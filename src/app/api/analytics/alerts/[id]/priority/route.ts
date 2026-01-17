import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { calculateAlertPriority, PriorityResult } from '@/lib/analytics/priority-scorer'

/**
 * GET /api/analytics/alerts/[id]/priority
 *
 * Returns the calculated priority score for a specific alert.
 *
 * The priority score (1-100) is calculated based on:
 * - Alert type weight (urgent: +40, high: +25, low: +10)
 * - Alert age (older = higher priority, max +20 for >24h)
 * - Patient history (high no-show rate = +15, many cancellations = +10)
 * - Appointment proximity (within 24h = +15, within 2h = +25)
 *
 * Returns:
 * - score: number (1-100)
 * - factors: breakdown of individual factor weights
 * - explanation: human-readable explanation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PriorityResult | { error: string }>> {
  const { id } = await params

  // Auth check
  const user = await getCurrentUserWithRole()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and ATENDENTE can view alert priority
  if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const priority = await calculateAlertPriority(id)
    return NextResponse.json(priority)
  } catch (error) {
    console.error('[Alert Priority API] Error:', error)

    // Handle specific "not found" error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
