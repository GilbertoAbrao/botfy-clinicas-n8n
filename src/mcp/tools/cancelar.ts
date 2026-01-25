import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentCancelAppointmentSchema
const inputSchema = z.object({
  agendamentoId: z.number().describe('ID do agendamento a ser cancelado'),
  motivo: z.string().describe('Motivo do cancelamento (min 3 caracteres)'),
})

interface CancelledAppointment {
  id: number
  status: string
  cancelledAt: string
}

export const cancelarAgendamentoTool = {
  name: 'cancelar_agendamento',
  title: 'Cancelar Agendamento',
  description: 'Cancela um agendamento existente. Requer motivo do cancelamento. Dispara notificação para lista de espera.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Validate motivo length
      if (input.motivo.length < 3) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Erro: O motivo do cancelamento deve ter pelo menos 3 caracteres',
          }],
          isError: true,
        }
      }

      const result = await callAgentApi<CancelledAppointment>('DELETE', `/agendamentos/${input.agendamentoId}`, {
        body: { motivo: input.motivo },
      })

      const summary = `Agendamento ${result.id} cancelado com sucesso.`
      const details = JSON.stringify(result, null, 2)

      return {
        content: [
          { type: 'text' as const, text: summary },
          { type: 'text' as const, text: `\n\nDetalhes:\n${details}` }
        ],
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'

      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        return {
          content: [{
            type: 'text' as const,
            text: `Agendamento não encontrado. Verifique o ID informado.`,
          }],
          isError: true,
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Erro ao cancelar: ${errorMsg}`,
        }],
        isError: true,
      }
    }
  },
}
