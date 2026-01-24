import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, errorResponse, handleApiError } from '@/lib/agent/error-handler'
import { searchAppointments } from '@/lib/services/appointment-service'
import { createAppointment } from '@/lib/services/appointment-write-service'
import { agentAppointmentSearchSchema, agentCreateAppointmentSchema } from '@/lib/validations/agent-schemas'
import { checkIdempotencyKey, storeIdempotencyResult, hashRequestBody } from '@/lib/idempotency/idempotency-service'
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

/**
 * POST /api/agent/agendamentos
 *
 * Create a new appointment with conflict detection and idempotency support.
 * Used by N8N AI Agent to create appointments for patients.
 *
 * Authentication: Bearer token (API key from agents table)
 *
 * Request body:
 * {
 *   pacienteId: number,              // Required: patient ID
 *   servicoId?: number,              // Optional: service ID for duration
 *   tipoConsulta?: string,           // Optional: appointment type (required if no servicoId)
 *   profissional?: string,           // Optional: provider name
 *   dataHora: string,                // Required: ISO 8601 datetime
 *   observacoes?: string,            // Optional: notes (max 500 chars)
 *   idempotencyKey?: string          // Optional: UUID for duplicate prevention
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: number,
 *     dataHora: string (ISO 8601),
 *     tipoConsulta: string,
 *     profissional: string | null,
 *     status: string,
 *     paciente: { id: number, nome: string, telefone: string }
 *   }
 * }
 *
 * Errors:
 * - 400: Validation failed (Zod errors)
 * - 404: Patient not found
 * - 409: Time slot already booked (conflict)
 * - 422: Idempotency key reused with different request body
 */
export const POST = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse and validate request body
    const body = await req.json()
    const validatedData = agentCreateAppointmentSchema.parse(body)

    // 2. Handle idempotency if key provided
    let requestHash: string | undefined
    if (validatedData.idempotencyKey) {
      // Hash the request body (without the idempotency key itself)
      const { idempotencyKey: _, ...bodyWithoutKey } = validatedData
      requestHash = hashRequestBody(bodyWithoutKey)

      try {
        const idempotencyResult = await checkIdempotencyKey(
          validatedData.idempotencyKey,
          requestHash
        )

        // If not new, return cached response
        if (!idempotencyResult.isNew && idempotencyResult.storedResponse) {
          // Audit log for idempotent hit
          logAudit({
            userId: agentContext.userId,
            action: AuditAction.AGENT_CREATE_APPOINTMENT,
            resource: 'agent_api',
            details: {
              agentId: agentContext.agentId,
              correlationId: agentContext.correlationId,
              idempotencyKey: validatedData.idempotencyKey,
              idempotencyHit: true,
            },
          }).catch(console.error)

          return successResponse(idempotencyResult.storedResponse, 201)
        }
      } catch (idempotencyError) {
        // Key reused with different body
        if (idempotencyError instanceof Error &&
            idempotencyError.message.includes('Idempotency key reused')) {
          return errorResponse(idempotencyError.message, 422)
        }
        throw idempotencyError
      }
    }

    // 3. Create appointment via service
    const appointment = await createAppointment({
      pacienteId: validatedData.pacienteId,
      servicoId: validatedData.servicoId,
      tipoConsulta: validatedData.tipoConsulta,
      profissional: validatedData.profissional,
      dataHora: validatedData.dataHora,
      observacoes: validatedData.observacoes,
    })

    // 4. Store idempotency result if key was provided
    if (validatedData.idempotencyKey && requestHash) {
      await storeIdempotencyResult(
        validatedData.idempotencyKey,
        requestHash,
        appointment
      )
    }

    // 5. Audit log
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_CREATE_APPOINTMENT,
      resource: 'agent_api',
      resourceId: String(appointment.id),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        pacienteId: validatedData.pacienteId,
        dataHora: appointment.dataHora,
        tipoConsulta: appointment.tipoConsulta,
        profissional: appointment.profissional,
        idempotencyKey: validatedData.idempotencyKey,
      },
    }).catch(console.error)

    // 6. Return created appointment
    return successResponse(appointment, 201)
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'Time slot already booked') {
        return errorResponse('Horario ja ocupado', 409)
      }
    }

    return handleApiError(error)
  }
})
