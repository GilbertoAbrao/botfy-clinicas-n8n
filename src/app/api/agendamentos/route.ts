import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/appointment'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { findConflicts, addBufferTime, TimeSlot } from '@/lib/calendar/conflict-detection'

export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and ATENDENTE can create appointments
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createAppointmentSchema.parse(body)

    const supabase = await createServerClient()

    // Fetch service to get duration
    const { data: service } = await supabase
      .from('servicos')
      .select('duracao_minutos')
      .eq('id', validatedData.servicoId)
      .single()

    const duration = service?.duracao_minutos || 60

    // Create proposed time slot
    const startTime = new Date(validatedData.dataHora)
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const proposedSlot: TimeSlot = {
      providerId: validatedData.providerId || 'default-provider-id',
      start: startTime,
      end: endTime,
    }

    // Add buffer time (15 minutes)
    const slotWithBuffer = addBufferTime(proposedSlot, 15)

    // Fetch existing appointments for this provider on this date
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
      .neq('status', 'CANCELADO')  // Ignore cancelled appointments

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
        { status: 409 }  // Conflict status code
      )
    }

    // No conflicts - proceed with insert
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        paciente_id: validatedData.pacienteId,
        servico_id: validatedData.servicoId,
        provider_id: validatedData.providerId || 'default-provider-id',
        data_hora: validatedData.dataHora,
        observacoes: validatedData.observacoes,
        status: validatedData.status,
        criado_por: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: data.id,
      details: {
        pacienteId: validatedData.pacienteId,
        servicoId: validatedData.servicoId,
        dataHora: validatedData.dataHora,
      },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
