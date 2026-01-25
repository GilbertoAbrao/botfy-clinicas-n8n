# Roadmap: Botfy ClinicOps - Console Administrativo

## Milestones

- ✅ **v1.0 MVP** - Phases 1-8 (shipped 2026-01-17)
- ✅ **v1.1 Anti No-Show Intelligence** - Phases 9-12 (shipped 2026-01-21)
- ✅ **v1.2 Agenda List View + Pre-Checkin Management** - Phases 13-16 (shipped 2026-01-21)
- ✅ **v2.0 Agent API Migration** - Phases 17-22 (shipped 2026-01-24)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) - SHIPPED 2026-01-17</summary>

### Phase 1: Authentication & Authorization
**Goal**: Users can securely access the console with role-based permissions
**Plans**: 3 plans

Plans:
- [x] 01-01: Supabase Auth setup with email/password
- [x] 01-02: RBAC implementation (Admin/Atendente)
- [x] 01-03: Session management and middleware

### Phase 2: Alert Dashboard Foundation
**Goal**: Staff can see all problems requiring attention at a glance
**Plans**: 4 plans

Plans:
- [x] 02-01: Alert data model and queries
- [x] 02-02: Alert dashboard UI with filters
- [x] 02-03: Priority scoring algorithm
- [x] 02-04: Alert detail view

### Phase 3: Patient Management
**Goal**: Staff can search, view, and manage patient records
**Plans**: 5 plans

Plans:
- [x] 03-01: Patient search and list
- [x] 03-02: Patient profile view
- [x] 03-03: Patient CRUD operations
- [x] 03-04: Document upload
- [x] 03-05: No-show tracking

### Phase 4: Calendar & Scheduling
**Goal**: Staff can view and manage appointments in calendar interface
**Plans**: 5 plans

Plans:
- [x] 04-01: Schedule-X calendar setup
- [x] 04-02: Appointment views (day/week/month)
- [x] 04-03: Appointment CRUD
- [x] 04-04: Waitlist management
- [x] 04-05: N8N webhook integration

### Phase 5: Conversation Monitoring
**Goal**: Staff can monitor WhatsApp conversations and clear stuck memory
**Plans**: 3 plans

Plans:
- [x] 05-01: Conversation list view
- [x] 05-02: Conversation thread viewer
- [x] 05-03: Clear memory functionality

### Phase 6: One-Click Interventions
**Goal**: Staff can take action directly from alert detail view
**Plans**: 2 plans

Plans:
- [x] 06-01: Reschedule from alert
- [x] 06-02: Send WhatsApp message (deep link)

### Phase 7: System Configuration
**Goal**: Admins can configure services, users, and business hours
**Plans**: 3 plans

Plans:
- [x] 07-01: Service management
- [x] 07-02: User management
- [x] 07-03: Business hours configuration

### Phase 8: Analytics & Smart Features
**Goal**: Staff can analyze patterns and export data
**Plans**: 7 plans

Plans:
- [x] 08-01: Pattern detection algorithm
- [x] 08-02: No-show risk prediction (heuristic)
- [x] 08-03: Analytics dashboard
- [x] 08-04: CSV export functionality
- [x] 08-05: Audit logging (6-year retention)
- [x] 08-06: Session timeout
- [x] 08-07: Performance optimization

</details>

<details>
<summary>✅ v1.1 Anti No-Show Intelligence (Phases 9-12) - SHIPPED 2026-01-21</summary>

### Phase 9: N8N Workflow Fix
**Goal**: N8N Anti No-Show workflow saves risk scores to database
**Plans**: 2 plans

Plans:
- [x] 09-01: Update workflow to INSERT into lembretes_enviados
- [x] 09-02: Test end-to-end with live N8N

### Phase 10: Reminder Configuration Management
**Goal**: Admins can configure reminder messages and risk thresholds
**Plans**: 2 plans

Plans:
- [x] 10-01: CRUD interface for config_lembretes
- [x] 10-02: Validation and audit logging

### Phase 11: Reminder History Panel
**Goal**: Staff can view history of sent reminders with filters
**Plans**: 2 plans

Plans:
- [x] 11-01: Read-only history table
- [x] 11-02: Filters by date, patient, status, risk

### Phase 12: Risk Analytics Dashboard
**Goal**: Staff can analyze no-show risk patterns
**Plans**: 3 plans

Plans:
- [x] 12-01: Risk distribution charts
- [x] 12-02: Predicted vs actual correlation
- [x] 12-03: Pattern analysis by day/time/service

</details>

<details>
<summary>✅ v1.2 Agenda List View + Pre-Checkin Management (Phases 13-16) - SHIPPED 2026-01-21</summary>

### Phase 13: Agenda List View
**Goal**: Staff can toggle between calendar and list views of appointments
**Plans**: 4 plans

Plans:
- [x] 13-01: TanStack Table setup with shadcn/ui
- [x] 13-02: Advanced filters (date/provider/service/status)
- [x] 13-03: Quick actions (reschedule, cancel, confirm)
- [x] 13-04: Mobile card layout

### Phase 14: Pre-Checkin Dashboard
**Goal**: Staff can monitor pre-checkin workflow progress
**Plans**: 5 plans

Plans:
- [x] 14-01: Analytics cards (pending/completed/rejected)
- [x] 14-02: Status tracking table
- [x] 14-03: Workflow timeline visualization
- [x] 14-04: N8N webhook reminder integration
- [x] 14-05: Filters by status and date range

### Phase 15: Procedure Instructions Management
**Goal**: Admins can create and edit procedure instructions for WhatsApp
**Plans**: 5 plans

Plans:
- [x] 15-01: CRUD interface for instrucoes_procedimentos
- [x] 15-02: 7 instruction types (jejum, hidratacao, etc)
- [x] 15-03: Live WhatsApp message preview
- [x] 15-04: Soft delete with filters
- [x] 15-05: Service linking and validation

### Phase 16: Patient Document Validation
**Goal**: Staff can review and approve/reject patient documents
**Plans**: 4 plans

Plans:
- [x] 16-01: Document preview with Supabase Storage
- [x] 16-02: Approve/reject actions
- [x] 16-03: Bulk operations (multi-select)
- [x] 16-04: Status tracking and history

</details>

### ✅ v2.0 Agent API Migration (Complete)

**Milestone Goal:** Migrate 11 N8N AI Agent tools from sub-workflows to Next.js API routes with MCP Server wrapper, bringing business logic into codebase for type safety, testability, and maintainability.

**Architecture:**
```
WhatsApp → N8N Webhook → AI Agent → HTTP Request → Next.js APIs → Supabase
                                         ↓
                                    MCP Server (optional)
```

#### Phase 17: Agent API Foundation
**Goal**: Agent authentication, error handling, audit logging, and service layer infrastructure
**Depends on**: Phase 16 (v1.2 complete)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. N8N AI Agent can authenticate to APIs using Bearer token from encrypted credential
  2. All API routes return consistent `{success, data?, error?, details?}` response format
  3. Agent tool calls are logged with `agentId` and correlation ID for HIPAA audit trail
  4. Service layer functions are reusable across both Console UI and Agent API routes
  5. API validation accepts multiple date formats (ISO 8601, Brazil locale) via flexible Zod schemas
**Plans**: 4 plans

Plans:
- [x] 17-01-PLAN.md — Agent types and database schema (bcrypt, Agent model)
- [x] 17-02-PLAN.md — Error handling and audit logger extension
- [x] 17-03-PLAN.md — Flexible date validation schemas
- [x] 17-04-PLAN.md — Authentication middleware and API key generation

#### Phase 18: Query Tools (Read Operations)
**Goal**: AI Agent can query available slots, appointments, patient data, pre-checkin status, and instructions
**Depends on**: Phase 17
**Requirements**: QUERY-01, QUERY-02, QUERY-03, QUERY-04, QUERY-05
**Success Criteria** (what must be TRUE):
  1. AI Agent can retrieve available appointment slots for any date/provider/service combination
  2. AI Agent can search appointments by patient, date range, status, or service filters
  3. AI Agent can find patient records by phone number or CPF with partial match support
  4. AI Agent can check pre-checkin document status for upcoming appointments
  5. AI Agent can retrieve procedure instructions by service type or instruction category
**Plans**: 5 plans

Plans:
- [x] 18-01-PLAN.md — Slots API (slot-service.ts + GET /api/agent/slots)
- [x] 18-02-PLAN.md — Appointments API (appointment-service.ts + GET /api/agent/agendamentos)
- [x] 18-03-PLAN.md — Patient API (patient-service.ts + GET /api/agent/paciente)
- [x] 18-04-PLAN.md — Pre-checkin Status API (pre-checkin-service.ts + GET /api/agent/pre-checkin/status)
- [x] 18-05-PLAN.md — Instructions API (instruction-service.ts + GET /api/agent/instrucoes)

#### Phase 19: Write Tools (Create/Update Operations)
**Goal**: AI Agent can create, reschedule, cancel appointments, update patient data, and confirm attendance
**Depends on**: Phase 18
**Requirements**: WRITE-01, WRITE-02, WRITE-03, WRITE-04, WRITE-05
**Success Criteria** (what must be TRUE):
  1. AI Agent can create appointments with automatic conflict detection and idempotency (no duplicates on retry)
  2. AI Agent can reschedule appointments with validation of new slot availability and conflict checks
  3. AI Agent can cancel appointments with required reason and trigger waitlist auto-fill notification
  4. AI Agent can update patient data (name, phone, email, address) with partial update support
  5. AI Agent can confirm appointment attendance and update status to "Confirmado" or "Presente"
**Plans**: 4 plans

Plans:
- [x] 19-01-PLAN.md — Create Appointment API (POST /api/agent/agendamentos with idempotency)
- [x] 19-02-PLAN.md — Reschedule and Cancel API (PATCH/DELETE /api/agent/agendamentos/:id)
- [x] 19-03-PLAN.md — Update Patient API (PATCH /api/agent/paciente/:id)
- [x] 19-04-PLAN.md — Confirm Attendance API (POST /api/agent/agendamentos/:id/confirmar)

#### Phase 20: Complex Tools (Specialized Operations)
**Goal**: AI Agent can process uploaded documents and extract structured data from images
**Depends on**: Phase 19
**Requirements**: CMPLX-01, CMPLX-02
**Success Criteria** (what must be TRUE):
  1. AI Agent can receive uploaded documents (RG, CPF, insurance card) and validate file type/size
  2. AI Agent can detect document type from image content (RG vs CPF vs CNS vs insurance card)
  3. AI Agent can extract key fields from documents (document number, name, date of birth, etc.)
**Plans**: 3 plans

Plans:
- [x] 20-01-PLAN.md — File validation with magic bytes and document type schemas
- [x] 20-02-PLAN.md — GPT-4o Vision extractor and Supabase Storage services
- [x] 20-03-PLAN.md — Document processing API (POST /api/agent/documentos/processar)

#### Phase 21: N8N Integration (Production Migration)
**Goal**: N8N AI Agent workflows call Next.js APIs instead of sub-workflows, with gradual rollout
**Depends on**: Phase 20
**Requirements**: N8N-01, N8N-02, N8N-03, N8N-04, N8N-05
**Success Criteria** (what must be TRUE):
  1. N8N HTTP Request node is configured with Bearer token from encrypted credential storage
  2. N8N credential for API key is created, encrypted, and accessible to main AI Agent workflow
  3. Gradual rollout mechanism works: 10% traffic → 50% → 100% over 1 week with zero errors
  4. All 11 sub-workflows are archived (not deleted) and marked deprecated with rollback instructions
  5. Rollback procedure is documented and tested: can revert to sub-workflows in under 5 minutes
**Plans**: 4 plans

Plans:
- [x] 21-01-PLAN.md — Credential setup and API endpoint reference
- [x] 21-02-PLAN.md — Response transformer templates and migration checklist
- [x] 21-03-PLAN.md — Gradual rollout implementation guide
- [x] 21-04-PLAN.md — Rollback runbook and archive procedure

#### Phase 22: MCP Server (Optional Enhancement)
**Goal**: Standalone MCP Server exposes all 11 tools for Claude Desktop integration
**Depends on**: Phase 21
**Requirements**: MCP-01, MCP-02, MCP-03
**Success Criteria** (what must be TRUE):
  1. MCP Server wraps all 11 agent APIs via stdio transport with tool discovery working in Claude Desktop
  2. Claude Desktop configuration file (`claude_desktop_config.json`) enables local testing of all tools
  3. MCP Server has error handlers and heartbeat logging for production reliability monitoring
**Plans**: 4 plans

Plans:
- [x] 22-01-PLAN.md — MCP Server foundation (config, http-client, logger, heartbeat, server entry point)
- [x] 22-02-PLAN.md — Query tool handlers (5 read-only tools)
- [x] 22-03-PLAN.md — Write tool handlers (5 create/update/delete tools)
- [x] 22-04-PLAN.md — Document tool, full server integration, and Claude Desktop config

## Progress

**Execution Order:**
Phases execute in numeric order: 17 → 18 → 19 → 20 → 21 → 22

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Authentication & Authorization | v1.0 | 3/3 | Complete | 2026-01-17 |
| 2. Alert Dashboard Foundation | v1.0 | 4/4 | Complete | 2026-01-17 |
| 3. Patient Management | v1.0 | 5/5 | Complete | 2026-01-17 |
| 4. Calendar & Scheduling | v1.0 | 5/5 | Complete | 2026-01-17 |
| 5. Conversation Monitoring | v1.0 | 3/3 | Complete | 2026-01-17 |
| 6. One-Click Interventions | v1.0 | 2/2 | Complete | 2026-01-17 |
| 7. System Configuration | v1.0 | 3/3 | Complete | 2026-01-17 |
| 8. Analytics & Smart Features | v1.0 | 7/7 | Complete | 2026-01-17 |
| 9. N8N Workflow Fix | v1.1 | 2/2 | Complete | 2026-01-21 |
| 10. Reminder Configuration | v1.1 | 2/2 | Complete | 2026-01-21 |
| 11. Reminder History | v1.1 | 2/2 | Complete | 2026-01-21 |
| 12. Risk Analytics Dashboard | v1.1 | 3/3 | Complete | 2026-01-21 |
| 13. Agenda List View | v1.2 | 4/4 | Complete | 2026-01-21 |
| 14. Pre-Checkin Dashboard | v1.2 | 5/5 | Complete | 2026-01-21 |
| 15. Procedure Instructions | v1.2 | 5/5 | Complete | 2026-01-21 |
| 16. Patient Document Validation | v1.2 | 4/4 | Complete | 2026-01-21 |
| 17. Agent API Foundation | v2.0 | 4/4 | Complete | 2026-01-24 |
| 18. Query Tools | v2.0 | 5/5 | Complete | 2026-01-24 |
| 19. Write Tools | v2.0 | 4/4 | Complete | 2026-01-24 |
| 20. Complex Tools | v2.0 | 3/3 | Complete | 2026-01-24 |
| 21. N8N Integration | v2.0 | 4/4 | Complete | 2026-01-24 |
| 22. MCP Server | v2.0 | 4/4 | Complete | 2026-01-24 |

---

*Roadmap created: 2026-01-15*
*Last updated: 2026-01-24 — Phase 22 complete (MCP Server) — v2.0 Milestone complete*
