import { PatientTableClient } from './patient-table-client';

interface PatientTableProps {
  q?: string;
  telefone?: string;
  cpf?: string;
  page: number;
  limit: number;
}

async function fetchPatients(params: PatientTableProps) {
  // Import Prisma here (only on server)
  const { prisma } = await import('@/lib/prisma');
  const { logAudit, AuditAction } = await import('@/lib/audit/logger');
  const { getCurrentUserWithRole } = await import('@/lib/auth/session');

  // Get current user for audit logging
  const user = await getCurrentUserWithRole();
  if (!user) {
    throw new Error('Não autenticado');
  }

  // Build where clause (same logic as API route)
  const where: any = {};

  if (params.q) {
    where.nome = {
      contains: params.q,
      mode: 'insensitive',
    };
  }

  if (params.telefone) {
    where.telefone = params.telefone;
  }

  if (params.cpf) {
    where.cpf = params.cpf;
  }

  // Calculate pagination
  const skip = (params.page - 1) * params.limit;

  // Execute query with pagination
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: {
        nome: 'asc',
      },
    }),
    prisma.patient.count({ where }),
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(total / params.limit);

  // Log PHI access
  await logAudit({
    userId: user.id,
    action: AuditAction.VIEW_PATIENT,
    resource: 'pacientes',
    resourceId: undefined,
    details: {
      searchParams: { q: params.q, telefone: params.telefone, cpf: params.cpf },
      resultCount: patients.length,
    },
  });

  return {
    patients,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
}

export async function PatientTable(props: PatientTableProps) {
  const data = await fetchPatients(props);

  return (
    <PatientTableClient
      patients={data.patients}
      pagination={data.pagination}
      searchParams={{
        q: props.q,
        telefone: props.telefone,
        cpf: props.cpf,
      }}
    />
  );
}
