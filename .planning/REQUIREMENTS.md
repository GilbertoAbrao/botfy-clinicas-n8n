# Requirements: v2.1 N8N Agent HTTP Tools Migration

**Milestone:** v2.1
**Status:** Draft
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
  - Body: `agendamento_id`, `tipo_documento`, arquivo (multipart ou base64)
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
- Changes to Next.js Agent APIs (already complete in v2.0)
- New tool creation (only migrating existing tools)
- Rate limiting or throttling (deferred to v2.2+)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HTTP-01 | TBD | Pending |
| HTTP-02 | TBD | Pending |
| HTTP-03 | TBD | Pending |
| HTTP-04 | TBD | Pending |
| HTTP-05 | TBD | Pending |
| HTTP-06 | TBD | Pending |
| HTTP-07 | TBD | Pending |
| HTTP-08 | TBD | Pending |
| HTTP-09 | TBD | Pending |
| HTTP-10 | TBD | Pending |
| VAL-01 | TBD | Pending |
| VAL-02 | TBD | Pending |

---

*Created: 2026-01-25*
