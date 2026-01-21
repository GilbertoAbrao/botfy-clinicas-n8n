# Roadmap: Botfy ClinicOps v1.2

**Milestone:** v1.2 Agenda List View + Pre-Checkin Management
**Phases:** 13-16 (continues from v1.1)
**Requirements:** 46 total
**Created:** 2026-01-21

## Phase Overview

| Phase | Name | Goal | Requirements | Complexity |
|-------|------|------|--------------|------------|
| 13 | Agenda List View | Toggle entre calendário e lista com filtros avançados | ALIST-01 to ALIST-12 | MEDIUM |
| 14 | Pre-Checkin Dashboard | Dashboard de gestão de pré-checkins com analytics | PCHK-01 to PCHK-13 | MEDIUM |
| 15 | Procedure Instructions | CRUD de instruções de procedimentos | INST-01 to INST-09 | LOW |
| 16 | Document Management | Gestão de documentos de pacientes | DOCS-01 to DOCS-12 | MEDIUM |

---

## Phase 13: Agenda List View

**Goal:** Adicionar view de lista como alternativa ao calendário na página de agenda, com filtros avançados e ações rápidas.

**Requirements covered:** ALIST-01 to ALIST-12 (12 requirements)

| ID | Requirement |
|----|-------------|
| ALIST-01 | Toggle calendar/list via button |
| ALIST-02 | Table with Date/Time, Patient, Service, Provider, Status, Actions |
| ALIST-03 | Filter by date range |
| ALIST-04 | Filter by provider (multi-select) |
| ALIST-05 | Filter by service type |
| ALIST-06 | Filter by status |
| ALIST-07 | Sort by any column |
| ALIST-08 | Search by patient name/phone |
| ALIST-09 | Quick action buttons: Edit, Confirm, Cancel |
| ALIST-10 | No-show risk badge |
| ALIST-11 | Pagination (50 rows) |
| ALIST-12 | Mobile responsive (card layout) |

**Success Criteria:**
1. User toggles between calendar and list view; filter state persists across toggle
2. List displays appointments with all columns; data matches calendar view
3. All filters (date, provider, service, status) work correctly and can be combined
4. Sorting by column works in both directions (asc/desc)
5. Search finds appointments by patient name or phone number
6. Quick actions (edit, confirm, cancel) work from list view
7. Risk badge shows for future appointments with calculated risk
8. Pagination controls appear when >50 appointments
9. Mobile view shows card layout instead of table

**Dependencies:** None - extends existing calendar page

**Technical Notes:**
- Install @tanstack/react-table for advanced table features
- Reuse existing useCalendarEvents hook for data
- Store view preference in URL query param (`?view=list`)
- Reuse AppointmentModal for edit actions

---

## Phase 14: Pre-Checkin Dashboard

**Goal:** Dashboard para visualizar e gerenciar status de pré-checkins, com analytics e ações de intervenção.

**Requirements covered:** PCHK-01 to PCHK-13 (13 requirements)

| ID | Requirement |
|----|-------------|
| PCHK-01 | Dashboard page with pre-checkin table |
| PCHK-02 | Columns: Patient, Appointment, Service, Status, Progress, Actions |
| PCHK-03 | Status badges: Pendente, Em Andamento, Completo, Incompleto |
| PCHK-04 | Filter by status |
| PCHK-05 | Filter by appointment date range |
| PCHK-06 | Search by patient name |
| PCHK-07 | Click row opens detail modal |
| PCHK-08 | Detail modal shows checklist (dados, docs, instrucoes) |
| PCHK-09 | Mark complete/incomplete from modal |
| PCHK-10 | Send reminder action (N8N webhook) |
| PCHK-11 | Analytics cards: completion rate, pending, overdue |
| PCHK-12 | Timeline view of workflow progress |
| PCHK-13 | Mobile responsive |

**Success Criteria:**
1. Dashboard shows all pre-checkin records from `pre_checkin` table
2. Status badges use correct colors (blue=pending, yellow=in_progress, green=complete, red=incomplete)
3. All filters work and persist in URL
4. Detail modal shows full checklist with timestamps
5. Mark complete/incomplete updates database and refreshes list
6. Send reminder triggers N8N webhook and shows success toast
7. Analytics cards show accurate calculations from database
8. Timeline shows workflow progression with timestamps
9. Mobile layout is usable on 320px screens

**Dependencies:** Phase 13 (list view patterns)

**Technical Notes:**
- Create new page at `/admin/pre-checkin`
- API routes: GET/PUT `/api/pre-checkin`, POST `/api/pre-checkin/[id]/send-reminder`
- Use Supabase admin client to bypass RLS for N8N tables
- N8N webhook URL from environment variable (not hardcoded)

---

## Phase 15: Procedure Instructions CRUD

**Goal:** Interface ADMIN para gerenciar instruções de procedimentos que o N8N envia aos pacientes.

**Requirements covered:** INST-01 to INST-09 (9 requirements)

| ID | Requirement |
|----|-------------|
| INST-01 | List all procedure instructions |
| INST-02 | Search by service name or title |
| INST-03 | Create new instruction form |
| INST-04 | Form fields: service, type, title, content, priority, active |
| INST-05 | Instruction types: preparo, jejum, medicamentos, vestuario, acompanhante, documentos, geral |
| INST-06 | Edit existing instruction |
| INST-07 | Deactivate (soft delete) instruction |
| INST-08 | Preview WhatsApp message format |
| INST-09 | ADMIN-only access |

**Success Criteria:**
1. List displays all instructions from `instrucoes_procedimentos` table
2. Search filters list by service name or instruction title
3. Create form validates all required fields and saves to database
4. Type dropdown shows all 7 instruction types
5. Edit form pre-fills with existing data and saves changes
6. Deactivate sets `ativo=false` instead of deleting
7. Preview shows instruction formatted as WhatsApp message
8. Non-ADMIN users see 403 error when accessing page

**Dependencies:** None - standalone CRUD

**Technical Notes:**
- Create new page at `/admin/pre-checkin/instrucoes`
- API routes: CRUD `/api/procedures/instructions`
- Zod validation for form fields
- WhatsApp preview: simple text formatting (no rich text)

---

## Phase 16: Document Management

**Goal:** Interface para visualizar e validar documentos de pacientes enviados durante pré-checkin.

**Requirements covered:** DOCS-01 to DOCS-12 (12 requirements)

| ID | Requirement |
|----|-------------|
| DOCS-01 | List all patient documents |
| DOCS-02 | Columns: Patient, Type, Upload Date, Status, Actions |
| DOCS-03 | Filter by status (pendente, aprovado, rejeitado) |
| DOCS-04 | Filter by document type |
| DOCS-05 | Filter by date range |
| DOCS-06 | Search by patient name |
| DOCS-07 | Approve document with optional notes |
| DOCS-08 | Reject document with required reason |
| DOCS-09 | Preview document in modal |
| DOCS-10 | Download original file |
| DOCS-11 | Bulk approve multiple documents |
| DOCS-12 | Bulk reject multiple documents |

**Success Criteria:**
1. List displays all documents from `documentos_paciente` table
2. All columns show correct data with proper formatting
3. Status filter shows correct counts per status
4. Type filter dropdown shows all document types
5. Approve action updates status and logs audit event
6. Reject requires reason field and updates status
7. Preview modal shows image or iframe for PDF
8. Download triggers file download from Supabase Storage
9. Bulk select allows approving multiple documents at once
10. Bulk reject shows single reason input for all selected

**Dependencies:** Phase 14 (API patterns)

**Technical Notes:**
- Create new page at `/admin/pre-checkin/documentos`
- API routes: GET `/api/patient-documents`, POST `/api/patient-documents/[id]/approve`, POST `/api/patient-documents/[id]/reject`
- Use Supabase Storage signed URLs for preview/download
- Bulk actions: checkbox column + action bar at bottom

---

## Milestone Summary

**Total phases:** 4 (phases 13-16)
**Total requirements:** 46
**Estimated complexity:** MEDIUM

**Build order rationale:**
1. **Phase 13 (Agenda List View)** - Foundation for list/table patterns used in subsequent phases
2. **Phase 14 (Pre-Checkin Dashboard)** - Core value of milestone; depends on list patterns
3. **Phase 15 (Procedure Instructions)** - Simple CRUD; low complexity
4. **Phase 16 (Document Management)** - Most complex; benefits from patterns established in earlier phases

**Risk mitigation:**
- All database tables already exist (no migrations needed)
- N8N workflows already populate data (no workflow changes needed)
- Reuses existing UI patterns (shadcn/ui, list/detail views)
- Single new dependency (@tanstack/react-table)

---

*Roadmap created: 2026-01-21*
*Last updated: 2026-01-21*
