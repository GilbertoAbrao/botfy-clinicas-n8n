import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser();
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
      action: 'VIEW_PATIENT',
      resource: 'patients',
      resourceId: null,
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
