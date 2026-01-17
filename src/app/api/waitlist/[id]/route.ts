import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'

// DELETE: Remove from waitlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // Delete waitlist entry
    const { error } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.REMOVE_WAITLIST,
      resource: 'waitlist',
      resourceId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from waitlist:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update waitlist status (for auto-fill process)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await req.json()

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('waitlist')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating waitlist:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
