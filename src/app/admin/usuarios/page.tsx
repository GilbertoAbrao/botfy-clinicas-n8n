import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { UserTable } from '@/components/users/user-table';
import { UsersPageClient } from '@/components/users/users-page-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UsersPageProps {
  searchParams: Promise<{
    role?: string;
    ativo?: string;
    page?: string;
    limit?: string;
  }>;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[40px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect('/auth/login');
  }

  // Check ADMIN permission
  if (!checkPermission(user.role, PERMISSIONS.MANAGE_USERS)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const role = params.role || undefined;
  const ativo = params.ativo || undefined;
  const page = parseInt(params.page || '1');
  const limit = Math.min(parseInt(params.limit || '20'), 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuarios</h1>
        <p className="text-gray-600 mt-1">
          Gerencie os usuarios do sistema, atribua funcoes e controle acessos.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Filtre usuarios por funcao ou status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersPageClient role={role} ativo={ativo} />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Suspense fallback={<TableSkeleton />}>
        <UserTable
          role={role}
          ativo={ativo}
          page={page}
          limit={limit}
          currentUserId={user.id}
        />
      </Suspense>
    </div>
  );
}
