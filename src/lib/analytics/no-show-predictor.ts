/**
 * No-Show Risk Predictor
 *
 * Calculates no-show risk for upcoming appointments based on:
 * - Patient's historical no-show rate (40%)
 * - Time of day (15%)
 * - Day of week (15%)
 * - Lead time from booking to appointment (15%)
 * - Confirmation status (15%)
 */

import { prisma } from '@/lib/prisma'
import { differenceInHours, differenceInDays, getHours, getDay } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export type NoShowRiskLevel = 'high' | 'medium' | 'low'

export interface RiskFactors {
  historicalNoShowRate: number
  timeOfDayRisk: number
  dayOfWeekRisk: number
  leadTimeRisk: number
  confirmationRisk: number
}

export interface NoShowPrediction {
  appointmentId: string
  riskLevel: NoShowRiskLevel
  riskScore: number // 0-100
  factors: RiskFactors
  recommendations: string[]
}

// ============================================================================
// Constants
// ============================================================================

const WEIGHTS = {
  historicalNoShowRate: 0.40,
  timeOfDayRisk: 0.15,
  dayOfWeekRisk: 0.15,
  leadTimeRisk: 0.15,
  confirmationRisk: 0.15,
}

// Risk thresholds
const HIGH_RISK_THRESHOLD = 60
const MEDIUM_RISK_THRESHOLD = 30

// ============================================================================
// Caching Layer (LRU with TTL)
// ============================================================================

interface CachedPrediction {
  prediction: NoShowPrediction
  cachedAt: number
}

const predictionCache = new Map<string, CachedPrediction>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_CACHE_SIZE = 1000

/**
 * Get cached prediction if valid (not expired)
 */
function getCachedPrediction(appointmentId: string): NoShowPrediction | null {
  const cached = predictionCache.get(appointmentId)

  if (!cached) {
    return null
  }

  // Check if expired
  if (Date.now() - cached.cachedAt > CACHE_TTL) {
    predictionCache.delete(appointmentId)
    return null
  }

  return cached.prediction
}

/**
 * Cache a prediction with LRU eviction
 */
function cachePrediction(appointmentId: string, prediction: NoShowPrediction): void {
  // LRU eviction: remove oldest entries if cache is full
  if (predictionCache.size >= MAX_CACHE_SIZE) {
    // Get the first (oldest) entry and delete it
    const firstKey = predictionCache.keys().next().value
    if (firstKey) {
      predictionCache.delete(firstKey)
    }
  }

  predictionCache.set(appointmentId, {
    prediction,
    cachedAt: Date.now(),
  })
}

/**
 * Invalidate cache for a specific appointment or all appointments
 * Call this when appointment status changes (e.g., confirmed, cancelled)
 */
export function invalidatePredictionCache(appointmentId?: string): void {
  if (appointmentId) {
    predictionCache.delete(appointmentId)
  } else {
    predictionCache.clear()
  }
}

// Time of day risk (higher for early morning and late afternoon)
// Hours: 0-7 (very early), 8-9 (early), 10-16 (normal), 17-18 (late), 19+ (very late)
function getTimeOfDayRisk(hour: number): number {
  if (hour < 8) return 80 // Very early morning
  if (hour < 10) return 50 // Early morning
  if (hour >= 17 && hour < 19) return 60 // Late afternoon
  if (hour >= 19) return 70 // Evening
  return 20 // Normal hours
}

// Day of week risk (Monday = 0, Sunday = 6)
// Mondays and Fridays have slightly higher risk
function getDayOfWeekRisk(day: number): number {
  switch (day) {
    case 1: return 50 // Monday
    case 5: return 45 // Friday
    case 6: return 60 // Saturday (if clinic is open)
    case 0: return 70 // Sunday (if clinic is open)
    default: return 25 // Tuesday-Thursday
  }
}

// Lead time risk (appointments booked far in advance are higher risk)
function getLeadTimeRisk(leadTimeDays: number): number {
  if (leadTimeDays <= 1) return 15 // Same day or next day - low risk
  if (leadTimeDays <= 3) return 25 // Within 3 days
  if (leadTimeDays <= 7) return 40 // Within a week
  if (leadTimeDays <= 14) return 60 // Within 2 weeks
  return 80 // More than 2 weeks
}

// Confirmation status risk
function getConfirmationRisk(
  status: string,
  confirmedAt: Date | null,
  scheduledAt: Date,
  now: Date
): number {
  // Already confirmed - low risk
  if (status === 'confirmed' && confirmedAt) {
    return 10
  }

  // Check if within 24 hours of appointment
  const hoursUntilAppointment = differenceInHours(scheduledAt, now)

  if (hoursUntilAppointment <= 0) {
    // Past appointment
    return 0
  }

  if (hoursUntilAppointment <= 24 && status !== 'confirmed') {
    // Unconfirmed within 24 hours - high risk
    return 90
  }

  if (hoursUntilAppointment <= 48 && status !== 'confirmed') {
    // Unconfirmed within 48 hours - medium-high risk
    return 60
  }

  // More time - moderate risk for unconfirmed
  return 40
}

// Calculate historical no-show rate for a patient
async function getPatientNoShowRate(patientId: string): Promise<number> {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      scheduledAt: { lt: new Date() }, // Only past appointments
      status: { in: ['completed', 'no_show'] },
    },
    select: { status: true },
  })

  if (appointments.length === 0) {
    // No history - return neutral risk
    return 25
  }

  const noShowCount = appointments.filter(a => a.status === 'no_show').length
  const noShowRate = (noShowCount / appointments.length) * 100

  // Convert rate to risk score (0% = 10, 50%+ = 100)
  return Math.min(10 + noShowRate * 1.8, 100)
}

// Generate recommendations based on risk factors
function generateRecommendations(
  riskLevel: NoShowRiskLevel,
  factors: RiskFactors
): string[] {
  const recommendations: string[] = []

  if (riskLevel === 'high') {
    recommendations.push('Ligar para confirmar')
    recommendations.push('Enviar lembrete extra via WhatsApp')

    if (factors.historicalNoShowRate > 60) {
      recommendations.push('Considerar pré-pagamento ou depósito')
    }

    if (factors.leadTimeRisk > 60) {
      recommendations.push('Reconfirmar 48h antes')
    }
  } else if (riskLevel === 'medium') {
    recommendations.push('Enviar lembrete 24h antes')

    if (factors.confirmationRisk > 50) {
      recommendations.push('Solicitar confirmação por WhatsApp')
    }

    if (factors.historicalNoShowRate > 40) {
      recommendations.push('Monitorar resposta ao lembrete')
    }
  } else {
    recommendations.push('Fluxo padrão de lembretes')
  }

  return recommendations
}

// Calculate risk level from score
function getRiskLevel(score: number): NoShowRiskLevel {
  if (score >= HIGH_RISK_THRESHOLD) return 'high'
  if (score >= MEDIUM_RISK_THRESHOLD) return 'medium'
  return 'low'
}

// ============================================================================
// Main Prediction Functions
// ============================================================================

/**
 * Predict no-show risk for a single appointment
 * Results are cached for 1 hour to avoid redundant calculations
 */
export async function predictNoShowRisk(
  appointmentId: string
): Promise<NoShowPrediction> {
  // Check cache first
  const cached = getCachedPrediction(appointmentId)
  if (cached) {
    return cached
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true },
  })

  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`)
  }

  const now = new Date()
  const scheduledAt = new Date(appointment.scheduledAt)

  // Calculate each risk factor
  const historicalNoShowRate = await getPatientNoShowRate(appointment.patientId)
  const timeOfDayRisk = getTimeOfDayRisk(getHours(scheduledAt))
  const dayOfWeekRisk = getDayOfWeekRisk(getDay(scheduledAt))

  // Calculate lead time (days from creation to scheduled date)
  const leadTimeDays = differenceInDays(scheduledAt, new Date(appointment.createdAt))
  const leadTimeRisk = getLeadTimeRisk(leadTimeDays)

  const confirmationRisk = getConfirmationRisk(
    appointment.status,
    appointment.confirmedAt,
    scheduledAt,
    now
  )

  const factors: RiskFactors = {
    historicalNoShowRate,
    timeOfDayRisk,
    dayOfWeekRisk,
    leadTimeRisk,
    confirmationRisk,
  }

  // Calculate weighted score
  const riskScore = Math.round(
    factors.historicalNoShowRate * WEIGHTS.historicalNoShowRate +
    factors.timeOfDayRisk * WEIGHTS.timeOfDayRisk +
    factors.dayOfWeekRisk * WEIGHTS.dayOfWeekRisk +
    factors.leadTimeRisk * WEIGHTS.leadTimeRisk +
    factors.confirmationRisk * WEIGHTS.confirmationRisk
  )

  const riskLevel = getRiskLevel(riskScore)
  const recommendations = generateRecommendations(riskLevel, factors)

  const prediction: NoShowPrediction = {
    appointmentId,
    riskLevel,
    riskScore,
    factors,
    recommendations,
  }

  // Cache the result
  cachePrediction(appointmentId, prediction)

  return prediction
}

/**
 * Predict no-show risk for multiple appointments (batch operation for efficiency)
 * Uses cache for already calculated predictions, only fetches uncached ones
 */
export async function predictNoShowRiskBatch(
  appointmentIds: string[]
): Promise<NoShowPrediction[]> {
  if (appointmentIds.length === 0) {
    return []
  }

  // Check cache first - separate cached from uncached
  const cachedPredictions: NoShowPrediction[] = []
  const uncachedIds: string[] = []

  for (const id of appointmentIds) {
    const cached = getCachedPrediction(id)
    if (cached) {
      cachedPredictions.push(cached)
    } else {
      uncachedIds.push(id)
    }
  }

  // If all are cached, return immediately
  if (uncachedIds.length === 0) {
    return cachedPredictions
  }

  // Fetch only uncached appointments in a single query
  const appointments = await prisma.appointment.findMany({
    where: { id: { in: uncachedIds } },
    include: { patient: true },
  })

  if (appointments.length === 0) {
    return cachedPredictions
  }

  // Get unique patient IDs for batch history lookup
  const patientIds = [...new Set(appointments.map(a => a.patientId))]

  // Batch fetch patient history
  const patientHistory = await prisma.appointment.groupBy({
    by: ['patientId', 'status'],
    where: {
      patientId: { in: patientIds },
      scheduledAt: { lt: new Date() },
      status: { in: ['completed', 'no_show'] },
    },
    _count: true,
  })

  // Build patient no-show rate map
  const patientNoShowRates = new Map<string, number>()

  for (const patientId of patientIds) {
    const patientStats = patientHistory.filter(h => h.patientId === patientId)
    const totalCount = patientStats.reduce((sum, s) => sum + s._count, 0)
    const noShowCount = patientStats.find(s => s.status === 'no_show')?._count || 0

    if (totalCount === 0) {
      patientNoShowRates.set(patientId, 25) // Neutral for new patients
    } else {
      const rate = (noShowCount / totalCount) * 100
      patientNoShowRates.set(patientId, Math.min(10 + rate * 1.8, 100))
    }
  }

  const now = new Date()

  // Calculate predictions for each appointment
  const newPredictions: NoShowPrediction[] = appointments.map(appointment => {
    const scheduledAt = new Date(appointment.scheduledAt)

    const historicalNoShowRate = patientNoShowRates.get(appointment.patientId) || 25
    const timeOfDayRisk = getTimeOfDayRisk(getHours(scheduledAt))
    const dayOfWeekRisk = getDayOfWeekRisk(getDay(scheduledAt))
    const leadTimeDays = differenceInDays(scheduledAt, new Date(appointment.createdAt))
    const leadTimeRisk = getLeadTimeRisk(leadTimeDays)
    const confirmationRisk = getConfirmationRisk(
      appointment.status,
      appointment.confirmedAt,
      scheduledAt,
      now
    )

    const factors: RiskFactors = {
      historicalNoShowRate,
      timeOfDayRisk,
      dayOfWeekRisk,
      leadTimeRisk,
      confirmationRisk,
    }

    const riskScore = Math.round(
      factors.historicalNoShowRate * WEIGHTS.historicalNoShowRate +
      factors.timeOfDayRisk * WEIGHTS.timeOfDayRisk +
      factors.dayOfWeekRisk * WEIGHTS.dayOfWeekRisk +
      factors.leadTimeRisk * WEIGHTS.leadTimeRisk +
      factors.confirmationRisk * WEIGHTS.confirmationRisk
    )

    const riskLevel = getRiskLevel(riskScore)
    const recommendations = generateRecommendations(riskLevel, factors)

    const prediction: NoShowPrediction = {
      appointmentId: appointment.id,
      riskLevel,
      riskScore,
      factors,
      recommendations,
    }

    // Cache each new prediction
    cachePrediction(appointment.id, prediction)

    return prediction
  })

  // Combine cached and new predictions
  return [...cachedPredictions, ...newPredictions]
}
