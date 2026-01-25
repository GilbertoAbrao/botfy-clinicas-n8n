# Phase 26: Validation & Archive - Research

**Researched:** 2026-01-25
**Domain:** API Testing, N8N Workflow Management, Sub-workflow Archiving
**Confidence:** HIGH

## Summary

This phase validates all 10 migrated tools and archives the replaced sub-workflows. The migration from `toolWorkflow` to `toolHttpRequest` nodes was completed in Phases 23-25. Now we must verify that:

1. All tools respond correctly when invoked by the AI Agent
2. Error handling returns appropriate HTTP status codes and messages
3. Bearer token authentication validates correctly
4. Old sub-workflows are exported to `workflows-backup/` and deactivated

The validation approach uses direct N8N MCP tools to inspect workflow state and test tool invocations. The archive approach exports sub-workflow JSON, commits to git, then deactivates (not deletes) the workflows in N8N.

**Primary recommendation:** Execute validation systematically tool-by-tool using N8N MCP tools to verify configuration, then manually test with real AI Agent interactions. Archive workflows only after validation passes.

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| N8N MCP Tools | Latest | Workflow inspection and deactivation | Direct MCP access to N8N instance |
| `curl` | System | HTTP endpoint testing | Universal, scriptable |
| `jq` | System | JSON parsing in scripts | Standard for CLI JSON manipulation |

### N8N MCP Operations

| Operation | MCP Function | Purpose |
|-----------|--------------|---------|
| Get workflow | `mcp__n8n-mcp__n8n_get_workflow` | Inspect node configuration |
| Export workflow | `mcp__n8n-mcp__n8n_get_workflow` | Get full JSON for backup |
| Deactivate workflow | `mcp__n8n-mcp__deactivate_workflow` | Disable sub-workflow without deletion |
| List credentials | `mcp__n8n-mcp__list_credentials` | Verify auth configuration |

### Test Patterns

| Pattern | Tool | When to Use |
|---------|------|-------------|
| Workflow inspection | N8N MCP | Verify node types, connections, credentials |
| Direct API test | curl + Bearer | Validate endpoint behavior |
| AI Agent test | Manual via WhatsApp | End-to-end validation |

## Architecture Patterns

### Validation Architecture

```
Phase 26 Validation Flow:

1. STATIC VALIDATION (via N8N MCP)
   |
   +-- Verify each tool node:
   |     - Type = toolHttpRequest
   |     - ai_tool connection exists
   |     - Credentials configured
   |     - URL pattern correct
   |     - Placeholders defined
   |
   +-- Verify AI Agent workflow:
         - Active = true
         - 10 toolHttpRequest nodes connected

2. API VALIDATION (via curl)
   |
   +-- For each endpoint:
   |     - 200 on valid request
   |     - 400 on validation error
   |     - 401 on missing/invalid token
   |     - 404 on not found
   |
   +-- Test auth:
         - Valid Bearer returns data
         - Invalid Bearer returns 401
         - Missing header returns 401

3. END-TO-END VALIDATION (via WhatsApp)
   |
   +-- AI Agent invokes tool correctly
   +-- Response parsed and used by AI
   +-- Error responses handled gracefully
```

### Archive Architecture

```
Sub-workflow Archive Flow:

1. EXPORT (per workflow)
   |
   +-- Get workflow JSON via MCP
   +-- Save to workflows-backup/{id}-{name}.json
   +-- Verify JSON valid (jq .)
   +-- Commit to git

2. DEACTIVATE (per workflow)
   |
   +-- Set workflow active = false
   +-- Verify via MCP (active = false)
   +-- DO NOT DELETE

3. DOCUMENT
   |
   +-- Update README in workflows-backup/
   +-- Record archive date, verifier
```

### Pattern: Systematic Tool Validation

**What:** Validate each tool against its API contract
**When to use:** Before marking migration complete

**Validation checklist per tool:**

```markdown
## Tool: {tool_name}

### Static Checks (MCP)
- [ ] Node type: @n8n/n8n-nodes-langchain.toolHttpRequest
- [ ] Connection: ai_tool to AI Agent
- [ ] Credentials: httpHeaderAuth linked
- [ ] URL: matches expected endpoint
- [ ] Placeholders: defined for all required params

### API Checks (curl)
- [ ] Valid request returns 200 + expected data
- [ ] Missing required param returns 400
- [ ] Invalid Bearer returns 401
- [ ] Edge case returns appropriate error

### Integration Check
- [ ] AI Agent can invoke tool
- [ ] Response parsed correctly
```

### Anti-Patterns to Avoid

- **Deleting sub-workflows:** Only deactivate. Deletion removes recovery option.
- **Skipping auth validation:** Must test both valid and invalid tokens.
- **Trusting static checks alone:** Must test actual HTTP calls.
- **Batch archive before validation:** Validate first, then archive.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workflow inspection | Manual N8N UI checking | N8N MCP `get_workflow` | Scriptable, consistent |
| API auth testing | Custom test scripts | curl with headers | Standard, documented |
| JSON export | Manual download | N8N MCP `get_workflow` | Automated, version-controlled |
| Workflow deactivation | Manual UI toggle | N8N MCP `deactivate_workflow` | Auditable, scriptable |

**Key insight:** N8N MCP provides all operations needed for validation and archiving. Don't use manual UI operations that can't be documented or reproduced.

## Common Pitfalls

### Pitfall 1: Forgetting to Test Auth Failure Cases

**What goes wrong:** Tool appears to work but auth isn't actually validated
**Why it happens:** Only testing happy path with valid token
**How to avoid:**
- Test with missing Authorization header (expect 401)
- Test with malformed token (expect 401)
- Test with invalid token (expect 401)
**Warning signs:** Tool works without proper auth header

### Pitfall 2: Deactivating Before Validation Complete

**What goes wrong:** Can't roll back if validation fails
**Why it happens:** Eager cleanup before verification
**How to avoid:**
- Complete ALL validation before ANY archiving
- Archive in a single batch after validation passes
- Keep sub-workflows active until verified
**Warning signs:** Rushing to mark phase complete

### Pitfall 3: Missing ai_tool Connection Verification

**What goes wrong:** Node exists but AI Agent can't invoke it
**Why it happens:** Connection was broken during migration
**How to avoid:**
- Use MCP to verify connection in workflow structure
- Check that tool appears in AI Agent's available tools
**Warning signs:** AI Agent says it can't find the tool

### Pitfall 4: Incomplete Sub-workflow Export

**What goes wrong:** Export missing nodes or connections
**Why it happens:** Partial download or truncated response
**How to avoid:**
- Verify JSON has `nodes` array with expected count
- Verify JSON has `connections` object
- Parse with `jq .` to confirm valid JSON
- Compare file size to known baseline
**Warning signs:** JSON parse errors, missing workflow logic

### Pitfall 5: Not Testing Error Handling

**What goes wrong:** Errors return wrong status codes or leak sensitive info
**Why it happens:** Only testing success cases
**How to avoid:**
- Test validation errors (400)
- Test not found errors (404)
- Test conflict errors (409)
- Verify error messages don't expose PHI
**Warning signs:** Generic 500 errors for known error conditions

## Code Examples

### Example 1: Tool Validation via MCP

```typescript
// Verification workflow using MCP

// 1. Get workflow and find tool node
const workflow = await mcp__n8n-mcp__n8n_get_workflow({
  workflowId: "bPJamJhBcrVCKgBg"
});

// 2. Find specific tool node
const toolNode = workflow.nodes.find(n => n.name === "buscar_slots_disponiveis");

// 3. Verify node configuration
assert(toolNode.type === "@n8n/n8n-nodes-langchain.toolHttpRequest");
assert(toolNode.parameters.method === "GET");
assert(toolNode.parameters.url.includes("/api/agent/slots"));
assert(toolNode.credentials.httpHeaderAuth.name === "Botfy Agent API");

// 4. Verify ai_tool connection
const aiAgentConnections = workflow.connections["AI Agent"];
const toolConnections = aiAgentConnections?.ai_tool || [];
assert(toolConnections.some(c =>
  c.node === "buscar_slots_disponiveis"
));
```

### Example 2: API Validation with curl

```bash
#!/bin/bash
# validate-agent-api.sh

API_URL="https://botfy-clinicas.example.com"
TOKEN="your-bearer-token"

echo "=== Testing /api/agent/slots ==="

# Test 1: Valid request
echo "Test: Valid request with date parameter"
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/agent/slots?data=2026-01-27"
# Expected: 200

# Test 2: Missing required param
echo "Test: Missing date parameter"
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/agent/slots"
# Expected: 400

# Test 3: Invalid token
echo "Test: Invalid Bearer token"
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer invalid-token" \
  "$API_URL/api/agent/slots?data=2026-01-27"
# Expected: 401

# Test 4: Missing auth header
echo "Test: Missing Authorization header"
curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/api/agent/slots?data=2026-01-27"
# Expected: 401
```

### Example 3: Sub-workflow Archive via MCP

```typescript
// Archive workflow flow

// 1. Export full workflow JSON
const workflowData = await mcp__n8n-mcp__n8n_get_workflow({
  workflowId: "8Bke6sYr7r51aeEq"  // buscar_slots_disponiveis sub-workflow
});

// 2. Save to file (via Bash tool)
// File: workflows-backup/8Bke6sYr7r51aeEq-buscar-slots-disponiveis.json

// 3. Verify export
// - Check nodes array length
// - Check connections object exists
// - Parse with jq to validate

// 4. Deactivate (not delete!)
await mcp__n8n-mcp__deactivate_workflow({
  workflowId: "8Bke6sYr7r51aeEq"
});

// 5. Verify deactivated
const verifyWorkflow = await mcp__n8n-mcp__n8n_get_workflow({
  workflowId: "8Bke6sYr7r51aeEq"
});
assert(verifyWorkflow.active === false);
```

### Example 4: Validation Report Structure

```markdown
## Tool Validation Report: buscar_slots_disponiveis

**Validated:** 2026-01-25T10:00:00Z
**Status:** PASSED

### Static Validation
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Node type | toolHttpRequest | toolHttpRequest | PASS |
| ai_tool connection | present | present | PASS |
| Credential | Botfy Agent API | Botfy Agent API | PASS |
| URL | /api/agent/slots | /api/agent/slots | PASS |
| Placeholder: data | defined | defined | PASS |

### API Validation
| Test | Request | Expected | Actual | Status |
|------|---------|----------|--------|--------|
| Valid request | GET ?data=2026-01-27 | 200 | 200 | PASS |
| Missing param | GET (no data) | 400 | 400 | PASS |
| Invalid token | Bearer invalid | 401 | 401 | PASS |
| No auth | (no header) | 401 | 401 | PASS |

### Response Format
| Field | Present | Valid |
|-------|---------|-------|
| success | Yes | boolean |
| data.date | Yes | YYYY-MM-DD |
| data.slots | Yes | string[] |
| data.totalAvailable | Yes | number |
```

## Tool Validation Reference

### All 10 Migrated Tools

| # | Tool | Method | Endpoint | Critical Params |
|---|------|--------|----------|-----------------|
| 1 | buscar_slots_disponiveis | GET | /api/agent/slots | data (required) |
| 2 | buscar_agendamentos | GET | /api/agent/agendamentos | telefone or pacienteId |
| 3 | buscar_paciente | GET | /api/agent/paciente | telefone, cpf, or nome |
| 4 | status_pre_checkin | GET | /api/agent/pre-checkin/status | agendamentoId, telefone, or pacienteId |
| 5 | buscar_instrucoes | GET | /api/agent/instrucoes | servicoId (optional) |
| 6 | criar_agendamento | POST | /api/agent/agendamentos | pacienteId, tipoConsulta, dataHora |
| 7 | reagendar_agendamento | PATCH | /api/agent/agendamentos/:id | dataHora |
| 8 | cancelar_agendamento | DELETE | /api/agent/agendamentos/:id | motivo |
| 9 | atualizar_dados_paciente | PATCH | /api/agent/paciente/:id | partial fields |
| 10 | processar_documento | POST | /api/agent/documentos/processar | patientId, imageUrl |

### Sub-workflows to Archive

| # | Workflow ID | Name | Nodes | Status |
|---|-------------|------|-------|--------|
| 1 | `8Bke6sYr7r51aeEq` | Tool: Buscar Slots Disponiveis | 9 | To archive |
| 2 | `8Ug0F3KuLov6EeCQ` | Tool: Buscar Agendamentos | 4 | To archive |
| 3 | `igG6sZsStxiDzNRY` | Tool: Buscar Paciente | 5 | To archive |
| 4 | `holwGQuksZPsSb19` | Tool: Consultar Status Pre Check-In | 8 | To archive |
| 5 | `NUZv1Gt15LKyiiKz` | Tool: Buscar Instrucoes | 6 | To archive |
| 6 | `eEx2enJk3YpreNUm` | Tool: Criar Agendamento | 15 | To archive |
| 7 | `21EHe24mkMmfBhK6` | Tool: Reagendar Agendamento | 4 | To archive |
| 8 | `gE2rpbLVUlnA5yMk` | Tool: Cancelar Agendamento | 4 | To archive |
| 9 | `4DNyXp5fPPfsFOnR` | Tool: Atualizar Dados Paciente | 9 | To archive |
| 10 | `Pc0PyATrZaGefiSJ` | Tool: Processar Documento | 13 | To archive |

### Error Response Codes

| Error Condition | Expected Status | Response Body |
|-----------------|-----------------|---------------|
| Missing required param | 400 | `{ success: false, error: "Validation failed", details: {...} }` |
| Invalid param format | 400 | `{ success: false, error: "Validation failed", details: {...} }` |
| Missing Authorization | 401 | `{ success: false, error: "Missing or invalid Authorization header..." }` |
| Invalid API key | 401 | `{ success: false, error: "Invalid API key" }` |
| Resource not found | 404 | `{ success: false, error: "[Resource] not found" }` |
| Time slot conflict | 409 | `{ success: false, error: "Time slot already booked" }` |
| File too large | 413 | `{ success: false, error: "File size exceeds 5MB limit" }` |
| Unsupported file type | 415 | `{ success: false, error: "File type not allowed" }` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual UI testing | MCP-based validation | v2.1 | Scriptable, reproducible |
| Manual workflow backup | Git-versioned JSON exports | v2.1 | Recovery, audit trail |
| Delete unused workflows | Deactivate and archive | v2.1 | Safer rollback option |

**Deprecated/outdated:**
- Manual N8N UI validation: Use MCP tools for consistency
- Deleting sub-workflows immediately: Deactivate first, evaluate deletion later

## Open Questions

1. **Token value in credential**
   - What we know: httpHeaderAuth credential "Botfy Agent API" exists
   - What's unclear: Whether the Bearer token value is correctly configured
   - Recommendation: Test API call to verify auth works end-to-end

2. **Sub-workflow interdependencies**
   - What we know: Sub-workflows are only called from main AI Agent
   - What's unclear: Whether any other workflows reference them
   - Recommendation: Search N8N for references before deactivating

3. **WhatsApp end-to-end testing**
   - What we know: Tools configured, APIs built
   - What's unclear: Test phone number, test scenarios
   - Recommendation: Document specific test scenarios for manual verification

## Sources

### Primary (HIGH confidence)

- Phase 23 VERIFICATION.md - Query tools migration verification pattern
- Phase 24 VERIFICATION.md - Write tools migration verification pattern
- Phase 25 VERIFICATION.md - Document tool migration verification pattern
- Existing codebase: `/src/app/api/agent/*/route.ts` - API contracts
- Existing codebase: `/src/lib/agent/middleware.ts` - Auth implementation
- Existing codebase: `/src/lib/agent/error-handler.ts` - Error response patterns

### Secondary (MEDIUM confidence)

- [N8N Community - Deactivate Workflow API](https://community.n8n.io/t/activate-and-deactivate-workflows-via-another-workflow-or-api/1957)
- [N8N MCP Tool Documentation](https://www.mcpbundles.com/tools/n8n-deactivate-workflow-n8n)
- workflows-backup/README.md - Existing archive documentation

### Tertiary (LOW confidence)

- [Bearer Token Authentication Best Practices](https://dev.to/apiverve/api-authentication-best-practices-in-2026-3k4a)
- General API testing patterns

## Metadata

**Confidence breakdown:**
- Validation approach: HIGH - Based on existing verification patterns from Phases 23-25
- Archive approach: HIGH - Existing backup infrastructure documented in workflows-backup/README.md
- MCP operations: HIGH - Used successfully in Phases 23-25
- Error handling: HIGH - Verified in codebase `/src/lib/agent/error-handler.ts`

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable operations)
