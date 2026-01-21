import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InstructionsPageClient } from '@/components/instructions/instructions-page-client'

export const metadata = {
  title: 'Instrucoes de Procedimentos | Botfy ClinicOps',
  description: 'Gerencie as instrucoes enviadas aos pacientes via WhatsApp',
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    tipo?: string
    ativo?: string
    page?: string
    limit?: string
  }>
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Skeleton className="h-10 md:col-span-2" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
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
  )
}

/**
 * Procedure Instructions Admin Page
 *
 * Server component that renders the procedure instructions management page.
 * Protected by admin layout RBAC (ADMIN only).
 *
 * Features:
 * - List all procedure instructions
 * - Search by title
 * - Filter by type and status
 * - Create/Edit with WhatsApp preview
 * - Deactivate instructions
 */
export default async function InstrucoesPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/admin/pre-checkin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pre-Checkin
          </Button>
        </Link>
      </div>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Instrucoes de Procedimentos</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as instrucoes enviadas aos pacientes via WhatsApp
        </p>
      </div>

      {/* Client-side component with search, table, and modals */}
      <Suspense fallback={<TableSkeleton />}>
        <InstructionsPageClient
          q={params.q}
          tipo={params.tipo}
          ativo={params.ativo}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </div>
  )
}
