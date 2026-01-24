import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse, handleApiError, errorResponse } from '@/lib/agent/error-handler'
import { confirmAppointment } from '@/lib/services/appointment-write-service'
import { agentConfirmAppointmentSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * POST /api/agent/agendamentos/:id/confirmar
 *
 * Confirm appointment attendance. Supports two confirmation types:
 * - 'confirmado': Patient confirmed attendance (phone/message confirmation)
 * - 'presente': Patient has arrived at the clinic
 *
 * Authentication: Bearer token (API key from agents table)
 *
 * Path parameters:
 * - id: Appointment ID (required)
 *
 * Request body:
 * {
 *   tipo: 'confirmado' | 'presente' (default: 'confirmado')
 * }
 *
 * State transition rules:
 * - 'confirmado': Can be applied to 'agendada' appointments
 * - 'presente': Can only be applied to 'confirmado' appointments
 * - Idempotent: applying same status returns success without change
 * - Cannot confirm 'cancelada', 'faltou', or 'realizada' appointments
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
 * - 400: Invalid appointment ID or invalid state transition
 * - 404: Appointment not found
 * - 401: Invalid API key
 */
export const POST = withAgentAuth(async (
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
    const input = agentConfirmAppointmentSchema.parse(body)

    // 3. Call service to confirm appointment
    const result = await confirmAppointment(appointmentId, input.tipo)

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
      action: AuditAction.AGENT_CONFIRM_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: String(appointmentId),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        tipo: input.tipo,
        previousStatus: '***', // We don't track previous status, just the action
        newStatus: result.status,
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
      if (error.message === 'Appointment must be confirmed before marking as present') {
        return errorResponse(error.message, 400)
      }
      if (error.message.startsWith('Cannot confirm appointment with status:')) {
        return errorResponse(error.message, 400)
      }
    }
    return handleApiError(error)
  }
})
