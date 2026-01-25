# Phase 23: Query Tools Migration - Research

**Researched:** 2026-01-25
**Domain:** N8N AI Agent Tool Migration (toolWorkflow to toolHttpRequest)
**Confidence:** HIGH

## Summary

This phase migrates 5 read-only query tools from N8N `toolWorkflow` nodes to `toolHttpRequest` nodes. The existing Next.js Agent APIs (built in v2.0) are fully functional and use Bearer token authentication via the `Authorization` header.

The migration involves replacing sub-workflow calls with direct HTTP requests to the Next.js API endpoints. Each `toolHttpRequest` node needs:
1. A descriptive name and description for the AI to understand when to use it
2. HTTP method (GET for all query tools)
3. URL with placeholders for dynamic parameters
4. Authorization header with Bearer token
5. Query parameters matching the existing API schemas

**Primary recommendation:** Use the `toolHttpRequest` node with manual header configuration (not predefined credentials) to pass the Bearer token, as this provides the most control and avoids known issues with n8n's built-in Bearer Auth.

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `@n8n/n8n-nodes-langchain.toolHttpRequest` | 2.x | HTTP tool for AI Agent | Official n8n node for HTTP-based tools |
| Next.js Agent APIs | v2.0 (existing) | Backend endpoints | Already built, tested, production-ready |
| Bearer token auth | N/A | API authentication | Already implemented in withAgentAuth middleware |

### N8N Node Types
| Node Type | Purpose | When to Use |
|-----------|---------|-------------|
| `toolHttpRequest` | Make HTTP calls from AI Agent | Query/write external APIs |
| `toolWorkflow` | Execute sub-workflow | Complex logic with multiple nodes (being replaced) |
| `toolCode` | Run JavaScript/Python | Custom logic (e.g., confirmar_presenca) |

### N8N Credential Types
| Type | Purpose | Recommendation |
|------|---------|----------------|
| `httpHeaderAuth` | Custom header auth | Use this for Bearer token |
| Built-in Bearer Auth | Automatic auth | Known bugs, avoid |

## Architecture Patterns

### Current Architecture (Before Migration)

```
AI Agent (bPJamJhBcrVCKgBg)
    |
    +-- toolWorkflow: buscar_slots_disponiveis
    |       |
    |       +-- Sub-workflow 8Bke6sYr7r51aeEq (9 nodes)
    |
    +-- toolWorkflow: buscar_agendamentos
    |       |
    |       +-- Sub-workflow 8Ug0F3KuLov6EeCQ (4 nodes)
    |
    +-- toolWorkflow: buscar_paciente
    |       |
    |       +-- Sub-workflow igG6sZsStxiDzNRY (5 nodes)
    |
    +-- toolWorkflow: status_pre_checkin
    |       |
    |       +-- Sub-workflow holwGQuksZPsSb19 (8 nodes)
    |
    +-- toolWorkflow: buscar_instrucoes
            |
            +-- Sub-workflow NUZv1Gt15LKyiiKz (6 nodes)
```

### Target Architecture (After Migration)

```
AI Agent (bPJamJhBcrVCKgBg)
    |
    +-- toolHttpRequest: buscar_slots_disponiveis
    |       |
    |       +-- GET https://botfy-clinicas.com/api/agent/slots?data={data}
    |
    +-- toolHttpRequest: buscar_agendamentos
    |       |
    |       +-- GET https://botfy-clinicas.com/api/agent/agendamentos?telefone={telefone}
    |
    +-- toolHttpRequest: buscar_paciente
    |       |
    |       +-- GET https://botfy-clinicas.com/api/agent/paciente?telefone={telefone}
    |
    +-- toolHttpRequest: status_pre_checkin
    |       |
    |       +-- GET https://botfy-clinicas.com/api/agent/pre-checkin/status?agendamentoId={id}
    |
    +-- toolHttpRequest: buscar_instrucoes
            |
            +-- GET https://botfy-clinicas.com/api/agent/instrucoes?servicoId={servicoId}
```

### Pattern: toolHttpRequest Node Configuration

**What:** Configure HTTP Request Tool for AI Agent integration
**When to use:** Replacing toolWorkflow with direct API calls

**JSON Structure:**
```json
{
  "parameters": {
    "name": "tool_name",
    "toolDescription": "Description for AI to understand when to use this tool",
    "method": "GET",
    "url": "https://example.com/api/endpoint?param={placeholder}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": false,
    "sendQuery": false,
    "sendBody": false,
    "placeholderDefinitions": {
      "values": [
        {
          "name": "placeholder",
          "description": "Description for AI to provide this value"
        }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 2,
  "position": [x, y],
  "id": "unique-id",
  "name": "tool_name",
  "credentials": {
    "httpHeaderAuth": {
      "id": "credential-id",
      "name": "Botfy Agent API"
    }
  }
}
```

### Anti-Patterns to Avoid

- **Hardcoding Bearer token in URL or headers:** Use credentials for security
- **Using built-in Bearer Auth:** Known bugs with n8n Bearer Auth, use httpHeaderAuth instead
- **Not defining placeholders:** AI won't know what parameters to provide
- **Missing tool description:** AI can't decide when to use the tool

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP authentication | Manual auth header in each request | N8N Credentials (httpHeaderAuth) | Centralized, secure, reusable |
| Parameter passing | Hardcoded query strings | Placeholders with `{name}` syntax | AI can provide dynamic values |
| Error handling | Custom error parsing | N8N built-in response handling | Consistent error format |

**Key insight:** The toolHttpRequest node handles most complexity (auth, parameters, response parsing). Don't recreate these features manually.

## Common Pitfalls

### Pitfall 1: Bearer Auth Credential Type Bug
**What goes wrong:** Using n8n's built-in "Bearer Auth" credential type doesn't send the Authorization header correctly.
**Why it happens:** Known bug in n8n (Issue #15261)
**How to avoid:** Use "Header Auth" credential type instead, manually setting the header name to `Authorization` and value to `Bearer <token>`
**Warning signs:** API returns 401 even with valid token configured

### Pitfall 2: Placeholder Syntax Confusion
**What goes wrong:** Using wrong syntax for placeholders
**Why it happens:** Multiple syntaxes exist (`{name}`, `{{name}}`, `$fromAI()`)
**How to avoid:** In toolHttpRequest, use `{placeholder}` in URL/query/body. Define each placeholder in `placeholderDefinitions`
**Warning signs:** AI provides values but they don't appear in request

### Pitfall 3: Query Parameters vs URL Path
**What goes wrong:** Putting query parameters in URL path or vice versa
**Why it happens:** Confusion between `/api/slots/{date}` and `/api/slots?data={date}`
**How to avoid:** Our APIs use query parameters for all filters. Always use `?param={placeholder}` format
**Warning signs:** 404 errors or empty responses

### Pitfall 4: Missing Placeholder Definition
**What goes wrong:** Using a placeholder without defining it in `placeholderDefinitions`
**Why it happens:** Assuming AI will infer parameters automatically
**How to avoid:** Every `{placeholder}` in URL/query must have a corresponding entry in `placeholderDefinitions.values`
**Warning signs:** AI doesn't provide expected parameters

### Pitfall 5: Wrong HTTP Method
**What goes wrong:** Using POST for read-only operations
**Why it happens:** Copy-paste from write tool examples
**How to avoid:** Query tools use GET. Only write/create tools use POST/PATCH/DELETE
**Warning signs:** 405 Method Not Allowed errors

## Code Examples

### Example 1: buscar_slots_disponiveis Migration

**Before (toolWorkflow):**
```json
{
  "parameters": {
    "name": "buscar_slots_disponiveis",
    "description": "Busca horarios DISPONIVEIS para agendamento...",
    "workflowId": {
      "__rl": true,
      "value": "8Bke6sYr7r51aeEq",
      "mode": "id"
    },
    "workflowInputs": {
      "mappingMode": "defineBelow",
      "value": {
        "data": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}",
        "periodo": "={{ $fromAI('periodo', 'Periodo: manha, tarde ou qualquer', 'string') }}"
      }
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
  "typeVersion": 2
}
```

**After (toolHttpRequest):**
```json
{
  "parameters": {
    "name": "buscar_slots_disponiveis",
    "toolDescription": "Busca horarios DISPONIVEIS para agendamento. SEMPRE use antes de oferecer horarios. Parametros: data (YYYY-MM-DD obrigatorio), profissional (opcional), servicoId (opcional).",
    "method": "GET",
    "url": "={{ $env.AGENT_API_URL }}/api/agent/slots?data={data}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "placeholderDefinitions": {
      "values": [
        {
          "name": "data",
          "description": "Data no formato YYYY-MM-DD para buscar horarios disponiveis"
        }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 2,
  "id": "tool-http-slots",
  "name": "buscar_slots_disponiveis",
  "credentials": {
    "httpHeaderAuth": {
      "id": "botfy-agent-auth",
      "name": "Botfy Agent API"
    }
  }
}
```

### Example 2: buscar_paciente Migration

**After (toolHttpRequest):**
```json
{
  "parameters": {
    "name": "buscar_paciente",
    "toolDescription": "Busca dados de um paciente pelo telefone, CPF ou nome. Retorna dados cadastrais e proximos agendamentos. Use para verificar se paciente existe no sistema.",
    "method": "GET",
    "url": "={{ $env.AGENT_API_URL }}/api/agent/paciente?telefone={telefone}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "placeholderDefinitions": {
      "values": [
        {
          "name": "telefone",
          "description": "Telefone do paciente com DDD (ex: 5511999998888)"
        }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 2,
  "id": "tool-http-paciente",
  "name": "buscar_paciente",
  "credentials": {
    "httpHeaderAuth": {
      "id": "botfy-agent-auth",
      "name": "Botfy Agent API"
    }
  }
}
```

### Example 3: N8N Credential Setup for Header Auth

**Credential configuration in N8N:**
```json
{
  "name": "Botfy Agent API",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer <your-agent-api-key>"
  }
}
```

## Tool Migration Reference

### Tool 1: buscar_slots_disponiveis

| Aspect | Details |
|--------|---------|
| **Endpoint** | `GET /api/agent/slots` |
| **Required params** | `data` (YYYY-MM-DD) |
| **Optional params** | `profissional`, `servicoId`, `duracaoMinutos` |
| **Response** | `{ success: true, data: { date, slots: ["08:00",...], totalAvailable, period: {morning, afternoon} } }` |
| **Old workflow ID** | `8Bke6sYr7r51aeEq` |

### Tool 2: buscar_agendamentos

| Aspect | Details |
|--------|---------|
| **Endpoint** | `GET /api/agent/agendamentos` |
| **Required params** | None (but should provide filters) |
| **Optional params** | `pacienteId`, `telefone`, `dataInicio`, `dataFim`, `status`, `servicoId`, `tipoConsulta`, `profissional`, `page`, `limit` |
| **Response** | `{ success: true, data: { agendamentos: [...], pagination: {...} } }` |
| **Old workflow ID** | `8Ug0F3KuLov6EeCQ` |

### Tool 3: buscar_paciente

| Aspect | Details |
|--------|---------|
| **Endpoint** | `GET /api/agent/paciente` |
| **Required params** | At least one of: `telefone`, `cpf`, `nome` |
| **Response (exact)** | `{ success: true, data: { patient: {...}, matchType: "exact", upcomingAppointments: [...] } }` |
| **Response (partial)** | `{ success: true, data: { patient: null, patients: [...], matchType: "partial" } }` |
| **Old workflow ID** | `igG6sZsStxiDzNRY` |

### Tool 4: status_pre_checkin

| Aspect | Details |
|--------|---------|
| **Endpoint** | `GET /api/agent/pre-checkin/status` |
| **Required params** | At least one of: `agendamentoId`, `pacienteId`, `telefone` |
| **Response** | `{ success: true, data: { exists, status, agendamentoId, dadosConfirmados, documentosEnviados, instrucoesEnviadas, pendencias, appointment } }` |
| **Old workflow ID** | `holwGQuksZPsSb19` |

### Tool 5: buscar_instrucoes

| Aspect | Details |
|--------|---------|
| **Endpoint** | `GET /api/agent/instrucoes` |
| **Required params** | None (returns all if no filters) |
| **Optional params** | `servicoId`, `tipoInstrucao` |
| **Response** | `{ success: true, data: { instrucoes: [...], total, filters, instructionTypes } }` |
| **Old workflow ID** | `NUZv1Gt15LKyiiKz` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| toolWorkflow with sub-workflows | toolHttpRequest with direct HTTP | 2025+ | Less overhead, simpler debugging, faster execution |
| $fromAI() in Edit Fields | Placeholders in URL | N8N 1.x | Cleaner parameter handling |
| Supabase nodes in sub-workflows | Next.js APIs with Prisma | v2.0 | Type safety, audit logging, better error handling |

**Deprecated/outdated:**
- Sub-workflows for simple API calls: replaced by toolHttpRequest
- `$fromAI()` function in toolWorkflow: replaced by placeholders in toolHttpRequest

## Open Questions

1. **Environment variable for API URL**
   - What we know: Need base URL for API endpoints
   - What's unclear: Should use `$env.AGENT_API_URL` or hardcode?
   - Recommendation: Use environment variable for flexibility between dev/staging/prod

2. **Credential ID for httpHeaderAuth**
   - What we know: Need to create credential in N8N
   - What's unclear: Exact credential ID will be generated by N8N
   - Recommendation: Create credential first, then update node configuration with actual ID

3. **Multiple placeholder support**
   - What we know: buscar_agendamentos has many optional params
   - What's unclear: How to handle multiple optional placeholders cleanly
   - Recommendation: Start with most common param (telefone), can enhance later

## Sources

### Primary (HIGH confidence)
- N8N Official Docs - HTTP Request Tool: https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolhttprequest/
- N8N Official Docs - AI Agent: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/
- Existing codebase: `/src/app/api/agent/*/route.ts`
- Existing workflow backup: `/workflows-backup/bPJamJhBcrVCKgBg-agendamento.json`

### Secondary (MEDIUM confidence)
- N8N Community - Bearer Token issues: https://community.n8n.io/t/using-a-bearer-token-with-http-request-api-calls/25264
- N8N GitHub Issue #15261: Bearer Auth bug

### Tertiary (LOW confidence)
- General N8N AI Agent tutorials (may be outdated)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official N8N documentation verified
- Architecture: HIGH - Existing codebase examined, patterns clear
- Pitfalls: MEDIUM - Based on community reports and GitHub issues

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable technology)
