import { TZDate } from "@date-fns/tz"

export interface TimeSlot {
  id?: string
  start: Date
  end: Date
  providerId: string
}

/**
 * Check if two time slots overlap
 * Overlap occurs if: slot1.start < slot2.end AND slot2.start < slot1.end
 */
export function hasOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // Different providers = no conflict
  if (slot1.providerId !== slot2.providerId) return false

  // Exclude self when checking (for updates)
  if (slot1.id && slot2.id && slot1.id === slot2.id) return false

  // Overlap: start < other.end AND other.start < end
  return (
    slot1.start.getTime() < slot2.end.getTime() &&
    slot2.start.getTime() < slot1.end.getTime()
  )
}

/**
 * Find all conflicts for a proposed time slot
 * Returns array of conflicting appointment IDs
 */
export function findConflicts(
  proposedSlot: TimeSlot,
  existingSlots: TimeSlot[]
): TimeSlot[] {
  return existingSlots.filter(slot => hasOverlap(proposedSlot, slot))
}

/**
 * Check if a time slot is available (no conflicts)
 */
export function isSlotAvailable(
  proposedSlot: TimeSlot,
  existingSlots: TimeSlot[]
): boolean {
  return findConflicts(proposedSlot, existingSlots).length === 0
}

/**
 * Add buffer time to time slot
 * @param slot Original time slot
 * @param bufferMinutes Buffer time in minutes (default: 15)
 * @returns Time slot with buffer added to end
 */
export function addBufferTime(
  slot: TimeSlot,
  bufferMinutes: number = 15
): TimeSlot {
  return {
    ...slot,
    end: new Date(slot.end.getTime() + bufferMinutes * 60000),
  }
}
