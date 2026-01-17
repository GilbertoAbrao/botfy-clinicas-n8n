import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * DELETE /api/conversations/[sessionId]/memory
 *
 * Clears all chat history for a conversation session from n8n_chat_histories.
 * This resets the AI context, forcing it to start fresh.
 *
 * Use case: When the AI enters a loop or gets confused, staff can reset the context.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // 1. Authentication
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization - Only ADMIN and ATENDENTE can clear memory
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Extract and decode sessionId (may contain @ and . characters)
    const { sessionId } = await params
    const decodedSessionId = decodeURIComponent(sessionId)

    // 4. Delete all chat history for this session
    const result = await prisma.chatHistory.deleteMany({
      where: {
        sessionId: decodedSessionId
      }
    })

    // 5. Audit logging
    await logAudit({
      userId: user.id,
      action: AuditAction.CLEAR_CHAT_MEMORY,
      resource: 'n8n_chat_histories',
      resourceId: decodedSessionId,
      details: { deletedCount: result.count }
    })

    // 6. Response
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'No messages found for this session' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error clearing chat memory:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
