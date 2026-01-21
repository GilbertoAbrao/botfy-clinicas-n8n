import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { approveDocumentSchema } from '@/lib/validations/patient-document'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const validated = approveDocumentSchema.parse(body)

    const supabase = await createServerSupabaseClient()

    // Update document
    const { data, error } = await supabase
      .from('documentos_paciente')
      .update({
        validado: true,
        validado_por: user.id,
        observacoes: validated.observacoes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 })
      }
      throw new Error(error.message)
    }

    await logAudit({
      userId: user.id,
      action: AuditAction.APPROVE_DOCUMENT,
      resource: 'documentos_paciente',
      resourceId: id,
      details: { observacoes: validated.observacoes },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[approve-document] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
