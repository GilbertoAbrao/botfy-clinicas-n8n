import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  patientDocumentFiltersSchema,
  PatientDocument,
} from '@/lib/validations/patient-document'

export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    // 2. Parse and validate query params
    const { searchParams } = new URL(req.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const filters = patientDocumentFiltersSchema.parse(queryParams)

    // 3. Build Supabase query
    const supabase = await createServerSupabaseClient()

    // Base query with patient join
    let query = supabase
      .from('documentos_paciente')
      .select(`
        *,
        paciente:pacientes!documentos_paciente_paciente_id_fkey (
          id,
          nome,
          telefone
        )
      `, { count: 'exact' })

    // 4. Apply filters
    // Status filter: map status string to validado boolean
    if (filters.status) {
      if (filters.status === 'pendente') {
        query = query.is('validado', null)
      } else if (filters.status === 'aprovado') {
        query = query.eq('validado', true)
      } else if (filters.status === 'rejeitado') {
        query = query.eq('validado', false)
      }
    }

    // Type filter
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    // Date range filter
    if (filters.dateStart) {
      query = query.gte('created_at', filters.dateStart)
    }
    if (filters.dateEnd) {
      query = query.lte('created_at', filters.dateEnd + 'T23:59:59')
    }

    // 5. Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(
        (filters.page - 1) * filters.limit,
        filters.page * filters.limit - 1
      )

    const { data, error, count } = await query

    if (error) {
      console.error('[patient-documents] Supabase error:', error)
      throw new Error(error.message)
    }

    // 6. Transform response data and apply client-side search filter
    let documents: PatientDocument[] = (data || []).map((item: any) => {
      // Handle paciente data (can be array or object from Supabase)
      const paciente = Array.isArray(item.paciente) ? item.paciente[0] : item.paciente

      return {
        id: item.id,
        pre_checkin_id: item.pre_checkin_id,
        paciente_id: item.paciente_id,
        tipo: item.tipo,
        arquivo_url: item.arquivo_url,
        arquivo_path: item.arquivo_path,
        dados_extraidos: item.dados_extraidos,
        confianca_extracao: item.confianca_extracao,
        validado: item.validado,
        validado_por: item.validado_por,
        observacoes: item.observacoes,
        created_at: item.created_at,
        paciente: paciente ? {
          id: paciente.id,
          nome: paciente.nome,
          telefone: paciente.telefone,
        } : null,
      }
    })

    // Client-side search filter (Supabase can't filter on joined fields)
    if (filters.search && documents.length > 0) {
      const searchLower = filters.search.toLowerCase()
      documents = documents.filter((doc) =>
        doc.paciente?.nome?.toLowerCase().includes(searchLower)
      )
    }

    // 7. Get status counts for filter badges
    const { data: countData } = await supabase
      .from('documentos_paciente')
      .select('validado')

    const counts = {
      pendente: 0,
      aprovado: 0,
      rejeitado: 0,
      total: 0,
    }

    if (countData) {
      countData.forEach((doc: { validado: boolean | null }) => {
        counts.total++
        if (doc.validado === null) counts.pendente++
        else if (doc.validado === true) counts.aprovado++
        else counts.rejeitado++
      })
    }

    // 8. Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_DOCUMENTS,
      resource: 'documentos_paciente',
      details: { filters, resultCount: documents.length },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    // 9. Adjust count if client-side filtering was applied
    const total = filters.search ? documents.length : (count || 0)
    const totalPages = Math.ceil(total / filters.limit)

    // 10. Return response
    return NextResponse.json({
      data: documents,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
      counts,
    })
  } catch (error) {
    console.error('[patient-documents] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
