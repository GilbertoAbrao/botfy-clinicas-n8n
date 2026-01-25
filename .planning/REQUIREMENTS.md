# Requirements: v2.1 N8N Agent HTTP Tools Migration

**Milestone:** v2.1
**Status:** Active
**Created:** 2026-01-25

---

## Overview

Migrate 10 `toolWorkflow` nodes in N8N AI Agent workflow "Botfy - Agendamento" (`bPJamJhBcrVCKgBg`) to `toolHttpRequest` nodes that call Next.js Agent APIs directly.

**Why:** Eliminate sub-workflow overhead, use type-safe APIs built in v2.0, simplify debugging.

---

## Requirements

### Query Tools Migration (5 tools)

- [ ] **HTTP-01**: Replace `buscar_slots_disponiveis` toolWorkflow with toolHttpRequest
  - Endpoint: `GET /api/agent/slots`
  - Parameters: `data`, `periodo` (opcional)
  - Auth: Bearer token

- [ ] **HTTP-02**: Replace `buscar_agendamentos` toolWorkflow with toolHttpRequest
  - Endpoint: `GET /api/agent/agendamentos`
  - Parameters: `paciente_id` ou `telefone`, `data_inicio`, `data_fim`
  - Auth: Bearer token

- [ ] **HTTP-03**: Replace `buscar_paciente` toolWorkflow with toolHttpRequest
  - Endpoint: `GET /api/agent/paciente`
  - Parameters: `telefone` ou `cpf`
  - Auth: Bearer token

- [ ] **HTTP-04**: Replace `status_pre_checkin` toolWorkflow with toolHttpRequest
  - Endpoint: `GET /api/agent/pre-checkin/status`
  - Parameters: `agendamento_id`
  - Auth: Bearer token

- [ ] **HTTP-05**: Replace `buscar_instrucoes` toolWorkflow with toolHttpRequest
  - Endpoint: `GET /api/agent/instrucoes`
  - Parameters: `servico_id`, `tipo` (opcional)
  - Auth: Bearer token

### Write Tools Migration (4 tools)

- [ ] **HTTP-06**: Replace `criar_agendamento` toolWorkflow with toolHttpRequest
  - Endpoint: `POST /api/agent/agendamentos`
  - Body: `paciente_id`, `servico_id`, `data_hora`, `observacoes`
  - Auth: Bearer token

- [ ] **HTTP-07**: Replace `reagendar_agendamento` toolWorkflow with toolHttpRequest
  - Endpoint: `PATCH /api/agent/agendamentos/:id`
  - Body: `nova_data_hora`, `motivo`
  - Auth: Bearer token

- [ ] **HTTP-08**: Replace `cancelar_agendamento` toolWorkflow with toolHttpRequest
  - Endpoint: `DELETE /api/agent/agendamentos/:id`
  - Body: `motivo`
  - Auth: Bearer token

- [ ] **HTTP-09**: Replace `atualizar_dados_paciente` toolWorkflow with toolHttpRequest
  - Endpoint: `PATCH /api/agent/paciente/:id`
  - Body: campos parciais (nome, email, etc.)
  - Auth: Bearer token

### Document Tool Migration (1 tool)

- [ ] **HTTP-10**: Replace `processar_documento` toolWorkflow with toolHttpRequest
  - Endpoint: `POST /api/agent/documentos/processar`
  - Body (JSON): `patientId` (required), `imageUrl` (required - HTTPS URL to document image)
  - Note: API also accepts multipart/form-data for direct file uploads
  - Note: Document type is auto-detected by GPT-4o Vision
  - Auth: Bearer token

### Validation & Cleanup

- [ ] **VAL-01**: Test all 10 migrated tools with AI Agent
  - Each tool returns expected response format
  - Error handling works correctly
  - Bearer token authentication validates

- [ ] **VAL-02**: Archive replaced sub-workflows
  - Export sub-workflows to `workflows-backup/`
  - Deactivate but do not delete sub-workflows
  - Document archive location

---

## Out of Scope

- `confirmar_presenca` tool (already `toolCode`, not `toolWorkflow`)
- Major changes to Next.js Agent APIs (already complete in v2.0)
  - Exception: HTTP-10 requires API enhancement to accept URL-based input for toolHttpRequest compatibility
- New tool creation (only migrating existing tools)
- Rate limiting or throttling (deferred to v2.2+)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HTTP-01 | Phase 23 | Complete |
| HTTP-02 | Phase 23 | Complete |
| HTTP-03 | Phase 23 | Complete |
| HTTP-04 | Phase 23 | Complete |
| HTTP-05 | Phase 23 | Complete |
| HTTP-06 | Phase 24 | Complete |
| HTTP-07 | Phase 24 | Complete |
| HTTP-08 | Phase 24 | Complete |
| HTTP-09 | Phase 24 | Complete |
| HTTP-10 | Phase 25 | Pending |
| VAL-01 | Phase 26 | Pending |
| VAL-02 | Phase 26 | Pending |

---

*Created: 2026-01-25*
*Last updated: 2026-01-25 - Phase 24 complete (HTTP-06 to HTTP-09)*
