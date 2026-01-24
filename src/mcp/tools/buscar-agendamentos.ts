/**
 * MCP Tool: buscar_agendamentos
 *
 * Searches for appointments with various filters.
 * Maps to GET /api/agent/agendamentos
 */

import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentAppointmentSearchSchema
const inputSchema = z.object({
  pacienteId: z.number().optional().describe('ID do paciente'),
  telefone: z.string().optional().describe('Telefone do paciente (10-11 dígitos)'),
  dataInicio: z.string().optional().describe('Data inicial (ISO 8601)'),
  dataFim: z.string().optional().describe('Data final (ISO 8601)'),
  status: z.enum(['agendada', 'confirmada', 'presente', 'cancelada', 'faltou']).optional().describe('Status do agendamento'),
  servicoId: z.number().optional().describe('ID do serviço'),
  tipoConsulta: z.string().optional().describe('Tipo de consulta'),
  profissional: z.string().optional().describe('Nome do profissional'),
  page: z.number().optional().describe('Página (default: 1)'),
  limit: z.number().optional().describe('Itens por página (default: 20, max: 100)'),
})

interface Appointment {
  id: number
  dataHora: string
  tipoConsulta: string
  profissional: string | null
  status: string | null
  observacoes: string | null
  paciente: { id: number; nome: string; telefone: string }
}

interface AppointmentsResult {
  agendamentos: Appointment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const buscarAgendamentosTool = {
  name: 'buscar_agendamentos',
  title: 'Buscar Agendamentos',
  description: 'Busca agendamentos com filtros por paciente, data, status, serviço ou profissional. Suporta paginação.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      const result = await callAgentApi<AppointmentsResult>('GET', '/agendamentos', {
        params: {
          pacienteId: input.pacienteId,
          telefone: input.telefone,
          dataInicio: input.dataInicio,
          dataFim: input.dataFim,
          status: input.status,
          servicoId: input.servicoId,
          tipoConsulta: input.tipoConsulta,
          profissional: input.profissional,
          page: input.page,
          limit: input.limit,
        },
      })

      const summary = `Encontrados ${result.pagination.total} agendamentos (página ${result.pagination.page}/${result.pagination.totalPages})`

      return {
        content: [{ type: 'text', text: summary }],
        structuredContent: result,
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Erro ao buscar agendamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        }],
        isError: true,
      }
    }
  },
}
