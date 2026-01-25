# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-25
**Status:** Phase 24 complete
**Current Milestone:** v2.1 N8N Agent HTTP Tools Migration

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-25)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Phase 24 - Write Tools Migration (complete)

---

## Current Position

**Milestone:** v2.1 N8N Agent HTTP Tools Migration
**Phase:** Phase 24 of 26 (Write Tools Migration) ✓ COMPLETE
**Plan:** 4 of 4 in current phase
**Status:** Ready for Phase 25

**Last activity:** 2026-01-25 — Phase 24 complete (4 write tools migrated)

**Progress v2.1:** ████████████░░░░░░░░ 75% (9/12 plans)

---

## Shipped Milestones

**v2.0 Agent API Migration (Shipped 2026-01-25)**
- 6 phases (17-22), 24 plans
- 11 Agent APIs for N8N AI Agent consumption
- MCP Server for Claude Desktop integration
- Archive: `.planning/milestones/v2.0-ROADMAP.md`

**v1.2 Agenda List View + Pre-Checkin (Shipped 2026-01-21)**
- 4 phases (13-16), 18 plans
- Archive: `.planning/milestones/v1.2-ROADMAP.md`

**v1.1 Anti No-Show Intelligence (Shipped 2026-01-21)**
- 4 phases (9-12), 9 plans
- Archive: `.planning/milestones/v1.1-ROADMAP.md`

**v1.0 MVP (Shipped 2026-01-17)**
- 8 phases (1-8), 32 plans
- Archive: `.planning/milestones/v1.0-ROADMAP.md`

---

## Performance Metrics

**All Milestones:**
- Total plans completed: 87
- Total phases completed: 22
- Total lines of code: 42,505 TypeScript

---

## Accumulated Context

### Decisions (v2.1)

- **Direct MCP execution**: Orchestrator executes N8N MCP operations directly (subagents lack MCP access)
- **Remove+Add pattern**: Migrate toolWorkflow→toolHttpRequest via remove old node + add new node (updateNode unreliable for type changes)
- **Credential name**: `Botfy Agent API` httpHeaderAuth credential for Bearer token auth

### Open Blockers

None

### Tech Debt (Tracked)

- 3 N8N sub-workflows not yet exported to workflows-backup/ (will be addressed in Phase 26)
- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15

---

## Session Continuity

**Last session:** 2026-01-25
**Stopped at:** Phase 24 complete
**Resume file:** None

**Next action:** `/gsd:plan-phase 25` or `/gsd:execute-phase 25`

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-25 — Phase 24 Write Tools Migration complete*
