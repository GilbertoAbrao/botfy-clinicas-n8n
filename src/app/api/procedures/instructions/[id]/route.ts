import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { instructionSchema } from '@/lib/validations/instruction';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para acessar instrucoes' },
        { status: 403 }
      );
    }

    // Await params (Next.js 15+ async params)
    const { id } = await params;
    const instructionId = parseInt(id);

    if (isNaN(instructionId)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }

    // Fetch instruction
    const instruction = await prisma.procedureInstruction.findUnique({
      where: { id: instructionId },
    });

    if (!instruction) {
      return NextResponse.json(
        { error: 'Instrucao nao encontrada' },
        { status: 404 }
      );
    }

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_INSTRUCTION,
      resource: 'procedure_instructions',
      resourceId: instruction.id.toString(),
    });

    return NextResponse.json(instruction);
  } catch (error) {
    console.error('Error fetching instruction:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar instrucao' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para editar instrucoes' },
        { status: 403 }
      );
    }

    // Await params
    const { id } = await params;
    const instructionId = parseInt(id);

    if (isNaN(instructionId)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = instructionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados invalidos',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Check if instruction exists
    const existingInstruction = await prisma.procedureInstruction.findUnique({
      where: { id: instructionId },
    });

    if (!existingInstruction) {
      return NextResponse.json(
        { error: 'Instrucao nao encontrada' },
        { status: 404 }
      );
    }

    // Check if new titulo conflicts with another instruction (same servicoId)
    if (validatedData.titulo.toLowerCase() !== existingInstruction.titulo.toLowerCase() ||
        validatedData.servicoId !== existingInstruction.servicoId) {
      const titleConflict = await prisma.procedureInstruction.findFirst({
        where: {
          titulo: {
            equals: validatedData.titulo,
            mode: 'insensitive',
          },
          servicoId: validatedData.servicoId,
          id: { not: instructionId },
        },
      });

      if (titleConflict) {
        return NextResponse.json(
          { error: 'Ja existe outra instrucao com este titulo para este servico' },
          { status: 409 }
        );
      }
    }

    // Track what changed for audit log
    const changes: Record<string, { from: any; to: any }> = {};

    if (existingInstruction.titulo !== validatedData.titulo) {
      changes.titulo = { from: existingInstruction.titulo, to: validatedData.titulo };
    }
    if (existingInstruction.conteudo !== validatedData.conteudo) {
      changes.conteudo = { from: '[previous content]', to: '[updated content]' };
    }
    if (existingInstruction.tipoInstrucao !== validatedData.tipoInstrucao) {
      changes.tipoInstrucao = { from: existingInstruction.tipoInstrucao, to: validatedData.tipoInstrucao };
    }
    if (existingInstruction.servicoId !== validatedData.servicoId) {
      changes.servicoId = { from: existingInstruction.servicoId, to: validatedData.servicoId };
    }
    if (existingInstruction.prioridade !== validatedData.prioridade) {
      changes.prioridade = { from: existingInstruction.prioridade, to: validatedData.prioridade };
    }
    if (existingInstruction.ativo !== validatedData.ativo) {
      changes.ativo = { from: existingInstruction.ativo, to: validatedData.ativo };
    }

    // Update instruction
    const updatedInstruction = await prisma.procedureInstruction.update({
      where: { id: instructionId },
      data: {
        servicoId: validatedData.servicoId,
        tipoInstrucao: validatedData.tipoInstrucao,
        titulo: validatedData.titulo,
        conteudo: validatedData.conteudo,
        prioridade: validatedData.prioridade,
        ativo: validatedData.ativo,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_INSTRUCTION,
      resource: 'procedure_instructions',
      resourceId: updatedInstruction.id.toString(),
      details: {
        titulo: updatedInstruction.titulo,
        changes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updatedInstruction);
  } catch (error) {
    console.error('Error updating instruction:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar instrucao' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para desativar instrucoes' },
        { status: 403 }
      );
    }

    // Await params
    const { id } = await params;
    const instructionId = parseInt(id);

    if (isNaN(instructionId)) {
      return NextResponse.json(
        { error: 'ID invalido' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // PATCH is only for deactivation (soft delete per INST-07)
    if (body.ativo !== false) {
      return NextResponse.json(
        { error: 'PATCH so permite desativar instrucoes (ativo: false)' },
        { status: 400 }
      );
    }

    // Check if instruction exists
    const existingInstruction = await prisma.procedureInstruction.findUnique({
      where: { id: instructionId },
    });

    if (!existingInstruction) {
      return NextResponse.json(
        { error: 'Instrucao nao encontrada' },
        { status: 404 }
      );
    }

    // Deactivate instruction (soft delete)
    await prisma.procedureInstruction.update({
      where: { id: instructionId },
      data: { ativo: false },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry with DEACTIVATE action
    await logAudit({
      userId: user.id,
      action: AuditAction.DEACTIVATE_INSTRUCTION,
      resource: 'procedure_instructions',
      resourceId: instructionId.toString(),
      details: {
        titulo: existingInstruction.titulo,
        previousStatus: existingInstruction.ativo,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, id: instructionId });
  } catch (error) {
    console.error('Error deactivating instruction:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar instrucao' },
      { status: 500 }
    );
  }
}
