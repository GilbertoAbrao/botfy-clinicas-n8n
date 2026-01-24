# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-24
**Status:** v2.0 In Progress — Defining requirements
**Current Milestone:** v2.0 Agent API Migration

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-24)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Migrating N8N agent tools to Next.js APIs + MCP Server

---

## Current Position

**Milestone:** v2.0 Agent API Migration
**Phase:** Not started (defining requirements)
**Plan:** —
**Status:** Defining requirements

**Last activity:** 2026-01-24 — Milestone v2.0 started

**Progress:** ░░░░░░░░░░░░░░░░░░░░ 0%

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

---

## Shipped Milestones

**v1.2 Agenda List View + Pre-Checkin Management (Shipped 2026-01-21)**
- 4 phases, 18 plans, 46 requirements
- 70+ files, 9,681 lines added

**v1.1 Anti No-Show Intelligence (Shipped 2026-01-21)**
- 4 phases, 9 plans, 18 requirements
- 56 files, 8,953 lines added

**v1.0 MVP (Shipped 2026-01-17)**
- 8 phases, 32 plans, 79 requirements
- 244 files, 21,654 lines TypeScript

---

## Archives

See `.planning/MILESTONES.md` for full milestone history.

---

## Open Blockers

None

---

## Tech Debt (Tracked)

- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15
- Missing 15-04-SUMMARY.md (phase 15 page integration)

---

## Accumulated Decisions

Key patterns established in previous milestones:
- TanStack Table for list views with shadcn/ui integration
- URL-based filter state for shareable/bookmarkable links
- Floating bulk action bars for multi-select operations
- 300ms debounce for search inputs
- Client-side filtering for Supabase nested field limitations
- Supabase admin client for N8N tables (bypass RLS)

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-24 — v2.0 milestone started*
