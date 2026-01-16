# Requirements: Botfy ClinicOps - Console Administrativo

**Defined:** 2026-01-15
**Core Value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção: conversas travadas, pré check-ins pendentes, agendamentos não confirmados e handoffs para humanos. A equipe precisa saber rapidamente onde intervir.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Dashboard & Alerts

- [ ] **ALERT-01**: User can view real-time alert queue showing all problems requiring attention
- [ ] **ALERT-02**: User can see alert priority/urgency indicators (urgent/high/low)
- [ ] **ALERT-03**: User can filter alerts by type (conversas travadas, pré check-ins pendentes, agendamentos não confirmados, handoffs normais, handoffs por erro)
- [ ] **ALERT-04**: User can filter alerts by status (new/in-progress/resolved/dismissed)
- [ ] **ALERT-05**: User can filter alerts by date range
- [ ] **ALERT-06**: User can sort alerts by priority, date, patient, or status
- [ ] **ALERT-07**: User can update alert status (mark as in-progress, resolved, or dismissed)
- [ ] **ALERT-08**: User can click alert to see detail view with full context (patient info, appointment details, conversation history)
- [ ] **ALERT-09**: System automatically prioritizes alerts using AI/ML based on context (patient history, issue type, urgency)
- [ ] **ALERT-10**: System detects patterns in failures (recurring issues, common failure times, specific providers)
- [ ] **ALERT-11**: User can perform one-click interventions from alert view (reschedule appointment, send message, clear chat memory)
- [ ] **ALERT-12**: Alert detail view shows related appointment information
- [ ] **ALERT-13**: Alert detail view shows patient contact information
- [ ] **ALERT-14**: Alert detail view shows conversation thread that triggered alert
- [ ] **ALERT-15**: Alert detail view shows action buttons for common interventions

### Calendar & Scheduling

- [ ] **CAL-01**: User can view appointments in calendar format (day/week/month views)
- [ ] **CAL-02**: User can see all providers' schedules centrally (multi-provider support)
- [ ] **CAL-03**: User can see appointment status indicators (confirmed/tentative/no-show/cancelled/completed)
- [ ] **CAL-04**: User can see time slot availability (which slots are free vs booked)
- [ ] **CAL-05**: User can create new appointment manually
- [ ] **CAL-06**: User can edit existing appointment (change date/time/service)
- [ ] **CAL-07**: User can reschedule appointment to different time slot
- [ ] **CAL-08**: User can cancel appointment
- [ ] **CAL-09**: User can view appointment details by clicking on calendar event
- [ ] **CAL-10**: User can filter calendar by provider
- [ ] **CAL-11**: User can filter calendar by service type
- [ ] **CAL-12**: System manages waitlist for appointments
- [ ] **CAL-13**: System automatically fills cancelled appointments from waitlist
- [ ] **CAL-14**: User can add patient to waitlist for specific date/time
- [ ] **CAL-15**: Calendar syncs with N8N workflows (changes reflected in both systems)

### Patient Management

- [ ] **PAT-01**: User can search patients by name
- [ ] **PAT-02**: User can search patients by phone number
- [ ] **PAT-03**: User can search patients by CPF
- [ ] **PAT-04**: User can view patient profile with contact information
- [ ] **PAT-05**: User can view patient appointment history (past and upcoming)
- [ ] **PAT-06**: User can create new patient record
- [ ] **PAT-07**: User can edit patient contact information
- [ ] **PAT-08**: User can edit patient personal data (nome, data_nascimento, CPF, endereço)
- [ ] **PAT-09**: User can edit patient convênio information (convenio, numero_carteirinha)
- [ ] **PAT-10**: User can view patient documents (stored files)
- [ ] **PAT-11**: User can upload documents for patient
- [ ] **PAT-12**: User can delete patient documents
- [ ] **PAT-13**: Patient profile shows conversation history with clinic
- [ ] **PAT-14**: Patient profile shows no-show rate and attendance patterns

### Conversation Monitoring

- [ ] **CONV-01**: User can view WhatsApp conversation thread for any patient
- [ ] **CONV-02**: User can see message status indicators (sent/delivered/read/failed)
- [ ] **CONV-03**: User can see which messages were sent by AI vs human
- [ ] **CONV-04**: Conversations are linked to patient records
- [ ] **CONV-05**: User can access conversation from alert detail view
- [ ] **CONV-06**: User can access conversation from patient profile
- [ ] **CONV-07**: User can clear chat memory (n8n_chat_histories) to resolve AI loops
- [ ] **CONV-08**: User can see conversation status (I.A, Humano, Finalizado)
- [ ] **CONV-09**: Conversation viewer shows timestamp for each message
- [ ] **CONV-10**: Conversation viewer scrolls to most recent messages first

### System Configuration

- [ ] **CONF-01**: User can configure business hours (days of week, opening/closing times)
- [ ] **CONF-02**: User can configure lunch break hours
- [ ] **CONF-03**: User can view list of services offered
- [ ] **CONF-04**: User can create new service (nome, duração, preço, ativo/inativo)
- [ ] **CONF-05**: User can edit existing service
- [ ] **CONF-06**: User can activate/deactivate service
- [ ] **CONF-07**: User can delete service
- [ ] **CONF-08**: User can configure antecedência mínima for appointments
- [ ] **CONF-09**: User can view list of system users
- [ ] **CONF-10**: User can create new user account (email, senha, role)
- [ ] **CONF-11**: User can edit user account (email, role)
- [ ] **CONF-12**: User can deactivate user account
- [ ] **CONF-13**: User can assign roles (Admin, Atendente) to users
- [ ] **CONF-14**: User can configure notification preferences

### Authentication & Security

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User can log out
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: System enforces role-based access control (Admin vs Atendente permissions)
- [ ] **AUTH-06**: System logs all PHI access for HIPAA compliance (6-year retention)
- [ ] **AUTH-07**: System encrypts all patient data at rest
- [ ] **AUTH-08**: System uses secure authentication (HTTPS, secure cookies)
- [ ] **AUTH-09**: Admin can view audit logs (who accessed what, when)
- [ ] **AUTH-10**: System automatically logs out inactive users after timeout
- [ ] **AUTH-11**: Atendente role can view and update alerts, patients, appointments
- [ ] **AUTH-12**: Admin role has full access to all features including user management and audit logs

### Infrastructure & UX

- [ ] **UX-01**: Interface is mobile-responsive (works on phones and tablets)
- [ ] **UX-02**: Interface is touch-friendly for mobile devices
- [ ] **UX-03**: Interface follows Botfy brand identity (colors and logo from botfy.ai)
- [ ] **UX-04**: System displays clear error messages when operations fail
- [ ] **UX-05**: System provides loading indicators for async operations
- [ ] **UX-06**: System provides success confirmations for important actions
- [ ] **UX-07**: System handles network errors gracefully with retry options
- [ ] **UX-08**: Dashboard loads key metrics at glance (agendamentos hoje, taxa de confirmação, conversas ativas)
- [ ] **UX-09**: System shows status of external services (Evolution API, N8N, Supabase)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Calendar & Scheduling (Advanced)

- **CAL-V2-01**: User can drag-and-drop appointments to reschedule visually
- **CAL-V2-02**: System suggests optimal appointment times using AI (based on provider patterns, patient history)
- **CAL-V2-03**: User can set recurring appointments (weekly therapy, monthly checkups)

### Conversation Monitoring (Advanced)

- **CONV-V2-01**: User can take over AI conversation in real-time (seamless human handoff)
- **CONV-V2-02**: User can rate AI conversation quality to improve over time
- **CONV-V2-03**: System sends in-app notifications for new conversations requiring attention

### Dashboard & Alerts (Advanced)

- **ALERT-V2-01**: User can create custom alert rules based on clinic workflow
- **ALERT-V2-02**: User can perform bulk actions on multiple alerts simultaneously
- **ALERT-V2-03**: System auto-escalates unhandled alerts after configurable time threshold

### System Configuration (Advanced)

- **CONF-V2-01**: User can customize automated message templates used by AI
- **CONF-V2-02**: User can configure advanced scheduling rules (buffer times, specific provider constraints)
- **CONF-V2-03**: System integrates with external EHR systems via API

### Analytics

- **ANLT-01**: User can view analytics dashboard with KPI metrics
- **ANLT-02**: User can see booking success rate over time
- **ANLT-03**: User can see no-show rate by patient, time, provider
- **ANLT-04**: User can see alert resolution time metrics
- **ANLT-05**: User can export data to CSV for external analysis
- **ANLT-06**: System predicts no-show risk for upcoming appointments using ML

### Security (Advanced)

- **AUTH-V2-01**: User can enable 2FA/MFA for account
- **AUTH-V2-02**: System supports OAuth login (Google, Microsoft)
- **AUTH-V2-03**: Admin can configure granular permissions beyond Admin/Atendente roles

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full EHR functionality | Massive scope creep - EHR is different product category requiring HIPAA certification, clinical workflows, billing integration. Competitors charge $29-99/month for this. Focus on operations console, integrate with existing EHR instead. |
| Direct WhatsApp messaging from console | Messages should flow through N8N/Evolution API workflows for consistency. Console is for monitoring and intervention, not direct communication. |
| Multi-location/multi-clinic support | System is single-tenant for v1. Multi-tenant architecture requires significant complexity. Defer until product-market fit is established. |
| Advanced analytics/BI tools | Users can export to CSV for advanced analysis in Excel/Tableau. Don't build business intelligence product. Focus on operational metrics only. |
| SMS/email/Telegram channels | System is WhatsApp-focused (matching existing Botfy stack). Multi-channel is integration nightmare with different APIs, compliance requirements. |
| Payment/billing system | Out of scope for operations console. Financial management is separate concern. |
| Extreme scheduling flexibility | Creates scheduler complexity with conflicting rules. Use template-based scheduling with limited customization (80/20 rule). |
| Real-time everything | Most alerts don't need <1sec updates. Smart polling: critical alerts real-time, routine alerts 5min intervals. Avoids battery drain and server load. |
| Complex workflow automation | Users overestimate ability to design good automation. Keep to simple trigger-action rules with pre-built templates. Avoid "if X then Y unless Z" complexity. |
| Video appointments | Not core to operations console. High complexity for streaming infrastructure. |
| Mobile native app | Web-first with mobile-responsive design. Native apps are separate development effort. |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ALERT-01 | Phase 2 | Complete |
| ALERT-02 | Phase 2 | Complete |
| ALERT-03 | Phase 2 | Complete |
| ALERT-04 | Phase 2 | Complete |
| ALERT-05 | Phase 2 | Complete |
| ALERT-06 | Phase 2 | Complete |
| ALERT-07 | Phase 2 | Complete |
| ALERT-08 | Phase 2 | Complete |
| ALERT-09 | Phase 8 | Not Started |
| ALERT-10 | Phase 8 | Not Started |
| ALERT-11 | Phase 6 | Not Started |
| ALERT-12 | Phase 2 | Complete |
| ALERT-13 | Phase 2 | Complete |
| ALERT-14 | Phase 2 | Complete |
| ALERT-15 | Phase 2 | Complete |
| CAL-01 | Phase 4 | Not Started |
| CAL-02 | Phase 4 | Not Started |
| CAL-03 | Phase 4 | Not Started |
| CAL-04 | Phase 4 | Not Started |
| CAL-05 | Phase 4 | Not Started |
| CAL-06 | Phase 4 | Not Started |
| CAL-07 | Phase 4 | Not Started |
| CAL-08 | Phase 4 | Not Started |
| CAL-09 | Phase 4 | Not Started |
| CAL-10 | Phase 4 | Not Started |
| CAL-11 | Phase 4 | Not Started |
| CAL-12 | Phase 4 | Not Started |
| CAL-13 | Phase 4 | Not Started |
| CAL-14 | Phase 4 | Not Started |
| CAL-15 | Phase 4 | Not Started |
| PAT-01 | Phase 3 | Complete |
| PAT-02 | Phase 3 | Complete |
| PAT-03 | Phase 3 | Complete |
| PAT-04 | Phase 3 | Complete |
| PAT-05 | Phase 3 | Complete |
| PAT-06 | Phase 3 | Complete |
| PAT-07 | Phase 3 | Complete |
| PAT-08 | Phase 3 | Complete |
| PAT-09 | Phase 3 | Complete |
| PAT-10 | Phase 3 | Complete |
| PAT-11 | Phase 3 | Complete |
| PAT-12 | Phase 3 | Complete |
| PAT-13 | Phase 3 | Complete |
| PAT-14 | Phase 3 | Complete |
| CONV-01 | Phase 5 | Not Started |
| CONV-02 | Phase 5 | Not Started |
| CONV-03 | Phase 5 | Not Started |
| CONV-04 | Phase 5 | Not Started |
| CONV-05 | Phase 5 | Not Started |
| CONV-06 | Phase 5 | Not Started |
| CONV-07 | Phase 5 | Not Started |
| CONV-08 | Phase 5 | Not Started |
| CONV-09 | Phase 5 | Not Started |
| CONV-10 | Phase 5 | Not Started |
| CONF-01 | Phase 7 | Not Started |
| CONF-02 | Phase 7 | Not Started |
| CONF-03 | Phase 7 | Not Started |
| CONF-04 | Phase 7 | Not Started |
| CONF-05 | Phase 7 | Not Started |
| CONF-06 | Phase 7 | Not Started |
| CONF-07 | Phase 7 | Not Started |
| CONF-08 | Phase 7 | Not Started |
| CONF-09 | Phase 7 | Not Started |
| CONF-10 | Phase 7 | Not Started |
| CONF-11 | Phase 7 | Not Started |
| CONF-12 | Phase 7 | Not Started |
| CONF-13 | Phase 7 | Not Started |
| CONF-14 | Phase 7 | Not Started |
| AUTH-01 | Phase 1 | Not Started |
| AUTH-02 | Phase 1 | Not Started |
| AUTH-03 | Phase 1 | Not Started |
| AUTH-04 | Phase 1 | Not Started |
| AUTH-05 | Phase 1 | Not Started |
| AUTH-06 | Phase 1 | Not Started |
| AUTH-07 | Phase 1 | Not Started |
| AUTH-08 | Phase 1 | Not Started |
| AUTH-09 | Phase 1 | Not Started |
| AUTH-10 | Phase 1 | Not Started |
| AUTH-11 | Phase 1 | Not Started |
| AUTH-12 | Phase 1 | Not Started |
| UX-01 | Phase 2 | Complete |
| UX-02 | Phase 2 | Complete |
| UX-03 | Phase 1 | Not Started |
| UX-04 | Phase 1 | Not Started |
| UX-05 | Phase 1 | Not Started |
| UX-06 | Phase 1 | Not Started |
| UX-07 | Phase 1 | Not Started |
| UX-08 | Phase 2 | Complete |
| UX-09 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 79 total
- Mapped to phases: 79 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-15*
*Last updated: 2026-01-15 after initial definition*
