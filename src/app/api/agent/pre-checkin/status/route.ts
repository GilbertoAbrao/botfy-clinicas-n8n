/**
 * GET /api/agent/pre-checkin/status
 *
 * Check pre-checkin status for an appointment.
 * Enables AI Agent to tell patients about their pre-checkin progress and pending documents.
 *
 * Query parameters (at least one required):
 * - agendamentoId (optional): Direct appointment ID lookup
 * - pacienteId (optional): Find next appointment for patient
 * - telefone (optional): Find next appointment by phone
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     exists: true,
 *     status: "parcial",
 *     agendamentoId: 123,
 *     dadosConfirmados: true,
 *     documentosEnviados: false,
 *     instrucoesEnviadas: true,
 *     pendencias: ["RG", "Comprovante de residencia"],
 *     mensagemEnviadaEm: "2026-01-24T10:00:00Z",
 *     lembreteEnviadoEm: null,
 *     appointment: {
 *       dataHora: "2026-01-25T14:00:00Z",
 *       tipoConsulta: "Consulta",
 *       profissional: "Dr. Maria"
 *     }
 *   }
 * }
 *
 * @module api/agent/pre-checkin/status
 */

import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError } from '@/lib/agent/error-handler'
import { getPreCheckinStatus } from '@/lib/services/pre-checkin-service'
import { agentPreCheckinStatusSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export const GET = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = agentPreCheckinStatusSchema.parse(searchParams)

    // 2. Call service layer
    const result = await getPreCheckinStatus({
      agendamentoId: query.agendamentoId,
      pacienteId: query.pacienteId,
      telefone: query.telefone,
    })

    // 3. Audit log (fire and forget - do NOT expose PHI like telefone)
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_VIEW_PRE_CHECKIN,
      resource: 'agent_api',
      resourceId: result.agendamentoId?.toString(),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        searchType: query.agendamentoId
          ? 'appointment'
          : query.pacienteId
            ? 'patient'
            : 'phone',
        preCheckinStatus: result.status,
        exists: result.exists,
      },
    }).catch(console.error)

    // 4. Return success response
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
})
