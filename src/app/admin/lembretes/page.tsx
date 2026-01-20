import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfigLembretesPageClient } from '@/components/config-lembretes';

interface PageProps {
  searchParams: Promise<{
    ativo?: string;
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

export default async function LembretesPage({ searchParams }: PageProps) {
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
          Configuracao de Lembretes
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie os tipos de lembretes enviados aos pacientes
        </p>
      </div>

      {/* Client-side component */}
      <Suspense fallback={<TableSkeleton />}>
        <ConfigLembretesPageClient
          ativo={params.ativo}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </div>
  );
}
