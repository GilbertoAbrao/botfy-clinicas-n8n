# Requirements: Botfy ClinicOps v1.2

**Defined:** 2026-01-21
**Core Value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção

## v1.2 Requirements

Requirements for Agenda List View + Pre-Checkin Management milestone.

### Agenda List View

- [ ] **ALIST-01**: User can toggle between calendar and list view via button in page header
- [ ] **ALIST-02**: List view displays table with columns: Date/Time, Patient, Service, Provider, Status, Actions
- [ ] **ALIST-03**: User can filter list by date range (today, tomorrow, this week, this month, custom)
- [ ] **ALIST-04**: User can filter list by provider (multi-select dropdown)
- [ ] **ALIST-05**: User can filter list by service type
- [ ] **ALIST-06**: User can filter list by status (agendada, confirmado, cancelada, realizada, faltou)
- [ ] **ALIST-07**: User can sort list by any column (date, patient, status, provider)
- [ ] **ALIST-08**: User can search appointments by patient name or phone
- [ ] **ALIST-09**: Each row shows quick action buttons: Edit, Confirm, Cancel
- [ ] **ALIST-10**: Each row shows no-show risk badge for future appointments
- [ ] **ALIST-11**: List is paginated (50 rows per page)
- [ ] **ALIST-12**: List view is responsive and displays as cards on mobile devices

### Pre-Checkin Dashboard

- [ ] **PCHK-01**: Dashboard page shows all pre-checkin records in a table
- [ ] **PCHK-02**: Table displays columns: Patient, Appointment Date/Time, Service, Status, Progress, Actions
- [ ] **PCHK-03**: Status is shown as badge: Pendente, Em Andamento, Completo, Incompleto
- [ ] **PCHK-04**: User can filter by status (pendente, em_andamento, completo, incompleto)
- [ ] **PCHK-05**: User can filter by appointment date range
- [ ] **PCHK-06**: User can search pre-checkins by patient name
- [ ] **PCHK-07**: User can click row to open detail modal showing full checklist
- [ ] **PCHK-08**: Detail modal shows progress: dados confirmados, documentos enviados, instrucoes enviadas
- [ ] **PCHK-09**: User can mark pre-checkin as complete or incomplete from detail modal
- [ ] **PCHK-10**: User can send reminder to patient (triggers N8N webhook)
- [ ] **PCHK-11**: Dashboard displays analytics cards: completion rate, pending count, overdue count
- [ ] **PCHK-12**: Detail modal shows timeline of workflow progress (created → message sent → reminder → completed)
- [ ] **PCHK-13**: Dashboard is responsive and works on mobile devices

### Procedure Instructions CRUD

- [ ] **INST-01**: Admin can view list of all procedure instructions
- [ ] **INST-02**: Admin can search instructions by service name or title
- [ ] **INST-03**: Admin can create new procedure instruction with form
- [ ] **INST-04**: Instruction form has fields: service, type, title, content, priority, active
- [ ] **INST-05**: Instruction types are: preparo, jejum, medicamentos, vestuario, acompanhante, documentos, geral
- [ ] **INST-06**: Admin can edit existing procedure instruction
- [ ] **INST-07**: Admin can deactivate (soft delete) procedure instruction
- [ ] **INST-08**: Admin can preview how instruction will appear in WhatsApp message
- [ ] **INST-09**: Only ADMIN role can access procedure instructions management

### Document Management

- [ ] **DOCS-01**: User can view list of all patient documents
- [ ] **DOCS-02**: List shows columns: Patient, Document Type, Upload Date, Status, Actions
- [ ] **DOCS-03**: User can filter documents by status (pendente, aprovado, rejeitado)
- [ ] **DOCS-04**: User can filter documents by document type (rg, cnh, carteirinha_convenio, guia_autorizacao, comprovante_residencia, outros)
- [ ] **DOCS-05**: User can filter documents by date range
- [ ] **DOCS-06**: User can search documents by patient name
- [ ] **DOCS-07**: User can approve document with optional notes
- [ ] **DOCS-08**: User can reject document with required reason
- [ ] **DOCS-09**: User can preview document in modal (images displayed, PDFs via iframe)
- [ ] **DOCS-10**: User can download original document file
- [ ] **DOCS-11**: User can select multiple documents and bulk approve
- [ ] **DOCS-12**: User can select multiple documents and bulk reject (with single reason)

## Future Requirements (v1.3+)

Deferred to future milestones. Tracked but not in current roadmap.

### Agenda Enhancements
- **ALIST-F01**: Bulk select appointments and confirm all at once
- **ALIST-F02**: Export filtered list to CSV
- **ALIST-F03**: Color-coded rows based on no-show risk level

### Pre-Checkin Enhancements
- **PCHK-F01**: Predictive completion (ML-based "likely won't complete" indicator)
- **PCHK-F02**: Bulk resend reminders to multiple patients

### Document Enhancements
- **DOCS-F01**: AI-powered document validation (OCR quality check)
- **DOCS-F02**: Duplicate document detection
- **DOCS-F03**: Document expiration tracking and alerts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Drag-drop in list view | Use calendar view for drag-drop rescheduling |
| Real-time list updates | Memory leak risk with Supabase Realtime on large lists; use manual refresh |
| Complex AND/OR filter logic | Simple pre-built filters are sufficient |
| Patient data editing in pre-checkin | Link to patient profile for edits (audit trail) |
| Auto-cancel appointments | Require manual action; patient safety concern |
| SMS sending from dashboard | Use N8N webhooks for messaging |
| Rich text editor for instructions | Textarea with preview sufficient for MVP |
| AI-generated instructions | Medical content requires human review |
| e-Signature capture | Out of scope; requires hardware/legal compliance |
| EHR integration | Massive scope; each EHR different |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ALIST-01 | Phase 13 | Pending |
| ALIST-02 | Phase 13 | Pending |
| ALIST-03 | Phase 13 | Pending |
| ALIST-04 | Phase 13 | Pending |
| ALIST-05 | Phase 13 | Pending |
| ALIST-06 | Phase 13 | Pending |
| ALIST-07 | Phase 13 | Pending |
| ALIST-08 | Phase 13 | Pending |
| ALIST-09 | Phase 13 | Pending |
| ALIST-10 | Phase 13 | Pending |
| ALIST-11 | Phase 13 | Pending |
| ALIST-12 | Phase 13 | Pending |
| PCHK-01 | Phase 14 | Pending |
| PCHK-02 | Phase 14 | Pending |
| PCHK-03 | Phase 14 | Pending |
| PCHK-04 | Phase 14 | Pending |
| PCHK-05 | Phase 14 | Pending |
| PCHK-06 | Phase 14 | Pending |
| PCHK-07 | Phase 14 | Pending |
| PCHK-08 | Phase 14 | Pending |
| PCHK-09 | Phase 14 | Pending |
| PCHK-10 | Phase 14 | Pending |
| PCHK-11 | Phase 14 | Pending |
| PCHK-12 | Phase 14 | Pending |
| PCHK-13 | Phase 14 | Pending |
| INST-01 | Phase 15 | Pending |
| INST-02 | Phase 15 | Pending |
| INST-03 | Phase 15 | Pending |
| INST-04 | Phase 15 | Pending |
| INST-05 | Phase 15 | Pending |
| INST-06 | Phase 15 | Pending |
| INST-07 | Phase 15 | Pending |
| INST-08 | Phase 15 | Pending |
| INST-09 | Phase 15 | Pending |
| DOCS-01 | Phase 16 | Pending |
| DOCS-02 | Phase 16 | Pending |
| DOCS-03 | Phase 16 | Pending |
| DOCS-04 | Phase 16 | Pending |
| DOCS-05 | Phase 16 | Pending |
| DOCS-06 | Phase 16 | Pending |
| DOCS-07 | Phase 16 | Pending |
| DOCS-08 | Phase 16 | Pending |
| DOCS-09 | Phase 16 | Pending |
| DOCS-10 | Phase 16 | Pending |
| DOCS-11 | Phase 16 | Pending |
| DOCS-12 | Phase 16 | Pending |

**Coverage:**
- v1.2 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-21 after initial definition*
