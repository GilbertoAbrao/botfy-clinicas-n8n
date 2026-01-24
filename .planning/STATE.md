# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-24
**Status:** v2.0 In Progress — Phase 19 in progress (plan 03 complete)
**Current Milestone:** v2.0 Agent API Migration

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-24)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Migrating N8N agent tools to Next.js APIs + MCP Server (Phase 19: Write Tools next)

---

## Current Position

**Milestone:** v2.0 Agent API Migration
**Phase:** Phase 19 of 22 (Write Tools) — IN PROGRESS
**Plan:** 3/5 plans complete (19-01, 19-02, 19-03)
**Status:** Executing Phase 19

**Last activity:** 2026-01-24 — Completed 19-03-PLAN.md (Patient Update API)

**Progress:** █████████████████░░░ 88% (71/81 total plans complete across all milestones)

---

## Milestone Context

**What we're building:**
Migrate all 11 N8N AI Agent tools from sub-workflows to Next.js API routes with an MCP Server wrapper. This brings business logic into the codebase for:
- Type safety (TypeScript + Zod validation)
- Testability (Jest/Vitest)
- Debuggability (VS Code, logs, breakpoints)
- Performance (direct HTTP calls vs. workflow execute)
- Code review (PR workflow)
- DRY (reuse Console services)

**Tools to migrate:**
1. ✅ `buscar_slots_disponiveis` — GET /api/agent/slots
2. `criar_agendamento` — 15 nodes → API endpoint
3. `reagendar_agendamento` — 4 nodes → API endpoint
4. `cancelar_agendamento` — 4 nodes → API endpoint
5. ✅ `buscar_agendamentos` — GET /api/agent/agendamentos
6. ✅ `buscar_paciente` — GET /api/agent/paciente
7. ✅ `atualizar_dados_paciente` — PATCH /api/agent/paciente/:id
8. `confirmar_presenca` — 1 node (JS) → API endpoint
9. ✅ `status_pre_checkin` — GET /api/agent/pre-checkin/status
10. ✅ `buscar_instrucoes` — GET /api/agent/instrucoes
11. `processar_documento` — 13 nodes → API endpoint

**Architecture:**
```
WhatsApp → N8N Webhook Handler → AI Agent → HTTP Request → Next.js APIs
                                              ↓
                                         MCP Server (optional wrapper)
                                              ↓
                                         Supabase
```

**v2.0 Phases:**
- ✅ Phase 17: Foundation (auth, error handling, audit logging, validation)
- ✅ Phase 18: Query Tools (5 read-only APIs)
- Phase 19: Write Tools (5 create/update APIs) — IN PROGRESS (3/5 plans)
- Phase 20: Complex Tools (2 specialized APIs)
- Phase 21: N8N Integration (production migration with gradual rollout)
- Phase 22: MCP Server (optional wrapper for Claude Desktop)

---

## Shipped Milestones

**v1.2 Agenda List View + Pre-Checkin Management (Shipped 2026-01-21)**
- 4 phases (13-16), 18 plans, 46 requirements
- 70+ files, 9,681 lines added

**v1.1 Anti No-Show Intelligence (Shipped 2026-01-21)**
- 4 phases (9-12), 9 plans, 18 requirements
- 56 files, 8,953 lines added

**v1.0 MVP (Shipped 2026-01-17)**
- 8 phases (1-8), 32 plans, 79 requirements
- 244 files, 21,654 lines TypeScript

---

## Performance Metrics

**Velocity (All Milestones):**
- Total plans completed: 68
- Total phases completed: 18
- Average plans per phase: 3.8

**By Milestone:**

| Milestone | Phases | Plans | Avg/Phase |
|-----------|--------|-------|-----------|
| v1.0 | 8 | 32 | 4.0 |
| v1.1 | 4 | 9 | 2.3 |
| v1.2 | 4 | 18 | 4.5 |
| v2.0 | 2 | 9 | 4.5 |

---

## Accumulated Context

### Phase 19 Deliverables (In Progress)

**Write Tools (3/5 plans complete):**

1. **Appointment Create API** (`src/lib/services/appointment-write-service.ts`, `src/app/api/agent/agendamentos/route.ts POST`)
   - `createAppointment()` with slot availability check
   - Idempotency key support for retry safety

2. **Appointment Update/Cancel API** (`src/app/api/agent/agendamentos/[id]/route.ts`)
   - PATCH for updates, DELETE for cancellations
   - Status transitions and reason logging

3. **Patient Update API** (`src/lib/services/patient-write-service.ts`, `src/app/api/agent/paciente/[id]/route.ts`)
   - `updatePatient()` with partial update support
   - Phone uniqueness validation across patients
   - PHI-safe audit logging (field names only)

### Phase 18 Deliverables

**Query Tools (completed 2026-01-24):**

1. **Slots API** (`src/lib/services/slot-service.ts`, `src/app/api/agent/slots/route.ts`)
   - `getAvailableSlots()` reusing Phase 4 `calculateAvailableSlots()`
   - Slots split by morning/afternoon for N8N filtering

2. **Appointments API** (`src/lib/services/appointment-service.ts`, `src/app/api/agent/agendamentos/route.ts`)
   - `searchAppointments()` with page-based pagination (default 20, max 100)
   - Parallel count + findMany for efficiency

3. **Patient API** (`src/lib/services/patient-service.ts`, `src/app/api/agent/paciente/route.ts`)
   - `searchPatient()` with exact-first-partial-fallback pattern
   - Includes up to 5 upcoming appointments for context

4. **Pre-Checkin API** (`src/lib/services/pre-checkin-service.ts`, `src/app/api/agent/pre-checkin/status/route.ts`)
   - `getPreCheckinStatus()` using Supabase admin client (RLS bypass)
   - Finds next appointment when searching by patient/phone

5. **Instructions API** (`src/lib/services/instruction-service.ts`, `src/app/api/agent/instrucoes/route.ts`)
   - `searchInstructions()` ordered by priority (descending)
   - Returns only active instructions

### Phase 17 Deliverables

**Agent API Foundation (completed 2026-01-24):**

1. **Type System** (`src/lib/agent/types.ts`)
   - `AgentContext`: agentId, userId, role, correlationId
   - `ApiResponse<T>`: success, data?, error?, details?

2. **Database Schema** (`prisma/schema.prisma`)
   - Agent model with bcrypt-hashed API keys

3. **Error Handling** (`src/lib/agent/error-handler.ts`)
   - `handleApiError()`, `successResponse()`, `errorResponse()`

4. **Audit Logging** (`src/lib/audit/logger.ts`)
   - 11 AGENT_* actions with agentId and correlationId

5. **Date Validation** (`src/lib/validations/agent-schemas.ts`)
   - `flexibleDateTimeSchema`: 4 ISO 8601 variants → TZDate

6. **Authentication** (`src/lib/agent/auth.ts`, `middleware.ts`)
   - `validateApiKey()`, `withAgentAuth()` HOF

### Decisions

Recent decisions from Phase 17-18:

- **bcrypt for API Key Hashing**: 12 salt rounds
- **Correlation IDs for Audit Trail**: UUID per-request
- **Service Layer Pattern**: Business logic in service files, HTTP concerns in routes
- **Parallel Prisma Queries**: count + findMany in Promise.all for pagination
- **PHI Masking in Audit**: Sensitive fields masked with '***'
- **Single Partial Match as Exact**: When search returns single result, treat as exact
- **Upcoming Appointments Context**: Include up to 5 future appointments
- **Phone/CPF Normalization**: Remove non-digits before storage and comparison
- **Partial Update Pattern**: Build update object with only defined fields

### Open Blockers

None

### Tech Debt (Tracked)

- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15
- Missing 15-04-SUMMARY.md (phase 15 page integration)

---

## Session Continuity

**Last session:** 2026-01-24
**Stopped at:** Completed 19-03-PLAN.md (Patient Update API)
**Resume file:** None

**Next action:** Execute 19-04-PLAN.md (Confirm Attendance API) or 19-05-PLAN.md

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-24 — Completed 19-03 (Patient Update API)*
