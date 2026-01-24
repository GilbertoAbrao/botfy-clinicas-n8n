# Phase 21: N8N Integration - Research

**Researched:** 2026-01-24
**Domain:** N8N workflow migration, HTTP Request nodes, credential management, gradual rollout
**Confidence:** MEDIUM-HIGH

## Summary

Phase 21 focuses on migrating N8N AI Agent tools from Execute Workflow sub-workflows to HTTP Request nodes calling Next.js APIs. This involves: (1) creating an N8N credential to securely store the API key, (2) replacing 11 "Execute Sub-Workflow" tool configurations with HTTP Request nodes using Bearer token authentication, (3) implementing gradual rollout using a Switch/IF node with random percentage routing, and (4) archiving (not deleting) the original sub-workflows with documented rollback procedures.

The Next.js APIs are already built and tested (Phases 17-20). The main work is N8N-side configuration: credential creation, HTTP Request node setup per tool, routing logic for gradual rollout, and documentation for rollback.

**Primary recommendation:** Create a single N8N "Header Auth" credential with `Authorization: Bearer <api_key>`, replace each tool's Execute Workflow node with an HTTP Request node pointing to the corresponding API endpoint, and use a Code node with `Math.random()` for percentage-based traffic routing during rollout.

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| N8N HTTP Request Node | n8n 2.0+ | Makes API calls to Next.js | Built-in, no extra dependencies |
| N8N Header Auth Credential | Built-in | Stores Bearer token securely | Encrypted storage, sharable across nodes |
| N8N Switch/IF Node | Built-in | Routes traffic for gradual rollout | Native conditional routing |
| N8N Code Node | Built-in | Random percentage logic | `Math.random()` for A/B routing |

### Supporting
| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| N8N Set/Edit Fields Node | Built-in | Transform API response for AI Agent | Map JSON response to tool output format |
| N8N Merge Node | Built-in | Combine old/new paths after rollout | Unify output regardless of route taken |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Header Auth | Predefined Credential (Bearer Auth) | Known issues with Bearer Auth credential not sending headers correctly in some versions; Header Auth is more reliable |
| Code Node for routing | n8n-nodes-randomizer community node | Requires community node install; Code node is built-in |
| Switch Node | IF Node | IF has 2 outputs; Switch supports multiple; both work for simple A/B |

**No npm install needed** - all changes are in N8N workflow configuration.

## Architecture Patterns

### Current Architecture (Sub-workflows)
```
AI Agent → Execute Sub-Workflow → Tool: Buscar Slots → Return to AI Agent
                                      ↓
                                  Supabase (direct DB access)
```

### Target Architecture (HTTP Request)
```
AI Agent → HTTP Request Node → Next.js API → Return to AI Agent
                    ↓                ↓
               Bearer Auth      Supabase (via Prisma)
                (credential)
```

### Pattern 1: HTTP Request Tool Configuration
**What:** Replace Execute Workflow node with HTTP Request node for each tool
**When to use:** All 11 AI Agent tools

**Example (buscar_slots_disponiveis):**
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://your-domain.com/api/agent/slots",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "data", "value": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}"}
      ]
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "<credential-id>",
      "name": "Botfy Agent API Key"
    }
  }
}
```

### Pattern 2: Response Transformation for AI Agent
**What:** Transform API JSON response to string format expected by AI Agent
**When to use:** AI Agent tools expect string output, not JSON

**Example:**
```javascript
// In Set/Edit Fields node after HTTP Request
// Transform: { success: true, data: { slots: [...] } }
// To: "Horarios disponiveis: 08:00, 09:00, 10:00"

const response = $json;
if (response.success) {
  const slots = response.data.slots || [];
  return `Horarios disponiveis para ${response.data.date}: ${slots.join(', ')}`;
} else {
  return `Erro: ${response.error}`;
}
```

### Pattern 3: Gradual Rollout with Random Routing
**What:** Route percentage of traffic to new HTTP path vs old sub-workflow
**When to use:** During migration rollout phases (10% -> 50% -> 100%)

**Example (Code node + Switch):**
```javascript
// Code Node: Generate random routing decision
const rolloutPercentage = 0.10; // Start at 10%
const useNewPath = Math.random() < rolloutPercentage;
return [{ json: { useNewPath, rolloutPercentage } }];

// Switch Node: Route based on useNewPath
// Output 0: useNewPath === true -> HTTP Request
// Output 1: useNewPath === false -> Execute Workflow (legacy)
```

### Pattern 4: Rollback-Ready Tool Structure
**What:** Keep both paths wired but toggle via percentage
**When to use:** Throughout rollout period

```
[AI Agent Tool Input]
        ↓
[Rollout Decision] (Code node)
        ↓
[Switch Node]
    ├── Output 0 (new): HTTP Request → Transform Response
    └── Output 1 (old): Execute Sub-Workflow
        ↓
[Merge Node]
        ↓
[Return to AI Agent]
```

### Anti-Patterns to Avoid
- **Deleting sub-workflows during migration:** Archive only, never delete until 100% stable for 1+ week
- **Hardcoding API key in workflow:** Always use N8N credential system for encryption
- **Testing in production first:** Test each tool with manual execution before enabling in AI Agent
- **Big bang migration:** Never switch all 11 tools at once; go tool by tool

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Credential encryption | Custom encryption logic | N8N built-in credential storage | N8N encrypts with N8N_ENCRYPTION_KEY, auditable |
| Percentage routing | Complex expression in IF | Code node + Math.random() | Clearer, easier to adjust percentage |
| Response parsing | Manual JSON.parse in expressions | HTTP Request responseFormat: json | Built-in parsing with error handling |
| Retry logic | Custom retry loops | HTTP Request retry on fail option | Built-in exponential backoff |
| Error handling | try/catch in Code nodes | HTTP Request error outputs | Native error routing to fallback path |

**Key insight:** N8N has built-in features for authentication, retries, and error routing. Using them ensures consistency and reduces maintenance burden.

## Common Pitfalls

### Pitfall 1: Bearer Auth Credential Not Sending Headers
**What goes wrong:** API returns 401 even with correct token
**Why it happens:** Known N8N issue where Bearer Auth credential type doesn't always send Authorization header (reported in N8N GitHub issues)
**How to avoid:** Use "Header Auth" credential type instead of "Bearer Auth":
  - Header Name: `Authorization`
  - Header Value: `Bearer <your-api-key>`
**Warning signs:** Consistent 401 errors in N8N execution logs

### Pitfall 2: AI Agent Expects String, Gets JSON
**What goes wrong:** AI Agent shows raw JSON in conversation or errors
**Why it happens:** HTTP Request returns JSON object, but AI Agent tools expect string output
**How to avoid:** Add transformation node after HTTP Request to format response as human-readable string
**Warning signs:** Patient sees `{"success":true,"data":{...}}` in WhatsApp

### Pitfall 3: Sub-workflow Input Format Mismatch
**What goes wrong:** API returns different structure than old sub-workflow
**Why it happens:** APIs return `{success, data}` format; sub-workflows returned `{resultado: "string"}`
**How to avoid:** Map API response to match old output format in transformation node
**Warning signs:** AI Agent behavior changes after migration

### Pitfall 4: Forgetting to Update All Tool References
**What goes wrong:** Some tools still call sub-workflows, causing inconsistent behavior
**Why it happens:** AI Agent has 11 tools; easy to miss one during migration
**How to avoid:** Create checklist of all 11 tools, check off each as migrated
**Warning signs:** Execution logs show mix of HTTP Request and Execute Workflow calls

### Pitfall 5: No Monitoring During Rollout
**What goes wrong:** Errors accumulate unnoticed, patients get bad experience
**Why it happens:** No active monitoring of new path success rate
**How to avoid:** Check N8N execution history daily; set up alerts for repeated failures
**Warning signs:** Increased patient complaints about bot responses

### Pitfall 6: Credential Ownership Issues
**What goes wrong:** Other workflows can't use credential, or credential stops working after team member leaves
**Why it happens:** N8N credentials are owned by creating user
**How to avoid:** Create credential with admin/owner account, document credential ID
**Warning signs:** "Credential not found" errors after personnel changes

## Code Examples

### N8N Credential Configuration (Header Auth)
```json
// Create via N8N UI: Credentials -> Add New -> Header Auth
{
  "name": "Botfy Agent API Key",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "Bearer bfk_XXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```
Source: N8N docs - Header Auth is more reliable than Bearer Auth credential type

### HTTP Request Node for GET Endpoint
```json
// GET /api/agent/slots
{
  "parameters": {
    "method": "GET",
    "url": "={{ $env.NEXTJS_API_URL }}/api/agent/slots",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "data", "value": "={{ $fromAI('data', 'Data YYYY-MM-DD', 'string') }}"},
        {"name": "profissional", "value": "={{ $fromAI('profissional', 'Nome do profissional', 'string') }}"}
      ]
    },
    "options": {
      "response": {"response": {"responseFormat": "json"}},
      "timeout": 30000
    }
  },
  "credentials": {
    "httpHeaderAuth": {"id": "<cred-id>", "name": "Botfy Agent API Key"}
  }
}
```

### HTTP Request Node for POST Endpoint
```json
// POST /api/agent/agendamentos
{
  "parameters": {
    "method": "POST",
    "url": "={{ $env.NEXTJS_API_URL }}/api/agent/agendamentos",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {"name": "nome", "value": "={{ $fromAI('nome', 'Nome do paciente', 'string') }}"},
        {"name": "telefone", "value": "={{ $fromAI('telefone', 'Telefone', 'string') }}"},
        {"name": "servico", "value": "={{ $fromAI('servico', 'Tipo do servico', 'string') }}"},
        {"name": "dataHora", "value": "={{ $fromAI('dataHora', 'Data e hora ISO', 'string') }}"}
      ]
    },
    "contentType": "json",
    "options": {
      "response": {"response": {"responseFormat": "json"}}
    }
  }
}
```

### Response Transformation (Code Node)
```javascript
// Transform API response to AI Agent expected format
const response = $input.first().json;

if (response.success) {
  // Format based on endpoint type
  if (response.data.slots) {
    // Slots endpoint
    const slots = response.data.slots.slice(0, 6);
    return [{
      json: {
        response: `Horarios disponiveis para ${response.data.date}: ${slots.join(', ')}. Pergunte qual horario o paciente prefere.`
      }
    }];
  } else if (response.data.id) {
    // Create/update endpoint
    return [{
      json: {
        response: `Operacao realizada com sucesso. ID: ${response.data.id}`
      }
    }];
  }
  // Default success
  return [{ json: { response: JSON.stringify(response.data) } }];
} else {
  return [{ json: { response: `Erro: ${response.error}` } }];
}
```

### Gradual Rollout Decision (Code Node)
```javascript
// Place at start of each tool flow
// Adjust percentage for rollout phases: 0.10 -> 0.50 -> 1.0

const ROLLOUT_PERCENTAGE = 0.10; // 10% to new path
const random = Math.random();
const useNewPath = random < ROLLOUT_PERCENTAGE;

// Log for monitoring
console.log(`Rollout decision: ${useNewPath ? 'NEW' : 'OLD'} (random: ${random.toFixed(3)}, threshold: ${ROLLOUT_PERCENTAGE})`);

return [{
  json: {
    ...($input.first().json),
    _rollout: {
      useNewPath,
      percentage: ROLLOUT_PERCENTAGE,
      random: random.toFixed(3)
    }
  }
}];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Execute Sub-Workflow | HTTP Request to API | This migration | Better separation of concerns, testability |
| Supabase nodes (deprecated) | Postgres nodes | N8N 1.x | Direct SQL queries, more control |
| Start node | Execute Workflow Trigger | N8N 2.0 (Dec 2025) | Sub-workflows must use new trigger |
| Bearer Auth credential | Header Auth credential | Ongoing | More reliable header sending |

**Deprecated/outdated:**
- Supabase nodes: N8N deprecated in favor of Postgres nodes
- Start node: Replaced by Manual Trigger or Execute Workflow Trigger in N8N 2.0
- Global credentials: Best practice is workflow-specific credentials to limit blast radius

## Tool-to-API Mapping

| Tool | Sub-workflow ID | API Endpoint | HTTP Method |
|------|-----------------|--------------|-------------|
| buscar_slots_disponiveis | 8Bke6sYr7r51aeEq | /api/agent/slots | GET |
| buscar_agendamentos | 8Ug0F3KuLov6EeCQ | /api/agent/agendamentos | GET |
| criar_agendamento | eEx2enJk3YpreNUm | /api/agent/agendamentos | POST |
| reagendar_agendamento | 21EHe24mkMmfBhK6 | /api/agent/agendamentos/:id | PATCH |
| cancelar_agendamento | gE2rpbLVUlnA5yMk | /api/agent/agendamentos/:id | DELETE |
| buscar_paciente | igG6sZsStxiDzNRY | /api/agent/paciente | GET |
| atualizar_dados_paciente | 4DNyXp5fPPfsFOnR | /api/agent/paciente/:id | PATCH |
| confirmar_presenca | (inline in main workflow) | /api/agent/agendamentos/:id/confirmar | POST |
| status_pre_checkin | holwGQuksZPsSb19 | /api/agent/pre-checkin/status | GET |
| buscar_instrucoes | NUZv1Gt15LKyiiKz | /api/agent/instrucoes | GET |
| processar_documento | Pc0PyATrZaGefiSJ | /api/agent/documentos/processar | POST (multipart) |

## Rollout Strategy

### Phase 1: 10% Traffic (Day 1-2)
- Enable new path for 10% of requests
- Monitor N8N execution logs hourly
- Check for 401 errors (auth issues)
- Check for response format issues

### Phase 2: 50% Traffic (Day 3-4)
- Increase to 50% if no errors in Phase 1
- Continue monitoring
- Document any edge cases found

### Phase 3: 100% Traffic (Day 5-7)
- Full migration to HTTP Request
- Keep sub-workflows available but unused
- Continue monitoring for 1 week

### Post-Rollout: Archive (Day 14+)
- After 1 week at 100% with no issues:
  - Move sub-workflows to "Deprecated" folder in N8N
  - Add "[ARCHIVED]" prefix to workflow names
  - Deactivate workflows (they're already inactive as tools)
  - Keep backups in `workflows-backup/` directory
  - DO NOT delete workflows

## Rollback Procedure

**Objective:** Revert to sub-workflows in under 5 minutes

### Steps:
1. **Change rollout percentage to 0:**
   - Open main AI Agent workflow
   - Find Rollout Decision Code nodes
   - Change `ROLLOUT_PERCENTAGE = 0.0`
   - Save workflow

2. **Immediate effect:**
   - All new requests route to Execute Workflow path
   - No code deployment needed
   - No N8N restart needed

3. **Verify rollback:**
   - Send test message to WhatsApp
   - Check N8N execution log
   - Confirm Execute Workflow nodes are being used

4. **If credential issue:**
   - Check N8N Credentials section
   - Verify credential still exists and is accessible
   - Re-create credential if needed

### Time Estimate:
- Step 1: 30 seconds
- Step 2: Immediate
- Step 3: 2 minutes
- Total: < 5 minutes

## Open Questions

1. **Environment variable for API URL**
   - What we know: Need base URL for API endpoints
   - What's unclear: Is `$env.NEXTJS_API_URL` set in N8N environment?
   - Recommendation: Create environment variable in N8N settings or use direct URL

2. **Multipart form data for document processing**
   - What we know: POST /api/agent/documentos/processar expects multipart/form-data
   - What's unclear: How N8N HTTP Request handles file uploads from AI Agent context
   - Recommendation: May need Code node to construct multipart request, or separate handling

3. **Confirmar Presenca tool location**
   - What we know: This tool might be inline in main workflow, not a sub-workflow
   - What's unclear: Exact location in workflow JSON
   - Recommendation: Search main workflow for confirmar_presenca to locate

## Sources

### Primary (HIGH confidence)
- N8N Official Docs - HTTP Request credentials: https://docs.n8n.io/integrations/builtin/credentials/httprequest/
- N8N Official Docs - Switch Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/
- N8N Official Docs - External Secrets: https://docs.n8n.io/external-secrets/
- Project codebase: `src/lib/agent/auth.ts`, `src/lib/agent/middleware.ts` - verified authentication pattern
- Project codebase: `workflows-backup/*.json` - verified sub-workflow structure

### Secondary (MEDIUM confidence)
- N8N Community: Bearer Auth known issues: https://community.n8n.io/t/using-a-bearer-token-with-http-request-api-calls/25264
- N8N Community: Randomizer patterns: https://community.n8n.io/t/randomizer/2338
- N8N Blog: AI Agent deployment best practices: https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/
- Medium: n8n Blue-Green Workflow Deploys: https://medium.com/@kaushalsinh73/n8n-blue-green-workflow-deploys-versioned-flows-with-one-click-rollback-51bc32a4b24c

### Tertiary (LOW confidence)
- General workflow migration patterns from training data - verified against current docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - N8N built-in nodes, verified in docs
- Architecture: HIGH - Pattern derived from existing codebase structure
- Rollout strategy: MEDIUM - Based on best practices, not project-specific experience
- Pitfalls: HIGH - Derived from N8N community issues and official docs
- Rollback: MEDIUM - Theoretical, needs validation during implementation

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - N8N is stable, major changes unlikely)
