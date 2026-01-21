import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { DocumentsDashboard } from '@/components/documents/documents-dashboard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Documentos de Pacientes | Botfy ClinicOps',
  description: 'Visualize e valide documentos enviados durante o pre-checkin',
}

/**
 * Loading skeleton for DocumentsDashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Quick filters skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      {/* Filters panel skeleton */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
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
      <div className="bg-white rounded-lg border">
        <div className="p-4">
          <Skeleton className="h-8 w-full" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-t p-4">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
      {/* Pagination skeleton */}
      <div className="bg-white rounded-lg border p-4">
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

/**
 * Patient Documents Page
 *
 * Server component that renders the document management dashboard.
 * Protected by auth check and RBAC (ADMIN, ATENDENTE only).
 *
 * Features:
 * - Filters for status, type, date range, patient search
 * - Table view with row selection
 * - Preview modal for images/PDFs
 * - Approve/reject actions (single and bulk)
 */
export default async function DocumentsPage() {
  // Auth check
  const user = await getCurrentUserWithRole()
  if (!user) {
    redirect('/auth/login')
  }

  // RBAC check - ADMIN or ATENDENTE can access
  if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
    redirect('/dashboard')
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Documentos de Pacientes</h1>
        <p className="text-gray-600 mt-1">
          Visualize e valide documentos enviados durante o pre-checkin
        </p>
      </div>

      {/* Dashboard with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DocumentsDashboard />
      </Suspense>
    </div>
  )
}
