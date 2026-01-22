import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { predictNoShowRisk, NoShowPrediction } from '@/lib/analytics/no-show-predictor'

/**
 * GET /api/analytics/appointments/[id]/risk
 *
 * Returns the no-show risk prediction for a specific appointment.
 *
 * The risk score (0-100) is calculated based on:
 * - Patient's historical no-show rate (40% weight)
 * - Time of day (15% weight)
 * - Day of week (15% weight)
 * - Lead time from booking to appointment (15% weight)
 * - Confirmation status (15% weight)
 *
 * Returns:
 * - appointmentId: number
 * - riskLevel: 'high' | 'medium' | 'low'
 * - riskScore: number (0-100)
 * - factors: breakdown of individual risk factors
 * - recommendations: actionable suggestions in Portuguese
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<NoShowPrediction | { error: string }>> {
  const { id } = await params

  // Auth check
  const user = await getCurrentUserWithRole()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only ADMIN and ATENDENTE can view appointment risk
  if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Validate and convert ID to number
    const appointmentId = parseInt(id, 10)
    if (isNaN(appointmentId) || appointmentId <= 0) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 })
    }
    const prediction = await predictNoShowRisk(appointmentId)
    return NextResponse.json(prediction)
  } catch (error) {
    console.error('[Appointment Risk API] Error:', error)

    // Handle specific "not found" error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
