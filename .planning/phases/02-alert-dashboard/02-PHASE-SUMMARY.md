# Phase 2: Alert Dashboard - Planning Summary

**Phase Goal:** Deliver core value prop — real-time alert queue showing all problems requiring human intervention.

**Status:** Planning Complete - Ready for Execution
**Plans Created:** 4 plans across 3 waves
**Requirements Covered:** 16 (ALERT-01 through ALERT-08, ALERT-12 through ALERT-15, UX-01, UX-02, UX-08, UX-09)

---

## Wave Structure

### Wave 1: Foundation (1 plan)
**Plan 02-01: Database Schema & Core Models**
- Create Alert, Patient, Appointment, Conversation models in Prisma
- Establish relations and indexes
- Apply Row Level Security policies
- Seed test data (3 patients, 5 appointments, 3 conversations, 8 alerts)

**Duration Estimate:** ~1 hour
**Dependencies:** Phase 1 complete
**Blockers:** None

---

### Wave 2: UI Components (2 plans - parallel execution)
**Plan 02-02: Alert List UI & Filtering**
- Build alert queue interface with table/card views
- Implement filters (type, status, date range)
- Implement sorting (priority, date, patient, status)
- Mobile-responsive design with touch-friendly UI

**Plan 02-03: Alert Detail View**
- Create alert detail page showing full context
- Display patient contact, appointment details, conversation thread
- Status update functionality (new → in-progress → resolved/dismissed)
- Action button placeholders for Phase 6 interventions

**Duration Estimate:** ~2-3 hours (parallel)
**Dependencies:** Plan 02-01 complete
**Blockers:** None (plans can run in parallel)

---

### Wave 3: Real-time & Metrics (1 plan)
**Plan 02-04: Real-time Updates & Metrics Dashboard**
- Supabase real-time subscriptions for alerts (with memory leak prevention)
- Key metrics dashboard (agendamentos hoje, taxa de confirmação, conversas ativas)
- Service status indicators (Evolution API, N8N, Supabase)
- Auto-refresh and connection status monitoring

**Duration Estimate:** ~1-2 hours
**Dependencies:** Plans 02-01, 02-02, 02-03 complete
**Blockers:** None

---

## Requirements Coverage

| Requirement | Description | Plan |
|-------------|-------------|------|
| ALERT-01 | View real-time alert queue | 02-02, 02-04 |
| ALERT-02 | Priority/urgency indicators | 02-02 |
| ALERT-03 | Filter by type | 02-02 |
| ALERT-04 | Filter by status | 02-02 |
| ALERT-05 | Filter by date range | 02-02 |
| ALERT-06 | Sort by priority/date/patient/status | 02-02 |
| ALERT-07 | Update alert status | 02-03 |
| ALERT-08 | Click alert to see detail view | 02-03 |
| ALERT-12 | Alert detail shows appointment info | 02-03 |
| ALERT-13 | Alert detail shows patient contact | 02-03 |
| ALERT-14 | Alert detail shows conversation thread | 02-03 |
| ALERT-15 | Alert detail shows action buttons | 02-03 |
| UX-01 | Mobile-responsive interface | 02-02, 02-03 |
| UX-02 | Touch-friendly UI | 02-02, 02-03 |
| UX-08 | Key metrics at glance | 02-04 |
| UX-09 | Service status indicators | 02-04 |

**Total:** 16 requirements
**Plans:** 4 plans
**Waves:** 3 waves

---

## Key Architectural Decisions

1. **Vertical Slice Architecture:**
   - Each plan delivers end-to-end functionality (database → API → UI)
   - Plans 02-02 and 02-03 can execute in parallel (both depend only on 02-01)

2. **Real-time Strategy:**
   - Supabase Realtime for alert updates (not polling)
   - Mandatory cleanup patterns to prevent memory leaks (Phase 1 pitfall)
   - Connection status indicators for transparency

3. **Mobile-First Design:**
   - Card layout for mobile (replaces table)
   - Touch-friendly tap targets (44px minimum)
   - Full-page detail view (not modal on mobile)

4. **Data Model Relations:**
   - Alert → Patient (optional, many-to-one)
   - Alert → Appointment (optional, many-to-one)
   - Alert → Conversation (optional, many-to-one)
   - Flexible linking: alerts can reference any combination of patient/appointment/conversation

5. **Deferred to Later Phases:**
   - One-click interventions (Phase 6)
   - Full conversation viewer with pagination (Phase 5)
   - ML-powered alert prioritization (Phase 8)

---

## Database Schema Overview

**New Tables:**
- `alerts`: Alert tracking with type, priority, status, relations
- `patients`: Patient records with contact info (PHI - RLS required)
- `appointments`: Appointment scheduling with status tracking
- `conversations`: WhatsApp conversation threads (PHI - RLS required)

**New Enums:**
- `AlertType`: conversas_travadas, pre_checkins_pendentes, agendamentos_nao_confirmados, handoff_normal, handoff_erro
- `AlertPriority`: urgent, high, low
- `AlertStatus`: new, in_progress, resolved, dismissed
- `AppointmentStatus`: confirmed, tentative, no_show, cancelled, completed
- `ConversationStatus`: IA, HUMANO, FINALIZADO

**Indexes:**
- Alert: status, priority, createdAt, patientId
- Patient: telefone, cpf, nome
- Appointment: patientId, scheduledAt, status
- Conversation: patientId, lastMessageAt, status

---

## Success Criteria (Phase 2 Complete)

1. ✓ User opens dashboard and sees 5 unresolved alerts sorted by priority
2. ✓ User filters alerts to show only "conversas travadas" and sees 2 matching alerts
3. ✓ User clicks alert and sees patient contact info, appointment details, conversation history
4. ✓ User marks alert as "in-progress" and alert moves to appropriate section
5. ✓ New alert arrives via webhook and appears in queue within 5 seconds without refresh

---

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Supabase real-time memory leaks | High | Mandatory cleanup in useEffect (Plan 02-04) | ✅ Addressed |
| Performance with large alert history | Medium | Retention policy (30 days active, archive after 7 days resolved) | 📝 Documented |
| RLS performance at scale | Medium | Simple auth checks (user role only, no complex queries) | ✅ Addressed |
| Mobile usability issues | High | Touch-friendly design (44px targets), card layout | ✅ Addressed |

---

## Next Actions

**To Execute Phase 2:**
```bash
# Option 1: Execute entire phase (all 4 plans in sequence)
/gsd:execute-phase 2

# Option 2: Execute plans individually (manual wave management)
/gsd:execute-plan 02-01  # Wave 1
/gsd:execute-plan 02-02  # Wave 2 (parallel with 02-03)
/gsd:execute-plan 02-03  # Wave 2
/gsd:execute-plan 02-04  # Wave 3
```

**After Execution:**
1. Apply RLS policies via Supabase SQL Editor (from 02-01)
2. Run seed script: `npm run seed:phase2`
3. Test E2E: Open two browser windows, verify real-time sync
4. User acceptance testing: Have atendente test alert workflow
5. Run `/gsd:verify-work 2` for structured UAT

---

## Files Created

**Planning Artifacts:**
- `.planning/phases/02-alert-dashboard/02-01-PLAN.md`
- `.planning/phases/02-alert-dashboard/02-02-PLAN.md`
- `.planning/phases/02-alert-dashboard/02-03-PLAN.md`
- `.planning/phases/02-alert-dashboard/02-04-PLAN.md`
- `.planning/phases/02-alert-dashboard/02-PHASE-SUMMARY.md` (this file)

**Implementation Files (to be created during execution):**
- `prisma/schema.prisma` (updated)
- `prisma/migrations/{timestamp}_add_alert_system/migration.sql`
- `prisma/rls-policies-phase2.sql`
- `prisma/seed-phase2.ts`
- `src/lib/api/alerts.ts`
- `src/lib/api/metrics.ts`
- `src/lib/realtime/alerts.ts`
- `src/lib/realtime/cleanup.ts`
- `src/app/dashboard/alerts/page.tsx`
- `src/app/dashboard/alerts/[id]/page.tsx`
- `src/components/alerts/alert-list.tsx`
- `src/components/alerts/alert-filters.tsx`
- `src/components/alerts/alert-detail.tsx`
- `src/components/alerts/alert-status-updater.tsx`
- `src/components/conversations/conversation-thread.tsx`
- `src/components/dashboard/metrics-dashboard.tsx`
- `src/components/dashboard/service-status.tsx`

**Total Implementation Files:** ~17 files

---

**Planning completed:** 2026-01-16
**Next step:** Execute Phase 2 plans
**Estimated completion:** ~4-6 hours total (with parallel execution)
