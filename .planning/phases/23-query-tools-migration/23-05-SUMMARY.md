# Plan 23-05 Summary: Migrate buscar_instrucoes

**Status:** Complete
**Completed:** 2026-01-25

## What Was Built

Migrated `buscar_instrucoes` tool from `toolWorkflow` to `toolHttpRequest` for direct HTTP access to the instructions API.

## Deliverables

### N8N Node Migration
- **Node:** `buscar_instrucoes`
- **Old type:** `@n8n/n8n-nodes-langchain.toolWorkflow` (called sub-workflow NUZv1Gt15LKyiiKz)
- **New type:** `@n8n/n8n-nodes-langchain.toolHttpRequest`
- **New ID:** `tool-buscar-instrucoes-http`
- **Position:** [-1552, 800] (preserved)

### HTTP Configuration
- **Method:** GET
- **URL:** `={{ $env.AGENT_API_URL }}/api/agent/instrucoes?servicoId={servicoId}`
- **Authentication:** `predefinedCredentialType` with `httpHeaderAuth`
- **Placeholder:** `servicoId` - Service ID to filter instructions

### Tool Description
"Busca instrucoes de preparo para procedimentos/consultas. Use quando o paciente perguntar sobre preparo, jejum, medicamentos, cuidados antes ou depois de um procedimento. Parametros: servicoId (opcional, ID do servico) ou tipoInstrucao (opcional: preparo/pos-procedimento/medicamentos/jejum). Sem parametros retorna todas as instrucoes."

## Verification

- [x] Node type changed to toolHttpRequest
- [x] URL pattern correct: `/api/agent/instrucoes?servicoId={servicoId}`
- [x] AI Agent connection via ai_tool
- [x] Placeholder definition for `servicoId` parameter

## Files Changed

| File | Change |
|------|--------|
| N8N Workflow bPJamJhBcrVCKgBg | Node `buscar_instrucoes` migrated |

## Commits

N8N workflow changes are applied directly via MCP API.

---

## Phase 23 Complete

All 5 query tools have been migrated from `toolWorkflow` to `toolHttpRequest`:

| Tool | Old Sub-workflow | New Endpoint |
|------|-----------------|--------------|
| buscar_slots_disponiveis | 8Bke6sYr7r51aeEq | /api/agent/slots |
| buscar_agendamentos | 8Ug0F3KuLov6EeCQ | /api/agent/agendamentos |
| buscar_paciente | igG6sZsStxiDzNRY | /api/agent/paciente |
| status_pre_checkin | holwGQuksZPsSb19 | /api/agent/pre-checkin/status |
| buscar_instrucoes | NUZv1Gt15LKyiiKz | /api/agent/instrucoes |

The old sub-workflows are no longer called but remain in N8N for archival (to be addressed in Phase 26).
