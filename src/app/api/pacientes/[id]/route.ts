import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check - only ADMIN and ATENDENTE can view patient profiles
    if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Await params (Next.js 15+ async params)
    const { id } = await params

    // Fetch patient with relations
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { scheduledAt: 'desc' },
        },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
        },
      },
    })

    // Return 404 if not found
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Log audit entries for PHI access
    // Fire-and-forget pattern - don't await to avoid blocking response
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_PATIENT,
      resource: 'patients',
      resourceId: patient.id,
    })

    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_APPOINTMENT,
      resource: 'appointments',
      resourceId: patient.id,
      details: {
        appointmentCount: patient.appointments.length,
      },
    })

    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONVERSATION,
      resource: 'conversations',
      resourceId: patient.id,
      details: {
        conversationCount: patient.conversations.length,
      },
    })

    // Return patient with relations
    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
