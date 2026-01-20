import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lembreteId = parseInt(id, 10);

    if (isNaN(lembreteId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    // Authentication
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Authorization - VIEW_AUDIT_LOGS for read-only analytics data
    if (!checkPermission(user.role, PERMISSIONS.VIEW_AUDIT_LOGS)) {
      return NextResponse.json(
        { error: 'Sem permissao para visualizar lembrete' },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch with full joins for complete details
    const { data, error } = await supabase
      .from('lembretes_enviados')
      .select(`
        *,
        agendamentos (
          id,
          data_hora,
          status,
          observacoes,
          pacientes (
            id,
            nome,
            telefone,
            email
          ),
          servicos (
            id,
            nome,
            duracao_minutos
          )
        )
      `)
      .eq('id', lembreteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lembrete nao encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching lembrete:', error);
      throw error;
    }

    // Transform data for frontend with all available fields
    const lembrete = {
      id: data.id,
      agendamento_id: data.agendamento_id,
      telefone: data.telefone,
      tipo_lembrete: data.tipo_lembrete,
      status_resposta: data.status_resposta,
      evento_id: data.evento_id,
      enviado_em: data.enviado_em,
      respondido_em: data.respondido_em,
      risco_noshow: data.risco_noshow,
      mensagem_enviada: data.mensagem_enviada,
      paciente_nome: data.agendamentos?.pacientes?.nome,
      servico_nome: data.agendamentos?.servicos?.nome,
      data_agendamento: data.agendamentos?.data_hora,
      // Additional fields from full joins
      agendamento_status: data.agendamentos?.status,
      agendamento_observacoes: data.agendamentos?.observacoes,
      paciente_telefone: data.agendamentos?.pacientes?.telefone,
      paciente_email: data.agendamentos?.pacientes?.email,
      servico_duracao: data.agendamentos?.servicos?.duracao_minutos,
    };

    return NextResponse.json({ lembrete });
  } catch (error) {
    console.error('Error fetching lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembrete' },
      { status: 500 }
    );
  }
}
