import { UserTableClient } from './user-table-client';

interface UserTableProps {
  role?: string;
  ativo?: string;
  page: number;
  limit: number;
  currentUserId: string;
}

async function fetchUsers(params: UserTableProps) {
  // Import Prisma here (only on server)
  const { prisma } = await import('@/lib/prisma');
  const { logAudit, AuditAction } = await import('@/lib/audit/logger');
  const { getCurrentUserWithRole } = await import('@/lib/auth/session');

  // Get current user for audit logging
  const user = await getCurrentUserWithRole();
  if (!user) {
    throw new Error('Nao autenticado');
  }

  // Build where clause
  const where: any = {};

  if (params.role && ['ADMIN', 'ATENDENTE'].includes(params.role)) {
    where.role = params.role;
  }

  if (params.ativo !== undefined && params.ativo !== '') {
    where.ativo = params.ativo === 'true';
  }

  // Calculate pagination
  const skip = (params.page - 1) * params.limit;

  // Execute query with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: {
        email: 'asc',
      },
      select: {
        id: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(total / params.limit);

  // Log access
  await logAudit({
    userId: user.id,
    action: AuditAction.VIEW_AUDIT_LOGS, // Using this as closest match for viewing user list
    resource: 'users',
    resourceId: undefined,
    details: {
      searchParams: { role: params.role, ativo: params.ativo },
      resultCount: users.length,
    },
  });

  return {
    users: users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
}

export async function UserTable(props: UserTableProps) {
  const data = await fetchUsers(props);

  return (
    <UserTableClient
      users={data.users}
      pagination={data.pagination}
      currentUserId={props.currentUserId}
      searchParams={{
        role: props.role,
        ativo: props.ativo,
      }}
    />
  );
}
