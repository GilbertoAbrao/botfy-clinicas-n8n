# Phase 24: Write Tools Migration - Research

**Researched:** 2026-01-25
**Domain:** N8N AI Agent Tool Migration (toolWorkflow to toolHttpRequest) - Write Operations
**Confidence:** HIGH
**Based on:** Phase 23 research + API endpoint inspection

## Summary

This phase migrates 4 write tools from N8N `toolWorkflow` nodes to `toolHttpRequest` nodes. These tools use POST, PATCH, and DELETE methods to create, update, and cancel data. The migration pattern is identical to Phase 23 query tools, with the key difference being:

1. **HTTP Methods:** POST, PATCH, DELETE instead of GET
2. **Request Bodies:** JSON bodies with parameters instead of query strings
3. **Placeholder handling:** Body placeholders use `{placeholder}` syntax in JSON body
4. **Idempotency:** Some write APIs support idempotency keys

## Tools to Migrate

| Tool | Old Sub-workflow | Method | New Endpoint | Body Parameters |
|------|------------------|--------|--------------|-----------------|
| criar_agendamento | EAZ66xWQdFPnwfKB | POST | /api/agent/agendamentos | pacienteId, tipoConsulta, dataHora, profissional, observacoes |
| reagendar_agendamento | n4FPxZZq0Ql1q9zY | PATCH | /api/agent/agendamentos/{agendamentoId} | dataHora, profissional |
| cancelar_agendamento | kZ4nwDv2Yp8QHJS1 | DELETE | /api/agent/agendamentos/{agendamentoId} | motivo |
| atualizar_dados_paciente | WzK8mPvQJ5bNHxY7 | PATCH | /api/agent/paciente/{pacienteId} | nome, telefone, email, cpf, etc |

## API Endpoint Details

### POST /api/agent/agendamentos (criar_agendamento)

**Method:** POST
**Auth:** Bearer token

**Request Body:**
```json
{
  "pacienteId": 123,           // Required: patient ID
  "tipoConsulta": "Consulta",  // Required: appointment type
  "dataHora": "2026-01-27T14:00:00",  // Required: ISO 8601
  "profissional": "Dr. Silva", // Optional
  "observacoes": "Notes"       // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "dataHora": "2026-01-27T14:00:00",
    "tipoConsulta": "Consulta",
    "profissional": "Dr. Silva",
    "status": "agendada",
    "paciente": { "id": 123, "nome": "...", "telefone": "..." }
  }
}
```

**Error codes:** 400 (validation), 404 (patient not found), 409 (time conflict)

### PATCH /api/agent/agendamentos/:id (reagendar_agendamento)

**Method:** PATCH
**Auth:** Bearer token
**Path param:** Appointment ID

**Request Body:**
```json
{
  "dataHora": "2026-01-28T15:00:00",  // Optional: new time
  "profissional": "Dr. Santos"        // Optional: new provider
}
```

**Response:** Same structure as POST

**Error codes:** 400 (invalid ID), 404 (not found), 409 (time conflict)

### DELETE /api/agent/agendamentos/:id (cancelar_agendamento)

**Method:** DELETE
**Auth:** Bearer token
**Path param:** Appointment ID

**Request Body:**
```json
{
  "motivo": "Paciente solicitou cancelamento"  // Required: reason
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Agendamento cancelado com sucesso",
    "id": 456,
    "status": "cancelada",
    "alreadyCancelled": false
  }
}
```

**Error codes:** 400 (missing motivo), 404 (not found)

### PATCH /api/agent/paciente/:id (atualizar_dados_paciente)

**Method:** PATCH
**Auth:** Bearer token
**Path param:** Patient ID

**Request Body:**
```json
{
  "nome": "New Name",           // Optional
  "telefone": "11999999999",    // Optional
  "email": "email@example.com", // Optional
  "cpf": "12345678901",         // Optional
  "dataNascimento": "1990-01-15", // Optional
  "convenio": "Unimed"          // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "nome": "New Name",
    "telefone": "11999999999",
    ...
  }
}
```

**Error codes:** 400 (invalid ID), 404 (not found), 409 (phone in use)

## toolHttpRequest Configuration for Write Operations

**Key differences from GET tools:**
1. Use `"method": "POST"`, `"PATCH"`, or `"DELETE"`
2. Use `"sendBody": "json"` with body template
3. Path parameters use `{placeholder}` in URL path
4. Body parameters use `{placeholder}` in JSON body

### Pattern: POST with JSON Body

```json
{
  "parameters": {
    "name": "criar_agendamento",
    "toolDescription": "Cria um novo agendamento para um paciente...",
    "method": "POST",
    "url": "={{ $env.AGENT_API_URL }}/api/agent/agendamentos",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendBody": "json",
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ pacienteId: {pacienteId}, tipoConsulta: {tipoConsulta}, dataHora: {dataHora}, profissional: {profissional} }) }}",
    "placeholderDefinitions": {
      "values": [
        { "name": "pacienteId", "description": "ID do paciente" },
        { "name": "tipoConsulta", "description": "Tipo da consulta" },
        { "name": "dataHora", "description": "Data e hora ISO 8601" },
        { "name": "profissional", "description": "Nome do profissional (opcional)" }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 1.1
}
```

### Pattern: PATCH/DELETE with Path Parameter

```json
{
  "parameters": {
    "name": "cancelar_agendamento",
    "toolDescription": "Cancela um agendamento existente...",
    "method": "DELETE",
    "url": "={{ $env.AGENT_API_URL }}/api/agent/agendamentos/{agendamentoId}",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendBody": "json",
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ motivo: {motivo} }) }}",
    "placeholderDefinitions": {
      "values": [
        { "name": "agendamentoId", "description": "ID do agendamento a cancelar" },
        { "name": "motivo", "description": "Motivo do cancelamento" }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 1.1
}
```

## Common Pitfalls for Write Operations

### Pitfall 1: JSON Body Placeholder Syntax
**Problem:** Placeholders in JSON body may not interpolate correctly
**Solution:** Use expression syntax `={{ JSON.stringify({...}) }}` or test raw string approach

### Pitfall 2: Path Parameter Escaping
**Problem:** Path parameters with special characters may break URL
**Solution:** Ensure IDs are numeric, no escaping needed

### Pitfall 3: Optional Fields in Body
**Problem:** Including undefined/null values in JSON body
**Solution:** Only include fields that are provided, or handle null gracefully

### Pitfall 4: Error Response Handling
**Problem:** AI doesn't understand error responses
**Solution:** Good tool descriptions help AI interpret 404/409/422 errors

## Migration Strategy

**Wave 1:** Setup pattern + criar_agendamento (POST - most complex body)
**Wave 2:** reagendar_agendamento, cancelar_agendamento, atualizar_dados_paciente (parallel - simpler patterns)

## Verified from Phase 23

- ✓ Credential "Botfy Agent API" exists (httpHeaderAuth type)
- ✓ Environment variable AGENT_API_URL configured
- ✓ Remove+Add migration pattern works reliably
- ✓ AI Agent ai_tool connections work correctly

## Open Questions

1. **JSON body syntax:** Need to verify exact placeholder interpolation in body
   - Recommendation: Test with criar_agendamento first

2. **Optional parameters:** How to handle optional body fields
   - Recommendation: Include all params, let AI provide empty strings or test with subset

---

*Research complete. Ready for planning.*
