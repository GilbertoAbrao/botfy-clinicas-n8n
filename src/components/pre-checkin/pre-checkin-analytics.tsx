'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for PreCheckinAnalytics component
 */
export interface PreCheckinAnalyticsProps {
  completionRate: number // 0-100
  pendingCount: number
  overdueCount: number
  loading?: boolean
}

/**
 * Get color class based on completion rate (higher is better)
 */
function getCompletionRateColor(rate: number): string {
  if (rate >= 70) return 'text-green-600'
  if (rate >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get color class based on overdue count (lower is better)
 */
function getOverdueColor(count: number): string {
  if (count === 0) return 'text-green-600'
  if (count <= 3) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Loading skeleton for PreCheckinAnalytics
 */
function PreCheckinAnalyticsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * PreCheckinAnalytics Component
 *
 * Displays pre-checkin KPIs in a responsive card grid:
 * 1. Taxa de Conclusao (completion rate)
 * 2. Pendentes (pending count)
 * 3. Atrasados (overdue count - less than 12h until appointment)
 *
 * Features:
 * - Responsive grid (3 cols on lg, 2 on sm, 1 on mobile)
 * - Color coding based on thresholds
 * - Loading skeleton state
 */
export function PreCheckinAnalytics({
  completionRate,
  pendingCount,
  overdueCount,
  loading = false,
}: PreCheckinAnalyticsProps) {
  if (loading) return <PreCheckinAnalyticsSkeleton />

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Card 1: Taxa de Conclusao */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Taxa de Conclusao
          </CardTitle>
          <CheckCircle className={cn('h-5 w-5', getCompletionRateColor(completionRate))} />
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', getCompletionRateColor(completionRate))}>
            {completionRate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">pre-checkins completos</p>
        </CardContent>
      </Card>

      {/* Card 2: Pendentes */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
          <Clock className="h-5 w-5 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <p className="text-xs text-gray-500 mt-1">aguardando conclusao</p>
        </CardContent>
      </Card>

      {/* Card 3: Atrasados */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Atrasados</CardTitle>
          <AlertTriangle className={cn('h-5 w-5', getOverdueColor(overdueCount))} />
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', getOverdueColor(overdueCount))}>
            {overdueCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">menos de 12h para consulta</p>
        </CardContent>
      </Card>
    </div>
  )
}
