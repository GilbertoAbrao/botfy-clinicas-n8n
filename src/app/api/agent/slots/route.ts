import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError } from '@/lib/agent/error-handler'
import { getAvailableSlots } from '@/lib/services/slot-service'
import { agentSlotsSearchSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * GET /api/agent/slots
 *
 * Query available appointment slots for a specific date.
 * Used by N8N AI Agent to find open times when patients ask about availability.
 *
 * Query parameters:
 * - data (required): Date in YYYY-MM-DD format
 * - profissional (optional): Filter by provider name
 * - servicoId (optional): Filter by service ID (to get correct duration)
 * - duracaoMinutos (optional): Override appointment duration (default: 30)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     date: "2026-01-25",
 *     slots: ["08:00", "09:00", "10:00", ...],
 *     totalAvailable: 12,
 *     period: {
 *       morning: ["08:00", "09:00", ...],
 *       afternoon: ["14:00", "15:00", ...]
 *     }
 *   }
 * }
 */
export const GET = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = agentSlotsSearchSchema.parse(searchParams)

    // 2. Call service layer
    const result = await getAvailableSlots({
      date: query.data,
      profissional: query.profissional,
      servicoId: query.servicoId,
      duracaoMinutos: query.duracaoMinutos,
    })

    // 3. Audit log (fire and forget)
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_SEARCH_SLOTS,
      resource: 'agent_api',
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        query: {
          date: query.data.toISOString(),
          profissional: query.profissional,
          servicoId: query.servicoId,
        },
        resultCount: result.totalAvailable,
      },
    }).catch(console.error) // Fire and forget

    // 4. Return success response
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
})
