import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentCreateAppointmentSchema
const inputSchema = z.object({
  pacienteId: z.number().describe('ID do paciente'),
  dataHora: z.string().describe('Data e hora (ISO 8601, ex: 2026-01-25T14:30:00-03:00)'),
  tipoConsulta: z.string().optional().describe('Tipo de consulta (obrigatório se não informar servicoId)'),
  servicoId: z.number().optional().describe('ID do serviço'),
  profissional: z.string().optional().describe('Nome do profissional'),
  observacoes: z.string().optional().describe('Observações (max 500 caracteres)'),
  idempotencyKey: z.string().optional().describe('Chave de idempotência (UUID) para evitar duplicatas'),
})

interface CreatedAppointment {
  id: number
  dataHora: string
  tipoConsulta: string
  profissional: string | null
  status: string
  paciente: { id: number; nome: string; telefone: string }
}

export const criarAgendamentoTool = {
  name: 'criar_agendamento',
  title: 'Criar Agendamento',
  description: 'Cria um novo agendamento para o paciente. Verifica conflitos de horário e suporta idempotência para retry seguro.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Validate business rule: servicoId OR tipoConsulta required
      if (!input.servicoId && !input.tipoConsulta) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Erro: É necessário informar servicoId ou tipoConsulta',
          }],
          isError: true,
        }
      }

      const result = await callAgentApi<CreatedAppointment>('POST', '/agendamentos', {
        body: input,
      })

      const summary = `Agendamento criado com sucesso. ID: ${result.id}, Data: ${result.dataHora}, Paciente: ${result.paciente.nome}`
      const details = JSON.stringify(result, null, 2)

      return {
        content: [
          { type: 'text' as const, text: summary },
          { type: 'text' as const, text: `\n\nDetalhes:\n${details}` }
        ],
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'

      // Handle specific error cases
      if (errorMsg.includes('Horario ja ocupado') || errorMsg.includes('conflict')) {
        return {
          content: [{
            type: 'text' as const,
            text: `Conflito de horário: O horário solicitado já está ocupado. Tente outro horário.`,
          }],
          isError: true,
        }
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Erro ao criar agendamento: ${errorMsg}`,
        }],
        isError: true,
      }
    }
  },
}
