import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema matching agentUpdatePatientSchema
const inputSchema = z.object({
  pacienteId: z.number().describe('ID do paciente a ser atualizado'),
  nome: z.string().optional().describe('Novo nome do paciente'),
  telefone: z.string().optional().describe('Novo telefone (10-11 dígitos)'),
  email: z.string().optional().describe('Novo email'),
  cpf: z.string().optional().describe('Novo CPF (11 dígitos)'),
  dataNascimento: z.string().optional().describe('Nova data de nascimento (YYYY-MM-DD)'),
  convenio: z.string().optional().describe('Novo convênio'),
  observacoes: z.string().optional().describe('Novas observações'),
})

interface UpdatedPatient {
  id: number
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  dataNascimento: string | null
  convenio: string | null
}

export const atualizarDadosPacienteTool = {
  name: 'atualizar_dados_paciente',
  title: 'Atualizar Dados do Paciente',
  description: 'Atualiza dados cadastrais do paciente (nome, telefone, email, CPF, etc). Suporta atualização parcial.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Build update body (exclude pacienteId)
      const { pacienteId, ...updateData } = input

      // Check if at least one field to update
      if (Object.keys(updateData).length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'Erro: Pelo menos um campo deve ser informado para atualização',
          }],
          isError: true,
        }
      }

      const result = await callAgentApi<UpdatedPatient>('PATCH', `/paciente/${pacienteId}`, {
        body: updateData,
      })

      const updatedFields = Object.keys(updateData).join(', ')
      const summary = `Paciente ${result.id} (${result.nome}) atualizado. Campos: ${updatedFields}`

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
            text: `Paciente não encontrado. Verifique o ID informado.`,
          }],
          isError: true,
        }
      }

      if (errorMsg.includes('phone') || errorMsg.includes('telefone')) {
        return {
          content: [{
            type: 'text',
            text: `Erro: Telefone já cadastrado para outro paciente.`,
          }],
          isError: true,
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Erro ao atualizar paciente: ${errorMsg}`,
        }],
        isError: true,
      }
    }
  },
}
