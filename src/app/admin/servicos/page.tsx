import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ServicesPageClient } from '@/components/services/services-page-client';

interface PageProps {
  searchParams: Promise<{
    q?: string;
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

export default async function ServicosPage({ searchParams }: PageProps) {
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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Servicos</h1>
          <p className="text-gray-600 mt-1">Cadastre e gerencie os servicos oferecidos pela clinica</p>
        </div>

        {/* Client-side component with search, table, and modals */}
        <Suspense fallback={<TableSkeleton />}>
          <ServicesPageClient
            q={params.q}
            ativo={params.ativo}
            page={params.page ? parseInt(params.page) : 1}
            limit={params.limit ? parseInt(params.limit) : 20}
          />
        </Suspense>
      </div>
  );
}
