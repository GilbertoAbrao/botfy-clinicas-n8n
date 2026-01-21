# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-21
**Status:** v1.2 In Progress — Ready to plan
**Current Milestone:** v1.2 Agenda List View + Pre-Checkin Management

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-21)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Agenda list view and pre-checkin management UI

---

## Current Position

**Milestone:** v1.2 Agenda List View + Pre-Checkin Management
**Phase:** 13 of 16 (Agenda List View)
**Plan:** 13-02 of 5 (List View UI)
**Status:** In Progress

**Last activity:** 2026-01-21 — Completed 13-02-PLAN.md

**Progress:** ██░░░░░░░░░░░░░░░░░░ 10% (2/20 plans)

---

## v1.2 Milestone Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 13 | Agenda List View | ALIST-01 to ALIST-12 | ◐ In Progress (2/5 plans) |
| 14 | Pre-Checkin Dashboard | PCHK-01 to PCHK-13 | ○ Pending |
| 15 | Procedure Instructions | INST-01 to INST-09 | ○ Pending |
| 16 | Document Management | DOCS-01 to DOCS-12 | ○ Pending |

**Total:** 4 phases, 46 requirements

---

## Milestone Summary

**v1.1 Anti No-Show Intelligence (Shipped 2026-01-21)**

| Phase | Status | Plans |
|-------|--------|-------|
| 9. N8N Anti No-Show Fix | Complete | 1/1 |
| 10. Config Lembretes | Complete | 3/3 |
| 11. Lembretes Enviados | Complete | 3/3 |
| 12. Analytics Risco | Complete | 2/2 |

**Stats:**
- 4 phases, 9 plans, 18 requirements
- 56 files, 8,953 lines added (26,658 total TypeScript)
- 1 day (2026-01-20 → 2026-01-21)

**v1.0 MVP (Shipped 2026-01-17)**

| Phase | Status | Plans |
|-------|--------|-------|
| 1. Secure Foundation | Complete | 5/5 |
| 2. Alert Dashboard | Complete | 4/4 |
| 3. Patient Management | Complete | 4/4 |
| 4. Calendar & Scheduling | Complete | 5/5 |
| 5. Conversation Monitoring | Complete | 3/3 |
| 6. One-Click Interventions | Complete | 1/1 |
| 7. System Configuration | Complete | 4/4 |
| 8. Analytics & Smart Features | Complete | 5/5 |

**Stats:**
- 8 phases, 32 plans, 79 requirements
- 244 files, 21,654 lines TypeScript
- 3 days (2026-01-15 → 2026-01-17)

---

## Archives

**v1.1 archives (created 2026-01-21):**
- `.planning/milestones/v1.1-ROADMAP.md` — Full phase details
- `.planning/milestones/v1.1-REQUIREMENTS.md` — All 18 requirements with status
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md` — Verification report
- `.planning/MILESTONES.md` — Summary entry

**v1.0 archives (created 2026-01-17):**
- `.planning/milestones/v1.0-ROADMAP.md` — Full phase details
- `.planning/milestones/v1.0-REQUIREMENTS.md` — All 79 requirements with status
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md` — Verification report
- `.planning/MILESTONES.md` — Summary entry

---

## Next Steps

1. **Continue Phase 13** — Execute plan 13-03 (Filters & Actions)
2. **Continue Phase 13** — Execute plan 13-04 (Mobile Card Layout)
3. **Complete Phase 13** — Execute plan 13-05 (Integration)

---

## Open Blockers

None

---

## Tech Debt (Tracked)

- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10

---

## Accumulated Decisions

| Phase | Decision | Impact |
|-------|----------|--------|
| 13-01 | Use @tanstack/react-table for headless table logic | Integrates with shadcn/ui Table components |
| 13-01 | Default 50 appointments per page (ALIST-11) | Set in validation schema defaults |
| 13-01 | Provider filter as comma-separated IDs | Enables multi-select UI without complex query params |
| 13-01 | Search filter applied client-side | Trade-off: acceptable for 50 items/page, avoids RPC complexity |
| 13-01 | Status stored lowercase in DB | Matches existing appointments table convention |
| 13-02 | Column definitions in separate file | Improves reusability and testability |
| 13-02 | Action buttons use stopPropagation | Prevents row click when clicking actions |
| 13-02 | Desktop-only table (hidden md:block) | Mobile will use separate card layout |
| 13-02 | Badge variants mapped by status | Consistent color coding across UI |

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-21 — Completed 13-02-PLAN.md*
