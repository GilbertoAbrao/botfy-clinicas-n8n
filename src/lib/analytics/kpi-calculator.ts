/**
 * Extended KPI Calculator
 *
 * Calculates key performance indicators for the clinic:
 * 1. Booking success rate: (completed + confirmed) / total appointments
 * 2. No-show rate: no_show / total appointments
 * 3. Cancellation rate: cancelled / total appointments
 * 4. Average alert resolution time: avg(resolvedAt - createdAt)
 * 5. Alert volume by type: count per AlertType
 * 6. Confirmation rate trend: comparison to previous period
 */

import { prisma } from '@/lib/prisma'
import { AlertType } from '@prisma/client'

// Appointment status type (string-based, using Portuguese names from database)
type AppointmentStatus = 'agendada' | 'confirmada' | 'concluida' | 'cancelada' | 'nao_compareceu'
import {
  subDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from 'date-fns'

/**
 * Trend direction for metrics
 */
export type TrendDirection = 'up' | 'down' | 'stable'

/**
 * Comprehensive KPI metrics
 */
export interface KPIMetrics {
  /** Percentage of appointments that completed or confirmed (0-100) */
  bookingSuccessRate: number
  /** Percentage of appointments that were no-shows (0-100) */
  noShowRate: number
  /** Percentage of appointments that were cancelled (0-100) */
  cancellationRate: number
  /** Average time to resolve alerts in minutes (null if no resolved alerts) */
  avgResolutionTimeMinutes: number | null
  /** Number of alerts by type */
  alertVolumeByType: Record<AlertType, number>
  /** Trend direction for confirmation rate compared to previous period */
  confirmationRateTrend: TrendDirection
  /** Percentage change from previous period (positive = improvement) */
  confirmationRateChange: number
  /** Time period for these metrics */
  period: {
    start: Date
    end: Date
  }
  /** Total counts for context */
  totals: {
    appointments: number
    alerts: number
    resolvedAlerts: number
  }
}

/**
 * Options for KPI calculation
 */
export interface KPICalculationOptions {
  /** Start date for the period (default: periodDays ago) */
  startDate?: Date
  /** End date for the period (default: now) */
  endDate?: Date
  /** Number of days for the period if startDate not provided (default: 30) */
  periodDays?: number
}

/**
 * Calculate appointment status counts for a given period
 */
async function getAppointmentStatusCounts(
  startDate: Date,
  endDate: Date
): Promise<Record<AppointmentStatus, number>> {
  const statusCounts = await prisma.appointment.groupBy({
    by: ['status'],
    where: {
      dataHora: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  })

  // Initialize all statuses to 0 (using Portuguese names)
  const counts: Record<AppointmentStatus, number> = {
    agendada: 0,
    confirmada: 0,
    concluida: 0,
    cancelada: 0,
    nao_compareceu: 0,
  }

  // Fill in actual counts
  statusCounts.forEach((item) => {
    if (item.status && item.status in counts) {
      counts[item.status as AppointmentStatus] = item._count.id
    }
  })

  return counts
}

/**
 * Calculate booking success rate
 * Success = completed (concluida) + confirmed (confirmada)
 */
function calculateBookingSuccessRate(counts: Record<AppointmentStatus, number>): number {
  const successful = counts.concluida + counts.confirmada
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  if (total === 0) return 0
  return Math.round((successful / total) * 1000) / 10 // Round to 1 decimal
}

/**
 * Calculate no-show rate
 */
function calculateNoShowRate(counts: Record<AppointmentStatus, number>): number {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  if (total === 0) return 0
  return Math.round((counts.nao_compareceu / total) * 1000) / 10
}

/**
 * Calculate cancellation rate
 */
function calculateCancellationRate(counts: Record<AppointmentStatus, number>): number {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  if (total === 0) return 0
  return Math.round((counts.cancelada / total) * 1000) / 10
}

/**
 * Calculate average alert resolution time in minutes
 */
async function calculateAvgResolutionTime(
  startDate: Date,
  endDate: Date
): Promise<{ avgMinutes: number | null; resolvedCount: number }> {
  // Get resolved alerts with their creation and resolution times
  const resolvedAlerts = await prisma.alert.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      resolvedAt: { not: null },
    },
    select: {
      createdAt: true,
      resolvedAt: true,
    },
  })

  if (resolvedAlerts.length === 0) {
    return { avgMinutes: null, resolvedCount: 0 }
  }

  // Calculate total resolution time
  let totalMinutes = 0
  resolvedAlerts.forEach((alert) => {
    if (alert.resolvedAt) {
      totalMinutes += differenceInMinutes(alert.resolvedAt, alert.createdAt)
    }
  })

  const avgMinutes = Math.round(totalMinutes / resolvedAlerts.length)

  return { avgMinutes, resolvedCount: resolvedAlerts.length }
}

/**
 * Get alert counts by type
 */
async function getAlertVolumeByType(
  startDate: Date,
  endDate: Date
): Promise<{ byType: Record<AlertType, number>; total: number }> {
  const alertCounts = await prisma.alert.groupBy({
    by: ['type'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { type: true },
  })

  // Initialize all types to 0
  const byType: Record<AlertType, number> = {
    conversas_travadas: 0,
    pre_checkins_pendentes: 0,
    agendamentos_nao_confirmados: 0,
    handoff_normal: 0,
    handoff_erro: 0,
  }

  let total = 0
  alertCounts.forEach((item) => {
    byType[item.type] = item._count.type
    total += item._count.type
  })

  return { byType, total }
}

/**
 * Calculate confirmation rate for trend comparison
 * Confirmation rate = confirmada / (confirmada + agendada)
 */
function calculateConfirmationRate(counts: Record<AppointmentStatus, number>): number {
  const total = counts.confirmada + counts.agendada

  if (total === 0) return 0
  return (counts.confirmada / total) * 100
}

/**
 * Calculate trend direction based on percentage change
 * @param change - Percentage change (positive = improvement)
 * @param threshold - Minimum change to consider significant (default: 5%)
 */
function getTrendDirection(change: number, threshold: number = 5): TrendDirection {
  if (Math.abs(change) < threshold) return 'stable'
  return change > 0 ? 'up' : 'down'
}

/**
 * Calculate all KPIs for the specified period
 *
 * @param options - Calculation options
 * @returns Comprehensive KPI metrics
 */
export async function calculateKPIs(options?: KPICalculationOptions): Promise<KPIMetrics> {
  const periodDays = options?.periodDays ?? 30
  const endDate = options?.endDate ?? endOfDay(new Date())
  const startDate = options?.startDate ?? startOfDay(subDays(endDate, periodDays))

  // Calculate previous period for trend comparison
  const periodLength = differenceInMinutes(endDate, startDate) / (60 * 24) // days
  const prevEndDate = subDays(startDate, 1)
  const prevStartDate = subDays(prevEndDate, periodLength)

  // Get appointment counts for both periods in parallel
  const [
    currentCounts,
    previousCounts,
    { avgMinutes, resolvedCount },
    { byType: alertVolumeByType, total: totalAlerts },
  ] = await Promise.all([
    getAppointmentStatusCounts(startDate, endDate),
    getAppointmentStatusCounts(prevStartDate, prevEndDate),
    calculateAvgResolutionTime(startDate, endDate),
    getAlertVolumeByType(startDate, endDate),
  ])

  // Calculate rates
  const bookingSuccessRate = calculateBookingSuccessRate(currentCounts)
  const noShowRate = calculateNoShowRate(currentCounts)
  const cancellationRate = calculateCancellationRate(currentCounts)

  // Calculate trend
  const currentConfirmationRate = calculateConfirmationRate(currentCounts)
  const previousConfirmationRate = calculateConfirmationRate(previousCounts)

  let confirmationRateChange = 0
  if (previousConfirmationRate > 0) {
    confirmationRateChange = ((currentConfirmationRate - previousConfirmationRate) / previousConfirmationRate) * 100
  } else if (currentConfirmationRate > 0) {
    confirmationRateChange = 100 // No previous data but have current = 100% improvement
  }

  confirmationRateChange = Math.round(confirmationRateChange * 10) / 10 // Round to 1 decimal

  const totalAppointments = Object.values(currentCounts).reduce((sum, count) => sum + count, 0)

  return {
    bookingSuccessRate,
    noShowRate,
    cancellationRate,
    avgResolutionTimeMinutes: avgMinutes,
    alertVolumeByType,
    confirmationRateTrend: getTrendDirection(confirmationRateChange),
    confirmationRateChange,
    period: {
      start: startDate,
      end: endDate,
    },
    totals: {
      appointments: totalAppointments,
      alerts: totalAlerts,
      resolvedAlerts: resolvedCount,
    },
  }
}

/**
 * Format resolution time for display
 * @param minutes - Resolution time in minutes
 * @returns Human-readable string
 */
export function formatResolutionTime(minutes: number | null): string {
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
 * Get KPI health status based on thresholds
 */
export interface KPIHealthStatus {
  metric: string
  value: number | null
  status: 'good' | 'warning' | 'critical'
  message: string
}

/**
 * Evaluate KPI health against clinic targets
 */
export function evaluateKPIHealth(kpis: KPIMetrics): KPIHealthStatus[] {
  const statuses: KPIHealthStatus[] = []

  // Booking success rate (target: >80%)
  const successStatus: KPIHealthStatus = {
    metric: 'Taxa de sucesso',
    value: kpis.bookingSuccessRate,
    status: kpis.bookingSuccessRate >= 80 ? 'good' : kpis.bookingSuccessRate >= 60 ? 'warning' : 'critical',
    message:
      kpis.bookingSuccessRate >= 80
        ? 'Excelente taxa de sucesso'
        : kpis.bookingSuccessRate >= 60
          ? 'Taxa de sucesso pode melhorar'
          : 'Taxa de sucesso crítica - ação necessária',
  }
  statuses.push(successStatus)

  // No-show rate (target: <10%)
  const noShowStatus: KPIHealthStatus = {
    metric: 'Taxa de faltas',
    value: kpis.noShowRate,
    status: kpis.noShowRate <= 10 ? 'good' : kpis.noShowRate <= 20 ? 'warning' : 'critical',
    message:
      kpis.noShowRate <= 10
        ? 'Taxa de faltas dentro do esperado'
        : kpis.noShowRate <= 20
          ? 'Taxa de faltas acima do ideal'
          : 'Taxa de faltas crítica - revisar lembretes',
  }
  statuses.push(noShowStatus)

  // Cancellation rate (target: <15%)
  const cancellationStatus: KPIHealthStatus = {
    metric: 'Taxa de cancelamento',
    value: kpis.cancellationRate,
    status: kpis.cancellationRate <= 15 ? 'good' : kpis.cancellationRate <= 25 ? 'warning' : 'critical',
    message:
      kpis.cancellationRate <= 15
        ? 'Cancelamentos dentro do esperado'
        : kpis.cancellationRate <= 25
          ? 'Cancelamentos acima do ideal'
          : 'Taxa de cancelamento crítica',
  }
  statuses.push(cancellationStatus)

  // Resolution time (target: <120 minutes)
  const resolutionStatus: KPIHealthStatus = {
    metric: 'Tempo de resolução',
    value: kpis.avgResolutionTimeMinutes,
    status:
      kpis.avgResolutionTimeMinutes === null
        ? 'good'
        : kpis.avgResolutionTimeMinutes <= 120
          ? 'good'
          : kpis.avgResolutionTimeMinutes <= 240
            ? 'warning'
            : 'critical',
    message:
      kpis.avgResolutionTimeMinutes === null
        ? 'Sem alertas resolvidos no período'
        : kpis.avgResolutionTimeMinutes <= 120
          ? 'Alertas sendo resolvidos rapidamente'
          : kpis.avgResolutionTimeMinutes <= 240
            ? 'Tempo de resolução pode melhorar'
            : 'Alertas demorando muito para serem resolvidos',
  }
  statuses.push(resolutionStatus)

  return statuses
}

/**
 * Calculate daily KPIs for trend charts
 */
export async function calculateDailyKPIs(
  days: number = 7
): Promise<
  Array<{
    date: Date
    bookingSuccessRate: number
    noShowRate: number
    cancellationRate: number
    alertCount: number
  }>
> {
  const results: Array<{
    date: Date
    bookingSuccessRate: number
    noShowRate: number
    cancellationRate: number
    alertCount: number
  }> = []

  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    const [counts, alertCount] = await Promise.all([
      getAppointmentStatusCounts(dayStart, dayEnd),
      prisma.alert.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
    ])

    results.push({
      date: dayStart,
      bookingSuccessRate: calculateBookingSuccessRate(counts),
      noShowRate: calculateNoShowRate(counts),
      cancellationRate: calculateCancellationRate(counts),
      alertCount,
    })
  }

  return results
}
