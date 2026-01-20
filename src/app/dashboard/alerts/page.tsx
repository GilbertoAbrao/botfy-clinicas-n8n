import { Suspense } from 'react'
import Link from 'next/link'
import { fetchAlerts, getUnresolvedAlertCount } from '@/lib/api/alerts'
import { AlertList } from '@/components/alerts/alert-list'
import { AlertListRealtime } from '@/components/alerts/alert-list-realtime'
import { AlertFiltersWrapper } from '@/components/alerts/alert-filters-wrapper'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AlertType, AlertStatus } from '@prisma/client'
import { AlertSortBy, AlertFilters as AlertFiltersType } from '@/lib/api/alerts'

type FilterValues = Partial<AlertFiltersType>

interface PageProps {
  searchParams: Promise<{
    type?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function AlertsPage({ searchParams }: PageProps) {
  // Check authentication (RBAC - all authenticated users can view alerts)
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/auth/login')
  }

  // Await searchParams (Next.js 15+ async searchParams)
  const params = await searchParams

  // Parse filters from URL query params
  const filters: Partial<FilterValues> = {}

  if (params.type && isValidAlertType(params.type)) {
    filters.type = params.type as AlertType
  }

  if (params.status && isValidAlertStatus(params.status)) {
    filters.status = params.status as AlertStatus
  }

  if (params.dateFrom) {
    const date = new Date(params.dateFrom)
    if (!isNaN(date.getTime())) {
      filters.dateFrom = date
    }
  }

  if (params.dateTo) {
    const date = new Date(params.dateTo)
    if (!isNaN(date.getTime())) {
      filters.dateTo = date
    }
  }

  if (params.sortBy && isValidSortBy(params.sortBy)) {
    filters.sortBy = params.sortBy as AlertSortBy
  }

  if (params.sortOrder && (params.sortOrder === 'asc' || params.sortOrder === 'desc')) {
    filters.sortOrder = params.sortOrder
  }

  // Fetch alerts with filters
  const alerts = await fetchAlerts(filters)

  // Get unresolved alert count for header badge
  const unresolvedCount = await getUnresolvedAlertCount()

  // Log page view (fire-and-forget)
  logAudit({
    userId: user.id,
    action: AuditAction.VIEW_ALERT,
    resource: 'alerts',
    details: { page: 'list', filters },
  })

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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          {unresolvedCount > 0 && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
              {unresolvedCount} {unresolvedCount === 1 ? 'novo' : 'novos'}
            </Badge>
          )}
        </div>
        <p className="text-gray-600">
          Todos os problemas que precisam de atencao
        </p>
      </div>

      {/* Filters (sticky on desktop) */}
      <div className="md:sticky md:top-0 md:z-10 md:bg-white md:pt-4 md:pb-4 md:-mx-6 md:px-6 md:border-b">
        <Suspense fallback={<div className="h-32 bg-gray-50 animate-pulse rounded" />}>
          <AlertFiltersWrapper initialFilters={filters} />
        </Suspense>
      </div>

      {/* Alert list with real-time updates */}
      <div>
        <Suspense fallback={<AlertList alerts={[]} loading />}>
          <AlertListRealtime initialAlerts={alerts} />
        </Suspense>
      </div>
    </div>
  )
}

// Validation helpers
function isValidAlertType(value: string): boolean {
  const validTypes: AlertType[] = [
    'conversas_travadas',
    'pre_checkins_pendentes',
    'agendamentos_nao_confirmados',
    'handoff_normal',
    'handoff_erro',
  ]
  return validTypes.includes(value as AlertType)
}

function isValidAlertStatus(value: string): boolean {
  const validStatuses: AlertStatus[] = ['new', 'in_progress', 'resolved', 'dismissed']
  return validStatuses.includes(value as AlertStatus)
}

function isValidSortBy(value: string): boolean {
  const validSortBys: AlertSortBy[] = ['priority', 'date', 'patient', 'status']
  return validSortBys.includes(value as AlertSortBy)
}
