---
phase: 18-query-tools
plan: 03
subsystem: api
tags: [patient-search, agent-api, prisma, service-layer]

# Dependency graph
requires:
  - phase: 17-agent-api-foundation
    provides: withAgentAuth middleware, ApiResponse types, agentPatientSearchSchema, AuditAction.AGENT_VIEW_PATIENT
provides:
  - Patient search service with exact/partial matching
  - GET /api/agent/paciente endpoint for N8N AI Agent
  - PatientSearchQuery, PatientResult, PatientSearchResult types
affects: [18-04, 19-02, pre-checkin-api, patient-update-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Service layer pattern (src/lib/services/)
    - Exact match first, partial match fallback
    - Phone/CPF normalization (strip non-digits)
    - Single partial match treated as exact

key-files:
  created:
    - src/lib/services/patient-service.ts
    - src/app/api/agent/paciente/route.ts
  modified: []

key-decisions:
  - "Service layer pattern: Business logic in src/lib/services/, route handlers thin"
  - "Single partial match as exact: Common case when user omits area code"
  - "Upcoming appointments context: Include up to 5 for AI Agent conversation context"

patterns-established:
  - "Service layer: Create {resource}-service.ts in src/lib/services/ for business logic"
  - "Agent API routes: Use withAgentAuth HOF, call service, audit log, return ApiResponse"

# Metrics
duration: 3min
completed: 2026-01-24
---

# Phase 18 Plan 03: Patient Search API Summary

**Patient search API with exact/partial phone matching, CPF lookup, and upcoming appointments context for N8N AI Agent**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T17:26:53Z
- **Completed:** 2026-01-24T17:29:09Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created patient-service.ts with searchPatient() supporting phone/CPF/name search
- Implemented exact match first (indexed), partial match fallback pattern
- Phone/CPF input normalization (strips non-digit characters)
- Includes up to 5 upcoming appointments for AI conversation context
- Single partial match treated as exact (common when area code omitted)
- GET /api/agent/paciente endpoint with Bearer token authentication
- Audit logging without PHI exposure (logs searchType, matchType, resultCount only)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create patient-service.ts with search functionality** - `e0c0aad` (feat)
2. **Task 2: Create GET /api/agent/paciente route** - `98ec479` (feat)

## Files Created

- `src/lib/services/patient-service.ts` - Patient search business logic with types
- `src/app/api/agent/paciente/route.ts` - GET endpoint with auth and validation

## Decisions Made

1. **Service layer pattern** - Business logic in src/lib/services/, keeping route handlers thin. This establishes the pattern for remaining Phase 18-20 APIs.

2. **Single partial match as exact** - When phone/name search returns exactly one result, treat it as exact match and include upcoming appointments. This handles the common case where users omit area codes.

3. **Limit partial results to 10** - Prevents large responses when many patients share similar phone patterns. AI Agent can ask user to be more specific.

4. **Upcoming appointments context** - Include up to 5 future appointments (not cancelled/missed) for exact matches. Gives AI Agent conversation context without additional API calls.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Service layer pattern established for remaining Query Tools APIs
- Next: 18-04 (Instructions API) or 18-05 (Pre-Checkin Status API)
- Patient service can be extended for update operations in Phase 19

---
*Phase: 18-query-tools*
*Completed: 2026-01-24*
