import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'

// Validation schema for resolve request
const resolveAlertSchema = z.object({
  interventionType: z.enum(['reschedule', 'send_message', 'clear_memory']),
  notes: z.string().optional(),
})

/**
 * POST /api/alerts/[id]/resolve
 *
 * Mark an alert as resolved after a successful intervention.
 * Records intervention type for tracking and audit.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: alertId } = await params
    const body = await req.json()

    // Validate request body
    const validated = resolveAlertSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validated.error.format() },
        { status: 400 }
      )
    }

    const { interventionType, notes } = validated.data

    // Check if alert exists
    const existingAlert = await prisma.alert.findUnique({
      where: { id: alertId },
    })

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Prepare metadata with intervention details
    const existingMetadata = (existingAlert.metadata as Record<string, unknown>) || {}
    const updatedMetadata = {
      ...existingMetadata,
      intervention: {
        type: interventionType,
        notes: notes || undefined,
        resolvedAt: new Date().toISOString(),
      },
    }

    // Update alert to resolved status
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolver: {
          connect: { id: user.id },
        },
        // Store intervention details in metadata JSON field
        metadata: updatedMetadata,
      },
      include: {
        patient: true,
        appointment: true,
        resolver: {
          select: { email: true },
        },
      },
    })

    // Audit log with intervention details
    await logAudit({
      userId: user.id,
      action: AuditAction.RESOLVE_ALERT,
      resource: 'alerts',
      resourceId: alertId,
      details: {
        interventionType,
        notes,
        previousStatus: existingAlert.status,
        alertType: existingAlert.type,
        patientId: existingAlert.patientId,
      },
    })

    return NextResponse.json(updatedAlert)
  } catch (error) {
    console.error('Error resolving alert:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
