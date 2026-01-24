/**
 * MCP Tool: buscar_instrucoes
 *
 * Searches for procedure instructions by service or type.
 * Maps to GET /api/agent/instrucoes
 */

import { z } from 'zod'
import { callAgentApi } from '../http-client'

const inputSchema = z.object({
  servicoId: z.number().optional().describe('ID do serviço'),
  tipoInstrucao: z.string().optional().describe('Tipo de instrução (jejum, hidratacao, medicacao, etc)'),
})

interface Instrucao {
  id: number
  servicoId: number
  tipoInstrucao: string
  titulo: string
  conteudo: string
  prioridade: number
}

interface InstrucoesResult {
  instrucoes: Instrucao[]
  total: number
}

export const buscarInstrucoesTool = {
  name: 'buscar_instrucoes',
  title: 'Buscar Instruções',
  description: 'Busca instruções de procedimentos por serviço ou tipo. Retorna instruções formatadas para envio via WhatsApp.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      const result = await callAgentApi<InstrucoesResult>('GET', '/instrucoes', {
        params: {
          servicoId: input.servicoId,
          tipoInstrucao: input.tipoInstrucao,
        },
      })

      const summary = `Encontradas ${result.total} instruções`

      return {
        content: [{ type: 'text', text: summary }],
        structuredContent: result,
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Erro ao buscar instruções: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        }],
        isError: true,
      }
    }
  },
}
