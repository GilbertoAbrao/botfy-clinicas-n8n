import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateFile } from '@/lib/validations/document';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { id: patientId } = await params;

    // Check authentication and authorization
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Fetch documents for patient
    const documents = await prisma.patientDocument.findMany({
      where: { patientId },
      include: {
        uploader: {
          select: { email: true }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: 'VIEW_DOCUMENTS',
      resource: 'patient_documents',
      resourceId: patientId,
      details: { count: documents.length },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { id: patientId } = await params;

    // Check authentication and authorization
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique storage path
    const fileExt = file.name.split('.').pop();
    const uniqueId = crypto.randomUUID();
    const storagePath = `${patientId}/${uniqueId}-${file.name}`;

    // Upload to Supabase Storage
    const supabase = await createServerSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Create document metadata in database
    const document = await prisma.patientDocument.create({
      data: {
        patientId,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        uploadedBy: user.id
      },
      include: {
        uploader: {
          select: { email: true }
        }
      }
    });

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: 'UPLOAD_DOCUMENT',
      resource: 'patient_documents',
      resourceId: patientId,
      details: { filename: file.name, size: file.size, type: file.type },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do documento' },
      { status: 500 }
    );
  }
}
