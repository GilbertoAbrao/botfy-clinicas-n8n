import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import { updateAppointmentSchema } from '@/lib/validations/appointment'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateAppointmentSchema.parse(body)

    const supabase = await createServerClient()

    // Update appointment
    const updateData: any = {}
    if (validatedData.pacienteId) updateData.paciente_id = validatedData.pacienteId
    if (validatedData.servicoId) updateData.servico_id = validatedData.servicoId
    if (validatedData.dataHora) updateData.data_hora = validatedData.dataHora
    if (validatedData.observacoes !== undefined) updateData.observacoes = validatedData.observacoes
    if (validatedData.status) updateData.status = validatedData.status

    const { data, error } = await supabase
      .from('agendamentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: id,
      details: validatedData,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const supabase = await createServerClient()

    // Delete appointment
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.DELETE_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
