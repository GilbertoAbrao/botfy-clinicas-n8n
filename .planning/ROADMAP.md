# Roadmap: Botfy ClinicOps Console Administrativo

## Milestones

- ✅ **v1.0 MVP** - Phases 1-8 (shipped 2026-01-17)
- 🚧 **v1.1 Anti No-Show Intelligence** - Phases 9-12 (in progress)

## Overview

v1.1 extends the console with no-show risk visibility. The N8N Anti No-Show workflow will be fixed to persist risk scores, and the console will provide management UI for reminder configurations, sent reminder history, and risk analytics.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (9.1, 9.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-17</summary>

### Phase 1: Secure Foundation
**Goal**: Authentication, authorization, database security, audit logging
**Plans**: 5/5 complete

### Phase 2: Alert Dashboard
**Goal**: Real-time alert queue with filtering, sorting, priority
**Plans**: 4/4 complete

### Phase 3: Patient Management
**Goal**: Patient search, profiles, CRUD, document upload
**Plans**: 4/4 complete

### Phase 4: Calendar & Scheduling
**Goal**: Calendar views, appointment CRUD, waitlist, N8N sync
**Plans**: 5/5 complete

### Phase 5: Conversation Monitoring
**Goal**: WhatsApp thread viewer, AI/human indicators
**Plans**: 3/3 complete

### Phase 6: One-Click Interventions
**Goal**: Reschedule, send message from alert detail
**Plans**: 1/1 complete

### Phase 7: System Configuration
**Goal**: Services, users, business hours, notifications
**Plans**: 4/4 complete

### Phase 8: Analytics & Smart Features
**Goal**: Priority scoring, pattern detection, no-show risk, CSV export
**Plans**: 5/5 complete

**Stats:** 8 phases, 32 plans, 79 requirements completed

</details>

### 🚧 v1.1 Anti No-Show Intelligence (In Progress)

**Milestone Goal:** Complete no-show risk management with N8N fix + full console UI

- [ ] **Phase 9: N8N Anti No-Show Fix** - Fix workflow to save risk score and message
- [ ] **Phase 10: Config Lembretes** - CRUD for reminder configurations
- [ ] **Phase 11: Lembretes Enviados** - History panel with filtering
- [ ] **Phase 12: Analytics Risco** - Risk analytics dashboard

## Phase Details

### Phase 9: N8N Anti No-Show Fix
**Goal**: Fix N8N workflow to persist risk data to lembretes_enviados table
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: N8N-01, N8N-02
**Success Criteria** (what must be TRUE):
  1. N8N workflow saves `risco_noshow` integer score to `lembretes_enviados` on reminder send
  2. N8N workflow saves `mensagem_enviada` text content to `lembretes_enviados` on reminder send
**Research**: Unlikely (modifying existing N8N workflow INSERT)
**Plans**: TBD

Plans:
- [ ] 09-01: Fix N8N INSERT to include risco_noshow and mensagem_enviada

### Phase 10: Config Lembretes
**Goal**: Full CRUD interface for reminder configurations
**Depends on**: Phase 9 (data must be saved correctly before managing configs)
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04, CONF-05
**Success Criteria** (what must be TRUE):
  1. Admin can view all reminder configs in a table
  2. Admin can create new reminder with type (48h/24h/2h) and message template
  3. Admin can edit existing reminder config
  4. Admin can delete reminder config
  5. Admin can toggle active/inactive status without deleting
**Research**: Unlikely (standard CRUD patterns from v1.0)
**Plans**: TBD

Plans:
- [ ] 10-01: Config lembretes list page and table
- [ ] 10-02: Create/edit reminder config form
- [ ] 10-03: Delete and toggle active/inactive actions

### Phase 11: Lembretes Enviados
**Goal**: Read-only history panel showing sent reminders with filtering
**Depends on**: Phase 9 (risk score must be saved to display)
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06
**Success Criteria** (what must be TRUE):
  1. User can view paginated list of sent reminders with status
  2. User can filter reminders by date range
  3. User can filter reminders by patient
  4. User can filter reminders by status (enviado/pendente/falhou)
  5. User sees `risco_noshow` score column in reminder list
  6. User can click reminder to view full details in modal/sheet
**Research**: Unlikely (standard table patterns with @tanstack/react-table)
**Plans**: TBD

Plans:
- [ ] 11-01: Lembretes enviados list page with table
- [ ] 11-02: Date, patient, and status filters
- [ ] 11-03: Reminder detail view modal

### Phase 12: Analytics Risco No-Show
**Goal**: Analytics dashboard visualizing no-show risk data and patterns
**Depends on**: Phase 9, Phase 11 (needs historical risk data)
**Requirements**: ANLT-01, ANLT-02, ANLT-03, ANLT-04, ANLT-05
**Success Criteria** (what must be TRUE):
  1. Dashboard displays risk score distribution chart (how patients are scored)
  2. Dashboard displays predicted vs actual correlation chart
  3. Dashboard identifies no-show patterns by day of week
  4. Dashboard identifies no-show patterns by time of day
  5. Dashboard identifies no-show patterns by service type
**Research**: Unlikely (using existing recharts patterns from v1.0)
**Plans**: TBD

Plans:
- [ ] 12-01: Risk score distribution and correlation charts
- [ ] 12-02: No-show pattern analysis by day/time/service

## Progress

**Execution Order:** 9 → 10 → 11 → 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-8 | v1.0 | 32/32 | Complete | 2026-01-17 |
| 9. N8N Anti No-Show Fix | v1.1 | 0/1 | Not started | - |
| 10. Config Lembretes | v1.1 | 0/3 | Not started | - |
| 11. Lembretes Enviados | v1.1 | 0/3 | Not started | - |
| 12. Analytics Risco | v1.1 | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-20*
