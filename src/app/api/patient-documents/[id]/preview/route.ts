import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
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
    const supabase = await createServerSupabaseClient()

    // Get document metadata
    const { data: doc, error: docError } = await supabase
      .from('documentos_paciente')
      .select('arquivo_path, tipo')
      .eq('id', id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 })
    }

    // Generate signed URL (1 hour expiry)
    const { data, error } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(doc.arquivo_path, 3600)

    if (error || !data) {
      console.error('[preview] Signed URL error:', error)
      return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })
    }

    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_DOCUMENT,
      resource: 'documentos_paciente',
      resourceId: id,
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({
      url: data.signedUrl,
      tipo: doc.tipo,
    })
  } catch (error) {
    console.error('[preview] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
