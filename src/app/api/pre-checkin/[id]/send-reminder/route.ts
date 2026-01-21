import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { sendPreCheckinReminder } from '@/lib/pre-checkin/n8n-reminder'

// POST /api/pre-checkin/[id]/send-reminder - Send reminder via N8N webhook
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authentication
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // 2. Authorization - ADMIN and ATENDENTE can send reminders
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissao para enviar lembrete' },
        { status: 403 }
      )
    }

    // 3. Send reminder (includes rate limiting)
    try {
      await sendPreCheckinReminder(id)
    } catch (error) {
      // Check if it's a rate limit error
      if (
        error instanceof Error &&
        error.message.includes('Proximo envio disponivel')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 } // Too Many Requests
        )
      }

      // Re-throw other errors
      throw error
    }

    // 4. Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.SEND_PRE_CHECKIN_REMINDER,
      resource: 'pre_checkin',
      resourceId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /pre-checkin/[id]/send-reminder] Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao enviar lembrete',
      },
      { status: 500 }
    )
  }
}
