---
phase: 04-calendar-scheduling
plan: 05
subsystem: calendar
tags: [waitlist, priority-queue, auto-fill, notifications, supabase]

# Dependency graph
requires:
  - phase: 04-02
    provides: Appointment CRUD with delete functionality
  - phase: 01-secure-foundation
    provides: Audit logging infrastructure
provides:
  - Waitlist table with priority queue
  - Waitlist API endpoints (GET, POST, DELETE, PUT)
  - Auto-fill notification on appointment cancellation
  - Waitlist manager UI component
  - Waitlist panel integrated in agenda page
affects: [04-06-n8n-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [priority-queue, async-notifications, auto-fill-workflow]

key-files:
  created:
    - prisma/migrations/20260117_add_waitlist_table/migration.sql
    - src/app/api/waitlist/route.ts
    - src/app/api/waitlist/[id]/route.ts
    - src/lib/waitlist/auto-fill.ts
    - src/components/calendar/waitlist-manager.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/audit/logger.ts
    - src/app/api/agendamentos/[id]/route.ts
    - src/app/agenda/page.tsx

key-decisions:
  - "Used servico_tipo string field instead of Service model relation (matches current database schema)"
  - "Set created_by as TEXT to match Supabase Auth user ID type"
  - "Manual SQL migration due to shadow database limitation with Supabase"
  - "Async waitlist notification to avoid blocking delete response"

patterns-established:
  - "Priority queue: URGENT before CONVENIENCE, FIFO within priority"
  - "7-day auto-expiry for active waitlist entries"
  - "N8N webhook integration for WhatsApp notifications"

# Metrics
duration: 11 min
completed: 2026-01-17
---

# Phase 4 Plan 5: Waitlist Management Summary

**Waitlist system with priority queue (URGENT/CONVENIENCE), auto-fill notifications via N8N, and sidebar UI showing active entries**

## Performance

- **Duration:** 11 min
- **Started:** 2026-01-17T14:43:03Z
- **Completed:** 2026-01-17T14:54:44Z
- **Tasks:** 6
- **Files modified:** 9

## Accomplishments
- Waitlist table with priority levels (URGENT, CONVENIENCE) and 7-day expiry
- API endpoints for adding, listing, removing, and updating waitlist entries
- Auto-fill logic that notifies top 5 waitlist candidates when appointment cancelled
- Waitlist manager UI component displaying priority queue
- Sidebar integration in agenda page showing waitlist next to calendar

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Waitlist model to Prisma schema** - `8131b76` (feat)
2. **Task 2: Create waitlist API endpoints** - `c146240` (feat)
3. **Task 3: Create auto-fill logic for cancelled appointments** - `1021df8` (feat)
4. **Task 4: Integrate auto-fill with appointment deletion** - `b3f0c55` (feat)
5. **Task 5: Create waitlist manager UI component** - `41de1e7` (feat)
6. **Task 6: Add waitlist panel to agenda page** - `35bae69` (feat)

**Plan metadata:** (will be committed separately)

## Files Created/Modified

**Created:**
- `prisma/migrations/20260117_add_waitlist_table/migration.sql` - Database table for waitlist
- `src/app/api/waitlist/route.ts` - GET (list) and POST (add) endpoints
- `src/app/api/waitlist/[id]/route.ts` - DELETE and PUT endpoints
- `src/lib/waitlist/auto-fill.ts` - Auto-notification logic for cancelled slots
- `src/components/calendar/waitlist-manager.tsx` - Waitlist UI component

**Modified:**
- `prisma/schema.prisma` - Added Waitlist model with relations
- `src/lib/audit/logger.ts` - Added ADD_WAITLIST and REMOVE_WAITLIST actions
- `src/app/api/agendamentos/[id]/route.ts` - Integrated waitlist notification on delete
- `src/app/agenda/page.tsx` - Added waitlist sidebar to calendar page

## Decisions Made

**Schema adaptation:**
- Used `servico_tipo` string field instead of a Service model relation, matching the existing database schema where services are stored as strings in `tipo_consulta`
- Changed `created_by` from UUID to TEXT to match Supabase Auth user ID type

**Database migration:**
- Created manual SQL migration file instead of using Prisma's automatic migration due to shadow database limitations with Supabase pooled connections
- Applied migration directly using psql command

**Integration approach:**
- Waitlist notification runs asynchronously (fire-and-forget) to avoid blocking appointment delete response
- Error in notification doesn't cause delete operation to fail

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted schema to match database reality**
- **Found during:** Task 1 (Waitlist model creation)
- **Issue:** Plan assumed a Service model with UUID relations, but database uses `tipo_consulta` string field
- **Fix:** Changed `servico_id` relation to `servico_tipo` string field to match existing `tipo_consulta` in agendamentos table
- **Files modified:** prisma/schema.prisma, src/app/api/waitlist/route.ts, src/lib/waitlist/auto-fill.ts
- **Verification:** Schema generates successfully, migration applies cleanly
- **Committed in:** 8131b76, c146240, 1021df8

**2. [Rule 1 - Bug] Fixed user ID type mismatch**
- **Found during:** Task 1 (Migration application)
- **Issue:** Prisma schema defined `created_by` as UUID, but Supabase Auth users have TEXT IDs
- **Fix:** Changed `created_by` from `@db.Uuid` to TEXT type
- **Files modified:** prisma/schema.prisma, prisma/migrations/20260117_add_waitlist_table/migration.sql
- **Verification:** Foreign key constraint created successfully
- **Committed in:** 8131b76

**3. [Rule 3 - Blocking] Manual migration due to shadow database limitation**
- **Found during:** Task 1 (Running Prisma migrate)
- **Issue:** Prisma migrate failed with shadow database error on Supabase pooled connection
- **Fix:** Created manual SQL migration file and applied directly using psql with direct database connection (port 5432)
- **Files modified:** prisma/migrations/20260117_add_waitlist_table/migration.sql
- **Verification:** Table created with all indexes and foreign keys
- **Committed in:** 8131b76

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary to match actual database schema. No scope changes, just adaptations to existing infrastructure.

## Issues Encountered

None - plan executed successfully with schema adaptations

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 04-06 (N8N Integration and Time Zones):
- Waitlist notification webhook endpoint configured (N8N_WEBHOOK_WAITLIST_NOTIFY env var)
- Auto-fill logic calls N8N webhook when appointment cancelled
- Priority queue ensures urgent cases notified first

**Note for next plan:**
- N8N workflow needs to be created to handle waitlist notification webhook
- Webhook should send WhatsApp message with available slot details
- Current implementation expects N8N to handle message formatting and delivery

---
*Phase: 04-calendar-scheduling*
*Completed: 2026-01-17*
