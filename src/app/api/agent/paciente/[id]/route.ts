/**
 * PATCH /api/agent/paciente/:id
 *
 * Update patient data with partial updates.
 * Used by N8N AI Agent to update patient information.
 *
 * Path parameters:
 * - id (required): Patient ID
 *
 * Body (all fields optional):
 * - nome: Patient name
 * - telefone: Phone number
 * - email: Email address
 * - cpf: CPF document number
 * - dataNascimento: Birth date (YYYY-MM-DD)
 * - convenio: Insurance provider
 * - observacoes: Notes
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: 123,
 *     nome: "Updated Name",
 *     telefone: "11999999999",
 *     email: "updated@email.com",
 *     cpf: "12345678901",
 *     dataNascimento: "1990-01-15",
 *     convenio: "Unimed",
 *     observacoes: "Updated notes"
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid patient ID or validation error
 * - 404: Patient not found
 * - 409: Phone number already in use
 *
 * @module api/agent/paciente/[id]
 */

import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import {
  successResponse,
  handleApiError,
  errorResponse,
} from '@/lib/agent/error-handler'
import { updatePatient } from '@/lib/services/patient-write-service'
import { agentUpdatePatientSchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

/**
 * PATCH handler for patient updates.
 * Requires Bearer token authentication.
 */
export const PATCH = withAgentAuth(async (req: NextRequest, context, agentContext) => {
  try {
    // 1. Parse patientId from params
    const params = context.params
    if (!params?.id) {
      return errorResponse('Patient ID is required', 400)
    }

    const patientId = parseInt(params.id, 10)
    if (isNaN(patientId)) {
      return errorResponse('Invalid patient ID', 400)
    }

    // 2. Parse and validate request body
    const body = await req.json()
    const input = agentUpdatePatientSchema.parse(body)

    // 3. Call service layer
    const result = await updatePatient(patientId, input)

    // 4. Audit log (fire and forget)
    // Log field names only - NOT values (PHI protection)
    const updatedFields = Object.keys(input).filter(
      (key) => input[key as keyof typeof input] !== undefined
    )

    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_UPDATE_PATIENT,
      resource: 'agent_api',
      resourceId: patientId.toString(),
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        patientId,
        updatedFields, // Only field names, no values
      },
    }).catch(console.error)

    // 5. Return success response
    return successResponse(result)
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message === 'Patient not found') {
        return errorResponse('Paciente nao encontrado', 404)
      }
      if (error.message === 'Phone number already in use by another patient') {
        return errorResponse('Telefone ja cadastrado para outro paciente', 409)
      }
    }

    return handleApiError(error)
  }
})
