import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

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

    const supabase = createAdminClient();

    // Fetch lembrete from Supabase
    const { data, error } = await supabase
      .from('lembretes_enviados')
      .select('*')
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
      return NextResponse.json(
        { error: 'Erro ao buscar lembrete', details: error.message },
        { status: 500 }
      );
    }

    // Enrich with agendamento data from Prisma
    let agendamentoInfo = null;
    if (data.agendamento_id) {
      const agendamento = await prisma.appointment.findUnique({
        where: { id: data.agendamento_id },
        select: {
          id: true,
          dataHora: true,
          status: true,
          observacoes: true,
          tipoConsulta: true,
          paciente: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              email: true,
            },
          },
        },
      });

      if (agendamento) {
        agendamentoInfo = {
          data_hora: agendamento.dataHora,
          status: agendamento.status,
          observacoes: agendamento.observacoes,
          servico_nome: agendamento.tipoConsulta,
          paciente: agendamento.paciente,
        };
      }
    }

    // Transform data for frontend (map DB column names to frontend expected names)
    const lembrete = {
      id: data.id,
      agendamento_id: data.agendamento_id,
      telefone: data.telefone,
      tipo_lembrete: data.tipo_lembrete,
      status_resposta: data.status_resposta,
      evento_id: data.evento_id,
      enviado_em: data.data_envio,       // DB: data_envio → Frontend: enviado_em
      respondido_em: data.data_resposta, // DB: data_resposta → Frontend: respondido_em
      risco_noshow: data.risco_noshow,
      mensagem_enviada: data.mensagem_enviada,
      paciente_nome: agendamentoInfo?.paciente?.nome || null,
      servico_nome: agendamentoInfo?.servico_nome || null,
      data_agendamento: agendamentoInfo?.data_hora || null,
      // Additional fields from full joins
      agendamento_status: agendamentoInfo?.status || null,
      agendamento_observacoes: agendamentoInfo?.observacoes || null,
      paciente_telefone: agendamentoInfo?.paciente?.telefone || null,
      paciente_email: agendamentoInfo?.paciente?.email || null,
    };

    return NextResponse.json({ lembrete });
  } catch (error) {
    console.error('Error fetching lembrete:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembrete', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
