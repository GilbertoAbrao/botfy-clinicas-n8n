import { TZDate } from "@date-fns/tz"
import { format, addHours, isSameDay } from "date-fns"
import { tz } from "@date-fns/tz"

// Clinic timezone (São Paulo - most clinics)
export const CLINIC_TIMEZONE = 'America/Sao_Paulo'

// Create appointment in clinic timezone (DST-aware)
export function createClinicDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): TZDate {
  return new TZDate(year, month, day, hour, minute, 0, CLINIC_TIMEZONE)
}

// Convert database timestamp to TZDate in clinic timezone
export function dbTimestampToTZDate(timestamp: string | Date): TZDate {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return new TZDate(date, CLINIC_TIMEZONE)
}

// Format appointment time for display in clinic timezone
export function formatAppointmentTime(date: Date | TZDate, formatStr: string = "PPpp"): string {
  return format(date, formatStr, { in: tz(CLINIC_TIMEZONE) })
}

// Check if two dates are same day in clinic timezone (avoids DST bugs)
export function isSameClinicDay(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2, { in: tz(CLINIC_TIMEZONE) })
}
