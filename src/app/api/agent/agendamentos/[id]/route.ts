import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError, errorResponse } from '@/lib/agent/error-handler'
import { rescheduleAppointment, cancelAppointment } from '@/lib/services/appointment-write-service'
import { agentUpdateAppointmentSchema, agentCancelAppointmentSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * PATCH /api/agent/agendamentos/:id
 *
 * Reschedule an existing appointment. Updates dataHora and/or profissional.
 * Uses atomic transaction with conflict detection for time changes.
 *
 * Authentication: Bearer token (API key from agents table)
 *
 * Path parameters:
 * - id: Appointment ID (required)
 *
 * Request body (all optional, at least one required):
 * {
 *   dataHora: string (ISO 8601),    // New appointment time
 *   profissional: string,           // New provider name
 *   observacoes: string,            // Additional notes (max 500 chars)
 *   status: 'agendada' | 'confirmada' | 'presente' | 'cancelada' | 'faltou'
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
 * Error responses:
 * - 400: Invalid appointment ID or validation error
 * - 404: Appointment not found
 * - 409: Time slot already booked (conflict)
 * - 401: Invalid API key
 */
export const PATCH = withAgentAuth(async (
  req: NextRequest,
  context,
  agentContext
) => {
  try {
    // 1. Get appointment ID from path params
    const params = context.params
    const idParam = params?.id
    const appointmentId = parseInt(idParam || '', 10)

    if (isNaN(appointmentId)) {
      return errorResponse('Invalid appointment ID', 400)
    }

    // 2. Parse and validate request body
    const body = await req.json().catch(() => ({}))
    const input = agentUpdateAppointmentSchema.parse(body)

    // 3. Call service to reschedule appointment
    const result = await rescheduleAppointment(appointmentId, {
      dataHora: input.dataHora,
      profissional: input.profissional,
    })

    // 4. Format response
    const response = {
      id: result.id,
      dataHora: result.dataHora,
      tipoConsulta: result.tipoConsulta,
      profissional: result.profissional,
      status: result.status,
      paciente: {
        id: result.paciente.id,
        nome: result.paciente.nome,
        telefone: result.paciente.telefone,
      },
    }

    // 5. Audit log (fire and forget)
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_UPDATE_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: String(appointmentId),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        changes: {
          dataHora: input.dataHora ? 'updated' : undefined,
          profissional: input.profissional ? 'updated' : undefined,
        },
        newDataHora: result.dataHora,
        newProfissional: result.profissional,
      },
    }).catch(console.error)

    // 6. Return success response
    return successResponse(response)
  } catch (error) {
    // Handle known errors with appropriate status codes
    if (error instanceof Error) {
      if (error.message === 'Appointment not found') {
        return errorResponse('Agendamento nao encontrado', 404)
      }
      if (error.message === 'Time slot already booked') {
        return errorResponse('Horario ja ocupado', 409)
      }
      if (error.message === 'Cannot reschedule cancelled appointment') {
        return errorResponse(error.message, 400)
      }
    }
    return handleApiError(error)
  }
})

/**
 * DELETE /api/agent/agendamentos/:id
 *
 * Cancel an existing appointment with a required reason.
 * Triggers waitlist notification for slot availability.
 * Idempotent: calling twice returns success.
 *
 * Authentication: Bearer token (API key from agents table)
 *
 * Path parameters:
 * - id: Appointment ID (required)
 *
 * Request body:
 * {
 *   motivo: string (required, min 3 chars, max 500 chars)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     message: string,
 *     id: number,
 *     status: 'cancelada',
 *     alreadyCancelled: boolean  // true if was already cancelled
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid appointment ID or missing motivo
 * - 404: Appointment not found
 * - 401: Invalid API key
 */
export const DELETE = withAgentAuth(async (
  req: NextRequest,
  context,
  agentContext
) => {
  try {
    // 1. Get appointment ID from path params
    const params = context.params
    const idParam = params?.id
    const appointmentId = parseInt(idParam || '', 10)

    if (isNaN(appointmentId)) {
      return errorResponse('Invalid appointment ID', 400)
    }

    // 2. Parse and validate request body
    const body = await req.json().catch(() => ({}))
    const input = agentCancelAppointmentSchema.parse(body)

    // 3. Call service to cancel appointment
    const result = await cancelAppointment(appointmentId, input.motivo)

    // 4. Audit log (fire and forget)
    // Truncate motivo for audit log (don't store full reason in audit)
    const truncatedMotivo = input.motivo.length > 50 
      ? input.motivo.substring(0, 50) + '...'
      : input.motivo

    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_CANCEL_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: String(appointmentId),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        motivo: truncatedMotivo,
        alreadyCancelled: result.alreadyCancelled || false,
      },
    }).catch(console.error)

    // 5. Return success response
    return successResponse({
      message: result.alreadyCancelled 
        ? 'Agendamento ja estava cancelado'
        : 'Agendamento cancelado com sucesso',
      id: result.id,
      status: result.status,
      alreadyCancelled: result.alreadyCancelled || false,
    })
  } catch (error) {
    // Handle known errors with appropriate status codes
    if (error instanceof Error) {
      if (error.message === 'Appointment not found') {
        return errorResponse('Agendamento nao encontrado', 404)
      }
    }
    return handleApiError(error)
  }
})
