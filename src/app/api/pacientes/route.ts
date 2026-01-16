import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { patientSchema } from '@/lib/validations/patient';

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

    // Authorization check (ADMIN or ATENDENTE)
    if (!checkPermission(user.role, PERMISSIONS.VIEW_PATIENTS)) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar pacientes' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || undefined;
    const telefone = searchParams.get('telefone') || undefined;
    const cpf = searchParams.get('cpf') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100

    // Build where clause
    const where: any = {};

    if (q) {
      // General search - nome field with case-insensitive partial match
      where.nome = {
        contains: q,
        mode: 'insensitive',
      };
    }

    if (telefone) {
      // Exact phone match
      where.telefone = telefone;
    }

    if (cpf) {
      // Exact CPF match
      where.cpf = cpf;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.patient.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Log PHI access
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_PATIENT,
      resource: 'patients',
      resourceId: undefined,
      details: {
        searchParams: { q, telefone, cpf },
        resultCount: patients.length,
      },
    });

    // Return response
    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pacientes' },
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

    // Authorization check (ADMIN or ATENDENTE)
    if (!checkPermission(user.role, PERMISSIONS.CREATE_PATIENT)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar pacientes' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = patientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Check CPF uniqueness if provided
    if (validatedData.cpf && validatedData.cpf !== '') {
      const existing = await prisma.patient.findUnique({
        where: { cpf: validatedData.cpf },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'CPF já cadastrado' },
          { status: 409 }
        );
      }
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        nome: validatedData.nome,
        telefone: validatedData.telefone,
        email: validatedData.email || null,
        cpf: validatedData.cpf || null,
        dataNascimento: validatedData.dataNascimento
          ? new Date(validatedData.dataNascimento)
          : null,
        endereco: validatedData.endereco || null,
        convenio: validatedData.convenio || null,
        numeroCarteirinha: validatedData.numeroCarteirinha || null,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_PATIENT,
      resource: 'patients',
      resourceId: patient.id,
      details: {
        patientName: patient.nome,
        telefone: patient.telefone,
      },
      ipAddress,
      userAgent,
    });

    // Return success with patient ID and location header
    return NextResponse.json(
      { id: patient.id, nome: patient.nome },
      {
        status: 201,
        headers: {
          Location: `/api/pacientes/${patient.id}`,
        },
      }
    );
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Erro ao criar paciente' },
      { status: 500 }
    );
  }
}
