# Requirements: Botfy ClinicOps v1.1

**Defined:** 2026-01-20
**Milestone:** v1.1 Anti No-Show Intelligence
**Core Value:** Dashboard de alertas "at glance" — v1.1 extends with no-show risk visibility

## v1.1 Requirements

Requirements for v1.1 release. Each maps to roadmap phases.

### N8N Workflow

- [x] **N8N-01**: N8N Anti No-Show workflow saves `risco_noshow` score to `lembretes_enviados` table
- [x] **N8N-02**: N8N Anti No-Show workflow saves `mensagem_enviada` content to `lembretes_enviados` table

### Config Lembretes

- [ ] **CONF-01**: User can view list of all reminder configurations
- [ ] **CONF-02**: User can create new reminder configuration with type (48h/24h/2h), message template
- [ ] **CONF-03**: User can edit existing reminder configuration
- [ ] **CONF-04**: User can delete reminder configuration
- [ ] **CONF-05**: User can activate/deactivate reminder configuration without deleting

### Lembretes Enviados

- [ ] **HIST-01**: User can view paginated list of sent reminders with status
- [ ] **HIST-02**: User can filter reminders by date range
- [ ] **HIST-03**: User can filter reminders by patient
- [ ] **HIST-04**: User can filter reminders by status (enviado/pendente/falhou)
- [ ] **HIST-05**: Reminder list displays `risco_noshow` score column
- [ ] **HIST-06**: User can click reminder to view full details

### Analytics Risco No-Show

- [ ] **ANLT-01**: Dashboard displays risk score distribution chart (how patients are scored)
- [ ] **ANLT-02**: Dashboard displays predicted vs actual correlation chart
- [ ] **ANLT-03**: Dashboard identifies no-show patterns by day of week
- [ ] **ANLT-04**: Dashboard identifies no-show patterns by time of day
- [ ] **ANLT-05**: Dashboard identifies no-show patterns by service type

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Analytics

- **ANLT-06**: Export analytics data to CSV
- **ANLT-07**: Custom date range for analytics
- **ANLT-08**: Compare periods (this week vs last week)

### Config Lembretes Advanced

- **CONF-06**: Schedule-based activation (e.g., disable weekends)
- **CONF-07**: Per-service reminder configuration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| ML-based prediction model | v1.1 uses existing N8N heuristics, ML requires more data collection |
| Automated interventions | Risk score is informational; human decides action |
| WhatsApp message editing | Console is read-only for messages; N8N handles sending |
| Real-time risk alerts | Risk is calculated at reminder time, not continuously |
| Batch reminder operations | Complexity not justified for v1.1 scope |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| N8N-01 | Phase 9 | ✓ Complete |
| N8N-02 | Phase 9 | ✓ Complete |
| CONF-01 | Phase 10 | Pending |
| CONF-02 | Phase 10 | Pending |
| CONF-03 | Phase 10 | Pending |
| CONF-04 | Phase 10 | Pending |
| CONF-05 | Phase 10 | Pending |
| HIST-01 | Phase 11 | Pending |
| HIST-02 | Phase 11 | Pending |
| HIST-03 | Phase 11 | Pending |
| HIST-04 | Phase 11 | Pending |
| HIST-05 | Phase 11 | Pending |
| HIST-06 | Phase 11 | Pending |
| ANLT-01 | Phase 12 | Pending |
| ANLT-02 | Phase 12 | Pending |
| ANLT-03 | Phase 12 | Pending |
| ANLT-04 | Phase 12 | Pending |
| ANLT-05 | Phase 12 | Pending |

**Coverage:**
- v1.1 requirements: 18 total
- Mapped to phases: 18 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after roadmap creation*
