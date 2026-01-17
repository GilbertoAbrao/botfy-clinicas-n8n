'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle,
  UserX,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Trend direction type
 */
export type TrendDirection = 'up' | 'down' | 'stable'

/**
 * KPI Metrics interface
 */
export interface KPIMetrics {
  bookingSuccessRate: number
  noShowRate: number
  cancellationRate: number
  avgResolutionTimeMinutes: number | null
  confirmationRateTrend: TrendDirection
  confirmationRateChange?: number
  alertVolumeByType?: Record<string, number>
  period: { start: Date; end: Date }
  totals?: {
    appointments: number
    alerts: number
    resolvedAlerts: number
  }
}

/**
 * Props for KPICards component
 */
export interface KPICardsProps {
  metrics: KPIMetrics | null
  loading?: boolean
}

/**
 * Get color class based on success rate (higher is better)
 */
function getSuccessRateColor(rate: number): string {
  if (rate >= 70) return 'text-green-600'
  if (rate >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get color class based on no-show rate (lower is better)
 */
function getNoShowRateColor(rate: number): string {
  if (rate <= 10) return 'text-green-600'
  if (rate <= 20) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get color class based on cancellation rate (lower is better)
 */
function getCancellationRateColor(rate: number): string {
  if (rate <= 15) return 'text-green-600'
  if (rate <= 25) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Format resolution time for display
 */
function formatResolutionTime(minutes: number | null): string {
  if (minutes === null) return 'N/A'

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

/**
 * Get trend icon and color
 */
function getTrendDisplay(trend: TrendDirection): {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: string
} {
  switch (trend) {
    case 'up':
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        label: 'Em alta',
      }
    case 'down':
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        label: 'Em queda',
      }
    case 'stable':
    default:
      return {
        icon: Minus,
        color: 'text-gray-500',
        label: 'Estavel',
      }
  }
}

/**
 * Format date range for display
 */
function formatPeriod(start: Date, end: Date): string {
  const startFormatted = format(new Date(start), 'dd/MM', { locale: ptBR })
  const endFormatted = format(new Date(end), 'dd/MM/yyyy', { locale: ptBR })
  return `Periodo: ${startFormatted} - ${endFormatted}`
}

/**
 * Loading skeleton for KPICards
 */
function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
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
 * Individual KPI Card component
 */
interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  valueColor: string
}

function KPICard({ title, value, subtitle, icon: Icon, iconColor, valueColor }: KPICardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', valueColor)}>{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

/**
 * KPICards Component
 *
 * Displays extended KPIs in a responsive card grid:
 * 1. Taxa de Sucesso (booking success rate)
 * 2. Taxa de Nao Comparecimento (no-show rate)
 * 3. Taxa de Cancelamento
 * 4. Tempo Medio de Resolucao
 * 5. Tendencia de Confirmacao
 *
 * Features:
 * - Responsive grid (5 cols on xl, 3 on lg, 2 on sm, 1 on mobile)
 * - Color coding based on thresholds
 * - Period displayed in footer
 * - Loading skeleton state
 */
export function KPICards({ metrics, loading = false }: KPICardsProps) {
  if (loading) {
    return <KPICardsSkeleton />
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500">Nenhuma metrica disponivel</p>
        </CardContent>
      </Card>
    )
  }

  const trend = getTrendDisplay(metrics.confirmationRateTrend)
  const TrendIcon = trend.icon

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Taxa de Sucesso */}
        <KPICard
          title="Taxa de Sucesso"
          value={`${metrics.bookingSuccessRate}%`}
          subtitle="agendamentos confirmados ou concluidos"
          icon={CheckCircle}
          iconColor={getSuccessRateColor(metrics.bookingSuccessRate)}
          valueColor={getSuccessRateColor(metrics.bookingSuccessRate)}
        />

        {/* Card 2: Taxa de Nao Comparecimento */}
        <KPICard
          title="Taxa de Faltas"
          value={`${metrics.noShowRate}%`}
          subtitle="pacientes que nao compareceram"
          icon={UserX}
          iconColor={getNoShowRateColor(metrics.noShowRate)}
          valueColor={getNoShowRateColor(metrics.noShowRate)}
        />

        {/* Card 3: Taxa de Cancelamento */}
        <KPICard
          title="Taxa de Cancelamento"
          value={`${metrics.cancellationRate}%`}
          subtitle="agendamentos cancelados"
          icon={XCircle}
          iconColor={getCancellationRateColor(metrics.cancellationRate)}
          valueColor={getCancellationRateColor(metrics.cancellationRate)}
        />

        {/* Card 4: Tempo Medio de Resolucao */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tempo de Resolucao
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatResolutionTime(metrics.avgResolutionTimeMinutes)}
            </div>
            <p className="text-xs text-gray-500 mt-1">media para resolver alertas</p>
          </CardContent>
        </Card>

        {/* Card 5: Tendencia de Confirmacao */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tendencia
            </CardTitle>
            <TrendIcon className={cn('h-5 w-5', trend.color)} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', trend.color)}>{trend.label}</div>
            <p className="text-xs text-gray-500 mt-1">taxa de confirmacao</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          {formatPeriod(metrics.period.start, metrics.period.end)}
        </p>
      </div>
    </div>
  )
}
