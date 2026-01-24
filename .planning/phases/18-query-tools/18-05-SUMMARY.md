---
phase: 18-query-tools
plan: 05
subsystem: api
tags: [prisma, agent-api, instructions, procedure-instructions]

# Dependency graph
requires:
  - phase: 17-agent-foundation
    provides: withAgentAuth HOF, AgentContext, agentInstructionsSearchSchema, AuditAction.AGENT_VIEW_INSTRUCTIONS
provides:
  - GET /api/agent/instrucoes endpoint for AI Agent
  - instruction-service.ts with searchInstructions()
  - InstructionQuery, InstructionResult, InstructionSearchResult types
  - INSTRUCTION_TYPES constant for reference
affects: [18-query-tools completion, n8n-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Service layer pattern for business logic separation
    - Prisma query with typed where clause

key-files:
  created:
    - src/lib/services/instruction-service.ts
    - src/app/api/agent/instrucoes/route.ts
  modified: []

key-decisions:
  - "Return instruction types in response for AI reference"
  - "Case-insensitive matching for tipoInstrucao filter"
  - "Include service name with each instruction for context"

patterns-established:
  - "Service layer pattern: business logic in src/lib/services/*.ts, route handlers call services"
  - "Query result includes filter metadata for debugging"

# Metrics
duration: 3min
completed: 2026-01-24
---

# Phase 18 Plan 05: Instructions API Summary

**Procedure instructions API endpoint for AI Agent to retrieve patient preparation instructions by service and instruction type, ordered by priority**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T17:27:02Z
- **Completed:** 2026-01-24T17:30:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Created instruction-service.ts with searchInstructions() and getInstructionsForAppointment()
- Implemented GET /api/agent/instrucoes endpoint with authentication and validation
- Instructions filtered by servicoId and/or tipoInstrucao, only active returned
- Results ordered by priority (descending) then by type

## Task Commits

Each task was committed atomically:

1. **Task 1: Create instruction-service.ts** - `e26f3f1` (feat)
2. **Task 2: Create GET /api/agent/instrucoes route** - `2254974` (feat)

## Files Created/Modified
- `src/lib/services/instruction-service.ts` - Service layer with searchInstructions(), getInstructionsForAppointment(), types, and INSTRUCTION_TYPES constant
- `src/app/api/agent/instrucoes/route.ts` - GET endpoint with withAgentAuth(), validation, audit logging

## Decisions Made
- **Return INSTRUCTION_TYPES in response:** Includes available instruction types in every response so AI Agent has reference without separate lookup
- **Case-insensitive tipoInstrucao matching:** Uses Prisma `mode: 'insensitive'` for flexibility in AI input
- **Include service info:** Each instruction includes servico.nome for better context when presenting to patients

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Instructions API ready for N8N integration testing
- Service layer pattern established for other plans to follow
- All 5 Query Tools plans now complete

---
*Phase: 18-query-tools*
*Plan: 05*
*Completed: 2026-01-24*
