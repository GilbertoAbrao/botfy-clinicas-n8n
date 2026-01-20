import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { configLembreteSchema } from '@/lib/validations/config-lembrete';

export async function GET(request: NextRequest) {
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
        { error: 'Sem permissao para acessar configuracoes de lembretes' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const ativo = searchParams.get('ativo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get Supabase client
    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('config_lembretes')
      .select('*', { count: 'exact' });

    // Apply filters
    if (ativo !== null && ativo !== undefined && ativo !== '') {
      query = query.eq('ativo', ativo === 'true');
    }

    // Apply ordering and pagination
    query = query
      .order('prioridade', { ascending: true })
      .order('horas_antes', { ascending: true })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: configs, count, error } = await query;

    if (error) {
      console.error('Error fetching config_lembretes:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar configuracoes de lembretes' },
        { status: 500 }
      );
    }

    // Calculate total pages
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONFIG_LEMBRETE,
      resource: 'config_lembretes',
      resourceId: undefined,
      details: {
        searchParams: { ativo },
        resultCount: configs?.length || 0,
      },
    });

    // Return response
    return NextResponse.json({
      configs: configs || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching config_lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuracoes de lembretes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Sem permissao para criar configuracoes de lembretes' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = configLembreteSchema.safeParse(body);

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

    // Get Supabase client
    const supabase = await createServerSupabaseClient();

    // Check if config name already exists
    const { data: existing } = await supabase
      .from('config_lembretes')
      .select('id')
      .ilike('nome', validatedData.nome)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Ja existe uma configuracao com este nome' },
        { status: 409 }
      );
    }

    // Create config
    const { data: config, error } = await supabase
      .from('config_lembretes')
      .insert({
        nome: validatedData.nome,
        horas_antes: validatedData.horas_antes,
        ativo: validatedData.ativo,
        template_tipo: validatedData.template_tipo,
        prioridade: validatedData.prioridade,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating config_lembrete:', error);
      return NextResponse.json(
        { error: 'Erro ao criar configuracao de lembrete' },
        { status: 500 }
      );
    }

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_CONFIG_LEMBRETE,
      resource: 'config_lembretes',
      resourceId: String(config.id),
      details: {
        configName: config.nome,
        horas_antes: config.horas_antes,
        template_tipo: config.template_tipo,
        prioridade: config.prioridade,
      },
      ipAddress,
      userAgent,
    });

    // Return success with config ID and location header
    return NextResponse.json(
      { id: config.id, nome: config.nome },
      {
        status: 201,
        headers: {
          Location: `/api/config-lembretes/${config.id}`,
        },
      }
    );
  } catch (error) {
    console.error('Error creating config_lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao criar configuracao de lembrete' },
      { status: 500 }
    );
  }
}
