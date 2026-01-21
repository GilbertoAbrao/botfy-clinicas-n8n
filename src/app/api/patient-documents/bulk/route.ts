import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bulkRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  documentIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um documento'),
  observacoes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const body = await req.json()
    const validated = bulkRequestSchema.parse(body)

    // Reject requires reason
    if (validated.action === 'reject' && !validated.observacoes) {
      return NextResponse.json(
        { error: 'Motivo da rejeicao e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Update all documents
    const { data, error } = await supabase
      .from('documentos_paciente')
      .update({
        validado: validated.action === 'approve',
        validado_por: user.id,
        observacoes: validated.observacoes || null,
      })
      .in('id', validated.documentIds)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: validated.action === 'approve'
        ? AuditAction.BULK_APPROVE_DOCUMENTS
        : AuditAction.BULK_REJECT_DOCUMENTS,
      resource: 'documentos_paciente',
      details: {
        documentIds: validated.documentIds,
        count: validated.documentIds.length,
        observacoes: validated.observacoes,
      },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('[bulk-documents] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
