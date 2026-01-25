# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-25
**Status:** Phase 26 in progress (plan 1 of 2 complete - partial validation)
**Current Milestone:** v2.1 N8N Agent HTTP Tools Migration

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-25)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Phase 25 complete - Ready for Phase 26

---

## Current Position

**Milestone:** v2.1 N8N Agent HTTP Tools Migration
**Phase:** Phase 26 of 26 (Validation & Archive)
**Plan:** 1 of 2 in current phase (26-01 complete - partial validation)
**Status:** In progress - validation blockers identified

**Last activity:** 2026-01-25 — Completed 26-01-PLAN.md (partial validation + bug fix)

**Progress v2.1:** █████████████████░░░ 96% (11.5/12 plans)

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
- Total plans completed: 89.5 (26-01 partial)
- Total phases completed: 25.5 (Phase 26 in progress)
- Total lines of code: ~43,000 TypeScript
- Bugs fixed: 1 (lazy OpenAI init)

---

## Accumulated Context

### Decisions (v2.1)

- **Direct MCP execution**: Orchestrator executes N8N MCP operations directly (subagents lack MCP access)
- **Remove+Add pattern**: Migrate toolWorkflow→toolHttpRequest via remove old node + add new node (updateNode unreliable for type changes)
- **Credential name**: `Botfy Agent API` httpHeaderAuth credential for Bearer token auth
- **URL-based document input**: Accept JSON with imageUrl for N8N toolHttpRequest compatibility (Phase 25-01)
- **Native fetch for URL fetching**: Use native fetch + AbortController (no external deps) (Phase 25-01)
- **Lazy OpenAI initialization**: Defer OpenAI client creation to prevent module load errors when env var missing (Phase 26-01)
- **Partial validation acceptable**: Document what's validated vs what requires follow-up when full validation blocked by dependencies (Phase 26-01)

### Open Blockers

**Phase 26 Validation (3 blockers):**
1. **Static validation pending**: N8N toolHttpRequest nodes not verified (requires orchestrator with MCP access)
2. **Agent setup pending**: `agents` table doesn't exist, cannot test authenticated API requests (requires Prisma migration + key generation)
3. **E2E test pending**: AI Agent integration not tested via WhatsApp (requires agent setup + manual test)

### Tech Debt (Tracked)

- 3 N8N sub-workflows not yet exported to workflows-backup/ (will be addressed in Phase 26-02 after full validation)
- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15
- Workflow backups outdated (most recent Jan 16, migration completed Jan 25) - need fresh export
- Module-level initialization pattern in other services may have similar issues (audit needed)

---

## Session Continuity

**Last session:** 2026-01-25
**Stopped at:** Completed 26-01-PLAN.md (partial validation with blockers)
**Resume file:** None

**Next action:**
1. Orchestrator: Complete static validation via MCP (verify N8N toolHttpRequest nodes)
2. User/Orchestrator: Set up agent authentication (run migration, generate key, configure N8N)
3. Subagent: Re-run authenticated API tests after agent setup
4. User: Perform E2E WhatsApp test
5. Then: `/gsd:execute-plan 26-02` (Archive Sub-workflows) if all validation passes

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-25 — Phase 26-01 Validation complete (partial - 3 blockers identified)*
