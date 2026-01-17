import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { updateUserSchema, toggleUserStatusSchema } from '@/lib/validations/user';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/usuarios/[id] - Get a single user
 * ADMIN only
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Authentication check
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check (ADMIN only)
    if (!checkPermission(currentUser.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: 'Sem permissão para ver usuários' },
        { status: 403 }
      );
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/usuarios/[id] - Update a user (email, role)
 * ADMIN only
 * Cannot change own role
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Authentication check
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check (ADMIN only)
    if (!checkPermission(currentUser.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: 'Sem permissão para editar usuários' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

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

    const { email, role } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Cannot change own role
    if (id === currentUser.id && role !== existingUser.role) {
      return NextResponse.json(
        { error: 'Você não pode alterar seu próprio role' },
        { status: 400 }
      );
    }

    // Check if new email is already in use by another user
    if (email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 409 }
        );
      }

      // Update email in Supabase Auth
      const supabaseAdmin = createAdminClient();
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email,
      });

      if (authError) {
        console.error('Supabase Auth error:', authError);
        return NextResponse.json(
          { error: 'Erro ao atualizar email no sistema de autenticação' },
          { status: 500 }
        );
      }
    }

    // Update user in our table
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: currentUser.id,
      action: AuditAction.UPDATE_USER,
      resource: 'users',
      resourceId: id,
      details: {
        previousEmail: existingUser.email,
        previousRole: existingUser.role,
        newEmail: email,
        newRole: role,
        updatedBy: currentUser.email,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      ...updatedUser,
      message: 'Usuário atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/usuarios/[id] - Toggle user active status
 * ADMIN only
 * Cannot deactivate own account
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Authentication check
    const currentUser = await getCurrentUserWithRole();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check (ADMIN only)
    if (!checkPermission(currentUser.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar status de usuários' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = toggleUserStatusSchema.safeParse(body);

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

    const { ativo } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Cannot deactivate own account
    if (id === currentUser.id && !ativo) {
      return NextResponse.json(
        { error: 'Você não pode desativar sua própria conta' },
        { status: 400 }
      );
    }

    // Update Supabase Auth user ban status (inactive users can't log in)
    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: ativo ? 'none' : '876000h', // ~100 years ban for inactive users
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status no sistema de autenticação' },
        { status: 500 }
      );
    }

    // Update user in our table
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { ativo },
      select: {
        id: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: currentUser.id,
      action: AuditAction.DEACTIVATE_USER,
      resource: 'users',
      resourceId: id,
      details: {
        email: existingUser.email,
        previousStatus: existingUser.ativo,
        newStatus: ativo,
        action: ativo ? 'reactivate' : 'deactivate',
        performedBy: currentUser.email,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      ...updatedUser,
      message: ativo ? 'Usuário reativado com sucesso' : 'Usuário desativado com sucesso',
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar status do usuário' },
      { status: 500 }
    );
  }
}
