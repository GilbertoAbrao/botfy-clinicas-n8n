---
phase: 17-agent-api-foundation
plan: 03
subsystem: api
tags: [zod, validation, date-fns, timezone, agent-api]

# Dependency graph
requires:
  - phase: 17-02
    provides: Error response formatting
  - phase: existing
    provides: time-zone-utils.ts with CLINIC_TIMEZONE
provides:
  - Flexible Zod schemas for agent API validation with TZDate transformation
  - 12 agent-specific validation schemas for all Phase 18-20 endpoints
  - Type-safe input validation with proper timezone handling
affects: [18-query-tools, 19-write-tools, 20-complex-tools]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Flexible date parsing accepting ISO 8601 variants
    - TZDate transformation in Zod schemas
    - z.coerce.number() for IDs from N8N
    - Idempotency key support in write operations

key-files:
  created:
    - src/lib/validations/agent-schemas.ts
  modified: []

key-decisions:
  - "Use z.coerce.number() for IDs that may come as strings from N8N"
  - "flexibleDateTimeSchema accepts ISO 8601 with offset, UTC, and local formats"
  - "All dates transformed to TZDate in America/Sao_Paulo timezone"
  - "Idempotency keys as optional UUID fields in write schemas"

patterns-established:
  - "Flexible date parsing: accept multiple ISO 8601 formats, transform to TZDate in clinic timezone"
  - "Agent schema naming: agent{Resource}{Action}Schema pattern"
  - "Type exports: export type for each schema with {SchemaName}Input pattern"

# Metrics
duration: 78s
completed: 2026-01-24
---

# Phase 17 Plan 03: Agent API Validation Schemas Summary

**Flexible Zod validation schemas with TZDate transformation for 12 agent API endpoints across query, write, and complex tools**

## Performance

- **Duration:** 1min 18s
- **Started:** 2026-01-24T16:42:41Z
- **Completed:** 2026-01-24T16:43:59Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments
- Created flexibleDateTimeSchema accepting 4 ISO 8601 format variants with TZDate transformation
- Created flexibleDateSchema for date-only strings (YYYY-MM-DD) with TZDate at start of day
- Implemented 12 agent-specific validation schemas covering all Phase 18-20 API endpoints
- Used z.coerce.number() for IDs that may arrive as strings from N8N
- Added idempotency key support for write operations to prevent duplicate submissions
- All date schemas transform to TZDate in America/Sao_Paulo timezone for DST-aware operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create flexible date validation schemas** - `4a7ad61` (feat)

**Plan metadata:** `e341410` (docs: complete plan)

## Files Created/Modified
- `src/lib/validations/agent-schemas.ts` - Flexible Zod schemas for agent API validation with TZDate transformation

## Decisions Made

**1. Flexible date parsing strategy**
- Accept ISO 8601 with timezone offset (e.g., "2026-01-24T14:30:00-03:00")
- Accept ISO 8601 UTC with Z suffix (e.g., "2026-01-24T14:30:00Z")
- Accept local datetime without offset (e.g., "2026-01-24T14:30:00")
- Accept date-only strings (e.g., "2026-01-24")
- All formats transformed to TZDate in America/Sao_Paulo timezone
- Rationale: N8N AI Agent may send dates in various formats depending on context and LLM output

**2. Coercion for numeric IDs**
- Use `z.coerce.number().int().positive()` for all ID fields (pacienteId, servicoId, agendamentoId)
- Rationale: N8N may send IDs as strings in JSON payloads; coercion prevents validation errors

**3. Idempotency key support**
- Added optional `idempotencyKey: z.string().uuid().optional()` to agentCreateAppointmentSchema
- Rationale: Prevents duplicate appointments if N8N retries HTTP request on timeout/error

**4. Comprehensive schema coverage**
- Created 12 schemas covering all 11 N8N tools to be migrated (some tools share schemas)
- Query tools (Phase 18): agentAppointmentSearchSchema, agentSlotsSearchSchema, agentPatientSearchSchema, agentInstructionsSearchSchema, agentPreCheckinStatusSchema
- Write tools (Phase 19): agentCreateAppointmentSchema, agentUpdateAppointmentSchema, agentCancelAppointmentSchema, agentConfirmAppointmentSchema, agentUpdatePatientSchema
- Complex tools (Phase 20): Will reuse query/write schemas
- Rationale: Complete foundation before implementing any endpoints

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward following existing validation patterns from appointment.ts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 18 (Query Tools implementation):**
- All validation schemas prepared for 5 query endpoints
- flexibleDateTimeSchema and flexibleDateSchema tested with various date formats
- TZDate transformation verified for America/Sao_Paulo timezone
- TypeScript types exported for all schemas

**Ready for Phase 19 (Write Tools implementation):**
- All write operation schemas prepared with proper validation
- Idempotency key support included for duplicate prevention
- Status enum validation aligned with database values

**Ready for Phase 20 (Complex Tools implementation):**
- Pre-checkin status schema prepared
- Instruction search schema prepared
- Can reuse other schemas as needed

**No blockers identified.**

---
*Phase: 17-agent-api-foundation*
*Completed: 2026-01-24*
