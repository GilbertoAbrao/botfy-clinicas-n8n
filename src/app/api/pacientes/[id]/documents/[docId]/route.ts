import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    }

    const { id: patientId, docId } = await params;

    // Fetch document metadata
    const document = await prisma.patientDocument.findUnique({
      where: { id: docId }
    });

    if (!document || document.patientId !== patientId) {
      return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 });
    }

    // Generate signed URL (1 hour expiry)
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(document.storagePath, 3600);

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar URL de download' },
        { status: 500 }
      );
    }

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_DOCUMENT,
      resource: 'patient_documents',
      resourceId: patientId,
      details: { documentId: docId, filename: document.filename },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de download' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // Check authentication and authorization
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
    }

    const { id: patientId, docId } = await params;

    // Fetch document metadata
    const document = await prisma.patientDocument.findUnique({
      where: { id: docId }
    });

    if (!document || document.patientId !== patientId) {
      return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 });
    }

    // Delete from Supabase Storage
    const supabase = await createServerSupabaseClient();
    const { error: deleteError } = await supabase.storage
      .from('patient-documents')
      .remove([document.storagePath]);

    if (deleteError) {
      console.error('Error deleting from storage:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
        { status: 500 }
      );
    }

    // Delete metadata from database
    await prisma.patientDocument.delete({
      where: { id: docId }
    });

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.DELETE_DOCUMENT,
      resource: 'patient_documents',
      resourceId: patientId,
      details: { documentId: docId, filename: document.filename },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar documento' },
      { status: 500 }
    );
  }
}
