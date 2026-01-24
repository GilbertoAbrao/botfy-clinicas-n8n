import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError } from '@/lib/agent/error-handler'
import { searchInstructions, INSTRUCTION_TYPES } from '@/lib/services/instruction-service'
import { agentInstructionsSearchSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * GET /api/agent/instrucoes
 *
 * Search procedure instructions for patient preparation.
 *
 * Query parameters (all optional - returns all if none provided):
 * - servicoId (optional): Filter by service ID
 * - tipoInstrucao (optional): Filter by instruction type
 *
 * Instruction types: jejum, hidratacao, medicamentos, documentos, vestimenta, acompanhante, geral
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     instrucoes: [
 *       {
 *         id: 1,
 *         servicoId: 5,
 *         tipoInstrucao: "jejum",
 *         titulo: "Jejum de 8 horas",
 *         conteudo: "Nao consumir alimentos solidos...",
 *         prioridade: 10,
 *         servico: { id: 5, nome: "Exame de Sangue" }
 *       },
 *       ...
 *     ],
 *     total: 5,
 *     filters: { servicoId: 5, tipoInstrucao: null },
 *     instructionTypes: ["jejum", "hidratacao", ...]  // Available types for reference
 *   }
 * }
 */
export const GET = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = agentInstructionsSearchSchema.parse(searchParams)

    // 2. Call service layer
    const result = await searchInstructions({
      servicoId: query.servicoId,
      tipoInstrucao: query.tipoInstrucao,
    })

    // 3. Audit log (fire and forget)
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_VIEW_INSTRUCTIONS,
      resource: 'agent_api',
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        filters: {
          servicoId: query.servicoId,
          tipoInstrucao: query.tipoInstrucao,
        },
        resultCount: result.total,
      },
    }).catch(console.error)

    // 4. Return success response with instruction types for reference
    return successResponse({
      ...result,
      instructionTypes: INSTRUCTION_TYPES,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
