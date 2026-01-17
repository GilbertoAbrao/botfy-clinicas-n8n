import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import { updateAppointmentSchema } from '@/lib/validations/appointment'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { findConflicts, addBufferTime, TimeSlot } from '@/lib/calendar/conflict-detection'
import { notifyWaitlist } from '@/lib/waitlist/auto-fill'
import {
  notifyN8NAppointmentUpdated,
  notifyN8NAppointmentCancelled,
} from '@/lib/calendar/n8n-sync'

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

    // Fetch original appointment
    const { data: original } = await supabase
      .from('agendamentos')
      .select('data_hora, provider_id, servico_id')
      .eq('id', id)
      .single()

    if (!original) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    // Only check conflicts if time or provider changed
    const timeChanged = validatedData.dataHora && validatedData.dataHora !== original.data_hora
    const providerChanged = validatedData.providerId && validatedData.providerId !== original.provider_id

    if (timeChanged || providerChanged) {
      // Fetch service duration
      const servicoId = validatedData.servicoId || original.servico_id
      const { data: service } = await supabase
        .from('servicos')
        .select('duracao_minutos')
        .eq('id', servicoId)
        .single()

      const duration = service?.duracao_minutos || 60

      // Create proposed slot
      const startTime = new Date(validatedData.dataHora || original.data_hora)
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const proposedSlot: TimeSlot = {
        id,  // Include ID for self-exclusion
        providerId: validatedData.providerId || original.provider_id || 'default-provider-id',
        start: startTime,
        end: endTime,
      }

      const slotWithBuffer = addBufferTime(proposedSlot, 15)

      // Fetch existing appointments (same logic as POST)
      const startOfDay = new Date(startTime)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(startTime)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: existingApts } = await supabase
        .from('agendamentos')
        .select('id, data_hora, provider_id, servicos(duracao_minutos)')
        .eq('provider_id', slotWithBuffer.providerId)
        .gte('data_hora', startOfDay.toISOString())
        .lte('data_hora', endOfDay.toISOString())
        .neq('status', 'CANCELADO')

      // Convert to TimeSlot format
      const existingSlots: TimeSlot[] = (existingApts || []).map(apt => {
        const start = new Date(apt.data_hora)
        const duration = (apt.servicos as any)?.duracao_minutos || 60
        const end = new Date(start.getTime() + duration * 60000)

        return {
          id: apt.id,
          providerId: apt.provider_id || 'default-provider-id',
          start,
          end,
        }
      })

      // Check for conflicts
      const conflicts = findConflicts(slotWithBuffer, existingSlots)

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Conflito de horário detectado',
            conflicts: conflicts.map(c => c.id),
          },
          { status: 409 }
        )
      }
    }

    // No conflicts or no time change - proceed with update
    const updateData: any = {}
    if (validatedData.pacienteId) updateData.paciente_id = validatedData.pacienteId
    if (validatedData.servicoId) updateData.servico_id = validatedData.servicoId
    if (validatedData.providerId) updateData.provider_id = validatedData.providerId
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

    // Trigger N8N webhook if significant changes (time, status, provider, service)
    const changes: Record<string, string> = {}
    if (validatedData.dataHora) changes.dataHora = validatedData.dataHora
    if (validatedData.status) changes.status = validatedData.status
    if (validatedData.providerId) changes.providerId = validatedData.providerId
    if (validatedData.servicoId) changes.serviceId = validatedData.servicoId

    if (Object.keys(changes).length > 0) {
      notifyN8NAppointmentUpdated({
        appointmentId: id,
        changes,
      }).catch(err => console.error('N8N sync failed:', err))
    }

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

    // Fetch appointment details before deleting (include patient/service for N8N)
    const { data: appointment } = await supabase
      .from('agendamentos')
      .select(`
        *,
        paciente:pacientes(nome, telefone),
        servico:servicos(nome),
        provider:providers(nome)
      `)
      .eq('id', id)
      .single()

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

    // Trigger N8N webhook for cancellation (handles reminder cleanup)
    if (appointment) {
      notifyN8NAppointmentCancelled({
        appointmentId: id,
        patientId: appointment.paciente_id,
        serviceId: appointment.servico_id,
        providerId: appointment.provider_id,
        dataHora: appointment.data_hora,
        status: appointment.status,
        patientName: appointment.paciente?.nome,
        patientPhone: appointment.paciente?.telefone,
        serviceName: appointment.servico?.nome,
        providerName: appointment.provider?.nome,
      }).catch(err => console.error('N8N cancellation sync failed:', err))

      // Trigger waitlist notification (async, don't wait)
      notifyWaitlist({
        servicoTipo: appointment.tipo_consulta,
        providerId: appointment.provider_id,
        dataHora: new Date(appointment.data_hora),
      }).catch(err => console.error('Waitlist notification failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
