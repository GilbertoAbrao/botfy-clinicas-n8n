import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { updateAppointmentSchema } from '@/lib/validations/appointment'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { findConflicts, addBufferTime, TimeSlot } from '@/lib/calendar/conflict-detection'
import { notifyWaitlist } from '@/lib/waitlist/auto-fill'
import {
  notifyN8NAppointmentUpdated,
  notifyN8NAppointmentCancelled,
} from '@/lib/calendar/n8n-sync'

/**
 * GET /api/agendamentos/[id]
 * Fetch a single appointment by ID from agendamentos table
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminSupabaseClient()

    // Fetch from agendamentos table (N8N/legacy system)
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_hora,
        tipo_consulta,
        status,
        observacoes,
        paciente_id,
        profissional,
        servico_id,
        duracao_minutos
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[API agendamentos GET] Error:', error)
      return NextResponse.json({ error: 'Erro ao buscar agendamento' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API agendamentos GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    console.log('[API agendamentos PUT] Raw body:', JSON.stringify(body))
    const validatedData = updateAppointmentSchema.parse(body)
    console.log('[API agendamentos PUT] Validated data:', JSON.stringify(validatedData))

    const supabase = createAdminSupabaseClient()

    // Fetch original appointment (from appointments table - same as calendar)
    const { data: original } = await supabase
      .from('appointments')
      .select('scheduled_at, provider_id, service_type, duration')
      .eq('id', id)
      .single()

    if (!original) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    // Only check conflicts if time or provider changed
    const timeChanged = validatedData.dataHora && validatedData.dataHora !== original.scheduled_at
    const providerChanged = validatedData.providerId && validatedData.providerId !== original.provider_id

    if (timeChanged || providerChanged) {
      // Use stored duration or fetch from services table
      const serviceType = validatedData.servicoId || original.service_type
      let duration = original.duration || 60

      // If service changed, fetch new duration
      if (validatedData.servicoId && validatedData.servicoId !== original.service_type) {
        const { data: service } = await supabase
          .from('services')
          .select('duracao')
          .eq('nome', serviceType)
          .single()
        if (service?.duracao) {
          duration = service.duracao
        }
      }

      // Create proposed slot
      const startTime = new Date(validatedData.dataHora || original.scheduled_at)
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
        .from('appointments')
        .select('id, scheduled_at, provider_id, duration')
        .eq('provider_id', slotWithBuffer.providerId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .neq('status', 'cancelled')

      // Convert to TimeSlot format
      const existingSlots: TimeSlot[] = (existingApts || []).map(apt => {
        const start = new Date(apt.scheduled_at)
        const aptDuration = apt.duration || 60
        const end = new Date(start.getTime() + aptDuration * 60000)

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
    // Map status from Portuguese frontend to English DB format
    const statusMap: Record<string, string> = {
      'AGENDADO': 'tentative',
      'CONFIRMADO': 'confirmed',
      'REALIZADO': 'completed',
      'CANCELADO': 'cancelled',
      'FALTOU': 'no_show',
    }

    const updateData: any = {}
    if (validatedData.pacienteId) updateData.patient_id = validatedData.pacienteId

    // Handle servicoId - can be UUID or service name
    if (validatedData.servicoId) {
      // Check if it's a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(validatedData.servicoId)) {
        // Fetch service name from UUID
        const { data: serviceData } = await supabase
          .from('services')
          .select('nome')
          .eq('id', validatedData.servicoId)
          .single()
        if (serviceData?.nome) {
          updateData.service_type = serviceData.nome
        }
      } else {
        // Already a service name
        updateData.service_type = validatedData.servicoId
      }
    }

    if (validatedData.providerId) updateData.provider_id = validatedData.providerId
    if (validatedData.dataHora) {
      // Convert datetime-local format to ISO if needed
      const dateStr = validatedData.dataHora
      updateData.scheduled_at = dateStr.includes('Z') ? dateStr : new Date(dateStr).toISOString()
    }

    // Always include notes (even if empty string)
    if (validatedData.observacoes !== undefined) {
      updateData.notes = validatedData.observacoes
    }

    if (validatedData.status) {
      // Convert Portuguese status to English DB status
      updateData.status = statusMap[validatedData.status] || validatedData.status.toLowerCase()
    }

    console.log('[API agendamentos PUT] updateData:', updateData)

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_APPOINTMENT,
      resource: 'appointments',
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
    const supabase = createAdminSupabaseClient()

    // Fetch appointment details before deleting (from appointments table - same as calendar)
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients!patient_id(id, nome, telefone),
        provider:providers!provider_id(id, nome)
      `)
      .eq('id', id)
      .single()

    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    // Delete appointment
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.DELETE_APPOINTMENT,
      resource: 'appointments',
      resourceId: id,
    })

    // Handle patient and provider data (can be array or object)
    const patient = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient
    const provider = Array.isArray(appointment.provider) ? appointment.provider[0] : appointment.provider

    // Trigger N8N webhook for cancellation (handles reminder cleanup)
    notifyN8NAppointmentCancelled({
      appointmentId: id,
      patientId: appointment.patient_id,
      serviceId: appointment.service_type,
      providerId: appointment.provider_id,
      dataHora: appointment.scheduled_at,
      status: appointment.status,
      patientName: patient?.nome,
      patientPhone: patient?.telefone,
      serviceName: appointment.service_type,
      providerName: provider?.nome,
    }).catch(err => console.error('N8N cancellation sync failed:', err))

    // Trigger waitlist notification (async, don't wait)
    notifyWaitlist({
      servicoTipo: appointment.service_type || '',
      providerId: appointment.provider_id,
      dataHora: new Date(appointment.scheduled_at),
    }).catch(err => console.error('Waitlist notification failed:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
