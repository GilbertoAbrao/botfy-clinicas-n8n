import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentUpdateAppointmentSchema
const inputSchema = z.object({
  agendamentoId: z.number().describe('ID do agendamento a ser reagendado'),
  dataHora: z.string().optional().describe('Nova data e hora (ISO 8601)'),
  profissional: z.string().optional().describe('Novo profissional'),
  observacoes: z.string().optional().describe('Novas observações'),
})

interface UpdatedAppointment {
  id: number
  dataHora: string
  tipoConsulta: string
  profissional: string | null
  status: string | null
  paciente: { id: number; nome: string; telefone: string }
}

export const reagendarAgendamentoTool = {
  name: 'reagendar_agendamento',
  title: 'Reagendar Agendamento',
  description: 'Reagenda um agendamento existente para nova data/hora ou profissional. Valida disponibilidade do novo horário.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Build update body (exclude agendamentoId)
      const { agendamentoId, ...updateData } = input

      const result = await callAgentApi<UpdatedAppointment>('PATCH', `/agendamentos/${agendamentoId}`, {
        body: updateData,
      })

      const summary = `Agendamento ${result.id} reagendado. Nova data: ${result.dataHora}`

      return {
        content: [{ type: 'text', text: summary }],
        structuredContent: result,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'

      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        return {
          content: [{
            type: 'text',
            text: `Agendamento não encontrado. Verifique o ID informado.`,
          }],
          isError: true,
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Erro ao reagendar: ${errorMsg}`,
        }],
        isError: true,
      }
    }
  },
}
