import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentConfirmAppointmentSchema
const inputSchema = z.object({
  agendamentoId: z.number().describe('ID do agendamento'),
  tipo: z.enum(['confirmado', 'presente']).optional().describe('Tipo de confirmação: "confirmado" (paciente confirmou) ou "presente" (paciente chegou). Default: confirmado'),
})

interface ConfirmedAppointment {
  id: number
  status: string
  confirmedAt: string
}

export const confirmarPresencaTool = {
  name: 'confirmar_presenca',
  title: 'Confirmar Presença',
  description: 'Confirma agendamento ou registra presença do paciente. Use "confirmado" quando paciente confirma por WhatsApp, "presente" quando paciente chega na clínica.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      const result = await callAgentApi<ConfirmedAppointment>('POST', `/agendamentos/${input.agendamentoId}/confirmar`, {
        body: { tipo: input.tipo || 'confirmado' },
      })

      const tipoMsg = result.status === 'presente' ? 'Presença registrada' : 'Agendamento confirmado'
      const summary = `${tipoMsg} para agendamento ${result.id}. Status: ${result.status}`

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

      if (errorMsg.includes('terminal') || errorMsg.includes('cancelled')) {
        return {
          content: [{
            type: 'text',
            text: `Não é possível confirmar: agendamento já está cancelado ou finalizado.`,
          }],
          isError: true,
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Erro ao confirmar presença: ${errorMsg}`,
        }],
        isError: true,
      }
    }
  },
}
