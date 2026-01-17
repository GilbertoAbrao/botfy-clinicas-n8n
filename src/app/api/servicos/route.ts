import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { serviceSchema } from '@/lib/validations/service';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar serviços' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || undefined;
    const ativo = searchParams.get('ativo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build where clause
    const where: any = {};

    if (q) {
      where.nome = {
        contains: q,
        mode: 'insensitive',
      };
    }

    if (ativo !== null && ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.service.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Log service access
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_SERVICE,
      resource: 'services',
      resourceId: undefined,
      details: {
        searchParams: { q, ativo },
        resultCount: services.length,
      },
    });

    // Return response
    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar serviços' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Check if service name already exists
    const existing = await prisma.service.findFirst({
      where: {
        nome: {
          equals: validatedData.nome,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um serviço com este nome' },
        { status: 409 }
      );
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        nome: validatedData.nome,
        duracao: validatedData.duracao,
        preco: validatedData.preco,
        ativo: validatedData.ativo ?? true,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_SERVICE,
      resource: 'services',
      resourceId: service.id,
      details: {
        serviceName: service.nome,
        duracao: service.duracao,
        preco: service.preco.toString(),
      },
      ipAddress,
      userAgent,
    });

    // Return success with service ID and location header
    return NextResponse.json(
      { id: service.id, nome: service.nome },
      {
        status: 201,
        headers: {
          Location: `/api/servicos/${service.id}`,
        },
      }
    );
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Erro ao criar serviço' },
      { status: 500 }
    );
  }
}
