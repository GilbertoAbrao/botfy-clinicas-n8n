/**
 * Risk Analytics Calculator
 *
 * Aggregates risk data from lembretes_enviados and agendamentos tables.
 * Provides data for no-show risk visualization charts:
 * 1. Risk score distribution (baixo, medio, alto)
 * 2. Predicted vs actual no-show correlation
 * 3. No-show patterns by day, time, and service
 */

import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  subDays,
  startOfDay,
  endOfDay,
  getDay,
  getHours,
} from 'date-fns'

/**
 * Risk level categories based on score
 */
type RiskLevel = 'baixo' | 'medio' | 'alto'

/**
 * Risk distribution data point
 */
export interface RiskDistributionItem {
  riskLevel: RiskLevel
  count: number
  percentage: number
}

/**
 * Predicted vs actual correlation data
 */
export interface PredictedVsActualItem {
  predicted: RiskLevel
  actualNoShow: number
  actualAttended: number
  accuracy: number
}

/**
 * Pattern data by category
 */
export interface PatternItem {
  day?: string
  slot?: string
  service?: string
  noShowRate: number
  total: number
}

/**
 * Complete risk analytics response
 */
export interface RiskAnalyticsData {
  distribution: RiskDistributionItem[]
  predictedVsActual: PredictedVsActualItem[]
  patterns: {
    byDayOfWeek: PatternItem[]
    byTimeSlot: PatternItem[]
    byService: PatternItem[]
  }
  period: { start: Date; end: Date }
  totals: { reminders: number; appointments: number }
  generatedAt: string
}

/**
 * Day names in Portuguese (Sunday = 0)
 */
const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

/**
 * Time slot labels in Portuguese
 */
const TIME_SLOTS = {
  manha: { label: 'Manha', start: 6, end: 12 },
  tarde: { label: 'Tarde', start: 12, end: 18 },
  noite: { label: 'Noite', start: 18, end: 22 },
}

/**
 * Categorize risk score into level
 */
function getRiskLevel(score: number | null): RiskLevel | null {
  if (score === null || score === undefined) return null
  if (score < 40) return 'baixo'
  if (score < 70) return 'medio'
  return 'alto'
}

/**
 * Get time slot from hour
 */
function getTimeSlot(hour: number): string {
  if (hour >= TIME_SLOTS.manha.start && hour < TIME_SLOTS.manha.end) {
    return TIME_SLOTS.manha.label
  }
  if (hour >= TIME_SLOTS.tarde.start && hour < TIME_SLOTS.tarde.end) {
    return TIME_SLOTS.tarde.label
  }
  if (hour >= TIME_SLOTS.noite.start && hour < TIME_SLOTS.noite.end) {
    return TIME_SLOTS.noite.label
  }
  return 'Outro'
}

/**
 * Calculate risk score distribution
 *
 * Query lembretes_enviados and group by risk level.
 *
 * @param periodDays Number of days to look back
 * @returns Array of risk distribution items
 */
export async function calculateRiskDistribution(
  periodDays: number
): Promise<RiskDistributionItem[]> {
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, periodDays))

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('lembretes_enviados')
    .select('risco_noshow')
    .gte('data_envio', startDate.toISOString())
    .lte('data_envio', endDate.toISOString())
    .not('risco_noshow', 'is', null)

  if (error) {
    console.error('Error fetching risk distribution:', error)
    return getEmptyDistribution()
  }

  if (!data || data.length === 0) {
    return getEmptyDistribution()
  }

  // Count by risk level
  const counts: Record<RiskLevel, number> = { baixo: 0, medio: 0, alto: 0 }
  let total = 0

  data.forEach((item) => {
    const level = getRiskLevel(item.risco_noshow)
    if (level) {
      counts[level]++
      total++
    }
  })

  // Calculate percentages
  return [
    {
      riskLevel: 'baixo',
      count: counts.baixo,
      percentage: total > 0 ? Math.round((counts.baixo / total) * 1000) / 10 : 0,
    },
    {
      riskLevel: 'medio',
      count: counts.medio,
      percentage: total > 0 ? Math.round((counts.medio / total) * 1000) / 10 : 0,
    },
    {
      riskLevel: 'alto',
      count: counts.alto,
      percentage: total > 0 ? Math.round((counts.alto / total) * 1000) / 10 : 0,
    },
  ]
}

/**
 * Return empty distribution with zeros
 */
function getEmptyDistribution(): RiskDistributionItem[] {
  return [
    { riskLevel: 'baixo', count: 0, percentage: 0 },
    { riskLevel: 'medio', count: 0, percentage: 0 },
    { riskLevel: 'alto', count: 0, percentage: 0 },
  ]
}

/**
 * Calculate predicted vs actual no-show correlation
 *
 * Fetch lembretes_enviados from Supabase, then use Prisma to get agendamento status.
 *
 * @param periodDays Number of days to look back
 * @returns Array of predicted vs actual items
 */
export async function calculatePredictedVsActual(
  periodDays: number
): Promise<PredictedVsActualItem[]> {
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, periodDays))

  const supabase = createAdminClient()

  // Fetch lembretes from Supabase (without joins)
  const { data, error } = await supabase
    .from('lembretes_enviados')
    .select('risco_noshow, agendamento_id')
    .gte('data_envio', startDate.toISOString())
    .lte('data_envio', endDate.toISOString())
    .not('risco_noshow', 'is', null)

  if (error) {
    console.error('Error fetching predicted vs actual:', error)
    return getEmptyPredictedVsActual()
  }

  if (!data || data.length === 0) {
    return getEmptyPredictedVsActual()
  }

  // Get unique agendamento IDs
  const agendamentoIds = [...new Set(data.map(item => item.agendamento_id).filter(Boolean))]

  // Fetch agendamento statuses from Prisma (only past appointments)
  const agendamentos = await prisma.appointment.findMany({
    where: {
      id: { in: agendamentoIds },
      dataHora: { lt: new Date() }, // Only past appointments
      status: { in: ['nao_compareceu', 'concluida', 'confirmada'] },
    },
    select: { id: true, status: true },
  })

  // Create a map for quick lookup
  const statusMap = new Map(agendamentos.map(a => [a.id, a.status]))

  // Track outcomes by risk level
  const outcomes: Record<RiskLevel, { noShow: number; attended: number }> = {
    baixo: { noShow: 0, attended: 0 },
    medio: { noShow: 0, attended: 0 },
    alto: { noShow: 0, attended: 0 },
  }

  data.forEach((item) => {
    const level = getRiskLevel(item.risco_noshow)
    if (!level) return

    const status = statusMap.get(item.agendamento_id)
    if (!status) return

    // Check if appointment was a no-show or attended
    if (status === 'nao_compareceu') {
      outcomes[level].noShow++
    } else if (status === 'concluida' || status === 'confirmada') {
      outcomes[level].attended++
    }
    // Other statuses (agendada, cancelada) are not counted
  })

  // Calculate accuracy for each level
  // Accuracy = how well the prediction matches reality
  // For high risk: accuracy = noShow / total (expecting no-shows)
  // For low risk: accuracy = attended / total (expecting attendance)
  return [
    {
      predicted: 'baixo',
      actualNoShow: outcomes.baixo.noShow,
      actualAttended: outcomes.baixo.attended,
      accuracy: calculateAccuracy('baixo', outcomes.baixo),
    },
    {
      predicted: 'medio',
      actualNoShow: outcomes.medio.noShow,
      actualAttended: outcomes.medio.attended,
      accuracy: calculateAccuracy('medio', outcomes.medio),
    },
    {
      predicted: 'alto',
      actualNoShow: outcomes.alto.noShow,
      actualAttended: outcomes.alto.attended,
      accuracy: calculateAccuracy('alto', outcomes.alto),
    },
  ]
}

/**
 * Calculate prediction accuracy
 *
 * For high risk: expect no-show, so accuracy = noShow / total
 * For low risk: expect attendance, so accuracy = attended / total
 * For medium: 50% threshold
 */
function calculateAccuracy(
  level: RiskLevel,
  outcome: { noShow: number; attended: number }
): number {
  const total = outcome.noShow + outcome.attended
  if (total === 0) return 0

  let correctPredictions: number
  if (level === 'alto') {
    // High risk should result in no-shows
    correctPredictions = outcome.noShow
  } else if (level === 'baixo') {
    // Low risk should result in attendance
    correctPredictions = outcome.attended
  } else {
    // Medium risk - use max of both as "correct"
    correctPredictions = Math.max(outcome.noShow, outcome.attended)
  }

  return Math.round((correctPredictions / total) * 1000) / 10
}

/**
 * Return empty predicted vs actual with zeros
 */
function getEmptyPredictedVsActual(): PredictedVsActualItem[] {
  return [
    { predicted: 'baixo', actualNoShow: 0, actualAttended: 0, accuracy: 0 },
    { predicted: 'medio', actualNoShow: 0, actualAttended: 0, accuracy: 0 },
    { predicted: 'alto', actualNoShow: 0, actualAttended: 0, accuracy: 0 },
  ]
}

/**
 * Calculate no-show patterns by day, time, and service
 *
 * @param periodDays Number of days to look back
 * @returns Patterns grouped by day, time slot, and service
 */
export async function calculateNoShowPatterns(
  periodDays: number
): Promise<{
  byDayOfWeek: PatternItem[]
  byTimeSlot: PatternItem[]
  byService: PatternItem[]
}> {
  const endDate = endOfDay(new Date())
  const startDate = startOfDay(subDays(endDate, periodDays))

  // Use Prisma for appointments since it has better type safety
  // Query appointments that are completed or no-show
  const appointments = await prisma.appointment.findMany({
    where: {
      dataHora: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['nao_compareceu', 'concluida', 'confirmada'],
      },
    },
    select: {
      dataHora: true,
      status: true,
      tipoConsulta: true,
    },
  })

  if (appointments.length === 0) {
    return getEmptyPatterns()
  }

  // Initialize aggregations
  const byDay: Record<string, { noShow: number; total: number }> = {}
  DAY_NAMES_PT.forEach((day) => {
    byDay[day] = { noShow: 0, total: 0 }
  })

  const bySlot: Record<string, { noShow: number; total: number }> = {
    [TIME_SLOTS.manha.label]: { noShow: 0, total: 0 },
    [TIME_SLOTS.tarde.label]: { noShow: 0, total: 0 },
    [TIME_SLOTS.noite.label]: { noShow: 0, total: 0 },
  }

  const byService: Record<string, { noShow: number; total: number }> = {}

  // Process each appointment
  appointments.forEach((apt) => {
    const date = new Date(apt.dataHora)
    const dayIndex = getDay(date)
    const dayName = DAY_NAMES_PT[dayIndex]
    const hour = getHours(date)
    const slot = getTimeSlot(hour)
    const service = apt.tipoConsulta || 'Nao especificado'
    const isNoShow = apt.status === 'nao_compareceu'

    // Aggregate by day
    if (byDay[dayName]) {
      byDay[dayName].total++
      if (isNoShow) byDay[dayName].noShow++
    }

    // Aggregate by time slot
    if (bySlot[slot]) {
      bySlot[slot].total++
      if (isNoShow) bySlot[slot].noShow++
    }

    // Aggregate by service
    if (!byService[service]) {
      byService[service] = { noShow: 0, total: 0 }
    }
    byService[service].total++
    if (isNoShow) byService[service].noShow++
  })

  // Convert to result format
  const byDayOfWeek: PatternItem[] = DAY_NAMES_PT.map((day) => ({
    day,
    noShowRate: byDay[day].total > 0
      ? Math.round((byDay[day].noShow / byDay[day].total) * 1000) / 10
      : 0,
    total: byDay[day].total,
  }))

  const byTimeSlot: PatternItem[] = [
    TIME_SLOTS.manha.label,
    TIME_SLOTS.tarde.label,
    TIME_SLOTS.noite.label,
  ].map((slot) => ({
    slot,
    noShowRate: bySlot[slot].total > 0
      ? Math.round((bySlot[slot].noShow / bySlot[slot].total) * 1000) / 10
      : 0,
    total: bySlot[slot].total,
  }))

  const byServiceArr: PatternItem[] = Object.entries(byService)
    .map(([service, data]) => ({
      service,
      noShowRate: data.total > 0
        ? Math.round((data.noShow / data.total) * 1000) / 10
        : 0,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total) // Sort by volume
    .slice(0, 10) // Top 10 services

  return {
    byDayOfWeek,
    byTimeSlot,
    byService: byServiceArr,
  }
}

/**
 * Return empty patterns with zeros
 */
function getEmptyPatterns(): {
  byDayOfWeek: PatternItem[]
  byTimeSlot: PatternItem[]
  byService: PatternItem[]
} {
  return {
    byDayOfWeek: DAY_NAMES_PT.map((day) => ({ day, noShowRate: 0, total: 0 })),
    byTimeSlot: [
      { slot: TIME_SLOTS.manha.label, noShowRate: 0, total: 0 },
      { slot: TIME_SLOTS.tarde.label, noShowRate: 0, total: 0 },
      { slot: TIME_SLOTS.noite.label, noShowRate: 0, total: 0 },
    ],
    byService: [],
  }
}
