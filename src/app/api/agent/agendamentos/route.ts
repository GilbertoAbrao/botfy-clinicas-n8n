import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError } from '@/lib/agent/error-handler'
import { searchAppointments } from '@/lib/services/appointment-service'
import { agentAppointmentSearchSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * GET /api/agent/agendamentos
 *
 * Search appointments with filters and pagination.
 * Used by N8N AI Agent to find patient appointments.
 *
 * Authentication: Bearer token (API key from agents table)
 *
 * Query parameters:
 * - pacienteId (optional): Filter by patient ID
 * - telefone (optional): Filter by patient phone (partial match)
 * - dataInicio (optional): Start date (ISO 8601)
 * - dataFim (optional): End date (ISO 8601)
 * - status (optional): Filter by status (agendada, confirmada, presente, cancelada, faltou)
 * - servicoId (optional): Filter by service ID
 * - tipoConsulta (optional): Filter by appointment type (partial match)
 * - profissional (optional): Filter by provider name (partial match)
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     agendamentos: [{
 *       id: number,
 *       dataHora: string (ISO 8601),
 *       tipoConsulta: string,
 *       profissional: string | null,
 *       status: string | null,
 *       observacoes: string | null,
 *       paciente: { id: number, nome: string, telefone: string }
 *     }],
 *     pagination: { page, limit, total, totalPages }
 *   }
 * }
 */
export const GET = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = agentAppointmentSearchSchema.parse(searchParams)

    // 2. Call service layer
    const result = await searchAppointments({
      pacienteId: query.pacienteId,
      telefone: query.telefone,
      dataInicio: query.dataInicio,
      dataFim: query.dataFim,
      status: query.status,
      servicoId: query.servicoId,
      tipoConsulta: query.tipoConsulta,
      profissional: query.profissional,
      page: query.page,
      limit: query.limit,
    })

    // 3. Audit log (fire and forget - don't block response)
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_VIEW_APPOINTMENTS,
      resource: 'agent_api',
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        query: {
          pacienteId: query.pacienteId,
          telefone: query.telefone ? '***' : undefined, // Mask PHI
          dateRange: query.dataInicio || query.dataFim ? 'provided' : undefined,
          status: query.status,
          servicoId: query.servicoId,
          tipoConsulta: query.tipoConsulta,
          profissional: query.profissional,
        },
        resultCount: result.pagination.total,
        pageReturned: result.pagination.page,
      },
    }).catch(console.error)

    // 4. Return success response
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
})
