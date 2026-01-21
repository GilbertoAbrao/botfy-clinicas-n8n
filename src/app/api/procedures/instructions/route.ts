import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { instructionSchema, INSTRUCTION_TYPES } from '@/lib/validations/instruction';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para acessar instrucoes' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const ativo = searchParams.get('ativo');
    const servicoIdParam = searchParams.get('servicoId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build where clause
    const where: any = {};

    // Search in titulo and conteudo (case-insensitive)
    if (q) {
      where.OR = [
        { titulo: { contains: q, mode: 'insensitive' } },
        { conteudo: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filter by tipo_instrucao
    if (tipo && INSTRUCTION_TYPES.includes(tipo as any)) {
      where.tipoInstrucao = tipo;
    }

    // Filter by active status
    if (ativo !== null && ativo !== undefined && ativo !== '') {
      where.ativo = ativo === 'true';
    }

    // Filter by servicoId (supports 'null' for general instructions)
    if (servicoIdParam !== null && servicoIdParam !== undefined && servicoIdParam !== '') {
      if (servicoIdParam === 'null') {
        where.servicoId = null;
      } else {
        const servicoIdNum = parseInt(servicoIdParam);
        if (!isNaN(servicoIdNum)) {
          where.servicoId = servicoIdNum;
        }
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [instructions, total] = await Promise.all([
      prisma.procedureInstruction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { prioridade: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          servico: {
            select: {
              nome: true,
            },
          },
        },
      }),
      prisma.procedureInstruction.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Log instruction access
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_INSTRUCTION,
      resource: 'procedure_instructions',
      resourceId: undefined,
      details: {
        searchParams: { q, tipo, ativo, servicoId: servicoIdParam },
        resultCount: instructions.length,
      },
    });

    // Return response
    return NextResponse.json({
      instructions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar instrucoes' },
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
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para criar instrucoes' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = instructionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados invalidos',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Check for duplicate titulo within same servicoId (case-insensitive)
    const existing = await prisma.procedureInstruction.findFirst({
      where: {
        titulo: {
          equals: validatedData.titulo,
          mode: 'insensitive',
        },
        servicoId: validatedData.servicoId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ja existe uma instrucao com este titulo para este servico' },
        { status: 409 }
      );
    }

    // Create instruction
    const instruction = await prisma.procedureInstruction.create({
      data: {
        servicoId: validatedData.servicoId,
        tipoInstrucao: validatedData.tipoInstrucao,
        titulo: validatedData.titulo,
        conteudo: validatedData.conteudo,
        prioridade: validatedData.prioridade,
        ativo: validatedData.ativo,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_INSTRUCTION,
      resource: 'procedure_instructions',
      resourceId: instruction.id.toString(),
      details: {
        titulo: instruction.titulo,
        tipoInstrucao: instruction.tipoInstrucao,
        servicoId: instruction.servicoId,
      },
      ipAddress,
      userAgent,
    });

    // Return success with instruction ID and location header
    return NextResponse.json(
      { id: instruction.id, titulo: instruction.titulo },
      {
        status: 201,
        headers: {
          Location: `/api/procedures/instructions/${instruction.id}`,
        },
      }
    );
  } catch (error) {
    console.error('Error creating instruction:', error);
    return NextResponse.json(
      { error: 'Erro ao criar instrucao' },
      { status: 500 }
    );
  }
}
