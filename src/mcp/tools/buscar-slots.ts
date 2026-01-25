/**
 * MCP Tool: buscar_slots_disponiveis
 *
 * Searches for available appointment slots on a specific date.
 * Maps to GET /api/agent/slots
 */

import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentSlotsSearchSchema
const inputSchema = z.object({
  data: z.string().describe('Data no formato YYYY-MM-DD'),
  profissional: z.string().optional().describe('Nome do profissional'),
  servicoId: z.number().optional().describe('ID do serviço'),
  duracaoMinutos: z.number().optional().describe('Duração em minutos (default: 30)'),
})

// Output type from slot-service.ts
interface SlotsResult {
  date: string
  slots: string[]
  totalAvailable: number
  period?: {
    morning: string[]
    afternoon: string[]
  }
}

export const buscarSlotsDisponiveisTool = {
  name: 'buscar_slots_disponiveis',
  title: 'Buscar Slots Disponíveis',
  description: 'Busca horários disponíveis para agendamento em uma data específica. Retorna lista de horários vagos divididos por período (manhã/tarde).',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      const result = await callAgentApi<SlotsResult>('GET', '/slots', {
        params: {
          data: input.data,
          profissional: input.profissional,
          servicoId: input.servicoId,
          duracaoMinutos: input.duracaoMinutos,
        },
      })

      const summary = `Encontrados ${result.totalAvailable} horários disponíveis para ${result.date}`
      const details = JSON.stringify(result, null, 2)

      return {
        content: [
          { type: 'text' as const, text: summary },
          { type: 'text' as const, text: `\n\nDetalhes:\n${details}` }
        ],
      }
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Erro ao buscar slots: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        }],
        isError: true,
      }
    }
  },
}
