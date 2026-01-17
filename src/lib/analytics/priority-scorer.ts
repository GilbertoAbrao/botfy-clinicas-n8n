/**
 * Alert Priority Scoring Algorithm
 *
 * Calculates a priority score (1-100) for alerts based on multiple factors:
 * 1. Alert type weight (urgent: +40, high: +25, low: +10)
 * 2. Alert age (older = higher priority, max +20 for >24h)
 * 3. Patient history (high no-show rate = +15, many cancellations = +10)
 * 4. Appointment proximity (within 24h = +15, within 2h = +25)
 */

import { prisma } from '@/lib/prisma'
import { AlertPriority, AlertType, AppointmentStatus } from '@prisma/client'
import { differenceInHours, differenceInMinutes } from 'date-fns'

/**
 * Individual priority factors with their calculated weights
 */
export interface PriorityFactors {
  typeWeight: number
  ageWeight: number
  patientHistoryWeight: number
  appointmentProximityWeight: number
}

/**
 * Result of priority calculation
 */
export interface PriorityResult {
  /** Priority score from 1-100 */
  score: number
  /** Individual factor weights */
  factors: PriorityFactors
  /** Human-readable explanation of the score */
  explanation: string
}

/**
 * Weight configuration for alert types
 */
const TYPE_WEIGHTS: Record<AlertPriority, number> = {
  urgent: 40,
  high: 25,
  low: 10,
}

/**
 * Maximum weights for each factor category
 */
const MAX_WEIGHTS = {
  type: 40,
  age: 20,
  patientHistory: 25, // 15 for no-show + 10 for cancellations
  appointmentProximity: 25,
}

/**
 * Calculate the type weight based on alert priority
 */
function calculateTypeWeight(priority: AlertPriority): number {
  return TYPE_WEIGHTS[priority] || 10
}

/**
 * Calculate the age weight based on how long the alert has been open
 * Max 20 points for alerts older than 24 hours
 */
function calculateAgeWeight(createdAt: Date): number {
  const ageHours = differenceInHours(new Date(), createdAt)

  if (ageHours >= 24) return 20
  if (ageHours >= 12) return 15
  if (ageHours >= 6) return 10
  if (ageHours >= 2) return 5
  return 0
}

/**
 * Calculate patient history weight based on no-show and cancellation rates
 * @param patientId - Patient ID (may be null)
 * @returns Weight (0-25 max)
 */
async function calculatePatientHistoryWeight(
  patientId: string | null
): Promise<{ weight: number; noShowRate: number; cancellationCount: number }> {
  if (!patientId) {
    return { weight: 0, noShowRate: 0, cancellationCount: 0 }
  }

  try {
    // Get appointment statistics for this patient
    const appointments = await prisma.appointment.groupBy({
      by: ['status'],
      where: { patientId },
      _count: { status: true },
    })

    const statusCounts = appointments.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.status
        return acc
      },
      {} as Record<AppointmentStatus, number>
    )

    const totalAppointments =
      (statusCounts.completed || 0) +
      (statusCounts.confirmed || 0) +
      (statusCounts.no_show || 0) +
      (statusCounts.cancelled || 0) +
      (statusCounts.tentative || 0)

    if (totalAppointments === 0) {
      return { weight: 0, noShowRate: 0, cancellationCount: 0 }
    }

    const noShowCount = statusCounts.no_show || 0
    const cancellationCount = statusCounts.cancelled || 0
    const noShowRate = (noShowCount / totalAppointments) * 100

    let weight = 0

    // High no-show rate (>20%) = +15
    if (noShowRate > 20) {
      weight += 15
    } else if (noShowRate > 10) {
      weight += 8
    }

    // Many cancellations (>=3) = +10
    if (cancellationCount >= 3) {
      weight += 10
    } else if (cancellationCount >= 2) {
      weight += 5
    }

    return { weight, noShowRate, cancellationCount }
  } catch (error) {
    console.error('[calculatePatientHistoryWeight] Error:', error)
    return { weight: 0, noShowRate: 0, cancellationCount: 0 }
  }
}

/**
 * Calculate appointment proximity weight
 * @param appointmentId - Appointment ID (may be null)
 * @returns Weight (0-25 max)
 */
async function calculateAppointmentProximityWeight(
  appointmentId: string | null
): Promise<{ weight: number; hoursUntil: number | null }> {
  if (!appointmentId) {
    return { weight: 0, hoursUntil: null }
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { scheduledAt: true, status: true },
    })

    if (!appointment || appointment.status === 'cancelled' || appointment.status === 'completed') {
      return { weight: 0, hoursUntil: null }
    }

    const now = new Date()
    const scheduledAt = new Date(appointment.scheduledAt)

    // If appointment is in the past, no proximity weight
    if (scheduledAt < now) {
      return { weight: 0, hoursUntil: 0 }
    }

    const minutesUntil = differenceInMinutes(scheduledAt, now)
    const hoursUntil = minutesUntil / 60

    // Within 2 hours = +25
    if (hoursUntil <= 2) {
      return { weight: 25, hoursUntil }
    }

    // Within 6 hours = +20
    if (hoursUntil <= 6) {
      return { weight: 20, hoursUntil }
    }

    // Within 24 hours = +15
    if (hoursUntil <= 24) {
      return { weight: 15, hoursUntil }
    }

    // Within 48 hours = +8
    if (hoursUntil <= 48) {
      return { weight: 8, hoursUntil }
    }

    return { weight: 0, hoursUntil }
  } catch (error) {
    console.error('[calculateAppointmentProximityWeight] Error:', error)
    return { weight: 0, hoursUntil: null }
  }
}

/**
 * Generate human-readable explanation of priority score
 */
function generateExplanation(
  factors: PriorityFactors,
  context: {
    alertType: AlertType
    alertPriority: AlertPriority
    ageHours: number
    noShowRate: number
    cancellationCount: number
    hoursUntil: number | null
  }
): string {
  const explanations: string[] = []

  // Type explanation
  explanations.push(`Prioridade ${context.alertPriority} (+${factors.typeWeight})`)

  // Age explanation
  if (factors.ageWeight > 0) {
    explanations.push(`Alerta há ${Math.round(context.ageHours)}h (+${factors.ageWeight})`)
  }

  // Patient history explanation
  if (factors.patientHistoryWeight > 0) {
    const historyParts: string[] = []
    if (context.noShowRate > 10) {
      historyParts.push(`${context.noShowRate.toFixed(0)}% faltas`)
    }
    if (context.cancellationCount >= 2) {
      historyParts.push(`${context.cancellationCount} cancelamentos`)
    }
    if (historyParts.length > 0) {
      explanations.push(`Histórico: ${historyParts.join(', ')} (+${factors.patientHistoryWeight})`)
    }
  }

  // Appointment proximity explanation
  if (factors.appointmentProximityWeight > 0 && context.hoursUntil !== null) {
    if (context.hoursUntil <= 2) {
      explanations.push(`Consulta em ${Math.round(context.hoursUntil * 60)}min (+${factors.appointmentProximityWeight})`)
    } else {
      explanations.push(`Consulta em ${Math.round(context.hoursUntil)}h (+${factors.appointmentProximityWeight})`)
    }
  }

  return explanations.join(' | ')
}

/**
 * Calculate priority score for an alert
 *
 * @param alertId - The ID of the alert to score
 * @returns PriorityResult with score, factors, and explanation
 */
export async function calculateAlertPriority(alertId: string): Promise<PriorityResult> {
  // Fetch alert with related data
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    select: {
      id: true,
      type: true,
      priority: true,
      status: true,
      patientId: true,
      appointmentId: true,
      createdAt: true,
    },
  })

  if (!alert) {
    throw new Error(`Alert not found: ${alertId}`)
  }

  // Calculate individual weights
  const typeWeight = calculateTypeWeight(alert.priority)
  const ageWeight = calculateAgeWeight(alert.createdAt)
  const ageHours = differenceInHours(new Date(), alert.createdAt)

  const { weight: patientHistoryWeight, noShowRate, cancellationCount } = await calculatePatientHistoryWeight(
    alert.patientId
  )

  const { weight: appointmentProximityWeight, hoursUntil } = await calculateAppointmentProximityWeight(
    alert.appointmentId
  )

  // Sum all factors
  const rawScore = typeWeight + ageWeight + patientHistoryWeight + appointmentProximityWeight

  // Normalize to 1-100 range
  // Max possible = 40 + 20 + 25 + 25 = 110
  // We clamp to 100 and ensure minimum of 1
  const score = Math.min(100, Math.max(1, rawScore))

  const factors: PriorityFactors = {
    typeWeight,
    ageWeight,
    patientHistoryWeight,
    appointmentProximityWeight,
  }

  const explanation = generateExplanation(factors, {
    alertType: alert.type,
    alertPriority: alert.priority,
    ageHours,
    noShowRate,
    cancellationCount,
    hoursUntil,
  })

  return {
    score,
    factors,
    explanation,
  }
}

/**
 * Calculate priority scores for multiple alerts efficiently
 * Useful for batch operations in list views
 *
 * @param alertIds - Array of alert IDs to score
 * @returns Map of alert ID to PriorityResult
 */
export async function calculateAlertPriorities(
  alertIds: string[]
): Promise<Map<string, PriorityResult>> {
  const results = new Map<string, PriorityResult>()

  // Process in parallel with concurrency limit
  const BATCH_SIZE = 10
  for (let i = 0; i < alertIds.length; i += BATCH_SIZE) {
    const batch = alertIds.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const result = await calculateAlertPriority(id)
          return { id, result }
        } catch (error) {
          console.error(`[calculateAlertPriorities] Failed for ${id}:`, error)
          // Return default low priority for failed calculations
          return {
            id,
            result: {
              score: 1,
              factors: { typeWeight: 0, ageWeight: 0, patientHistoryWeight: 0, appointmentProximityWeight: 0 },
              explanation: 'Erro ao calcular prioridade',
            },
          }
        }
      })
    )

    batchResults.forEach(({ id, result }) => results.set(id, result))
  }

  return results
}
