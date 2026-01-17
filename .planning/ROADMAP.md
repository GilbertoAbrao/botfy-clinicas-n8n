# Roadmap: Botfy ClinicOps - Console Administrativo

**Created:** 2026-01-15
**Status:** Active
**Current Phase:** Phase 1 Complete - Ready for Phase 2

## Overview

8-phase roadmap delivering a healthcare operations console with alert-first design. Security and HIPAA compliance are non-negotiable foundation (Phase 1). Each subsequent phase adds vertical capability while maintaining the core value: a dashboard showing "at glance" everything requiring human intervention.

**Total v1 Requirements:** 79
**Target Release:** v1.0
**Approach:** Security-first, value-driven sequencing with dependency management

---

## Phase 1: Secure Foundation

**Goal:** Establish authentication, authorization, database security, and HIPAA audit logging foundation before building any features.

**Why First:** Recent critical CVEs (React RCE, Next.js middleware bypass) are framework-level. Building features on insecure foundation requires expensive refactoring and creates HIPAA violation risk ($100-$50k per violation).

**Requirements:**
- AUTH-01: User can sign up with email and password
- AUTH-02: User can log in with email and password
- AUTH-03: User can log out
- AUTH-04: User session persists across browser refresh
- AUTH-05: System enforces role-based access control (Admin vs Atendente permissions)
- AUTH-06: System logs all PHI access for HIPAA compliance (6-year retention)
- AUTH-07: System encrypts all patient data at rest
- AUTH-08: System uses secure authentication (HTTPS, secure cookies)
- AUTH-09: Admin can view audit logs (who accessed what, when)
- AUTH-10: System automatically logs out inactive users after timeout
- AUTH-11: Atendente role can view and update alerts, patients, appointments
- AUTH-12: Admin role has full access to all features including user management and audit logs
- UX-03: Interface follows Botfy brand identity (colors and logo from botfy.ai)
- UX-04: System displays clear error messages when operations fail
- UX-05: System provides loading indicators for async operations
- UX-06: System provides success confirmations for important actions
- UX-07: System handles network errors gracefully with retry options

**Success Criteria:**
1. ✓ User logs in with email/password and sees dashboard landing page
2. ✓ Atendente cannot access user management pages (403 error)
3. ✓ Admin views audit log showing all PHI access with timestamps
4. ✓ User session persists after browser refresh without re-login
5. ✓ Inactive user is automatically logged out after 30 minutes

**Research Needed:** NO — Standard patterns documented in Supabase Auth and Next.js docs

**Dependencies:** None (foundation phase)

**Risks:**
- CVE-2025-55182, CVE-2025-66478 (React RCE) — mitigation: upgrade React immediately
- CVE-2025-29927 (Next.js middleware bypass) — mitigation: defense-in-depth (middleware + route checks + RLS)
- RLS performance at scale — mitigation: optimize queries from day one, use IN/ANY vs subqueries

---

## Phase 2: Alert Dashboard ✅

**Status:** Complete (2026-01-16)
**Goal:** Deliver core value prop — real-time alert queue showing all problems requiring human intervention.

**Why Second:** Alert dashboard is the differentiator. Competitors are booking-first; we're operations-first. Enables staff to see problems "at glance."

**Requirements:**
- ALERT-01: User can view real-time alert queue showing all problems requiring attention
- ALERT-02: User can see alert priority/urgency indicators (urgent/high/low)
- ALERT-03: User can filter alerts by type (conversas travadas, pré check-ins pendentes, agendamentos não confirmados, handoffs normais, handoffs por erro)
- ALERT-04: User can filter alerts by status (new/in-progress/resolved/dismissed)
- ALERT-05: User can filter alerts by date range
- ALERT-06: User can sort alerts by priority, date, patient, or status
- ALERT-07: User can update alert status (mark as in-progress, resolved, or dismissed)
- ALERT-08: User can click alert to see detail view with full context (patient info, appointment details, conversation history)
- ALERT-12: Alert detail view shows related appointment information
- ALERT-13: Alert detail view shows patient contact information
- ALERT-14: Alert detail view shows conversation thread that triggered alert
- ALERT-15: Alert detail view shows action buttons for common interventions
- UX-01: Interface is mobile-responsive (works on phones and tablets)
- UX-02: Interface is touch-friendly for mobile devices
- UX-08: Dashboard loads key metrics at glance (agendamentos hoje, taxa de confirmação, conversas ativas)
- UX-09: System shows status of external services (Evolution API, N8N, Supabase)

**Success Criteria:**
1. ✓ User opens dashboard and sees 5 unresolved alerts sorted by priority
2. ✓ User filters alerts to show only "conversas travadas" and sees 2 matching alerts
3. ✓ User clicks alert and sees patient contact info, appointment details, and conversation history
4. ✓ User marks alert as "in-progress" and alert moves to appropriate section
5. ✓ New alert arrives via webhook and appears in queue within 5 seconds without refresh

**Research Needed:** NO — Standard CRUD + real-time patterns, well-documented in Supabase

**Dependencies:**
- Phase 1 (auth/authorization for role-based alert access)

**Deferred to Later:**
- ALERT-09 (AI/ML prioritization) — Phase 8
- ALERT-10 (pattern detection) — Phase 8
- ALERT-11 (one-click interventions) — Phase 6

**Risks:**
- Supabase real-time memory leaks — mitigation: mandatory cleanup in useEffect
- Performance with large alert history — mitigation: retention policy (30 days active, archive after 7 days resolved)

---

## Phase 3: Patient Management ✅

**Status:** Complete (2026-01-16)
**Goal:** Enable comprehensive patient data management with search, profiles, history, and document handling.

**Why Third:** Patient context is essential for handling alerts effectively. Table stakes for admin dashboard. Required before calendar (appointments need patient context).

**Requirements:**
- PAT-01: User can search patients by name
- PAT-02: User can search patients by phone number
- PAT-03: User can search patients by CPF
- PAT-04: User can view patient profile with contact information
- PAT-05: User can view patient appointment history (past and upcoming)
- PAT-06: User can create new patient record
- PAT-07: User can edit patient contact information
- PAT-08: User can edit patient personal data (nome, data_nascimento, CPF, endereço)
- PAT-09: User can edit patient convênio information (convenio, numero_carteirinha)
- PAT-10: User can view patient documents (stored files)
- PAT-11: User can upload documents for patient
- PAT-12: User can delete patient documents
- PAT-13: Patient profile shows conversation history with clinic
- PAT-14: Patient profile shows no-show rate and attendance patterns

**Success Criteria:**
1. ✓ User searches for "Silva" and sees 3 matching patients in <500ms
2. ✓ User views patient profile and sees contact info, appointment history, and conversation thread
3. ✓ User edits patient phone number and change saves successfully
4. ✓ User uploads PDF document for patient and sees it in document list
5. ✓ Patient profile shows no-show rate calculated from appointment history

**Research Needed:** NO — Standard table + form patterns covered by shadcn/ui examples

**Dependencies:**
- Phase 1 (auth/RBAC for patient data access)
- Phase 2 (alerts reference patient data)

**Risks:**
- Search performance on large patient base — mitigation: database indexes on nome, telefone, cpf
- Document storage costs — mitigation: use Supabase Storage with retention policies

---

## Phase 4: Calendar & Scheduling

**Goal:** Visual calendar with appointment CRUD, multi-provider support, and availability management.

**Why Fourth:** Complex feature requiring patient context (Phase 3). Table stakes but not core differentiator. Waitlist management adds value.

**Requirements:**
- CAL-01: User can view appointments in calendar format (day/week/month views)
- CAL-02: User can see all providers' schedules centrally (multi-provider support)
- CAL-03: User can see appointment status indicators (confirmed/tentative/no-show/cancelled/completed)
- CAL-04: User can see time slot availability (which slots are free vs booked)
- CAL-05: User can create new appointment manually
- CAL-06: User can edit existing appointment (change date/time/service)
- CAL-07: User can reschedule appointment to different time slot
- CAL-08: User can cancel appointment
- CAL-09: User can view appointment details by clicking on calendar event
- CAL-10: User can filter calendar by provider
- CAL-11: User can filter calendar by service type
- CAL-12: System manages waitlist for appointments
- CAL-13: System automatically fills cancelled appointments from waitlist
- CAL-14: User can add patient to waitlist for specific date/time
- CAL-15: Calendar syncs with N8N workflows (changes reflected in both systems)

**Success Criteria:**
1. ✓ User views week calendar and sees 12 appointments across 2 providers
2. ✓ User creates new appointment by clicking free slot, selects patient/service, and appointment appears immediately
3. ✓ User drags appointment to different time slot (reschedule) and change persists
4. ✓ User cancels appointment and system automatically offers slot to waitlist patient
5. ✓ User filters calendar to show only "Limpeza de Pele" appointments and sees 5 matching events

**Research Needed:** LIKELY — Complex scheduling logic, time zone handling, conflict detection. Consider research-phase for calendar library comparison (react-big-calendar vs alternatives).

**Dependencies:**
- Phase 3 (appointments require patient records)
- Phase 7 (business hours and services configuration)

**Risks:**
- Drag-and-drop on mobile conflicts with mobile-first design — mitigation: click-to-reschedule dialog on mobile
- Time zone handling complexity — mitigation: use date-fns consistently
- Calendar performance with 1000+ appointments — mitigation: pagination, virtualization

---

## Phase 5: Conversation Monitoring ✅

**Status:** Complete (2026-01-17)
**Goal:** WhatsApp conversation viewer with AI chat history, status tracking, and ability to clear chat memory.

**Why Fifth:** Enables staff to understand why alerts occurred and intervene in AI conversations. Requires patient context (Phase 3) for linking conversations.

**Requirements:**
- CONV-01: User can view WhatsApp conversation thread for any patient
- CONV-02: User can see message status indicators (sent/delivered/read/failed)
- CONV-03: User can see which messages were sent by AI vs human
- CONV-04: Conversations are linked to patient records
- CONV-05: User can access conversation from alert detail view
- CONV-06: User can access conversation from patient profile
- CONV-07: User can clear chat memory (n8n_chat_histories) to resolve AI loops
- CONV-08: User can see conversation status (I.A, Humano, Finalizado)
- CONV-09: Conversation viewer shows timestamp for each message
- CONV-10: Conversation viewer scrolls to most recent messages first

**Success Criteria:**
1. ✓ User opens patient profile and clicks "Ver Conversas" to see WhatsApp thread
2. ✓ Conversation viewer shows 20 messages with timestamps, AI/human labels, and status indicators
3. ✓ User clicks "Limpar Memória" button and chat history is cleared from n8n_chat_histories table
4. ✓ User accesses conversation from alert detail view without navigating away
5. ✓ New message arrives and appears in conversation thread within 5 seconds

**Research Needed:** NO — Standard chat UI patterns, plenty of examples

**Dependencies:**
- Phase 3 (conversations linked to patient records)
- Phase 2 (alerts reference conversations)

**Risks:**
- Long conversation threads (100+ messages) performance — mitigation: virtualization with react-window
- Real-time message updates memory leaks — mitigation: subscription cleanup patterns from Phase 1

---

## Phase 6: One-Click Interventions

**Goal:** Fix issues directly from alert view without navigating away. Competitive differentiator.

**Why Sixth:** Requires all previous phases (alerts, patients, calendar, conversations) to provide context-aware actions.

**Requirements:**
- ALERT-11: User can perform one-click interventions from alert view (reschedule appointment, send message, clear chat memory)

**Success Criteria:**
1. ✓ User clicks "Reagendar" on alert and sees pre-filled form with patient/appointment context
2. ✓ User clicks "Limpar Memória" on alert and chat memory clears without leaving alert view
3. ✓ User clicks "Ver Conversa" on alert and conversation opens in modal overlay
4. ✓ User reschedules appointment from alert and alert auto-resolves
5. ✓ All intervention actions complete in <2 seconds with success feedback

**Research Needed:** LIKELY — N8N webhook integration patterns, state synchronization. Consider research-phase for webhook reliability and error handling strategies.

**Dependencies:**
- Phase 2 (alert infrastructure)
- Phase 3 (patient data for context)
- Phase 4 (rescheduling logic)
- Phase 5 (conversation viewer, memory clearing)

**Risks:**
- N8N webhook reliability — mitigation: retry logic with exponential backoff
- Race conditions between console and N8N workflows — mitigation: optimistic UI updates with rollback

---

## Phase 7: System Configuration

**Goal:** Enable clinic staff to configure business rules without touching N8N workflows.

**Why Seventh:** Not blocking for core operations. Needed before analytics (Phase 8) to define business logic for metrics.

**Requirements:**
- CONF-01: User can configure business hours (days of week, opening/closing times)
- CONF-02: User can configure lunch break hours
- CONF-03: User can view list of services offered
- CONF-04: User can create new service (nome, duração, preço, ativo/inativo)
- CONF-05: User can edit existing service
- CONF-06: User can activate/deactivate service
- CONF-07: User can delete service
- CONF-08: User can configure antecedência mínima for appointments
- CONF-09: User can view list of system users
- CONF-10: User can create new user account (email, senha, role)
- CONF-11: User can edit user account (email, role)
- CONF-12: User can deactivate user account
- CONF-13: User can assign roles (Admin, Atendente) to users
- CONF-14: User can configure notification preferences

**Success Criteria:**
1. ✓ Admin configures business hours (Mon-Fri 9am-6pm, lunch 12-1pm) and settings save
2. ✓ Admin creates new service "Botox" with 60min duration and R$500 price
3. ✓ Admin deactivates "Limpeza de Pele" service and it no longer appears in booking flow
4. ✓ Admin creates new Atendente user and user can log in with generated credentials
5. ✓ Admin changes notification preferences and system respects new settings

**Research Needed:** NO — Standard CRUD forms and settings pages

**Dependencies:**
- Phase 1 (admin role required for configuration access)
- Phase 4 (calendar uses business hours and services)

**Risks:**
- Changing business hours while appointments exist — mitigation: validation with warnings
- Deleting services with existing appointments — mitigation: soft delete with confirmation

---

## Phase 8: Analytics & Smart Features

**Goal:** Data-driven improvements with ML-powered insights. Deferred to v1.1+ as not table stakes.

**Why Last:** Requires historical data for ML training (cold start problem). Not needed to validate product-market fit.

**Requirements:**
- ALERT-09: System automatically prioritizes alerts using AI/ML based on context (patient history, issue type, urgency)
- ALERT-10: System detects patterns in failures (recurring issues, common failure times, specific providers)

**Success Criteria:**
1. ✓ Alert queue shows priority scores (1-100) calculated by ML model
2. ✓ System detects pattern: "3 no-shows for 4pm Thursday slots" and shows insight
3. ✓ Dashboard shows KPIs: booking success rate, no-show rate, average resolution time
4. ✓ System predicts no-show risk (high/medium/low) for upcoming appointments
5. ✓ User exports last 30 days data to CSV for external analysis

**Research Needed:** YES — ML stack and model selection required. No-show prediction models, training data requirements, ML deployment patterns.

**Dependencies:**
- All previous phases (requires data from alerts, appointments, conversations)
- Minimum 3 months historical data for ML training

**Risks:**
- ML model accuracy depends on data quality — mitigation: start with simple heuristics, iterate to ML
- Training data bias — mitigation: validate model across different patient demographics

---

## Requirement Coverage

**Total v1 Requirements:** 79
**Mapped to Phases:** 79
**Unmapped:** 0 ✓

### Coverage by Phase

| Phase | Requirements | Percentage |
|-------|--------------|------------|
| Phase 1 | 17 (AUTH-01 to AUTH-12, UX-03 to UX-07) | 21.5% |
| Phase 2 | 16 (ALERT-01 to ALERT-08, ALERT-12 to ALERT-15, UX-01, UX-02, UX-08, UX-09) | 20.3% |
| Phase 3 | 14 (PAT-01 to PAT-14) | 17.7% |
| Phase 4 | 15 (CAL-01 to CAL-15) | 19.0% |
| Phase 5 | 10 (CONV-01 to CONV-10) | 12.7% |
| Phase 6 | 1 (ALERT-11) | 1.3% |
| Phase 7 | 14 (CONF-01 to CONF-14) | 17.7% |
| Phase 8 | 2 (ALERT-09, ALERT-10) | 2.5% |

### Coverage by Category

| Category | Total | Mapped | Unmapped |
|----------|-------|--------|----------|
| Dashboard & Alerts | 15 | 15 | 0 ✓ |
| Calendar & Scheduling | 15 | 15 | 0 ✓ |
| Patient Management | 14 | 14 | 0 ✓ |
| Conversation Monitoring | 10 | 10 | 0 ✓ |
| System Configuration | 14 | 14 | 0 ✓ |
| Authentication & Security | 12 | 12 | 0 ✓ |
| Infrastructure & UX | 9 | 9 | 0 ✓ |

---

## Research Flags

Phases likely needing research-phase before planning:

- **Phase 4 (Calendar):** Complex scheduling, time zones, conflict detection algorithms
- **Phase 6 (One-Click Interventions):** N8N webhook integration patterns, state sync
- **Phase 8 (ML Features):** ML stack, no-show prediction models, training pipelines

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** Supabase Auth and Next.js security docs
- **Phase 2 (Alert Dashboard):** CRUD + real-time patterns
- **Phase 3 (Patient Management):** Standard table + form patterns
- **Phase 5 (Conversation Monitoring):** Chat UI patterns
- **Phase 7 (Configuration):** CRUD forms and settings

---

## Execution Strategy

**Mode:** YOLO (skip checkpoints, auto-proceed)
**Depth:** Standard (balance thoroughness and speed)
**Parallelization:** Enabled at plan level (3 max concurrent agents)

**Phase Order Rationale:**

1. **Security-first:** Phase 1 non-negotiable due to CVEs and HIPAA
2. **Value-driven:** Phase 2 delivers core differentiator immediately
3. **Dependency-managed:** Patient → Calendar → Conversations → Interventions
4. **Risk-mitigated:** Address critical pitfalls (memory leaks, RLS, authorization) in Phase 1

**Success Metrics:**

- Phase completion: All requirements ✓ + success criteria validated
- Quality gates: Security review (Phase 1), performance testing (Phases 2-5), integration testing (Phase 6)
- User validation: Each phase ships to staging for feedback before next phase

---

*Roadmap created: 2026-01-15*
*Last updated: 2026-01-15*
*Next: Plan Phase 1*
