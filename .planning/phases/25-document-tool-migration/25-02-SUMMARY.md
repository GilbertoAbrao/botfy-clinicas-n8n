# Plan 25-02 Summary: Migrate processar_documento N8N Tool

**Completed:** 2026-01-25
**Duration:** ~5 minutes (orchestrator direct execution)

## Objective

Migrate the `processar_documento` tool from N8N toolWorkflow to toolHttpRequest, completing the HTTP tools migration.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| 1 | Remove old toolWorkflow node | ✓ Complete |
| 2 | Add new toolHttpRequest node | ✓ Complete |
| 3 | Connect node to AI Agent | ✓ Complete |
| 4 | Verify migration | ✓ Complete |

## Deliverables

### N8N Workflow Changes (bPJamJhBcrVCKgBg)

**Removed:**
- `processar_documento` node (type: `@n8n/n8n-nodes-langchain.toolWorkflow`)
- Sub-workflow reference: `Pc0PyATrZaGefiSJ`

**Added:**
- `processar_documento` node (type: `@n8n/n8n-nodes-langchain.toolHttpRequest`)
- ID: `tool-processar-documento-http`
- Position: [-1200, 640]

**Configuration:**
```json
{
  "name": "processar_documento",
  "description": "Processa documento enviado pelo paciente (RG, CNH, carteirinha de convenio, guia de autorizacao). Extrai dados automaticamente via OCR/IA. Parametros obrigatorios: patientId (ID do paciente), imageUrl (URL HTTPS da imagem do documento). Retorna campos extraidos, tipo de documento detectado e nivel de confianca.",
  "method": "POST",
  "url": "={{ $env.AGENT_API_URL }}/api/agent/documentos/processar",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={{ JSON.stringify({ patientId: \"{patientId}\", imageUrl: \"{imageUrl}\" }) }}",
  "placeholderDefinitions": {
    "values": [
      {"name": "patientId", "description": "ID do paciente que enviou o documento (obrigatorio)"},
      {"name": "imageUrl", "description": "URL HTTPS completa da imagem do documento (obrigatorio)"}
    ]
  }
}
```

**Connection:**
- Source: `processar_documento`
- Target: `AI Agent`
- Type: `ai_tool`

**Credentials:**
- Type: `httpHeaderAuth`
- ID: `5TaXKqsLaosPr7U9`
- Name: `Botfy Agent API`

## Verification

| Check | Result |
|-------|--------|
| Node type is toolHttpRequest | ✓ |
| Method is POST | ✓ |
| URL points to /api/agent/documentos/processar | ✓ |
| JSON body has patientId and imageUrl placeholders | ✓ |
| Credentials configured | ✓ |
| ai_tool connection to AI Agent | ✓ |
| Workflow is active | ✓ |

## Migration Summary

**All 10 AI Agent tools now use toolHttpRequest:**

| Tool | Type | Status |
|------|------|--------|
| buscar_slots_disponiveis | toolHttpRequest | ✓ Phase 23 |
| buscar_agendamentos | toolHttpRequest | ✓ Phase 23 |
| buscar_paciente | toolHttpRequest | ✓ Phase 23 |
| status_pre_checkin | toolHttpRequest | ✓ Phase 23 |
| buscar_instrucoes | toolHttpRequest | ✓ Phase 23 |
| criar_agendamento | toolHttpRequest | ✓ Phase 24 |
| reagendar_agendamento | toolHttpRequest | ✓ Phase 24 |
| cancelar_agendamento | toolHttpRequest | ✓ Phase 24 |
| atualizar_dados_paciente | toolHttpRequest | ✓ Phase 24 |
| processar_documento | toolHttpRequest | ✓ Phase 25 |

## Notes

- Executed directly by orchestrator (subagents lack MCP access)
- No code commits needed (N8N workflow changes via MCP API)
- Old sub-workflow `Pc0PyATrZaGefiSJ` still exists for archival in Phase 26
