import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
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

    const supabase = createAdminClient();

    // Build base query for lembretes_enviados
    let query = supabase
      .from('lembretes_enviados')
      .select('*', { count: 'exact' });

    // Apply filters directly on lembretes_enviados
    if (status) {
      query = query.eq('status_resposta', status);
    }
    if (tipo) {
      query = query.eq('tipo_lembrete', tipo);
    }
    if (data_inicio) {
      query = query.gte('data_envio', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_envio', data_fim);
    }
    if (risco_min !== undefined) {
      query = query.gte('risco_noshow', risco_min);
    }

    // Order by send date descending, paginate
    query = query
      .order('data_envio', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching lembretes_enviados:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar lembretes enviados', details: error.message },
        { status: 500 }
      );
    }

    // Get unique agendamento IDs for enrichment
    const agendamentoIds = [...new Set((data || []).map(item => item.agendamento_id).filter(Boolean))];

    // Fetch agendamento details from Prisma (which works)
    const agendamentosMap = new Map<number, { paciente_nome: string; servico_nome: string | null; data_hora: Date }>();

    if (agendamentoIds.length > 0) {
      const agendamentos = await prisma.appointment.findMany({
        where: { id: { in: agendamentoIds } },
        select: {
          id: true,
          dataHora: true,
          tipoConsulta: true,
          paciente: { select: { nome: true } },
        },
      });

      agendamentos.forEach((ag: { id: number; dataHora: Date; tipoConsulta: string; paciente: { nome: string } | null }) => {
        agendamentosMap.set(ag.id, {
          paciente_nome: ag.paciente?.nome || 'Paciente não encontrado',
          servico_nome: ag.tipoConsulta || null,
          data_hora: ag.dataHora,
        });
      });
    }

    // Filter by paciente_id if provided (after fetching, since we need to join via agendamentos)
    let filteredData = data || [];
    if (paciente_id) {
      // Get agendamentos for this patient (paciente_id is already a number from zod coerce)
      const patientAgendamentos = await prisma.appointment.findMany({
        where: { pacienteId: paciente_id },
        select: { id: true },
      });
      const patientAgIds = new Set(patientAgendamentos.map((a: { id: number }) => a.id));
      filteredData = filteredData.filter(item => patientAgIds.has(item.agendamento_id));
    }

    // Transform data for frontend (map DB column names to frontend expected names)
    const lembretes = filteredData.map(item => {
      const agInfo = agendamentosMap.get(item.agendamento_id);
      return {
        id: item.id,
        agendamento_id: item.agendamento_id,
        telefone: item.telefone,
        tipo_lembrete: item.tipo_lembrete,
        status_resposta: item.status_resposta,
        evento_id: item.evento_id,
        enviado_em: item.data_envio,      // DB: data_envio → Frontend: enviado_em
        respondido_em: item.data_resposta, // DB: data_resposta → Frontend: respondido_em
        risco_noshow: item.risco_noshow,
        mensagem_enviada: item.mensagem_enviada,
        paciente_nome: agInfo?.paciente_nome || null,
        servico_nome: agInfo?.servico_nome || null,
        data_agendamento: agInfo?.data_hora || null,
      };
    });

    // Adjust count if filtered by paciente_id
    const total = paciente_id ? lembretes.length : (count || 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      lembretes,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error('Error fetching lembretes_enviados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembretes enviados', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
