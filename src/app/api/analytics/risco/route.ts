import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import {
  calculateRiskDistribution,
  calculatePredictedVsActual,
  calculateNoShowPatterns,
  type RiskAnalyticsData,
} from '@/lib/analytics/risk-calculator'

/**
 * GET /api/analytics/risco
 *
 * Returns risk analytics data for no-show prediction visualization.
 *
 * Query Parameters:
 * - periodDays: number (default 30, max 90)
 *
 * Returns:
 * - distribution: Risk score distribution (baixo/medio/alto)
 * - predictedVsActual: Correlation between predictions and outcomes
 * - patterns: No-show patterns by day, time, and service
 * - period: Start and end dates for the analysis
 * - totals: Total counts for context
 * - generatedAt: ISO timestamp
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<RiskAnalyticsData | { error: string }>> {
  try {
    // 1. Authentication check
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // 2. Authorization: ADMIN or ATENDENTE can view analytics
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    // 3. Parse and validate query params
    const { searchParams } = new URL(request.url)
    let periodDays = parseInt(searchParams.get('periodDays') || '30', 10)

    // Validate and clamp periodDays
    if (isNaN(periodDays) || periodDays < 1) {
      periodDays = 30
    }
    periodDays = Math.min(periodDays, 90)

    // 4. Fetch all analytics in parallel
    const [distribution, predictedVsActual, patterns] = await Promise.all([
      calculateRiskDistribution(periodDays),
      calculatePredictedVsActual(periodDays),
      calculateNoShowPatterns(periodDays),
    ])

    // 5. Calculate totals
    const totalReminders = distribution.reduce((sum, d) => sum + d.count, 0)
    const totalAppointments = patterns.byDayOfWeek.reduce(
      (sum, d) => sum + d.total,
      0
    )

    // 6. Build response
    const response: RiskAnalyticsData = {
      distribution,
      predictedVsActual,
      patterns,
      period: {
        start: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      totals: {
        reminders: totalReminders,
        appointments: totalAppointments,
      },
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Risk Analytics API] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular analytics de risco' },
      { status: 500 }
    )
  }
}
