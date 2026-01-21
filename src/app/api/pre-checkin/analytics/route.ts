import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TZDate } from '@date-fns/tz'
import { differenceInHours } from 'date-fns'
import { z } from 'zod'

const CLINIC_TIMEZONE = 'America/Sao_Paulo'

// Query params schema for analytics
const analyticsParamsSchema = z.object({
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Authorization - ADMIN and ATENDENTE can view analytics
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar analytics' },
        { status: 403 }
      )
    }

    // 3. Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { dateStart, dateEnd } = analyticsParamsSchema.parse(searchParams)

    // 4. Build Supabase query - fetch all pre_checkin records with appointments
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('pre_checkin')
      .select(`
        id,
        status,
        agendamento:agendamentos!pre_checkin_agendamento_id_fkey(
          id,
          data_hora
        )
      `)

    if (error) {
      console.error('[API /pre-checkin/analytics] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar analytics', details: error.message },
        { status: 500 }
      )
    }

    // 5. Apply date filters (on appointment date)
    let records = data || []

    if (dateStart) {
      const startDate = new Date(dateStart)
      records = records.filter((r: any) => {
        const agendamento = Array.isArray(r.agendamento) ? r.agendamento[0] : r.agendamento
        if (!agendamento?.data_hora) return false
        return new Date(agendamento.data_hora) >= startDate
      })
    }

    if (dateEnd) {
      const endDate = new Date(dateEnd)
      records = records.filter((r: any) => {
        const agendamento = Array.isArray(r.agendamento) ? r.agendamento[0] : r.agendamento
        if (!agendamento?.data_hora) return false
        return new Date(agendamento.data_hora) <= endDate
      })
    }

    // 6. Calculate analytics
    const now = new TZDate(new Date(), CLINIC_TIMEZONE)

    const total = records.length
    const completed = records.filter((r: any) => r.status === 'completo').length
    const pending = records.filter((r: any) =>
      r.status === 'pendente' || r.status === 'em_andamento'
    ).length

    // Overdue: status != 'completo' AND appointment is < 12 hours away
    const overdue = records.filter((r: any) => {
      if (r.status === 'completo') return false

      const agendamento = Array.isArray(r.agendamento) ? r.agendamento[0] : r.agendamento
      if (!agendamento?.data_hora) return false

      const appointmentDate = new TZDate(new Date(agendamento.data_hora), CLINIC_TIMEZONE)
      const hoursUntilAppointment = differenceInHours(appointmentDate, now)

      // Overdue if appointment is within next 12 hours (or already passed)
      return hoursUntilAppointment <= 12
    }).length

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 7. Return analytics response
    return NextResponse.json({
      completionRate,
      pendingCount: pending,
      overdueCount: overdue,
      total,
    })
  } catch (error) {
    console.error('[API /pre-checkin/analytics] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
