import { prisma } from '@/lib/prisma'

/**
 * Result of an appointment confirmation operation.
 * Includes patient info for response formatting.
 */
export interface AppointmentConfirmResult {
  id: number
  dataHora: string
  tipoConsulta: string
  profissional: string | null
  status: string | null
  paciente: {
    id: number
    nome: string
    telefone: string
  }
}

/**
 * Invalid states for any confirmation operation.
 * These states represent terminal or post-appointment states
 * that cannot transition to 'confirmado' or 'presente'.
 */
const INVALID_CONFIRMATION_STATES = ['cancelada', 'faltou', 'realizada']

/**
 * Confirm an appointment by updating its status.
 *
 * State machine:
 * - agendada -> confirmado -> presente -> realizada
 * - agendada -> cancelada
 * - agendada -> faltou (after appointment time)
 * - confirmado -> cancelada
 * - confirmado -> faltou (after appointment time)
 *
 * Transition rules:
 * - 'confirmado': Can be applied to 'agendada' appointments
 * - 'presente': Can only be applied to 'confirmado' appointments
 * - Both are idempotent (applying same status returns unchanged)
 * - Cannot confirm 'cancelada', 'faltou', or 'realizada' appointments
 *
 * @param appointmentId - The appointment ID to confirm
 * @param tipo - Confirmation type: 'confirmado' (patient confirmed) or 'presente' (patient arrived)
 * @returns The updated appointment with patient info
 * @throws Error if appointment not found or invalid state transition
 */
export async function confirmAppointment(
  appointmentId: number,
  tipo: 'confirmado' | 'presente'
): Promise<AppointmentConfirmResult> {
  // 1. Fetch current appointment with patient info
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      paciente: {
        select: {
          id: true,
          nome: true,
          telefone: true,
        },
      },
    },
  })

  // 2. Check if appointment exists
  if (!appointment) {
    throw new Error('Appointment not found')
  }

  const currentStatus = appointment.status || 'agendada'

  // 3. Check if current status allows confirmation
  if (INVALID_CONFIRMATION_STATES.includes(currentStatus)) {
    throw new Error(`Cannot confirm appointment with status: ${currentStatus}`)
  }

  // 4. Idempotent check - if already in target status, return unchanged
  if (currentStatus === tipo) {
    return {
      id: appointment.id,
      dataHora: appointment.dataHora.toISOString(),
      tipoConsulta: appointment.tipoConsulta,
      profissional: appointment.profissional,
      status: appointment.status,
      paciente: appointment.paciente,
    }
  }

  // 5. Validate state transition for 'presente'
  // 'presente' can only be applied if appointment is already 'confirmado'
  if (tipo === 'presente' && currentStatus !== 'confirmado') {
    throw new Error('Appointment must be confirmed before marking as present')
  }

  // 6. Update the status
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: tipo },
    include: {
      paciente: {
        select: {
          id: true,
          nome: true,
          telefone: true,
        },
      },
    },
  })

  // 7. Return formatted result
  return {
    id: updated.id,
    dataHora: updated.dataHora.toISOString(),
    tipoConsulta: updated.tipoConsulta,
    profissional: updated.profissional,
    status: updated.status,
    paciente: updated.paciente,
  }
}
