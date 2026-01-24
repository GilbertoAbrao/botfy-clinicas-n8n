# N8N Workflow Structure Documentation

**Purpose:** Document the AI Agent workflow architecture before, during, and after migration from sub-workflows to Next.js HTTP APIs.

**Related:** See `gradual-rollout.md` for implementation details and `api-endpoints.md` for HTTP Request node configuration.

---

## Table of Contents

1. [Overview](#overview)
2. [Current Architecture (Before Migration)](#current-architecture-before-migration)
3. [Target Architecture (After Migration)](#target-architecture-after-migration)
4. [Transition Architecture (During Rollout)](#transition-architecture-during-rollout)
5. [Node Count Comparison](#node-count-comparison)
6. [Credential Flow](#credential-flow)
7. [Sub-Workflow Inventory](#sub-workflow-inventory)

---

## Overview

The AI Agent workflow (ID: `bPJamJhBcrVCKgBg`, name: "Botfy - Agendamento") is the main conversation handler that receives WhatsApp messages and delegates to tools for actions.

**Current approach:** Tools implemented as N8N sub-workflows (Execute Workflow nodes)

**Target approach:** Tools implemented as Next.js HTTP APIs (HTTP Request nodes)

**Migration strategy:** Gradual rollout with percentage-based traffic routing (see `gradual-rollout.md`)

---

## Current Architecture (Before Migration)

### Workflow Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Botfy - Agendamento Workflow                              │
│                    ID: bPJamJhBcrVCKgBg | 83 nodes                           │
└─────────────────────────────────────────────────────────────────────────────┘

[Webhook /webhook/marilia]
        ↓
[Buffer Messages (15 sec)]
        ↓
[Check Existing Chat]
        ↓
┌──────────────────────────┐
│     AI Agent (GPT-4o)    │
│   Persona: Marília       │
│   Tools: 11 functions    │
└────────┬─────────────────┘
         │
         ├─ Tool: buscar_slots_disponiveis
         │    ↓
         │  [Execute Workflow: 8Bke6sYr7r51aeEq] → Sub-workflow (9 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: criar_agendamento
         │    ↓
         │  [Execute Workflow: eEx2enJk3YpreNUm] → Sub-workflow (15 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: reagendar_agendamento
         │    ↓
         │  [Execute Workflow: 21EHe24mkMmfBhK6] → Sub-workflow (4 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: cancelar_agendamento
         │    ↓
         │  [Execute Workflow: gE2rpbLVUlnA5yMk] → Sub-workflow (4 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: buscar_agendamentos
         │    ↓
         │  [Execute Workflow: 8Ug0F3KuLov6EeCQ] → Sub-workflow (4 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: buscar_paciente
         │    ↓
         │  [Execute Workflow: igG6sZsStxiDzNRY] → Sub-workflow (5 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: atualizar_dados_paciente
         │    ↓
         │  [Execute Workflow: 4DNyXp5fPPfsFOnR] → Sub-workflow (9 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: confirmar_presenca
         │    ↓
         │  [Execute Workflow: ??? ] → Sub-workflow
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: status_pre_checkin
         │    ↓
         │  [Execute Workflow: holwGQuksZPsSb19] → Sub-workflow (8 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: buscar_instrucoes
         │    ↓
         │  [Execute Workflow: NUZv1Gt15LKyiiKz] → Sub-workflow (6 nodes)
         │    ↓
         │  [Return to AI Agent]
         │
         └─ Tool: processar_documento
              ↓
            [Execute Workflow: Pc0PyATrZaGefiSJ] → Sub-workflow (13 nodes)
              ↓
            [Return to AI Agent]
        ↓
[Send Response to WhatsApp]
```

### Characteristics

**Pros:**
- Visual workflow design (easy to understand in N8N UI)
- Sub-workflows reusable across different parent workflows
- All logic in N8N (single platform)

**Cons:**
- No type safety (JSON passed between nodes)
- Difficult to test (no unit tests for sub-workflows)
- Hard to debug (no breakpoints, limited logging)
- Poor code review (workflow JSON not readable in PRs)
- Performance overhead (Execute Workflow node spawns sub-execution)
- No code reuse with Console (duplicate Supabase queries)

---

## Target Architecture (After Migration)

### Workflow Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Botfy - Agendamento Workflow                              │
│                    ID: bPJamJhBcrVCKgBg | ~40 nodes (after cleanup)         │
└─────────────────────────────────────────────────────────────────────────────┘

[Webhook /webhook/marilia]
        ↓
[Buffer Messages (15 sec)]
        ↓
[Check Existing Chat]
        ↓
┌──────────────────────────┐
│     AI Agent (GPT-4o)    │
│   Persona: Marília       │
│   Tools: 11 functions    │
└────────┬─────────────────┘
         │
         ├─ Tool: buscar_slots_disponiveis
         │    ↓
         │  [HTTP Request: GET /api/agent/slots]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: criar_agendamento
         │    ↓
         │  [HTTP Request: POST /api/agent/agendamentos]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: reagendar_agendamento
         │    ↓
         │  [HTTP Request: PATCH /api/agent/agendamentos/:id]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: cancelar_agendamento
         │    ↓
         │  [HTTP Request: DELETE /api/agent/agendamentos/:id]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: buscar_agendamentos
         │    ↓
         │  [HTTP Request: GET /api/agent/agendamentos]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: buscar_paciente
         │    ↓
         │  [HTTP Request: GET /api/agent/paciente]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: atualizar_dados_paciente
         │    ↓
         │  [HTTP Request: PATCH /api/agent/paciente/:id]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: confirmar_presenca
         │    ↓
         │  [HTTP Request: POST /api/agent/agendamentos/:id/confirmar]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: status_pre_checkin
         │    ↓
         │  [HTTP Request: GET /api/agent/pre-checkin/status]
         │    ↓
         │  [Return to AI Agent]
         │
         ├─ Tool: buscar_instrucoes
         │    ↓
         │  [HTTP Request: GET /api/agent/instrucoes]
         │    ↓
         │  [Return to AI Agent]
         │
         └─ Tool: processar_documento
              ↓
            [HTTP Request: POST /api/agent/documentos/processar]
              ↓
            [Return to AI Agent]
        ↓
[Send Response to WhatsApp]
```

### Characteristics

**Pros:**
- ✅ Type safety (TypeScript + Zod validation)
- ✅ Testability (Jest/Vitest unit tests)
- ✅ Debuggability (VS Code, breakpoints, logs)
- ✅ Performance (direct HTTP vs. sub-workflow execution)
- ✅ Code review (readable TypeScript in PRs)
- ✅ DRY (reuse Console services, no duplicate queries)
- ✅ Simpler workflow (1 HTTP node vs. 1 Execute Workflow node)

**Cons:**
- Requires Console deployment for API availability
- API downtime affects N8N (mitigated by gradual rollout)

---

## Transition Architecture (During Rollout)

### Workflow Structure with Rollout Nodes

This is the architecture while gradually migrating each tool from sub-workflow to HTTP API.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Botfy - Agendamento Workflow                              │
│              ID: bPJamJhBcrVCKgBg | ~120 nodes (during rollout)             │
└─────────────────────────────────────────────────────────────────────────────┘

[Webhook /webhook/marilia]
        ↓
[Buffer Messages (15 sec)]
        ↓
[Check Existing Chat]
        ↓
┌──────────────────────────┐
│     AI Agent (GPT-4o)    │
│   Persona: Marília       │
│   Tools: 11 functions    │
└────────┬─────────────────┘
         │
         ├─ Tool: buscar_slots_disponiveis
         │    ↓
         │  ┌────────────────────────────────────────────────────┐
         │  │ [Rollout Decision Code]                            │
         │  │   useNewPath = Math.random() < 0.10  (10% rollout) │
         │  └──────────────────┬─────────────────────────────────┘
         │                     ↓
         │         ┌──────────[Switch Node]──────────┐
         │         │                                 │
         │   useNewPath=true            useNewPath=false
         │         ↓                                 ↓
         │  [HTTP Request]                  [Execute Workflow]
         │  GET /api/agent/slots            ID: 8Bke6sYr7r51aeEq
         │         ↓                                 ↓
         │         └────────────[Merge]──────────────┘
         │                      ↓
         │              [Return to AI Agent]
         │
         ├─ Tool: criar_agendamento
         │    ↓
         │  [Rollout Decision Code] → [Switch] → HTTP/Sub-workflow → [Merge]
         │
         ├─ Tool: reagendar_agendamento
         │    ↓
         │  [Rollout Decision Code] → [Switch] → HTTP/Sub-workflow → [Merge]
         │
         └─ (... same pattern for all 11 tools ...)
        ↓
[Send Response to WhatsApp]
```

### Rollout Node Structure (Per Tool)

Each tool requires 4 additional nodes during rollout:

1. **Rollout Decision Code** - Calculates useNewPath boolean (Math.random() < percentage)
2. **Switch Node** - Routes to HTTP Request or Execute Workflow based on useNewPath
3. **HTTP Request Node** - NEW path (Next.js API)
4. **Merge Node** - Converges HTTP and sub-workflow outputs

**Total overhead:** 4 nodes × 11 tools = 44 additional nodes during rollout

**After 100% rollout:** Delete nodes 1, 2, 4 and old Execute Workflow (keep only HTTP Request)

---

## Node Count Comparison

| Architecture Phase | Total Nodes | Per-Tool Overhead | Notes |
|-------------------|-------------|-------------------|-------|
| **Before Migration** | 83 | 1 Execute Workflow node | Calls sub-workflows (separate from count) |
| **During Rollout (10% → 100%)** | ~127 | 5 nodes (Decision + Switch + HTTP + Merge + old Execute) | Temporary rollout infrastructure |
| **After Migration (cleanup)** | ~39 | 1 HTTP Request node | Streamlined (no rollout or sub-workflow nodes) |

**Node reduction:** 83 → 39 nodes (-53% reduction after cleanup)

**Simplification benefits:**
- Fewer nodes = easier maintenance
- Direct HTTP calls = better performance
- No Execute Workflow overhead = faster tool calls

---

## Credential Flow

### Current Architecture (Before Migration)

```
┌──────────────────────────────────────────────────────┐
│            N8N Workflow Credentials                   │
│                                                       │
│  [Supabase Credential]                               │
│    ↓                                                  │
│  Used by all Execute Workflow nodes                  │
│    ↓                                                  │
│  Each sub-workflow has Supabase nodes                │
│    ↓                                                  │
│  Direct database queries                             │
└──────────────────────────────────────────────────────┘
```

**Credential count:** 1 Supabase credential (shared across sub-workflows)

### Target Architecture (After Migration)

```
┌──────────────────────────────────────────────────────┐
│            N8N Workflow Credentials                   │
│                                                       │
│  [Header Auth Credential: "Botfy Console API Key"]   │
│    Name: Botfy Console API Key                       │
│    Header Name: x-api-key                            │
│    Value: <generated API key from Console>           │
│    ↓                                                  │
│  Used by ALL HTTP Request nodes (11 tools)           │
│    ↓                                                  │
│  Console validates API key → agentId                 │
│    ↓                                                  │
│  Console uses Supabase client internally             │
└──────────────────────────────────────────────────────┘
```

**Credential count:** 1 Header Auth credential (shared across all HTTP Request nodes)

**Credential reuse pattern:**

```json
{
  "credentials": {
    "headerAuth": {
      "id": "1",
      "name": "Botfy Console API Key"
    }
  }
}
```

Every HTTP Request node references the SAME credential by ID and name.

**Benefits:**
- Single API key rotation point (update credential, all nodes use new key)
- Centralized access control (revoke credential, all API calls blocked)
- Audit trail (all requests tagged with same agentId)

---

## Sub-Workflow Inventory

### All 11 Sub-Workflows to Migrate

| Tool Name | Sub-Workflow ID | Nodes | Target API Endpoint |
|-----------|-----------------|-------|---------------------|
| **buscar_slots_disponiveis** | `8Bke6sYr7r51aeEq` | 9 | GET /api/agent/slots |
| **criar_agendamento** | `eEx2enJk3YpreNUm` | 15 | POST /api/agent/agendamentos |
| **reagendar_agendamento** | `21EHe24mkMmfBhK6` | 4 | PATCH /api/agent/agendamentos/:id |
| **cancelar_agendamento** | `gE2rpbLVUlnA5yMk` | 4 | DELETE /api/agent/agendamentos/:id |
| **buscar_agendamentos** | `8Ug0F3KuLov6EeCQ` | 4 | GET /api/agent/agendamentos |
| **buscar_paciente** | `igG6sZsStxiDzNRY` | 5 | GET /api/agent/paciente |
| **atualizar_dados_paciente** | `4DNyXp5fPPfsFOnR` | 9 | PATCH /api/agent/paciente/:id |
| **confirmar_presenca** | TBD | TBD | POST /api/agent/agendamentos/:id/confirmar |
| **status_pre_checkin** | `holwGQuksZPsSb19` | 8 | GET /api/agent/pre-checkin/status |
| **buscar_instrucoes** | `NUZv1Gt15LKyiiKz` | 6 | GET /api/agent/instrucoes |
| **processar_documento** | `Pc0PyATrZaGefiSJ` | 13 | POST /api/agent/documentos/processar |

**Total sub-workflow nodes:** 77+ nodes (to be deleted after migration)

**Migration strategy:**
1. Implement HTTP Request node for each tool (see `api-endpoints.md`)
2. Add rollout nodes (Decision, Switch, Merge) per tool
3. Start at 10% rollout per tool
4. Monitor execution logs for errors
5. Increase to 50%, then 100% if stable
6. Delete rollout nodes and old Execute Workflow nodes
7. Delete sub-workflows from N8N (after 7 days at 100%)

---

## Architecture Evolution Summary

### Phase 1: Before Migration (Current)

- **Main workflow:** 83 nodes
- **Sub-workflows:** 11 separate workflows (77+ nodes total)
- **Total complexity:** 160+ nodes across 12 workflows
- **Credential:** 1 Supabase credential

### Phase 2: During Rollout (Transition)

- **Main workflow:** ~127 nodes (83 original + 44 rollout nodes)
- **Sub-workflows:** 11 separate workflows (still active as fallback)
- **Total complexity:** 204+ nodes across 12 workflows
- **Credentials:** 1 Supabase + 1 Header Auth

**Note:** This is the PEAK complexity phase. Temporary infrastructure for safe migration.

### Phase 3: After Migration (Target)

- **Main workflow:** ~39 nodes (original - Execute Workflow nodes + HTTP Request nodes)
- **Sub-workflows:** 0 (deleted)
- **Total complexity:** 39 nodes in 1 workflow
- **Credential:** 1 Header Auth credential

**Reduction:** 160+ nodes → 39 nodes (76% reduction)

---

## Next Steps

1. **Read gradual rollout guide:** `docs/n8n/gradual-rollout.md`
2. **Review API endpoints:** `docs/n8n/api-endpoints.md`
3. **Implement rollout nodes:** Start with low-risk read-only tools (buscar_slots_disponiveis, buscar_paciente)
4. **Monitor and validate:** 24-48 hours at each rollout percentage
5. **Clean up after 100%:** Remove rollout nodes and delete sub-workflows

**Goal:** Simplified, maintainable, type-safe architecture with 76% fewer N8N nodes.
