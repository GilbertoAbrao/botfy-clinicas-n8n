# Project State: Botfy ClinicOps - Console Administrativo

**Last Updated:** 2026-01-21
**Status:** v1.2 In Progress
**Current Milestone:** v1.2 Agenda List View + Pre-Checkin Management

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-01-21)

**Core value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção
**Current focus:** Agenda list view and pre-checkin management UI

---

## Current Position

**Milestone:** v1.2 Agenda List View + Pre-Checkin Management
**Phase:** 15 of 16 (Procedure Instructions)
**Plan:** 3 of 4
**Status:** In Progress

**Last activity:** 2026-01-21 — Completed 15-03-PLAN.md (List Page UI)

**Progress:** ██████████████░░░░░░ 70% (14/20 plans)

---

## v1.2 Milestone Summary

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 13 | Agenda List View | ALIST-01 to ALIST-12 | ● Complete (5/5 plans) |
| 14 | Pre-Checkin Dashboard | PCHK-01 to PCHK-13 | ● Complete (5/5 plans) |
| 15 | Procedure Instructions | INST-01 to INST-09 | ◐ In Progress (3/4 plans) |
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

1. **Continue Phase 15** — Plan 04 (Page Integration)
2. **Continue v1.2 Milestone** — Complete remaining plans in phases 15, 16

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
| 13-03 | Use Popover with Checkbox list for provider multi-select | shadcn/ui doesn't have native multi-select, this is the recommended pattern |
| 13-03 | 300ms debounce for search input | Balance between responsiveness and reducing API calls |
| 13-03 | Quick date presets (hoje, amanha, esta semana, este mes) | Common use cases for faster filtering |
| 13-03 | Preserve all filter params when paginating | Users expect filters to remain active when navigating pages |
| 13-03 | Reset to page 1 when changing filters or items per page | Prevents empty pages, predictable behavior |
| 13-05 | ViewToggle preserves all search params when switching views | Seamless experience, users don't lose their filters |
| 13-05 | Default view is calendar when no param specified | Maintains existing behavior, list is opt-in |
| 13-05 | WaitlistManager only shows in calendar view | Waitlist is calendar-specific feature, keeps list view focused |
| 13-05 | Status param validated against AppointmentStatus enum | Type safety prevents runtime errors in useAgendaList |
| 13-05 | Desktop/mobile responsive with CSS media queries | Table on desktop, cards on mobile for optimal UX |
| 14-01 | Client-side filtering for date range and search | Supabase nested field limitation, acceptable for 50 items/page |
| 14-01 | Overdue threshold: 12 hours before appointment | Gives staff time to intervene |
| 14-01 | Progress calculation: 0/33/66/100 based on 3 boolean fields | Simple, clear progression indicator |
| 14-02 | Completion rate color: green >= 70%, yellow >= 50%, red < 50% | Aligns with existing kpi-cards.tsx pattern |
| 14-02 | Overdue count color: green = 0, yellow <= 3, red > 3 | Escalating urgency for overdue items |
| 14-02 | Pendentes card always yellow | Pending items inherently need attention |
| 14-03 | StatusBadge uses className override for consistent colors | Works across theme variations |
| 14-03 | ProgressBar normalizes values to 0-100 range | Safety against invalid input |
| 14-03 | Filters use usePathname for route flexibility | Component reusable on different routes |
| 14-03 | 25/50/100 pagination options for pre-checkin | More granular control for smaller lists |
| 14-04 | Rate limit 4 hours between reminders, server-side enforcement | Returns 429 status for rate limit violations |
| 14-04 | Confirmation dialog before sending reminders | Per CONTEXT.md, always confirm before N8N webhook |
| 14-04 | Timeline steps dynamic based on status | Shows current workflow state, not just timestamps |
| 14-04 | N8N webhook graceful degradation | Works without webhook configured (dev-friendly) |
| 14-05 | Dashboard wrapped in Suspense | Provides loading skeleton while client component hydrates |
| 14-05 | Table and Cards both rendered (CSS visibility) | Simpler than conditional rendering, prevents layout shift |
| 14-05 | No RBAC in page | Admin layout already enforces ADMIN role |
| 15-01 | Exclude embedding column from Prisma model | pgvector not supported by Prisma, managed by N8N |
| 15-01 | Use z.enum with message param | Zod v4 API compatibility |
| 15-01 | DEACTIVATE_INSTRUCTION instead of DELETE | Soft delete pattern per INST-07 |
| 15-02 | PATCH restricted to deactivation only | Enforces soft delete per INST-07 |
| 15-02 | Duplicate titulo check scoped by servicoId | Same title allowed for different services |
| 15-02 | Content diff placeholder in audit log | Avoids large audit entries |
| 15-03 | Remove .default() from Zod instruction schema | react-hook-form zodResolver compatibility |
| 15-03 | WhatsApp preview with Brazilian sample data | Joao Silva, 15/01 as 14h, etc. for realistic preview |
| 15-03 | Character warnings at 1000/2000 chars | Visual feedback, not hard limits |

---

*State tracking started: 2026-01-15*
*Last updated: 2026-01-21 — Completed 15-03-PLAN.md (List Page UI)*
