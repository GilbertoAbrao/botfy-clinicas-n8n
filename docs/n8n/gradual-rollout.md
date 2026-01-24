# Gradual Rollout Implementation Guide

**Purpose:** Safely migrate N8N AI Agent tools from sub-workflows to Next.js HTTP APIs using percentage-based traffic routing.

**Risk mitigation:** Gradual rollout enables instant rollback and production validation without all-or-nothing deployment.

---

## Table of Contents

1. [Overview](#overview)
2. [Rollout Phases](#rollout-phases)
3. [Node Structure](#node-structure)
4. [Implementation Steps](#implementation-steps)
5. [Adjusting Rollout Percentage](#adjusting-rollout-percentage)
6. [Monitoring](#monitoring)
7. [Instant Rollback](#instant-rollback)
8. [Per-Tool Configuration](#per-tool-configuration)

---

## Overview

### What is Gradual Rollout?

Gradual rollout routes a percentage of traffic to new HTTP Request nodes while keeping the rest on old sub-workflows. This allows production validation with real traffic before full migration.

**Example:**
- 10% rollout: 1 in 10 requests go to new API, 9 in 10 use old sub-workflow
- 50% rollout: Half of requests test new API
- 100% rollout: All traffic on new API (old sub-workflow can be deleted)

### Benefits

- **Safe validation:** Test new APIs with real production traffic
- **Instant rollback:** Set percentage to 0% to revert to old behavior
- **Progressive confidence:** Increase percentage as confidence grows
- **Single value change:** Adjust rollout by changing one number

---

## Rollout Phases

Recommended progression for safe migration:

| Phase | Percentage | Duration | Purpose |
|-------|------------|----------|---------|
| **Canary** | 10% | 24-48 hours | Initial smoke test with real traffic |
| **Beta** | 50% | 48-72 hours | Validate performance and reliability |
| **GA** | 100% | Permanent | Full migration complete |

**Validation criteria between phases:**

- ✅ No HTTP 5xx errors in N8N execution logs
- ✅ Response times comparable to old sub-workflow
- ✅ No validation errors (400 responses)
- ✅ Audit logs showing correct agentId and correlationId
- ✅ User reports no issues (WhatsApp conversations complete normally)

**If issues found:** Roll back to previous percentage or 0% immediately.

---

## Node Structure

### Routing Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Workflow                        │
│                                                             │
│  [AI Agent] → [Tool Call Detected]                         │
│                      ↓                                      │
│              [Rollout Decision Code]                        │
│                      ↓                                      │
│           useNewPath = Math.random() < 0.10  ← ADJUST HERE │
│                      ↓                                      │
│                  [Switch Node]                              │
│                 /           \                               │
│               /               \                             │
│    [useNewPath=true]    [useNewPath=false]                 │
│            ↓                     ↓                          │
│    [HTTP Request Node]    [Old Sub-Workflow]               │
│            ↓                     ↓                          │
│            └─────[Merge Node]────┘                          │
│                      ↓                                      │
│              [Return to AI Agent]                           │
└─────────────────────────────────────────────────────────────┘
```

### Node Responsibilities

| Node | Purpose | Configuration |
|------|---------|---------------|
| **Rollout Decision Code** | Calculate routing decision | Math.random() comparison |
| **Switch Node** | Route to old or new path | Branch on useNewPath boolean |
| **HTTP Request Node** | Call Next.js API | Header Auth credential |
| **Old Sub-Workflow** | Execute existing logic | No changes (fallback path) |
| **Merge Node** | Converge paths | Wait for all branches, continue with any |

---

## Implementation Steps

### Step 1: Add Rollout Decision Code Node

**Location:** After tool call detection, before routing to old sub-workflow

**Node Configuration:**

```javascript
// Node name: Rollout Decision - [Tool Name]
// Type: Code
// Mode: Run Once for All Items

// ROLLOUT PERCENTAGE: Adjust this value (0.0 to 1.0)
const ROLLOUT_PERCENTAGE = 0.10; // 10% of traffic to new API

// Calculate routing decision
const useNewPath = Math.random() < ROLLOUT_PERCENTAGE;

// Log decision for monitoring
console.log(`Rollout decision for ${$node["AI Agent"].json.toolName}: ${useNewPath ? 'NEW API' : 'OLD SUB-WORKFLOW'} (${ROLLOUT_PERCENTAGE * 100}% rollout)`);

return [{
  json: {
    useNewPath,
    rolloutPercentage: ROLLOUT_PERCENTAGE,
    toolName: $node["AI Agent"].json.toolName
  }
}];
```

**Key points:**
- `ROLLOUT_PERCENTAGE` is the ONLY value to change when adjusting rollout
- `Math.random()` generates 0.0 to 1.0 (uniform distribution)
- Log includes decision and percentage for debugging

### Step 2: Add Switch Node

**Node Configuration:**

```json
{
  "name": "Route: New API or Old Workflow",
  "type": "n8n-nodes-base.switch",
  "parameters": {
    "mode": "rules",
    "rules": {
      "rules": [
        {
          "operation": "equal",
          "value1": "={{ $json.useNewPath }}",
          "value2": true,
          "output": 0
        }
      ]
    },
    "fallbackOutput": 1
  }
}
```

**Outputs:**
- **Output 0** (useNewPath=true): Connect to HTTP Request node
- **Output 1** (fallback): Connect to old sub-workflow

### Step 3: Add HTTP Request Node

See `docs/n8n/api-endpoints.md` for per-tool HTTP Request configuration.

**General structure:**

```json
{
  "name": "HTTP Request - [Tool Name]",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://console.botfyclinics.com.br/api/agent/[endpoint]",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "headerAuth",
    "method": "GET",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "options": {
      "timeout": 30000
    }
  },
  "credentials": {
    "headerAuth": {
      "id": "1",
      "name": "Botfy Console API Key"
    }
  }
}
```

**IMPORTANT:** All HTTP Request nodes share the SAME Header Auth credential (single API key).

### Step 4: Add Merge Node

**Node Configuration:**

```json
{
  "name": "Merge Paths",
  "type": "n8n-nodes-base.merge",
  "parameters": {
    "mode": "passThrough",
    "options": {
      "waitForAll": false
    }
  }
}
```

**Settings:**
- **Mode:** Pass-through (don't modify data)
- **Wait for all:** false (only one path executes per request)

**Connections:**
- **Input 1:** HTTP Request node output
- **Input 2:** Old sub-workflow output
- **Output:** Connect to AI Agent return path

### Step 5: Connect Nodes

```
Rollout Decision Code
  ↓
Switch Node
  ├─ Output 0 → HTTP Request Node → Merge Node
  └─ Output 1 → Old Sub-Workflow → Merge Node
                                      ↓
                                 AI Agent
```

---

## Adjusting Rollout Percentage

### Single Value Change

To adjust rollout, edit **ONLY** the `ROLLOUT_PERCENTAGE` constant in the Rollout Decision Code node.

**Examples:**

```javascript
// 0% rollout (all traffic to old sub-workflow)
const ROLLOUT_PERCENTAGE = 0.00;

// 10% rollout (canary phase)
const ROLLOUT_PERCENTAGE = 0.10;

// 50% rollout (beta phase)
const ROLLOUT_PERCENTAGE = 0.50;

// 100% rollout (full migration)
const ROLLOUT_PERCENTAGE = 1.00;
```

**Steps:**
1. Open AI Agent workflow in N8N
2. Click "Rollout Decision - [Tool Name]" Code node
3. Change `ROLLOUT_PERCENTAGE` value
4. Click "Save" (no need to deactivate/reactivate workflow)
5. Change takes effect immediately for new requests

### Rollout Schedule Example

**Tool:** buscar_slots_disponiveis

```javascript
// Day 1-2: Canary (10%)
const ROLLOUT_PERCENTAGE = 0.10;

// Day 3-5: Beta (50%) - if no issues
const ROLLOUT_PERCENTAGE = 0.50;

// Day 6+: GA (100%) - if performance validated
const ROLLOUT_PERCENTAGE = 1.00;
```

**After 1 week at 100% with no issues:** Delete old sub-workflow and rollout nodes (direct connection to HTTP Request).

---

## Monitoring

### Execution Logs

**View:** N8N → Executions → Filter by workflow "AI Agent"

**What to check:**

1. **Rollout decision logs:**
   ```
   Rollout decision for buscar_slots_disponiveis: NEW API (10% rollout)
   Rollout decision for buscar_slots_disponiveis: OLD SUB-WORKFLOW (10% rollout)
   ```

   Validate distribution matches expected percentage.

2. **HTTP Request node success:**
   - Status code: 200
   - Response time: < 2 seconds (typical)
   - Response structure: matches old sub-workflow output

3. **Error rates:**
   - HTTP 4xx: Validation errors (check request payload)
   - HTTP 5xx: Server errors (rollback immediately)
   - Network timeout: Check Console API health

### Supabase Audit Logs

**Query:** Check audit_logs table for AGENT_* actions

```sql
SELECT
  action,
  agent_id,
  correlation_id,
  created_at,
  success,
  details
FROM audit_logs
WHERE
  action LIKE 'AGENT_%'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 100;
```

**Validate:**
- agentId present and correct (from API key)
- correlationId present (UUID format)
- success = true for normal requests
- details JSON structured correctly

### WhatsApp Conversation Testing

**Manual validation:**

1. Send test message to clinic WhatsApp number
2. Trigger tool call (e.g., "Quais horários disponíveis amanhã?")
3. Verify response correct and timely
4. Check N8N execution log for rollout decision
5. Repeat 10x to validate percentage distribution

---

## Instant Rollback

### When to Rollback

**Immediate rollback (set to 0%) if:**
- HTTP 5xx errors in execution logs
- Response times > 5 seconds consistently
- Validation errors not seen in old sub-workflow
- User reports issues (incorrect responses, timeouts)
- Database connection errors in Console logs

### Rollback Procedure

**Time: < 30 seconds**

1. Open N8N AI Agent workflow
2. Click "Rollout Decision - [Tool Name]" Code node
3. Change to `const ROLLOUT_PERCENTAGE = 0.00;`
4. Click "Save"
5. All new requests immediately use old sub-workflow
6. In-flight requests complete on their current path

**Post-rollback:**
- Investigate root cause in Console logs (`/var/log/console/` or Vercel logs)
- Fix issue in Next.js API code
- Test with 10% rollout again after fix deployed

### Partial Rollback

If only some tools have issues:

```javascript
// Tool A: Working well, keep at 50%
// File: Rollout Decision - buscar_slots_disponiveis
const ROLLOUT_PERCENTAGE = 0.50;

// Tool B: Showing errors, roll back to 0%
// File: Rollout Decision - criar_agendamento
const ROLLOUT_PERCENTAGE = 0.00;
```

Each tool has independent rollout control.

---

## Per-Tool Configuration

### All 11 Tools

Each tool needs its own rollout nodes. Copy the structure above for each:

1. **buscar_slots_disponiveis** → GET /api/agent/slots
2. **criar_agendamento** → POST /api/agent/agendamentos
3. **reagendar_agendamento** → PATCH /api/agent/agendamentos/:id
4. **cancelar_agendamento** → DELETE /api/agent/agendamentos/:id
5. **buscar_agendamentos** → GET /api/agent/agendamentos
6. **buscar_paciente** → GET /api/agent/paciente
7. **atualizar_dados_paciente** → PATCH /api/agent/paciente/:id
8. **confirmar_presenca** → POST /api/agent/agendamentos/:id/confirmar
9. **status_pre_checkin** → GET /api/agent/pre-checkin/status
10. **buscar_instrucoes** → GET /api/agent/instrucoes
11. **processar_documento** → POST /api/agent/documentos/processar

### Node Naming Convention

Use consistent names for easy identification:

```
Rollout Decision - [tool_name]
Route: [tool_name] New API or Old Workflow
HTTP Request - [tool_name]
Merge - [tool_name]
```

**Example for buscar_slots_disponiveis:**
- Rollout Decision - buscar_slots_disponiveis
- Route: buscar_slots_disponiveis New API or Old Workflow
- HTTP Request - buscar_slots_disponiveis
- Merge - buscar_slots_disponiveis

### Independent Rollout Percentages

Each tool can have different rollout percentages based on confidence:

```javascript
// High confidence tools (read-only, well-tested)
// buscar_slots_disponiveis
const ROLLOUT_PERCENTAGE = 0.50;

// Medium confidence tools (write operations)
// criar_agendamento
const ROLLOUT_PERCENTAGE = 0.10;

// Low confidence tools (complex logic)
// processar_documento
const ROLLOUT_PERCENTAGE = 0.05; // 5% canary
```

**Strategy:** Start read-only tools at higher percentages, write operations at lower percentages.

---

## Cleanup After Full Migration

Once ALL tools are at 100% rollout for 7+ days with no issues:

### Step 1: Remove Rollout Nodes

For each tool:

1. Delete Rollout Decision Code node
2. Delete Switch node
3. Delete Merge node
4. Connect directly: AI Agent → HTTP Request → AI Agent

### Step 2: Delete Old Sub-Workflows

1. Open Workflows list in N8N
2. Deactivate old sub-workflow (e.g., "Tool - buscar_slots_disponiveis")
3. Delete sub-workflow
4. Repeat for all 11 tools

### Step 3: Update Documentation

Mark migration complete in:
- `docs/n8n/migration-checklist.md` (check all boxes)
- `.planning/phases/21-n8n-integration/21-XX-SUMMARY.md` (final summary)

**Result:** Simplified workflow with direct HTTP Request calls, no rollout overhead.

---

## Troubleshooting

### Issue: Rollout percentage not matching expected distribution

**Symptoms:** 10% rollout but 20% of requests going to new API

**Diagnosis:**
```javascript
// Add counter to Rollout Decision Code node
const useNewPath = Math.random() < ROLLOUT_PERCENTAGE;
console.log(`Decision: ${useNewPath}, Random: ${Math.random()}`);
```

**Solution:** Verify `Math.random()` called only once per execution (not in loop).

### Issue: Both paths executing

**Symptoms:** HTTP Request AND sub-workflow both execute for same request

**Diagnosis:** Check Switch node configuration - fallbackOutput should be different from rule output.

**Solution:**
```json
{
  "rules": [
    { "value1": "={{ $json.useNewPath }}", "value2": true, "output": 0 }
  ],
  "fallbackOutput": 1  // Must be different from output 0
}
```

### Issue: Merge node not found error

**Symptoms:** "Node 'Merge - [tool]' not found in workflow"

**Diagnosis:** Merge node connections broken or node renamed.

**Solution:** Verify both HTTP Request and Sub-Workflow nodes connect to same Merge node.

---

## Summary

**Gradual rollout provides:**
- ✅ Safe production validation with real traffic
- ✅ Instant rollback capability (single value change)
- ✅ Independent per-tool rollout control
- ✅ Progressive confidence building (10% → 50% → 100%)
- ✅ No user disruption during migration

**Implementation checklist per tool:**
- [ ] Add Rollout Decision Code node with ROLLOUT_PERCENTAGE
- [ ] Add Switch node with useNewPath routing
- [ ] Add HTTP Request node (see api-endpoints.md)
- [ ] Add Merge node to converge paths
- [ ] Connect nodes correctly
- [ ] Test with 0% (verify old path works)
- [ ] Start 10% rollout and monitor for 24-48 hours
- [ ] Increase to 50% if no issues
- [ ] Reach 100% after validation
- [ ] Remove rollout nodes after 7 days at 100%

**Next steps:** See `docs/n8n/workflow-structure.md` for architecture diagrams and `docs/n8n/api-endpoints.md` for HTTP Request node configurations.
