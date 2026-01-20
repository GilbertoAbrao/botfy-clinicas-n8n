import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { lembreteEnviadoQuerySchema } from '@/lib/validations/lembrete-enviado';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Authorization - VIEW_AUDIT_LOGS for read-only analytics data
    if (!checkPermission(user.role, PERMISSIONS.VIEW_AUDIT_LOGS)) {
      return NextResponse.json(
        { error: 'Sem permissao para visualizar lembretes enviados' },
        { status: 403 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = lembreteEnviadoQuerySchema.parse(searchParams);

    const { page, limit, status, tipo, paciente_id, data_inicio, data_fim, risco_min } = params;
    const offset = (page - 1) * limit;

    const supabase = await createServerSupabaseClient();

    // Build query with joins for patient info
    let query = supabase
      .from('lembretes_enviados')
      .select(`
        *,
        agendamentos!inner (
          id,
          data_hora,
          pacientes!inner (id, nome),
          servicos (nome)
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status_resposta', status);
    }
    if (tipo) {
      query = query.eq('tipo_lembrete', tipo);
    }
    if (paciente_id) {
      query = query.eq('agendamentos.paciente_id', paciente_id);
    }
    if (data_inicio) {
      query = query.gte('enviado_em', data_inicio);
    }
    if (data_fim) {
      query = query.lte('enviado_em', data_fim);
    }
    if (risco_min !== undefined) {
      query = query.gte('risco_noshow', risco_min);
    }

    // Order by send date descending, paginate
    query = query
      .order('enviado_em', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching lembretes_enviados:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar lembretes enviados' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const lembretes = (data || []).map(item => ({
      id: item.id,
      agendamento_id: item.agendamento_id,
      telefone: item.telefone,
      tipo_lembrete: item.tipo_lembrete,
      status_resposta: item.status_resposta,
      evento_id: item.evento_id,
      enviado_em: item.enviado_em,
      respondido_em: item.respondido_em,
      risco_noshow: item.risco_noshow,
      mensagem_enviada: item.mensagem_enviada,
      paciente_nome: item.agendamentos?.pacientes?.nome,
      servico_nome: item.agendamentos?.servicos?.nome,
      data_agendamento: item.agendamentos?.data_hora,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      lembretes,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error('Error fetching lembretes_enviados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembretes enviados' },
      { status: 500 }
    );
  }
}
