# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-24
**Status:** v2.0 In Progress — Phase 17 complete, ready for Phase 18
**Current Milestone:** v2.0 Agent API Migration

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-24)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Migrating N8N agent tools to Next.js APIs + MCP Server (Phase 18: Query Tools next)

---

## Current Position

**Milestone:** v2.0 Agent API Migration
**Phase:** Phase 17 of 22 (Agent API Foundation) — COMPLETE
**Plan:** 4/4 plans complete (17-01 to 17-04)
**Status:** Ready for Phase 18

**Last activity:** 2026-01-24 — Phase 17 executed (4 plans, 2 waves)

**Progress:** █████████████████░░░ 78% (63/81 total plans complete across all milestones)

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
1. `buscar_slots_disponiveis` — 9 nodes → API endpoint
2. `criar_agendamento` — 15 nodes → API endpoint
3. `reagendar_agendamento` — 4 nodes → API endpoint
4. `cancelar_agendamento` — 4 nodes → API endpoint
5. `buscar_agendamentos` — 4 nodes → API endpoint
6. `buscar_paciente` — 5 nodes → API endpoint
7. `atualizar_dados_paciente` — 9 nodes → API endpoint
8. `confirmar_presenca` — 1 node (JS) → API endpoint
9. `status_pre_checkin` — 8 nodes → API endpoint
10. `buscar_instrucoes` — 6 nodes → API endpoint
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
- Phase 18: Query Tools (5 read-only APIs)
- Phase 19: Write Tools (5 create/update APIs)
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
- Total plans completed: 63
- Total phases completed: 17
- Average plans per phase: 3.7

**By Milestone:**

| Milestone | Phases | Plans | Avg/Phase |
|-----------|--------|-------|-----------|
| v1.0 | 8 | 32 | 4.0 |
| v1.1 | 4 | 9 | 2.3 |
| v1.2 | 4 | 18 | 4.5 |
| v2.0 | 1 | 4 | 4.0 |

---

## Accumulated Context

### Phase 17 Deliverables

**Agent API Foundation (completed 2026-01-24):**

1. **Type System** (`src/lib/agent/types.ts`)
   - `AgentContext`: agentId, userId, role, correlationId
   - `ApiResponse<T>`: success, data?, error?, details?
   - `AgentHandler<T>`: route handler signature

2. **Database Schema** (`prisma/schema.prisma`)
   - Agent model with bcrypt-hashed API keys
   - Maps agents to system users for RBAC

3. **Error Handling** (`src/lib/agent/error-handler.ts`)
   - `handleApiError()`: ZodError field-level details, known error mapping
   - `successResponse()`, `errorResponse()`: consistent format

4. **Audit Logging** (`src/lib/audit/logger.ts`)
   - 11 new AGENT_* actions
   - agentId and correlationId in details JSON

5. **Date Validation** (`src/lib/validations/agent-schemas.ts`)
   - `flexibleDateTimeSchema`: 4 ISO 8601 variants → TZDate
   - 12 agent-specific validation schemas

6. **Authentication** (`src/lib/agent/auth.ts`, `middleware.ts`)
   - `validateApiKey()`: bcrypt compare against agents table
   - `withAgentAuth()`: HOF wrapper for route handlers
   - `scripts/generate-agent-key.ts`: CLI for generating keys

### Decisions

Recent decisions from Phase 17:

- **bcrypt for API Key Hashing**: 12 salt rounds (industry standard, prevents brute force)
- **Correlation IDs for Audit Trail**: UUID per-request to link audit logs
- **Generic ApiResponse Type**: Single response interface for consistent N8N parsing
- **HOF Pattern for Middleware**: Use Higher-Order Function for withAgentAuth()
- **Service Layer Deferred**: Will be incorporated into Phase 18-20 when building actual API endpoints

### Open Blockers

None

### Tech Debt (Tracked)

- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15
- Missing 15-04-SUMMARY.md (phase 15 page integration)
- Service layer extraction deferred from Phase 17 to Phase 18+

---

## Session Continuity

**Last session:** 2026-01-24
**Stopped at:** Phase 17 complete
**Resume file:** None

**Next action:** Run `/gsd:discuss-phase 18` to gather context for Query Tools

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-24 — Phase 17 complete (4 plans executed)*
