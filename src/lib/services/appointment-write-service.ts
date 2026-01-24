import { prisma } from '@/lib/prisma'
import { TZDate } from '@date-fns/tz'
import { startOfDay, endOfDay } from 'date-fns'
import { findConflicts, addBufferTime, type TimeSlot } from '@/lib/calendar/conflict-detection'
import { notifyN8NAppointmentUpdated, notifyN8NAppointmentCancelled } from '@/lib/calendar/n8n-sync'
import { notifyWaitlist } from '@/lib/waitlist/auto-fill'

/**
 * Input for rescheduling an appointment.
 */
export interface RescheduleInput {
  dataHora?: TZDate
  profissional?: string
}

/**
 * Result of a reschedule or cancel operation.
 */
export interface AppointmentWriteResult {
  id: number
  dataHora: string           // ISO 8601 format
  tipoConsulta: string
  profissional: string | null
  status: string | null
  observacoes: string | null
  paciente: {
    id: number
    nome: string
    telefone: string
  }
  alreadyCancelled?: boolean  // For idempotent cancel
}

/**
 * Reschedule an existing appointment to a new time/provider.
 *
 * Uses Prisma transaction for atomicity:
 * 1. Fetch existing appointment (verify exists, not cancelled)
 * 2. If dataHora changed, check for conflicts (excluding self)
 * 3. Update appointment with new dataHora/profissional
 * 4. Notify N8N of changes (fire-and-forget)
 *
 * @param appointmentId - ID of the appointment to reschedule
 * @param input - New dataHora and/or profissional
 * @returns Updated appointment with patient info
 * @throws Error('Appointment not found') if appointment doesn't exist
 * @throws Error('Cannot reschedule cancelled appointment') if already cancelled
 * @throws Error('Time slot already booked') if new time conflicts
 */
export async function rescheduleAppointment(
  appointmentId: number,
  input: RescheduleInput
): Promise<AppointmentWriteResult> {
  // Use transaction for atomic update
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch existing appointment with patient info
    const existing = await tx.appointment.findUnique({
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

    if (!existing) {
      throw new Error('Appointment not found')
    }

    if (existing.status === 'cancelada') {
      throw new Error('Cannot reschedule cancelled appointment')
    }

    // 2. If dataHora changed, check for conflicts
    if (input.dataHora) {
      // Get provider for conflict check (new or existing)
      const provider = input.profissional ?? existing.profissional ?? 'default'
      const duration = existing.duracaoMinutos ?? 30

      // Calculate proposed slot times
      const proposedStart = new Date(input.dataHora)
      const proposedEnd = new Date(proposedStart.getTime() + duration * 60000)

      // Create proposed slot
      const proposedSlot: TimeSlot = {
        id: appointmentId.toString(), // Exclude self from conflicts
        start: proposedStart,
        end: proposedEnd,
        providerId: provider,
      }

      // Add buffer time for conflict detection
      const bufferedSlot = addBufferTime(proposedSlot, 15)

      // Get existing appointments for the same day and provider
      const dayStart = startOfDay(proposedStart)
      const dayEnd = endOfDay(proposedStart)

      const existingAppointments = await tx.appointment.findMany({
        where: {
          dataHora: {
            gte: dayStart,
            lte: dayEnd,
          },
          profissional: provider,
          status: {
            notIn: ['cancelada', 'faltou'],
          },
          id: {
            not: appointmentId, // Exclude self
          },
        },
        select: {
          id: true,
          dataHora: true,
          duracaoMinutos: true,
          profissional: true,
        },
      })

      // Convert to TimeSlot format
      const existingSlots: TimeSlot[] = existingAppointments.map((apt) => {
        const dur = apt.duracaoMinutos ?? 30
        return {
          id: apt.id.toString(),
          start: apt.dataHora,
          end: new Date(apt.dataHora.getTime() + dur * 60000),
          providerId: apt.profissional ?? 'default',
        }
      })

      // Check for conflicts
      const conflicts = findConflicts(bufferedSlot, existingSlots)

      if (conflicts.length > 0) {
        throw new Error('Time slot already booked')
      }
    }

    // 3. Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (input.dataHora) {
      updateData.dataHora = new Date(input.dataHora)
    }

    if (input.profissional !== undefined) {
      updateData.profissional = input.profissional
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      // No changes, return existing
      return existing
    }

    // 4. Update appointment
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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

    return updated
  })

  // 5. Notify N8N of changes (fire-and-forget, outside transaction)
  if (input.dataHora || input.profissional) {
    notifyN8NAppointmentUpdated({
      appointmentId: appointmentId.toString(),
      changes: {
        ...(input.dataHora && { dataHora: new Date(input.dataHora).toISOString() }),
        ...(input.profissional && { providerId: input.profissional }),
      },
    }).catch((error) => {
      console.error('Failed to notify N8N of reschedule:', error)
    })
  }

  // Transform to API format
  return {
    id: result.id,
    dataHora: result.dataHora.toISOString(),
    tipoConsulta: result.tipoConsulta,
    profissional: result.profissional,
    status: result.status,
    observacoes: result.observacoes,
    paciente: {
      id: result.paciente.id,
      nome: result.paciente.nome,
      telefone: result.paciente.telefone,
    },
  }
}

/**
 * Cancel an existing appointment with a reason.
 *
 * Features:
 * - Idempotent: Returns success if already cancelled
 * - Appends reason to observacoes field
 * - Notifies N8N for reminder cleanup (fire-and-forget)
 * - Triggers waitlist notification for slot availability (fire-and-forget)
 *
 * @param appointmentId - ID of the appointment to cancel
 * @param motivo - Required reason for cancellation
 * @returns Updated appointment with alreadyCancelled flag if was cancelled
 * @throws Error('Appointment not found') if appointment doesn't exist
 */
export async function cancelAppointment(
  appointmentId: number,
  motivo: string
): Promise<AppointmentWriteResult> {
  // 1. Fetch appointment with patient info
  const existing = await prisma.appointment.findUnique({
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

  if (!existing) {
    throw new Error('Appointment not found')
  }

  // 2. If already cancelled, return idempotent response
  if (existing.status === 'cancelada') {
    return {
      id: existing.id,
      dataHora: existing.dataHora.toISOString(),
      tipoConsulta: existing.tipoConsulta,
      profissional: existing.profissional,
      status: existing.status,
      observacoes: existing.observacoes,
      paciente: {
        id: existing.paciente.id,
        nome: existing.paciente.nome,
        telefone: existing.paciente.telefone,
      },
      alreadyCancelled: true,
    }
  }

  // 3. Update status to cancelled, append reason to observacoes
  const existingObs = existing.observacoes || ''
  const separator = existingObs ? '\n---\n' : ''
  const timestamp = new Date().toISOString()
  const newObs = `${existingObs}${separator}[${timestamp}] Cancelado: ${motivo}`

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'cancelada',
      observacoes: newObs,
    },
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

  // 4. Notify N8N of cancellation (fire-and-forget)
  notifyN8NAppointmentCancelled({
    appointmentId: appointmentId.toString(),
    patientId: existing.paciente.id.toString(),
    serviceId: existing.servicoId?.toString() ?? '',
    providerId: existing.profissional ?? '',
    dataHora: existing.dataHora.toISOString(),
    status: 'cancelada',
    patientName: existing.paciente.nome,
    patientPhone: existing.paciente.telefone,
  }).catch((error) => {
    console.error('Failed to notify N8N of cancellation:', error)
  })

  // 5. Trigger waitlist notification for the freed slot (fire-and-forget)
  notifyWaitlist({
    servicoTipo: existing.tipoConsulta,
    providerId: existing.profissional,
    dataHora: existing.dataHora,
  }).catch((error) => {
    console.error('Failed to notify waitlist:', error)
  })

  // Transform to API format
  return {
    id: updated.id,
    dataHora: updated.dataHora.toISOString(),
    tipoConsulta: updated.tipoConsulta,
    profissional: updated.profissional,
    status: updated.status,
    observacoes: updated.observacoes,
    paciente: {
      id: updated.paciente.id,
      nome: updated.paciente.nome,
      telefone: updated.paciente.telefone,
    },
  }
}

/**
 * Confirm an existing appointment.
 *
 * Supports two confirmation types:
 * - 'confirmado': Patient confirmed attendance (phone/message confirmation)
 * - 'presente': Patient has arrived at the clinic
 *
 * State transition rules:
 * - 'confirmado': Can be applied to 'agendada' appointments
 * - 'presente': Can be applied to 'confirmada' appointments
 * - Idempotent: applying same status returns success without change
 * - Cannot confirm 'cancelada', 'faltou', or 'realizada' appointments
 *
 * @param appointmentId - ID of the appointment to confirm
 * @param tipo - Confirmation type ('confirmado' or 'presente')
 * @returns Updated appointment with patient info
 * @throws Error('Appointment not found') if appointment doesn't exist
 * @throws Error('Cannot confirm appointment with status: X') for invalid transitions
 * @throws Error('Appointment must be confirmed before marking as present') if trying to mark as present from agendada
 */
export async function confirmAppointment(
  appointmentId: number,
  tipo: 'confirmado' | 'presente'
): Promise<AppointmentWriteResult> {
  // 1. Fetch appointment with patient info
  const existing = await prisma.appointment.findUnique({
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

  if (!existing) {
    throw new Error('Appointment not found')
  }

  const currentStatus = existing.status ?? 'agendada'

  // 2. Check for invalid state transitions
  const invalidStatuses = ['cancelada', 'faltou', 'realizada']
  if (invalidStatuses.includes(currentStatus)) {
    throw new Error(`Cannot confirm appointment with status: ${currentStatus}`)
  }

  // 3. Determine new status based on tipo
  let newStatus: string

  if (tipo === 'confirmado') {
    // Can confirm from 'agendada', idempotent for 'confirmada'
    if (currentStatus === 'confirmada') {
      // Idempotent - already confirmed
      return {
        id: existing.id,
        dataHora: existing.dataHora.toISOString(),
        tipoConsulta: existing.tipoConsulta,
        profissional: existing.profissional,
        status: existing.status,
        observacoes: existing.observacoes,
        paciente: {
          id: existing.paciente.id,
          nome: existing.paciente.nome,
          telefone: existing.paciente.telefone,
        },
      }
    }
    if (currentStatus === 'presente') {
      // Already present - more advanced state
      return {
        id: existing.id,
        dataHora: existing.dataHora.toISOString(),
        tipoConsulta: existing.tipoConsulta,
        profissional: existing.profissional,
        status: existing.status,
        observacoes: existing.observacoes,
        paciente: {
          id: existing.paciente.id,
          nome: existing.paciente.nome,
          telefone: existing.paciente.telefone,
        },
      }
    }
    newStatus = 'confirmada'
  } else {
    // tipo === 'presente'
    // Can only mark as present from 'confirmada'
    if (currentStatus === 'presente') {
      // Idempotent - already present
      return {
        id: existing.id,
        dataHora: existing.dataHora.toISOString(),
        tipoConsulta: existing.tipoConsulta,
        profissional: existing.profissional,
        status: existing.status,
        observacoes: existing.observacoes,
        paciente: {
          id: existing.paciente.id,
          nome: existing.paciente.nome,
          telefone: existing.paciente.telefone,
        },
      }
    }
    if (currentStatus === 'agendada') {
      throw new Error('Appointment must be confirmed before marking as present')
    }
    newStatus = 'presente'
  }

  // 4. Update status
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: newStatus,
    },
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

  // Transform to API format
  return {
    id: updated.id,
    dataHora: updated.dataHora.toISOString(),
    tipoConsulta: updated.tipoConsulta,
    profissional: updated.profissional,
    status: updated.status,
    observacoes: updated.observacoes,
    paciente: {
      id: updated.paciente.id,
      nome: updated.paciente.nome,
      telefone: updated.paciente.telefone,
    },
  }
}
