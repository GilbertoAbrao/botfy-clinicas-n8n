import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LembretesEnviadosPageClient } from '@/components/lembretes-enviados';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    tipo?: string;
    paciente_id?: string;
    data_inicio?: string;
    data_fim?: string;
    risco_min?: string;
    page?: string;
    limit?: string;
  }>;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Quick filters skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* Filters skeleton */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      {/* Table skeleton */}
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

export default async function LembretesEnviadosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Lembretes Enviados
        </h1>
        <p className="text-gray-600 mt-1">
          Historico de lembretes enviados aos pacientes
        </p>
      </div>

      {/* Client-side component */}
      <Suspense fallback={<TableSkeleton />}>
        <LembretesEnviadosPageClient
          status={params.status}
          tipo={params.tipo}
          paciente_id={params.paciente_id}
          data_inicio={params.data_inicio}
          data_fim={params.data_fim}
          risco_min={params.risco_min}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </div>
  );
}
