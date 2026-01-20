import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

// Placeholder component until ConfigLembretesPageClient is available from plan 10-02
function ConfigLembretesPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configuracao de Lembretes
        </CardTitle>
        <CardDescription>
          Os componentes de interface estao sendo implementados.
          Execute o plano 10-02 para criar os componentes UI necessarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Componentes em Desenvolvimento
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            Esta pagina exibira a lista de configuracoes de lembretes (tipo, antecedencia, canal, template).
            Os componentes de UI serao adicionados pelo plano 10-02.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function LembretesPage({ searchParams }: PageProps) {
  // Await searchParams (Next.js 15 pattern)
  const _params = await searchParams;

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

      {/* Client-side component - placeholder until 10-02 is executed */}
      <Suspense fallback={<TableSkeleton />}>
        {/* TODO: Replace with ConfigLembretesPageClient once plan 10-02 is executed */}
        {/* <ConfigLembretesPageClient
          ativo={params.ativo}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        /> */}
        <ConfigLembretesPlaceholder />
      </Suspense>
    </div>
  );
}
