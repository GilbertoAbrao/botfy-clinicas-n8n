/**
 * MCP Tool: buscar_paciente
 *
 * Searches for patient by phone, CPF, or name.
 * Maps to GET /api/agent/paciente
 */

import { z } from 'zod'
import { callAgentApi } from '../http-client'

// Input schema - at least one search parameter required
const inputSchema = z.object({
  telefone: z.string().optional().describe('Telefone do paciente (10-11 dígitos)'),
  cpf: z.string().optional().describe('CPF do paciente (11 dígitos)'),
  nome: z.string().optional().describe('Nome do paciente (busca parcial)'),
})

interface Patient {
  id: number
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  dataNascimento: string | null
  convenio: string | null
  observacoes: string | null
}

interface PatientResult {
  paciente: Patient | null
  proximosAgendamentos?: Array<{
    id: number
    dataHora: string
    tipoConsulta: string
    status: string | null
  }>
  matchType: 'exact' | 'partial' | 'none'
  partialMatches?: Array<{ id: number; nome: string; telefone: string }>
}

export const buscarPacienteTool = {
  name: 'buscar_paciente',
  title: 'Buscar Paciente',
  description: 'Busca paciente por telefone, CPF ou nome. Retorna dados do paciente e próximos agendamentos quando encontrado.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Validate at least one parameter
      if (!input.telefone && !input.cpf && !input.nome) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Erro: Pelo menos um parâmetro de busca é necessário (telefone, cpf ou nome)',
          }],
          isError: true,
        }
      }

      const result = await callAgentApi<PatientResult>('GET', '/paciente', {
        params: {
          telefone: input.telefone,
          cpf: input.cpf,
          nome: input.nome,
        },
      })

      let summary: string
      if (result.matchType === 'exact' && result.paciente) {
        summary = `Paciente encontrado: ${result.paciente.nome} (ID: ${result.paciente.id})`
        if (result.proximosAgendamentos?.length) {
          summary += `. ${result.proximosAgendamentos.length} próximos agendamentos.`
        }
      } else if (result.matchType === 'partial' && result.partialMatches) {
        summary = `${result.partialMatches.length} pacientes encontrados com busca parcial`
      } else {
        summary = 'Nenhum paciente encontrado'
      }

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
          text: `Erro ao buscar paciente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        }],
        isError: true,
      }
    }
  },
}
