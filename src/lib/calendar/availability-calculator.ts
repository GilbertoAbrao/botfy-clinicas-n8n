import { TZDate, CLINIC_TIMEZONE, createClinicDate } from './time-zone-utils'
import { TimeSlot, addBufferTime, isSlotAvailable } from './conflict-detection'

interface ProviderSchedule {
  providerId: string
  workingHours: { start: string; end: string }[]  // e.g., ["08:00", "12:00"], ["14:00", "18:00"]
  appointmentDuration: number  // Default duration in minutes
  bufferMinutes: number  // Buffer between appointments
}

/**
 * Calculate available time slots for a provider on a specific date
 */
export function calculateAvailableSlots(
  date: Date,
  schedule: ProviderSchedule,
  existingAppointments: TimeSlot[]
): Date[] {
  const slots: Date[] = []

  for (const hours of schedule.workingHours) {
    const [startHour, startMin] = hours.start.split(':').map(Number)
    const [endHour, endMin] = hours.end.split(':').map(Number)

    const periodStart = createClinicDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startHour,
      startMin
    )

    const periodEnd = createClinicDate(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      endHour,
      endMin
    )

    let currentTime = periodStart.getTime()
    const slotDuration = schedule.appointmentDuration + schedule.bufferMinutes

    // Generate all possible slots within working hours
    while (currentTime + (schedule.appointmentDuration * 60000) <= periodEnd.getTime()) {
      const slotStart = new Date(currentTime)
      const slotEnd = new Date(currentTime + schedule.appointmentDuration * 60000)

      // Create proposed slot with buffer
      const proposedSlot: TimeSlot = {
        providerId: schedule.providerId,
        start: slotStart,
        end: slotEnd,
      }

      const slotWithBuffer = addBufferTime(proposedSlot, schedule.bufferMinutes)

      // Check if slot is available (no conflicts)
      if (isSlotAvailable(slotWithBuffer, existingAppointments)) {
        slots.push(new Date(currentTime))
      }

      // Move to next slot (appointment + buffer)
      currentTime = currentTime + slotDuration * 60000
    }
  }

  return slots
}

/**
 * Default working hours for MVP (8am-12pm, 2pm-6pm)
 * TODO: Move to provider configuration in Phase 7
 */
export const DEFAULT_WORKING_HOURS = [
  { start: '08:00', end: '12:00' },
  { start: '14:00', end: '18:00' },
]

export const DEFAULT_APPOINTMENT_DURATION = 60  // 1 hour
export const DEFAULT_BUFFER_MINUTES = 15  // 15 minutes buffer
