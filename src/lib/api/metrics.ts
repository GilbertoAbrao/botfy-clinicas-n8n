'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { AppError, handleApiError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import { startOfDay, endOfDay } from 'date-fns'

/**
 * Metrics data for dashboard widgets
 */
export interface MetricsData {
  agendamentosHoje: number
  taxaConfirmacao: number | null // Percentage (0-100) or null if no data
  conversasAtivas: number
}

/**
 * Cache for metrics data (5 minutes)
 * Simple in-memory cache to avoid excessive database queries
 */
let metricsCache: {
  data: MetricsData | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Get count of appointments scheduled for today
 * Counts appointments with scheduledAt date = today
 *
 * @returns Count of appointments for today
 */
export async function getAgendamentosHoje(): Promise<number> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)

    const count = await prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    })

    return count
  } catch (error) {
    console.error('[getAgendamentosHoje] Error:', error)
    return 0
  }
}

/**
 * Calculate confirmation rate for appointments
 * Formula: (confirmed / (confirmed + tentative)) * 100
 *
 * @returns Confirmation percentage (0-100) or null if no data
 */
export async function getTaxaConfirmacao(): Promise<number | null> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Count confirmed appointments
    const confirmedCount = await prisma.appointment.count({
      where: {
        status: 'confirmed',
      },
    })

    // Count tentative appointments
    const tentativeCount = await prisma.appointment.count({
      where: {
        status: 'tentative',
      },
    })

    const total = confirmedCount + tentativeCount

    // Return null if no appointments
    if (total === 0) {
      return null
    }

    // Calculate percentage
    const percentage = (confirmedCount / total) * 100

    // Round to 1 decimal place
    return Math.round(percentage * 10) / 10
  } catch (error) {
    console.error('[getTaxaConfirmacao] Error:', error)
    return null
  }
}

/**
 * Get count of active conversations
 * Counts conversations with status = ai_handling or human_required (not completed)
 *
 * @returns Count of active conversations
 */
export async function getConversasAtivas(): Promise<number> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const count = await prisma.conversation.count({
      where: {
        status: {
          in: ['IA', 'HUMANO'],
        },
      },
    })

    return count
  } catch (error) {
    console.error('[getConversasAtivas] Error:', error)
    return 0
  }
}

/**
 * Get all metrics at once with caching
 * Combines all metrics queries and caches result for 5 minutes
 *
 * @param skipCache - Skip cache and fetch fresh data
 * @returns All metrics data
 */
export async function getAllMetrics(skipCache: boolean = false): Promise<MetricsData> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Check cache
    const now = Date.now()
    const cacheAge = now - metricsCache.timestamp

    if (!skipCache && metricsCache.data && cacheAge < CACHE_TTL) {
      // Return cached data
      return metricsCache.data
    }

    // Fetch all metrics in parallel for better performance
    const [agendamentosHoje, taxaConfirmacao, conversasAtivas] = await Promise.all([
      getAgendamentosHoje(),
      getTaxaConfirmacao(),
      getConversasAtivas(),
    ])

    const data: MetricsData = {
      agendamentosHoje,
      taxaConfirmacao,
      conversasAtivas,
    }

    // Update cache
    metricsCache = {
      data,
      timestamp: now,
    }

    return data
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[getAllMetrics] Error:', getUserFriendlyMessage(appError), error)

    // Return default values on error
    return {
      agendamentosHoje: 0,
      taxaConfirmacao: null,
      conversasAtivas: 0,
    }
  }
}
