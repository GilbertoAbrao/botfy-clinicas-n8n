import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { configLembreteSchema } from '@/lib/validations/config-lembrete';

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
        { error: 'Sem permissao para acessar configuracoes de lembretes' },
        { status: 403 }
      );
    }

    // Await params (Next.js 15+ async params)
    const { id } = await params;

    // Get Supabase client
    const supabase = createAdminClient();

    // Fetch config
    const { data: config, error } = await supabase
      .from('config_lembretes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !config) {
      return NextResponse.json(
        { error: 'Configuracao de lembrete nao encontrada' },
        { status: 404 }
      );
    }

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONFIG_LEMBRETE,
      resource: 'config_lembretes',
      resourceId: String(config.id),
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching config_lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuracao de lembrete' },
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
        { error: 'Sem permissao para editar configuracoes de lembretes' },
        { status: 403 }
      );
    }

    // Await params
    const { id } = await params;

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
    const supabase = createAdminClient();

    // Check if config exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('config_lembretes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'Configuracao de lembrete nao encontrada' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another config
    if (validatedData.nome.toLowerCase() !== existingConfig.nome.toLowerCase()) {
      const { data: nameConflict } = await supabase
        .from('config_lembretes')
        .select('id')
        .ilike('nome', validatedData.nome)
        .neq('id', id)
        .single();

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Ja existe outra configuracao com este nome' },
          { status: 409 }
        );
      }
    }

    // Track what changed for audit log
    const changes: Record<string, { from: any; to: any }> = {};

    if (existingConfig.nome !== validatedData.nome) {
      changes.nome = { from: existingConfig.nome, to: validatedData.nome };
    }
    if (existingConfig.horas_antes !== validatedData.horas_antes) {
      changes.horas_antes = { from: existingConfig.horas_antes, to: validatedData.horas_antes };
    }
    if (existingConfig.ativo !== validatedData.ativo) {
      changes.ativo = { from: existingConfig.ativo, to: validatedData.ativo };
    }
    if (existingConfig.template_tipo !== validatedData.template_tipo) {
      changes.template_tipo = { from: existingConfig.template_tipo, to: validatedData.template_tipo };
    }
    if (existingConfig.prioridade !== validatedData.prioridade) {
      changes.prioridade = { from: existingConfig.prioridade, to: validatedData.prioridade };
    }

    // Update config
    const { data: updatedConfig, error: updateError } = await supabase
      .from('config_lembretes')
      .update({
        nome: validatedData.nome,
        horas_antes: validatedData.horas_antes,
        ativo: validatedData.ativo,
        template_tipo: validatedData.template_tipo,
        prioridade: validatedData.prioridade,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating config_lembrete:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar configuracao de lembrete' },
        { status: 500 }
      );
    }

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_CONFIG_LEMBRETE,
      resource: 'config_lembretes',
      resourceId: String(updatedConfig.id),
      details: {
        configName: updatedConfig.nome,
        changes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating config_lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuracao de lembrete' },
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
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - Only ADMIN can manage system config
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para excluir configuracoes de lembretes' },
        { status: 403 }
      );
    }

    // Await params
    const { id } = await params;

    // Get Supabase client
    const supabase = createAdminClient();

    // Check if config exists
    const { data: existingConfig, error: fetchError } = await supabase
      .from('config_lembretes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'Configuracao de lembrete nao encontrada' },
        { status: 404 }
      );
    }

    // Delete the config
    const { error: deleteError } = await supabase
      .from('config_lembretes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting config_lembrete:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao excluir configuracao de lembrete' },
        { status: 500 }
      );
    }

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.DELETE_CONFIG_LEMBRETE,
      resource: 'config_lembretes',
      resourceId: id,
      details: {
        configName: existingConfig.nome,
        horas_antes: existingConfig.horas_antes,
        template_tipo: existingConfig.template_tipo,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuracao de lembrete excluida com sucesso',
    });
  } catch (error) {
    console.error('Error deleting config_lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir configuracao de lembrete' },
      { status: 500 }
    );
  }
}
