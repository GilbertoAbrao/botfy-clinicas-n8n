import { prisma } from '@/lib/prisma'
import {
  calculateAvailableSlots,
  DEFAULT_WORKING_HOURS,
  DEFAULT_BUFFER_MINUTES,
} from '@/lib/calendar/availability-calculator'
import { TimeSlot } from '@/lib/calendar/conflict-detection'
import { TZDate } from '@date-fns/tz'
import { startOfDay, endOfDay, format } from 'date-fns'

const CLINIC_TIMEZONE = 'America/Sao_Paulo'

/**
 * Query parameters for slot availability search.
 */
export interface SlotQuery {
  date: TZDate
  profissional?: string
  servicoId?: number
  duracaoMinutos?: number
}

/**
 * Result of slot availability search.
 * Returns formatted time strings for easy N8N consumption.
 */
export interface SlotResult {
  date: string // YYYY-MM-DD
  slots: string[] // ["08:00", "09:00", ...]
  totalAvailable: number
  period: {
    morning: string[] // Slots before 12:00
    afternoon: string[] // Slots 12:00 and after
  }
}

/**
 * Get available appointment slots for a specific date.
 *
 * Reuses calculateAvailableSlots() from Phase 4 calendar utilities.
 * Fetches existing appointments to determine conflicts.
 *
 * @param query - Search parameters (date, provider, service, duration)
 * @returns Available slots formatted as HH:mm strings, split by morning/afternoon
 */
export async function getAvailableSlots(query: SlotQuery): Promise<SlotResult> {
  const { date, profissional, servicoId, duracaoMinutos = 30 } = query

  // Get service duration if servicoId provided
  let appointmentDuration = duracaoMinutos
  if (servicoId) {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: { duracaoMinutos: true },
    })
    if (servico) {
      appointmentDuration = servico.duracaoMinutos
    }
  }

  // Fetch existing appointments for the day
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  // Build where clause with explicit typing
  const where: {
    dataHora: { gte: Date; lte: Date }
    status: { notIn: string[] }
    profissional?: string
  } = {
    dataHora: {
      gte: dayStart,
      lte: dayEnd,
    },
    status: {
      notIn: ['cancelada', 'faltou'],
    },
  }

  if (profissional) {
    where.profissional = profissional
  }

  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      id: true,
      dataHora: true,
      duracaoMinutos: true,
      profissional: true,
    },
  })

  // Convert to TimeSlot format for conflict detection
  const existingSlots: TimeSlot[] = appointments.map((apt) => {
    const start = new Date(apt.dataHora)
    const duration = apt.duracaoMinutos || 30
    const end = new Date(start.getTime() + duration * 60000)
    return {
      providerId: apt.profissional || 'default',
      start,
      end,
    }
  })

  // Calculate available slots using Phase 4 utility
  const availableSlots = calculateAvailableSlots(
    date,
    {
      providerId: profissional || 'default',
      workingHours: DEFAULT_WORKING_HOURS,
      appointmentDuration,
      bufferMinutes: DEFAULT_BUFFER_MINUTES,
    },
    existingSlots
  )

  // Format slots as HH:mm strings
  const formattedSlots = availableSlots.map((slot) => format(slot, 'HH:mm'))

  // Split by morning/afternoon
  const morning = formattedSlots.filter((s) => parseInt(s.split(':')[0]) < 12)
  const afternoon = formattedSlots.filter((s) => parseInt(s.split(':')[0]) >= 12)

  return {
    date: format(date, 'yyyy-MM-dd'),
    slots: formattedSlots,
    totalAvailable: formattedSlots.length,
    period: {
      morning,
      afternoon,
    },
  }
}
