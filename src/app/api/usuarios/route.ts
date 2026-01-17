import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { createUserSchema } from '@/lib/validations/user';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/usuarios - List all users
 * ADMIN only
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Authorization check (ADMIN only)
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json(
        { error: 'Sem permissão para gerenciar usuários' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || undefined;
    const ativo = searchParams.get('ativo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build where clause
    const where: any = {};

    if (role && ['ADMIN', 'ATENDENTE'].includes(role)) {
      where.role = role;
    }

    if (ativo !== null && ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          email: 'asc',
        },
        select: {
          id: true,
          email: true,
          role: true,
          ativo: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Log access
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_AUDIT_LOGS, // Using VIEW_AUDIT_LOGS as closest match for viewing users
      resource: 'users',
      resourceId: undefined,
      details: {
        searchParams: { role, ativo },
        resultCount: users.length,
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usuarios - Create a new user
 * ADMIN only
 * Creates user in Supabase Auth, then syncs to users table
 */
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Sem permissão para criar usuários' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

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

    const { email, password, role } = validation.data;

    // Check if email already exists in users table
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    // Create user in Supabase Auth
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
    });

    if (authError || !authData.user) {
      console.error('Supabase Auth error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário no sistema de autenticação' },
        { status: 500 }
      );
    }

    // Create user in our users table with the auth user ID
    const newUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        role,
        ativo: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: currentUser.id,
      action: AuditAction.CREATE_USER,
      resource: 'users',
      resourceId: newUser.id,
      details: {
        email: newUser.email,
        role: newUser.role,
        createdBy: currentUser.email,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        message: 'Usuário criado com sucesso'
      },
      {
        status: 201,
        headers: {
          Location: `/api/usuarios/${newUser.id}`,
        },
      }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
