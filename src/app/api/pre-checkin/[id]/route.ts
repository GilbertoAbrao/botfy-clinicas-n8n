import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

// Validation schema for PUT request body
const updateStatusSchema = z.object({
  status: z.enum(['completo', 'incompleto']),
})

// GET /api/pre-checkin/[id] - Fetch single pre-checkin by ID
export async function GET(
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

    // 2. Authorization - ADMIN and ATENDENTE can view pre-checkin
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissao para visualizar pre check-in' },
        { status: 403 }
      )
    }

    // 3. Fetch pre-checkin with related data
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
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
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Pre-checkin nao encontrado' },
          { status: 404 }
        )
      }
      console.error('[API /pre-checkin/[id]] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pre-checkin', details: error.message },
        { status: 500 }
      )
    }

    // Handle array results from Supabase joins
    const agendamento = Array.isArray(data.agendamento)
      ? data.agendamento[0]
      : data.agendamento
    const paciente = Array.isArray(data.paciente)
      ? data.paciente[0]
      : data.paciente

    const preCheckin = {
      id: data.id,
      agendamento_id: data.agendamento_id,
      paciente_id: data.paciente_id,
      status: data.status,
      dados_confirmados: data.dados_confirmados,
      documentos_enviados: data.documentos_enviados,
      instrucoes_enviadas: data.instrucoes_enviadas,
      pendencias: data.pendencias,
      mensagem_enviada_em: data.mensagem_enviada_em,
      lembrete_enviado_em: data.lembrete_enviado_em,
      created_at: data.created_at,
      updated_at: data.updated_at,
      agendamento: agendamento
        ? {
            id: agendamento.id,
            data_hora: agendamento.data_hora,
            servico: agendamento.servico ? { nome: agendamento.servico.nome } : null,
          }
        : null,
      paciente: paciente
        ? {
            id: paciente.id,
            nome: paciente.nome,
            telefone: paciente.telefone,
          }
        : null,
    }

    // 4. Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_PRE_CHECKIN,
      resource: 'pre_checkin',
      resourceId: id,
    })

    return NextResponse.json(preCheckin)
  } catch (error) {
    console.error('[API /pre-checkin/[id]] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao buscar pre-checkin',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/pre-checkin/[id] - Update pre-checkin status
export async function PUT(
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

    // 2. Authorization - ADMIN and ATENDENTE can update pre-checkin
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Sem permissao para atualizar pre check-in' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validation = updateStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Status invalido', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // 4. Update pre-checkin status
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('pre_checkin')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Pre-checkin nao encontrado' },
          { status: 404 }
        )
      }
      console.error('[API /pre-checkin/[id] PUT] Supabase error:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar pre-checkin', details: error.message },
        { status: 500 }
      )
    }

    // 5. Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_PRE_CHECKIN,
      resource: 'pre_checkin',
      resourceId: id,
      details: { newStatus: status },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API /pre-checkin/[id] PUT] Error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao atualizar pre-checkin',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
