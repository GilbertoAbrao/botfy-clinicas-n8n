/**
 * MCP Tool: status_pre_checkin
 *
 * Queries pre-check-in status for an appointment.
 * Maps to GET /api/agent/pre-checkin/status
 */

import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema - at least one parameter required
const inputSchema = z.object({
  agendamentoId: z.number().optional().describe('ID do agendamento'),
  pacienteId: z.number().optional().describe('ID do paciente'),
  telefone: z.string().optional().describe('Telefone do paciente'),
})

interface PreCheckinStatus {
  agendamentoId: number
  pacienteId: number
  status: string
  documentos: Array<{
    tipo: string
    status: 'pendente' | 'enviado' | 'aprovado' | 'rejeitado'
    enviadoEm?: string
  }>
  completude: number // 0-100
}

export const statusPreCheckinTool = {
  name: 'status_pre_checkin',
  title: 'Status Pré Check-in',
  description: 'Consulta o status do pré check-in de um agendamento, incluindo documentos enviados e pendentes.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Validate at least one parameter
      if (!input.agendamentoId && !input.pacienteId && !input.telefone) {
        return {
          content: [{
            type: 'text',
            text: 'Erro: Pelo menos um parâmetro é necessário (agendamentoId, pacienteId ou telefone)',
          }],
          isError: true,
        }
      }

      const result = await callAgentApi<PreCheckinStatus>('GET', '/pre-checkin/status', {
        params: {
          agendamentoId: input.agendamentoId,
          pacienteId: input.pacienteId,
          telefone: input.telefone,
        },
      })

      const summary = `Pré check-in ${result.completude}% completo. Status: ${result.status}`

      return {
        content: [{ type: 'text', text: summary }],
        structuredContent: result,
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Erro ao consultar pré check-in: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        }],
        isError: true,
      }
    }
  },
}
