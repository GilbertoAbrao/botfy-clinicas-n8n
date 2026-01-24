# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-24
**Status:** v2.0 In Progress — Phase 17 planned, ready to execute
**Current Milestone:** v2.0 Agent API Migration

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-24)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Migrating N8N agent tools to Next.js APIs + MCP Server (Phase 17: Foundation)

---

## Current Position

**Milestone:** v2.0 Agent API Migration
**Phase:** Phase 17 of 22 (Agent API Foundation)
**Plan:** 3 of 4 complete (17-03 completed)
**Status:** In progress - Wave 1 execution

**Last activity:** 2026-01-24 — Completed 17-03-PLAN.md (Agent API validation schemas)

**Progress:** ████████████████░░░░ 74% (60/81 total plans complete across all milestones)

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
- Phase 17: Foundation (auth, error handling, audit logging, service layer)
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
- Total plans completed: 59
- Total phases completed: 16
- Average plans per phase: 3.7

**By Milestone:**

| Milestone | Phases | Plans | Avg/Phase |
|-----------|--------|-------|-----------|
| v1.0 | 8 | 32 | 4.0 |
| v1.1 | 4 | 9 | 2.3 |
| v1.2 | 4 | 18 | 4.5 |
| v2.0 | 0 | 1 | - |

---

## Accumulated Context

### Decisions

Recent decisions from PROJECT.md affecting v2.0 work:

- **Service Layer Extraction**: Business logic extracted from existing routes for reuse between Console UI and Agent APIs
- **API Key Authentication**: Simple Bearer token approach for N8N integration (stateless, N8N-compatible)
- **Dual-track Architecture**: N8N calls REST APIs directly, MCP Server wraps same APIs for Claude Desktop
- **Gradual Rollout**: Keep sub-workflows as fallback during migration (10% → 50% → 100%)
- **Idempotency First**: All write operations must support idempotency keys to prevent duplicates

Phase 17 decisions:

- **Flexible Date Parsing** (17-03): Accept ISO 8601 with offset, UTC (Z), local datetime, and date-only formats; transform to TZDate in America/Sao_Paulo timezone
- **ID Coercion** (17-03): Use z.coerce.number() for IDs that may arrive as strings from N8N
- **Comprehensive Schema Coverage** (17-03): Created 12 validation schemas covering all 11 N8N tools before implementing endpoints

### Open Blockers

None

### Tech Debt (Tracked)

- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15
- Missing 15-04-SUMMARY.md (phase 15 page integration)

---

## Session Continuity

**Last session:** 2026-01-24
**Stopped at:** Completed 17-03-PLAN.md
**Resume file:** None

**Next action:** Continue with 17-04-PLAN.md (Service layer extraction) to complete Phase 17 Wave 1

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-24 — Completed 17-03-PLAN.md (Agent API validation schemas)*
