---
phase: 22-mcp-server
plan: 03
subsystem: mcp-server
completed: 2026-01-24
tags:
  - mcp
  - tools
  - write-operations
  - appointments
  - patients
requires:
  - "22-01-PLAN.md (MCP Server Foundation)"
  - "Phase 19 (Write APIs)"
provides:
  - "5 MCP tool handlers for write operations"
  - "Write tools registration module"
affects:
  - "22-04-PLAN.md (Server integration)"
tech-stack:
  added: []
  patterns:
    - "MCP tool handler pattern with Zod schemas"
    - "Error handling with MCP-compliant format"
    - "Structured content responses"
key-files:
  created:
    - "src/mcp/tools/criar-agendamento.ts"
    - "src/mcp/tools/reagendar.ts"
    - "src/mcp/tools/cancelar.ts"
    - "src/mcp/tools/atualizar-paciente.ts"
    - "src/mcp/tools/confirmar-presenca.ts"
    - "src/mcp/tools/write.ts"
  modified: []
decisions:
  - id: "mcp-write-tools-pattern"
    decision: "Same tool handler pattern as query tools (export object with name, description, inputSchema, handler)"
    rationale: "Consistency across all MCP tools for maintainability"
    alternatives: []
  - id: "write-tool-names"
    decision: "Use exact N8N tool names (criar_agendamento, reagendar_agendamento, etc)"
    rationale: "Direct compatibility with existing N8N workflows for migration"
    alternatives: []
  - id: "error-specificity"
    decision: "Specific error messages for common cases (conflict, not found, validation)"
    rationale: "Better user experience in Claude Desktop - clear actionable errors"
    alternatives: ["Generic error messages"]
metrics:
  duration: "3 minutes"
  files-created: 6
  tools-implemented: 5
---

# Phase 22 Plan 03: Write Tools Summary

MCP tool handlers for all 5 write (create/update/delete) agent APIs with proper error handling and idempotency support.

## What Was Built

Created MCP tool handlers for appointment management and patient updates:

**1. Appointment Create (`criar_agendamento`):**
- POST /api/agent/agendamentos
- Idempotency key support for retry safety
- Business rule validation (servicoId OR tipoConsulta required)
- Conflict detection for occupied time slots

**2. Appointment Reschedule (`reagendar_agendamento`):**
- PATCH /api/agent/agendamentos/:id
- Partial update support (dataHora, profissional, observacoes)
- New slot availability validation

**3. Appointment Cancel (`cancelar_agendamento`):**
- DELETE /api/agent/agendamentos/:id
- Required cancellation reason (min 3 chars)
- Triggers waitlist notifications

**4. Patient Update (`atualizar_dados_paciente`):**
- PATCH /api/agent/paciente/:id
- Partial update support for all patient fields
- Phone uniqueness validation
- At least one field required validation

**5. Appointment Confirmation (`confirmar_presenca`):**
- POST /api/agent/agendamentos/:id/confirmar
- Two confirmation types: 'confirmado' (via WhatsApp) and 'presente' (arrived)
- State machine validation (prevents confirming terminal states)
- Idempotent operation

**6. Write Tools Index (`write.ts`):**
- `registerWriteTools(server: McpServer)` function
- Registers all 5 write tools with logging
- Ready for integration in main MCP server

## Implementation Details

**HTTP Method Correctness:**
- POST: criar_agendamento, confirmar_presenca
- PATCH: reagendar_agendamento, atualizar_dados_paciente
- DELETE: cancelar_agendamento

**Error Handling Pattern:**
All tools implement MCP-compliant error format:
```typescript
return {
  content: [{ type: 'text', text: 'Error message' }],
  isError: true,
}
```

**Specific Error Cases:**
- **409 Conflict**: "O horário solicitado já está ocupado" (criar_agendamento)
- **404 Not Found**: "Agendamento/Paciente não encontrado" (all tools)
- **400 Validation**: Field-specific messages (phone duplicate, motivo too short)
- **422 State Machine**: "Não é possível confirmar: agendamento já cancelado" (confirmar_presenca)

**Success Response Pattern:**
All tools return:
```typescript
return {
  content: [{ type: 'text', text: summary }],
  structuredContent: result,
}
```

## Testing

All tools verified:
1. Files exist in `src/mcp/tools/`
2. Correct HTTP methods used (verified via grep)
3. MCP error handling present (verified via grep)
4. Export format matches query tools pattern

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e6faf7a | Appointment write tools (create, reschedule, cancel) |
| 2 | 21443ac | Patient update and appointment confirmation tools |
| 3 | ec041ea | Write tools registration index |

## Decisions Made

**1. Tool Handler Pattern Consistency**
- Used same export pattern as query tools (object with name, description, inputSchema, handler)
- Enables uniform registration in write.ts
- Makes tools self-documenting

**2. Tool Name Compatibility**
- Kept exact N8N tool names (criar_agendamento, reagendar_agendamento, etc)
- Ensures seamless migration from N8N sub-workflows to MCP Server
- Claude Desktop will see same tool names as N8N AI Agent

**3. Error Specificity**
- Implemented specific error messages for common failure scenarios
- Better UX than generic "API error occurred"
- Actionable feedback for Claude Desktop users

**4. Idempotency Strategy**
- criar_agendamento: Explicit idempotencyKey parameter
- confirmar_presenca: Idempotent by nature (returns success if already in target state)
- Matches API implementations from Phase 19

## Next Phase Readiness

**Ready for 22-04 (Server Integration):**
- ✅ All write tools implemented with correct HTTP methods
- ✅ registerWriteTools() function ready to import
- ✅ Error handling consistent across all tools
- ✅ Tool names match N8N conventions

**Integration Steps (22-04):**
1. Import `registerWriteTools` in main server.ts
2. Call after `registerQueryTools()`
3. Test all 5 write operations via Claude Desktop
4. Verify MCP protocol compliance

**No blockers.**

## Deviations from Plan

None - plan executed exactly as written.

## File Tree

```
src/mcp/tools/
├── criar-agendamento.ts      # POST /api/agent/agendamentos
├── reagendar.ts              # PATCH /api/agent/agendamentos/:id
├── cancelar.ts               # DELETE /api/agent/agendamentos/:id
├── atualizar-paciente.ts     # PATCH /api/agent/paciente/:id
├── confirmar-presenca.ts     # POST /api/agent/agendamentos/:id/confirmar
└── write.ts                  # registerWriteTools() index
```

## Statistics

- **Files created**: 6
- **Lines of code**: 419 (6 files)
- **Tools implemented**: 5
- **HTTP methods**: POST (2), PATCH (2), DELETE (1)
- **Error cases handled**: 12 specific error scenarios
- **Execution time**: 3 minutes

---

**Status:** ✅ Complete
**Next Plan:** 22-04 (Server Integration with all tool modules)
