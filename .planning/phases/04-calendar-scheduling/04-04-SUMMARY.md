---
phase: 04-calendar-scheduling
plan: 04
subsystem: calendar
tags: [conflict-detection, availability, buffer-time, validation, interval-algorithm]

# Dependency graph
requires:
  - phase: 04-02
    provides: Appointment CRUD APIs with validation
  - phase: 04-03
    provides: Multi-provider support with provider_id on appointments
provides:
  - Conflict detection with O(n log n) interval overlap algorithm
  - Available time slot calculation with buffer times
  - Server-side validation preventing double-booking
  - Visual conflict warnings in appointment modal
affects: [04-05-waitlist, 04-06-n8n-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [interval-overlap-algorithm, server-side-conflict-validation, buffer-time-enforcement]

key-files:
  created:
    - src/lib/calendar/conflict-detection.ts
    - src/lib/calendar/availability-calculator.ts
  modified:
    - src/lib/validations/appointment.ts
    - src/app/api/agendamentos/route.ts
    - src/app/api/agendamentos/[id]/route.ts
    - src/components/calendar/appointment-modal.tsx

key-decisions:
  - "15-minute buffer time enforced between all appointments (MVP hardcoded, configurable in Phase 7)"
  - "Conflict detection runs server-side before INSERT/UPDATE to prevent race conditions"
  - "Cancelled appointments excluded from conflict checks (status != 'CANCELADO')"
  - "Self-exclusion in updates: appointment doesn't conflict with itself"

patterns-established:
  - "Interval overlap algorithm: O(n log n) performance for conflict detection"
  - "Buffer time pattern: addBufferTime() adds minutes to slot end for provider recovery"
  - "409 Conflict status code for scheduling conflicts with detailed error response"

# Metrics
duration: 3 min
completed: 2026-01-17
---

# Phase 04 Plan 04: Conflict Detection and Availability Summary

**Interval overlap algorithm (O(n log n)) prevents double-booking with 15-minute buffer times, server-side validation before INSERT/UPDATE, and visual conflict warnings in appointment modal**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-17T14:43:14Z
- **Completed:** 2026-01-17T14:46:18Z
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments
- Conflict detection utility with interval overlap algorithm (hasOverlap, findConflicts, isSlotAvailable)
- Availability calculator generating free slots within working hours (8am-12pm, 2pm-6pm default)
- Server-side conflict validation in POST /api/agendamentos preventing double-booking
- Server-side conflict validation in PUT /api/agendamentos/[id] with self-exclusion
- Visual conflict warnings in appointment modal (red alert box, stays open for retry)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create conflict detection utility** - `d3a7cf5` (feat)
2. **Task 2: Create availability calculator** - `6f3bf65` (feat)
3. **Task 3: Add conflict validation to create appointment API** - `feb1d28` (feat)
4. **Task 4: Add conflict validation to update appointment API** - `94eb01a` (feat)
5. **Task 5: Show conflict warnings in appointment modal** - `f1c4820` (feat)

**Plan metadata:** (to be committed next)

## Files Created/Modified
- `src/lib/calendar/conflict-detection.ts` - Interval overlap algorithm with O(n log n) performance, hasOverlap checks two time slots, findConflicts returns conflicting appointments, addBufferTime adds minutes to slot end
- `src/lib/calendar/availability-calculator.ts` - Calculates available time slots within provider working hours, respects existing appointments and buffer times, defaults to 8am-12pm, 2pm-6pm with 60min appointments
- `src/lib/validations/appointment.ts` - Added providerId to createAppointmentSchema and updateAppointmentSchema (optional field)
- `src/app/api/agendamentos/route.ts` - POST endpoint fetches service duration, creates proposed slot with buffer, fetches existing appointments for provider on same day, checks conflicts, returns 409 if overlap detected
- `src/app/api/agendamentos/[id]/route.ts` - PUT endpoint fetches original appointment, only checks conflicts if time/provider changed, includes appointment ID for self-exclusion, returns 409 if conflict
- `src/components/calendar/appointment-modal.tsx` - Added conflictError state, handles 409 status specially, displays red alert box for conflicts, keeps modal open for retry

## Decisions Made
- **15-minute buffer time:** Hardcoded for MVP (DEFAULT_BUFFER_MINUTES = 15), will be configurable per provider in Phase 7
- **Server-side validation:** Conflict checks run in API routes before INSERT/UPDATE to prevent race conditions from concurrent requests
- **Cancelled appointments excluded:** status != 'CANCELADO' filter ensures cancelled slots are available for rebooking
- **Self-exclusion pattern:** Update endpoint includes appointment ID in proposedSlot so it doesn't conflict with itself
- **409 Conflict status code:** RESTful approach for scheduling conflicts, distinct from 400 validation errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added providerId to validation schemas**
- **Found during:** Task 3 (Create appointment API conflict validation)
- **Issue:** createAppointmentSchema and updateAppointmentSchema lacked providerId field, blocking conflict detection implementation
- **Fix:** Added providerId as optional UUID field to both schemas
- **Files modified:** src/lib/validations/appointment.ts
- **Verification:** TypeScript compiles, schemas accept providerId in API requests
- **Committed in:** feb1d28 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Blocking fix necessary to implement conflict detection for multi-provider support. No scope creep.

## Issues Encountered
None - plan executed exactly as specified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Conflict detection prevents double-booking same provider at same time
- 15-minute buffer time enforced between appointments
- System ready for Plan 04-05 (Waitlist Management) to auto-fill cancelled slots
- Available slot calculation ready for integration with appointment booking UI
- Server-side validation ensures data integrity for all appointment operations

---
*Phase: 04-calendar-scheduling*
*Completed: 2026-01-17*
