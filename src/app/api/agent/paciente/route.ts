/**
 * GET /api/agent/paciente
 *
 * Search for a patient by phone, CPF, or name.
 * Used by N8N AI Agent for patient identification during conversations.
 *
 * Query parameters (at least one required):
 * - telefone (optional): Phone number (exact or partial match)
 * - cpf (optional): CPF number (exact match)
 * - nome (optional): Patient name (partial match)
 *
 * Response (exact match):
 * {
 *   success: true,
 *   data: {
 *     patient: { id, nome, telefone, email, cpf, dataNascimento, convenio, observacoes },
 *     matchType: "exact",
 *     upcomingAppointments: [{ id, dataHora, tipoConsulta, profissional, status }, ...]
 *   }
 * }
 *
 * Response (partial match - multiple results):
 * {
 *   success: true,
 *   data: {
 *     patient: null,
 *     patients: [{ id, nome, telefone, ... }, ...],
 *     matchType: "partial"
 *   }
 * }
 *
 * Response (not found):
 * {
 *   success: true,
 *   data: {
 *     patient: null,
 *     matchType: "none"
 *   }
 * }
 *
 * @module api/agent/paciente
 */

import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import {
  successResponse,
  handleApiError,
} from '@/lib/agent/error-handler'
import { searchPatient } from '@/lib/services/patient-service'
import { agentPatientSearchSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * GET handler for patient search.
 * Requires Bearer token authentication.
 */
export const GET = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = agentPatientSearchSchema.parse(searchParams)

    // 2. Call service layer
    const result = await searchPatient({
      telefone: query.telefone,
      cpf: query.cpf,
      nome: query.nome,
    })

    // 3. Audit log (fire and forget)
    // Log search without exposing PHI in details
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_VIEW_PATIENT,
      resource: 'agent_api',
      resourceId: result.patient?.id?.toString(),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        searchType: query.telefone ? 'phone' : query.cpf ? 'cpf' : 'name',
        matchType: result.matchType,
        resultCount:
          result.matchType === 'partial'
            ? result.patients?.length
            : result.patient
              ? 1
              : 0,
      },
    }).catch(console.error)

    // 4. Return success response
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
})
