import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { calculateKPIs, KPIMetrics } from '@/lib/analytics/kpi-calculator'
import { detectPatterns, Pattern } from '@/lib/analytics/pattern-detector'

/**
 * Response type for analytics endpoint
 */
interface AnalyticsResponse {
  kpis: KPIMetrics
  patterns: Pattern[]
  generatedAt: string
}

/**
 * GET /api/analytics
 *
 * Returns comprehensive analytics dashboard data including KPIs and detected patterns.
 *
 * Query Parameters:
 * - periodDays: number (default 30, max 90)
 *
 * Returns:
 * - kpis: Key performance indicators for the period
 * - patterns: Detected failure patterns
 * - generatedAt: ISO timestamp of when the data was generated
 */
export async function GET(req: NextRequest): Promise<NextResponse<AnalyticsResponse | { error: string }>> {
  try {
    // 1. Auth check
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and ATENDENTE can view analytics
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse query params
    const searchParams = req.nextUrl.searchParams
    const periodDaysParam = searchParams.get('periodDays')
    let periodDays = periodDaysParam ? parseInt(periodDaysParam, 10) : 30

    // Validate and clamp periodDays
    if (isNaN(periodDays) || periodDays < 1) {
      periodDays = 30
    }
    if (periodDays > 90) {
      periodDays = 90
    }

    // 3. Fetch analytics in parallel
    const [kpis, patterns] = await Promise.all([
      calculateKPIs({ periodDays }),
      detectPatterns({ lookbackDays: periodDays }),
    ])

    // 4. Return response
    return NextResponse.json({
      kpis,
      patterns,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
