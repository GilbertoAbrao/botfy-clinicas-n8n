import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/appointment'
import { logAudit, AuditAction } from '@/lib/audit/logger'

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

    // Insert appointment
    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        paciente_id: validatedData.pacienteId,
        servico_id: validatedData.servicoId,
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
