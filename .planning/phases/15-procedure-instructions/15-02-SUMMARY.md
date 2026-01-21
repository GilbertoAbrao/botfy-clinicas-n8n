---
phase: 15-procedure-instructions
plan: 02
subsystem: api
tags: [nextjs, api-routes, prisma, rbac, audit, instructions]

# Dependency graph
requires:
  - phase: 15-01
    provides: ProcedureInstruction Prisma model, Zod validation schema, audit actions
provides:
  - GET /api/procedures/instructions with pagination and filters
  - POST /api/procedures/instructions with validation
  - GET /api/procedures/instructions/[id] for single instruction
  - PUT /api/procedures/instructions/[id] for updates
  - PATCH /api/procedures/instructions/[id] for deactivation (soft delete)
affects: [15-03, 15-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Integer ID parsing for instruction routes (not UUID)"
    - "PATCH for deactivation-only operations (soft delete pattern)"
    - "Duplicate titulo check scoped by servicoId"

key-files:
  created:
    - src/app/api/procedures/instructions/route.ts
    - src/app/api/procedures/instructions/[id]/route.ts
  modified: []

key-decisions:
  - "PATCH restricted to deactivation only (ativo: false), per INST-07 soft delete requirement"
  - "Duplicate titulo check scoped to servicoId (allows same title for different services)"
  - "Content changes in audit log show [previous content]/[updated content] placeholders (avoid large diffs)"

patterns-established:
  - "Instruction API: Integer ID parsing unlike UUID-based patient/service routes"
  - "Soft delete via PATCH with ativo: false instead of DELETE endpoint"
  - "Search across multiple fields using Prisma OR clause"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 15 Plan 02: API CRUD Endpoints Summary

**Full CRUD API for procedure instructions with pagination, filters, RBAC enforcement, and soft delete**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T19:36:16Z
- **Completed:** 2026-01-21T19:39:12Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- GET endpoint with pagination and filters (q, tipo, ativo, servicoId)
- POST endpoint with validation and duplicate titulo check
- GET/PUT/PATCH endpoints for single instruction operations
- Soft delete via PATCH (no DELETE endpoint per INST-07)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create list and create endpoints** - `4d12ea8` (feat)
2. **Task 2: Create single item endpoints** - `8d0a102` (feat)

## Files Created/Modified
- `src/app/api/procedures/instructions/route.ts` - GET list with filters, POST create with validation
- `src/app/api/procedures/instructions/[id]/route.ts` - GET single, PUT update, PATCH deactivate

## Decisions Made
- **PATCH for deactivation only:** Restricted PATCH to only accept `{ ativo: false }` to enforce soft delete pattern per INST-07
- **Duplicate check scoped by servicoId:** Allows same titulo for different services or general vs service-specific instructions
- **Content diff placeholder:** Audit log shows `[previous content]`/`[updated content]` instead of full text to avoid large audit entries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full CRUD API available for frontend integration
- Ready for 15-03: List Page UI
- API endpoints:
  - `GET /api/procedures/instructions?q=&tipo=&ativo=&servicoId=&page=&limit=`
  - `POST /api/procedures/instructions`
  - `GET /api/procedures/instructions/[id]`
  - `PUT /api/procedures/instructions/[id]`
  - `PATCH /api/procedures/instructions/[id]`

---
*Phase: 15-procedure-instructions*
*Completed: 2026-01-21*
