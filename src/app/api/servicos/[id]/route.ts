import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { serviceSchema } from '@/lib/validations/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar serviços' },
        { status: 403 }
      );
    }

    // Await params (Next.js 15+ async params)
    const { id } = await params;

    // Fetch service
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_SERVICE,
      resource: 'services',
      resourceId: service.id,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviço' },
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
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissão para editar serviços' },
        { status: 403 }
      );
    }

    // Await params
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another service
    if (validatedData.nome.toLowerCase() !== existingService.nome.toLowerCase()) {
      const nameConflict = await prisma.service.findFirst({
        where: {
          nome: {
            equals: validatedData.nome,
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Já existe outro serviço com este nome' },
          { status: 409 }
        );
      }
    }

    // Track what changed for audit log
    const changes: Record<string, { from: any; to: any }> = {};

    if (existingService.nome !== validatedData.nome) {
      changes.nome = { from: existingService.nome, to: validatedData.nome };
    }
    if (existingService.duracao !== validatedData.duracao) {
      changes.duracao = { from: existingService.duracao, to: validatedData.duracao };
    }
    if (existingService.preco.toString() !== validatedData.preco.toString()) {
      changes.preco = { from: existingService.preco.toString(), to: validatedData.preco.toString() };
    }
    if (existingService.ativo !== (validatedData.ativo ?? existingService.ativo)) {
      changes.ativo = { from: existingService.ativo, to: validatedData.ativo };
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        nome: validatedData.nome,
        duracao: validatedData.duracao,
        preco: validatedData.preco,
        ativo: validatedData.ativo ?? existingService.ativo,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_SERVICE,
      resource: 'services',
      resourceId: updatedService.id,
      details: {
        serviceName: updatedService.nome,
        changes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar serviço' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir serviços' },
        { status: 403 }
      );
    }

    // Await params
    const { id } = await params;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Check if service has any appointments using this service type name
    // Note: Appointments use serviceType (string), not service ID
    // For now, we allow deletion but log a warning
    const appointmentsWithService = await prisma.appointment.count({
      where: {
        serviceType: {
          equals: existingService.nome,
          mode: 'insensitive',
        },
      },
    });

    // Delete the service
    await prisma.service.delete({
      where: { id },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.DELETE_SERVICE,
      resource: 'services',
      resourceId: id,
      details: {
        serviceName: existingService.nome,
        hadAppointments: appointmentsWithService > 0,
        appointmentCount: appointmentsWithService,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Serviço excluído com sucesso',
      hadAppointments: appointmentsWithService > 0,
      appointmentCount: appointmentsWithService,
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir serviço' },
      { status: 500 }
    );
  }
}
