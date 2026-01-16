import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { PatientSearch } from '@/components/patients/patient-search';
import { PatientTable } from '@/components/patients/patient-table';
import { Button } from '@/components/ui/button';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface PageProps {
  searchParams: Promise<{
    q?: string;
    telefone?: string;
    cpf?: string;
    page?: string;
    limit?: string;
  }>;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="p-4">
          <Skeleton className="h-8 w-full" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t p-4">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function PacientesPage({ searchParams }: PageProps) {
  // Verify authentication
  const user = await getCurrentUserWithRole();
  if (!user) {
    redirect('/entrar');
  }

  // Verify authorization (ADMIN or ATENDENTE)
  const canViewPatients = checkPermission(user.role, PERMISSIONS.VIEW_PATIENTS);
  if (!canViewPatients) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
        <Link href="/dashboard">
          <Button>Voltar ao Dashboard</Button>
        </Link>
      </div>
    );
  }

  const params = await searchParams;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Pacientes</h1>
            <p className="text-gray-600 mt-1">Busque e gerencie informações dos pacientes</p>
          </div>
          <Link href="/pacientes/novo" className="mt-4 sm:mt-0">
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </Link>
        </div>

        {/* Search component */}
        <div>
          <PatientSearch />
        </div>

        {/* Patient table with Suspense boundary */}
        <Suspense fallback={<TableSkeleton />}>
          <PatientTable
            q={params.q}
            telefone={params.telefone}
            cpf={params.cpf}
            page={params.page ? parseInt(params.page) : 1}
            limit={params.limit ? parseInt(params.limit) : 20}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
