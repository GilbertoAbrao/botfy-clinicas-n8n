import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import {
  preCheckinFiltersSchema,
  PreCheckin,
} from '@/lib/validations/pre-checkin'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Authorization - ADMIN and ATENDENTE can view pre-checkin
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar pré check-in' },
        { status: 403 }
      )
    }

    // 3. Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = preCheckinFiltersSchema.parse(searchParams)

    const { page, limit, dateStart, dateEnd, status, search } = params
    const offset = (page - 1) * limit

    // 4. Build Supabase query
    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('pre_checkin')
      .select(
        `
        *,
        agendamento:agendamentos!pre_checkin_agendamento_id_fkey(
          id,
          data_hora,
          servico:servicos!agendamentos_servico_id_fkey(nome)
        ),
        paciente:pacientes!pre_checkin_paciente_id_fkey(
          id,
          nome,
          telefone
        )
      `,
        { count: 'exact' }
      )

    // 5. Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    // Date filtering on appointment date
    // Note: Supabase doesn't support filtering on nested fields directly
    // We'll fetch all and filter in-memory for date/search (acceptable for 50 items/page)

    // 6. Apply pagination and ordering
    // Order by created_at descending for now (will filter by appointment date in-memory)
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[API /pre-checkin] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pré check-in', details: error.message },
        { status: 500 }
      )
    }

    // 7. Transform response and apply client-side filters
    let preCheckins: PreCheckin[] = (data || []).map((item: any) => {
      // Handle agendamento and paciente data (can be arrays or objects)
      const agendamento = Array.isArray(item.agendamento) ? item.agendamento[0] : item.agendamento
      const paciente = Array.isArray(item.paciente) ? item.paciente[0] : item.paciente

      return {
        id: item.id,
        agendamento_id: item.agendamento_id,
        paciente_id: item.paciente_id,
        status: item.status,
        dados_confirmados: item.dados_confirmados,
        documentos_enviados: item.documentos_enviados,
        instrucoes_enviadas: item.instrucoes_enviadas,
        pendencias: item.pendencias,
        mensagem_enviada_em: item.mensagem_enviada_em,
        lembrete_enviado_em: item.lembrete_enviado_em,
        created_at: item.created_at,
        updated_at: item.updated_at,
        agendamento: agendamento ? {
          id: agendamento.id,
          data_hora: agendamento.data_hora,
          servico: agendamento.servico ? { nome: agendamento.servico.nome } : null,
        } : null,
        paciente: paciente ? {
          id: paciente.id,
          nome: paciente.nome,
          telefone: paciente.telefone,
        } : null,
      }
    })

    // Client-side filter for date range (based on appointment date)
    if (dateStart) {
      const startDate = new Date(dateStart)
      preCheckins = preCheckins.filter(pc => {
        if (!pc.agendamento?.data_hora) return false
        return new Date(pc.agendamento.data_hora) >= startDate
      })
    }

    if (dateEnd) {
      const endDate = new Date(dateEnd)
      preCheckins = preCheckins.filter(pc => {
        if (!pc.agendamento?.data_hora) return false
        return new Date(pc.agendamento.data_hora) <= endDate
      })
    }

    // Client-side filter for search (patient name)
    if (search) {
      const searchLower = search.toLowerCase()
      preCheckins = preCheckins.filter(pc =>
        pc.paciente?.nome?.toLowerCase().includes(searchLower)
      )
    }

    // Adjust count if client-side filtering was applied
    const total = (dateStart || dateEnd || search) ? preCheckins.length : (count || 0)
    const totalPages = Math.ceil(total / limit)

    // 8. Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_PRE_CHECKIN,
      resource: 'pre_checkin',
      details: { filters: params, count: preCheckins.length },
    })

    // 9. Return response
    return NextResponse.json({
      data: preCheckins,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('[API /pre-checkin] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar pré check-in',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
