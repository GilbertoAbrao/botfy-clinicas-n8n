# Plan 23-03 Summary: Migrate buscar_paciente

**Status:** Complete
**Completed:** 2026-01-25

## What Was Built

Migrated `buscar_paciente` tool from `toolWorkflow` to `toolHttpRequest` for direct HTTP access to the patient lookup API.

## Deliverables

### N8N Node Migration
- **Node:** `buscar_paciente`
- **Old type:** `@n8n/n8n-nodes-langchain.toolWorkflow` (called sub-workflow igG6sZsStxiDzNRY)
- **New type:** `@n8n/n8n-nodes-langchain.toolHttpRequest`
- **New ID:** `tool-buscar-paciente-http`
- **Position:** [-2112, 656] (preserved)

### HTTP Configuration
- **Method:** GET
- **URL:** `={{ $env.AGENT_API_URL }}/api/agent/paciente?telefone={telefone}`
- **Authentication:** `predefinedCredentialType` with `httpHeaderAuth`
- **Placeholder:** `telefone` - Patient phone with DDD

### Tool Description
"Busca dados de um paciente pelo telefone, CPF ou nome. Retorna dados cadastrais completos e proximos agendamentos. Use para verificar se paciente existe no sistema ou obter informacoes do cadastro. Parametros: telefone (com DDD, ex: 5511999998888) OU cpf (apenas numeros) OU nome (busca parcial)."

## Verification

- [x] Node type changed to toolHttpRequest
- [x] URL pattern correct: `/api/agent/paciente?telefone={telefone}`
- [x] AI Agent connection via ai_tool
- [x] Placeholder definition for `telefone` parameter

## Files Changed

| File | Change |
|------|--------|
| N8N Workflow bPJamJhBcrVCKgBg | Node `buscar_paciente` migrated |

## Commits

N8N workflow changes are applied directly via MCP API.
