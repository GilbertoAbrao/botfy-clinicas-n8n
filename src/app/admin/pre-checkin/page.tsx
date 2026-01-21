import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PreCheckinDashboard } from '@/components/pre-checkin/pre-checkin-dashboard'

export const metadata = {
  title: 'Pre-Checkin | Botfy ClinicOps',
  description: 'Dashboard de gerenciamento de pre-checkins',
}

/**
 * Loading skeleton for PreCheckinDashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Analytics cards skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  )
}

/**
 * Pre-Checkin Dashboard Page
 *
 * Server component that renders the pre-checkin management dashboard.
 * Protected by admin layout RBAC (ADMIN only).
 *
 * Features:
 * - Analytics cards showing KPIs
 * - Filters for status, date range, search
 * - Table/cards displaying pre-checkin records
 * - Detail modal with actions
 */
export default function PreCheckinPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Pre-Checkin</h1>
        <p className="text-gray-600 mt-1">
          Gerencie o status de pre-checkin dos pacientes
        </p>
      </div>

      {/* Dashboard with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <PreCheckinDashboard />
      </Suspense>
    </div>
  )
}
