/**
 * Failure Pattern Detection Algorithm
 *
 * Identifies recurring patterns in appointment failures and alert spikes:
 * 1. Time-slot patterns: "X no-shows for Y:00 on Weekday"
 * 2. Provider patterns: "X failures with Provider Y"
 * 3. Alert type patterns: "X handoff_erro alerts in last 7 days"
 * 4. Day-of-week patterns: "Tuesdays have 2x more cancellations"
 */

import { prisma } from '@/lib/prisma'
import { AlertType, AppointmentStatus } from '@prisma/client'
import {
  subDays,
  format,
  getDay,
  getHours,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Types of patterns that can be detected
 */
export type PatternType =
  | 'time_slot_noshow'
  | 'provider_failure'
  | 'alert_type_spike'
  | 'day_of_week'

/**
 * Severity levels for detected patterns
 */
export type PatternSeverity = 'info' | 'warning' | 'critical'

/**
 * A detected pattern in the data
 */
export interface Pattern {
  /** Type of pattern detected */
  type: PatternType
  /** Human-readable description */
  description: string
  /** Number of occurrences */
  count: number
  /** Severity level based on impact */
  severity: PatternSeverity
  /** Additional context-specific data */
  metadata: Record<string, unknown>
  /** When the pattern was detected */
  detectedAt: Date
}

/**
 * Options for pattern detection
 */
export interface PatternDetectionOptions {
  /** Number of days to look back for patterns (default: 30) */
  lookbackDays?: number
  /** Minimum occurrences to be considered a pattern (default: 3) */
  minOccurrences?: number
  /** Maximum number of patterns to return (default: 10) */
  maxPatterns?: number
}

/**
 * Day of week names in Portuguese
 */
const DAY_NAMES: Record<number, string> = {
  0: 'domingo',
  1: 'segunda-feira',
  2: 'terça-feira',
  3: 'quarta-feira',
  4: 'quinta-feira',
  5: 'sexta-feira',
  6: 'sábado',
}

/**
 * Determine severity based on count thresholds
 */
function getSeverity(count: number, thresholds: { warning: number; critical: number }): PatternSeverity {
  if (count >= thresholds.critical) return 'critical'
  if (count >= thresholds.warning) return 'warning'
  return 'info'
}

/**
 * Detect time-slot patterns for no-shows
 * Identifies specific hours that have unusually high no-show rates
 */
async function detectTimeSlotPatterns(
  startDate: Date,
  minOccurrences: number
): Promise<Pattern[]> {
  const patterns: Pattern[] = []

  try {
    // Get all no-show appointments with their scheduled times
    const noShows = await prisma.appointment.findMany({
      where: {
        status: 'no_show',
        scheduledAt: { gte: startDate },
      },
      select: {
        scheduledAt: true,
      },
    })

    // Group by hour and day of week
    const timeSlotCounts = new Map<string, { count: number; dayName: string; hour: number }>()

    noShows.forEach((appointment) => {
      const date = new Date(appointment.scheduledAt)
      const dayOfWeek = getDay(date)
      const hour = getHours(date)
      const key = `${dayOfWeek}-${hour}`

      if (!timeSlotCounts.has(key)) {
        timeSlotCounts.set(key, {
          count: 0,
          dayName: DAY_NAMES[dayOfWeek],
          hour,
        })
      }

      timeSlotCounts.get(key)!.count++
    })

    // Find patterns above threshold
    timeSlotCounts.forEach((data, key) => {
      if (data.count >= minOccurrences) {
        patterns.push({
          type: 'time_slot_noshow',
          description: `${data.count} faltas às ${data.hour}:00 em ${data.dayName}s`,
          count: data.count,
          severity: getSeverity(data.count, { warning: 5, critical: 10 }),
          metadata: {
            dayOfWeek: parseInt(key.split('-')[0]),
            hour: data.hour,
            dayName: data.dayName,
          },
          detectedAt: new Date(),
        })
      }
    })
  } catch (error) {
    console.error('[detectTimeSlotPatterns] Error:', error)
  }

  return patterns
}

/**
 * Detect provider patterns for failures
 * Identifies providers with high rates of cancelled/no-show appointments
 */
async function detectProviderPatterns(
  startDate: Date,
  minOccurrences: number
): Promise<Pattern[]> {
  const patterns: Pattern[] = []

  try {
    // Get failure counts by provider
    const providerFailures = await prisma.appointment.groupBy({
      by: ['providerId'],
      where: {
        scheduledAt: { gte: startDate },
        providerId: { not: null },
        status: { in: ['no_show', 'cancelled'] },
      },
      _count: { id: true },
    })

    // Get provider names for those with significant failures
    const significantProviderIds = providerFailures
      .filter((p) => p._count.id >= minOccurrences)
      .map((p) => p.providerId!)

    if (significantProviderIds.length > 0) {
      const providers = await prisma.provider.findMany({
        where: { id: { in: significantProviderIds } },
        select: { id: true, nome: true },
      })

      const providerMap = new Map(providers.map((p) => [p.id, p.nome]))

      providerFailures.forEach((failure) => {
        if (failure._count.id >= minOccurrences && failure.providerId) {
          const providerName = providerMap.get(failure.providerId) || 'Desconhecido'

          patterns.push({
            type: 'provider_failure',
            description: `${failure._count.id} faltas/cancelamentos com ${providerName}`,
            count: failure._count.id,
            severity: getSeverity(failure._count.id, { warning: 5, critical: 15 }),
            metadata: {
              providerId: failure.providerId,
              providerName,
            },
            detectedAt: new Date(),
          })
        }
      })
    }
  } catch (error) {
    console.error('[detectProviderPatterns] Error:', error)
  }

  return patterns
}

/**
 * Detect alert type spikes
 * Identifies unusual increases in specific alert types
 */
async function detectAlertTypePatterns(
  startDate: Date,
  minOccurrences: number
): Promise<Pattern[]> {
  const patterns: Pattern[] = []

  try {
    // Get alert counts by type
    const alertCounts = await prisma.alert.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    })

    // Alert type descriptions in Portuguese
    const alertDescriptions: Record<AlertType, string> = {
      conversas_travadas: 'Conversas travadas',
      pre_checkins_pendentes: 'Pré check-ins pendentes',
      agendamentos_nao_confirmados: 'Agendamentos não confirmados',
      handoff_normal: 'Handoffs normais',
      handoff_erro: 'Handoffs com erro',
    }

    alertCounts.forEach((alert) => {
      if (alert._count.id >= minOccurrences) {
        // handoff_erro is more critical than other types
        const thresholds =
          alert.type === 'handoff_erro'
            ? { warning: 3, critical: 7 }
            : { warning: 10, critical: 25 }

        patterns.push({
          type: 'alert_type_spike',
          description: `${alert._count.id} alertas de "${alertDescriptions[alert.type]}"`,
          count: alert._count.id,
          severity: getSeverity(alert._count.id, thresholds),
          metadata: {
            alertType: alert.type,
            alertTypeName: alertDescriptions[alert.type],
          },
          detectedAt: new Date(),
        })
      }
    })
  } catch (error) {
    console.error('[detectAlertTypePatterns] Error:', error)
  }

  return patterns
}

/**
 * Detect day-of-week patterns
 * Identifies days with unusually high failure rates compared to average
 */
async function detectDayOfWeekPatterns(
  startDate: Date,
  minOccurrences: number
): Promise<Pattern[]> {
  const patterns: Pattern[] = []

  try {
    // Get all failed appointments
    const failedAppointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: startDate },
        status: { in: ['no_show', 'cancelled'] },
      },
      select: {
        scheduledAt: true,
        status: true,
      },
    })

    // Get total appointments per day of week for comparison
    const allAppointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: startDate },
      },
      select: {
        scheduledAt: true,
      },
    })

    // Count by day of week
    const failuresByDay = new Map<number, number>()
    const totalByDay = new Map<number, number>()

    failedAppointments.forEach((apt) => {
      const dayOfWeek = getDay(new Date(apt.scheduledAt))
      failuresByDay.set(dayOfWeek, (failuresByDay.get(dayOfWeek) || 0) + 1)
    })

    allAppointments.forEach((apt) => {
      const dayOfWeek = getDay(new Date(apt.scheduledAt))
      totalByDay.set(dayOfWeek, (totalByDay.get(dayOfWeek) || 0) + 1)
    })

    // Calculate average failure rate
    let totalFailures = 0
    let totalAppointments = 0
    failuresByDay.forEach((count) => (totalFailures += count))
    totalByDay.forEach((count) => (totalAppointments += count))

    const avgFailureRate = totalAppointments > 0 ? totalFailures / totalAppointments : 0

    // Find days with significantly higher failure rates (>1.5x average)
    failuresByDay.forEach((failures, dayOfWeek) => {
      const total = totalByDay.get(dayOfWeek) || 0
      if (total < minOccurrences) return

      const dayFailureRate = failures / total
      const ratio = avgFailureRate > 0 ? dayFailureRate / avgFailureRate : 0

      if (ratio >= 1.5 && failures >= minOccurrences) {
        patterns.push({
          type: 'day_of_week',
          description: `${DAY_NAMES[dayOfWeek]} tem ${ratio.toFixed(1)}x mais faltas que a média`,
          count: failures,
          severity: getSeverity(Math.round(ratio * 10), { warning: 20, critical: 30 }),
          metadata: {
            dayOfWeek,
            dayName: DAY_NAMES[dayOfWeek],
            failures,
            total,
            failureRate: (dayFailureRate * 100).toFixed(1),
            avgFailureRate: (avgFailureRate * 100).toFixed(1),
            ratio: ratio.toFixed(2),
          },
          detectedAt: new Date(),
        })
      }
    })
  } catch (error) {
    console.error('[detectDayOfWeekPatterns] Error:', error)
  }

  return patterns
}

/**
 * Sort patterns by severity (critical > warning > info) then by count
 */
function sortPatterns(patterns: Pattern[]): Pattern[] {
  const severityOrder: Record<PatternSeverity, number> = {
    critical: 3,
    warning: 2,
    info: 1,
  }

  return patterns.sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
    if (severityDiff !== 0) return severityDiff
    return b.count - a.count
  })
}

/**
 * Detect all patterns in the data
 *
 * @param options - Detection options
 * @returns Array of detected patterns sorted by severity
 */
export async function detectPatterns(options?: PatternDetectionOptions): Promise<Pattern[]> {
  const lookbackDays = options?.lookbackDays ?? 30
  const minOccurrences = options?.minOccurrences ?? 3
  const maxPatterns = options?.maxPatterns ?? 10

  const startDate = startOfDay(subDays(new Date(), lookbackDays))

  // Run all pattern detections in parallel
  const [timeSlotPatterns, providerPatterns, alertTypePatterns, dayOfWeekPatterns] = await Promise.all([
    detectTimeSlotPatterns(startDate, minOccurrences),
    detectProviderPatterns(startDate, minOccurrences),
    detectAlertTypePatterns(startDate, minOccurrences),
    detectDayOfWeekPatterns(startDate, minOccurrences),
  ])

  // Combine and sort all patterns
  const allPatterns = [
    ...timeSlotPatterns,
    ...providerPatterns,
    ...alertTypePatterns,
    ...dayOfWeekPatterns,
  ]

  const sortedPatterns = sortPatterns(allPatterns)

  // Return top N patterns
  return sortedPatterns.slice(0, maxPatterns)
}

/**
 * Get pattern summary statistics
 */
export async function getPatternSummary(options?: PatternDetectionOptions): Promise<{
  totalPatterns: number
  criticalCount: number
  warningCount: number
  infoCount: number
  patternsByType: Record<PatternType, number>
}> {
  const patterns = await detectPatterns({
    ...options,
    maxPatterns: 100, // Get all patterns for summary
  })

  const patternsByType: Record<PatternType, number> = {
    time_slot_noshow: 0,
    provider_failure: 0,
    alert_type_spike: 0,
    day_of_week: 0,
  }

  let criticalCount = 0
  let warningCount = 0
  let infoCount = 0

  patterns.forEach((pattern) => {
    patternsByType[pattern.type]++

    switch (pattern.severity) {
      case 'critical':
        criticalCount++
        break
      case 'warning':
        warningCount++
        break
      case 'info':
        infoCount++
        break
    }
  })

  return {
    totalPatterns: patterns.length,
    criticalCount,
    warningCount,
    infoCount,
    patternsByType,
  }
}
