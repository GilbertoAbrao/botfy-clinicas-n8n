# Features Research: Agent API + MCP Migration

**Domain:** AI Agent Tool APIs for Healthcare Operations
**Researched:** 2026-01-24
**Overall confidence:** HIGH

## Executive Summary

AI agent tool APIs follow specific interface patterns defined by standards like MCP (Model Context Protocol) and OpenAI function calling. The migration from N8N sub-workflows to Next.js APIs with MCP server represents a shift from implicit tool calling (N8N's toolWorkflow) to explicit, standardized interfaces that enable better error handling, type safety, and agent-friendly responses.

Key findings: Tools should be high-level workflow-oriented (not raw CRUD), errors must be reported within results (not as protocol failures), and response formats need to be both machine-parseable and LLM-understandable. The healthcare context demands particular attention to error clarity, timezone handling, and HIPAA-compliant audit logging.

## Table Stakes

Must-have features for AI agent APIs to work with AI agents effectively.

| Feature | Why Required | Implementation Notes |
|---------|--------------|---------------------|
| **JSON Schema Input Validation** | AI agents rely on structured schemas to understand parameters. Without JSON Schema, agents cannot determine valid inputs. | Use Zod schemas exported as JSON Schema. MCP requires `inputSchema` in tool definitions. [Source: [MCP Specification](https://modelcontextprotocol.io/docs/concepts/tools)] |
| **Structured Error Responses** | AI agents need machine-readable error codes to decide retry/adjust behavior. Generic errors cause agent confusion. | Return `{isError: true, content: [{type: "text", text: "error message"}]}` format. Use error codes like `INVALID_DATE`, `SLOT_UNAVAILABLE`. [Source: [MCP Error Handling](https://apxml.com/courses/getting-started-model-context-protocol/chapter-3-implementing-tools-and-logic/error-handling-reporting)] |
| **Tool Descriptions** | LLMs use descriptions to select appropriate tools. Missing/vague descriptions cause tool misuse. | Each tool needs clear `description` field explaining WHEN to use it, not just WHAT it does. Example: "Use when patient requests available appointment slots for a specific date and time period" vs "Gets slots". [Source: [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)] |
| **Parameter Descriptions** | AI needs to understand what each parameter expects to generate valid arguments. | Every parameter in inputSchema needs `description` field with format examples. Example: `date: {type: "string", description: "Date in YYYY-MM-DD format (e.g., 2026-01-24)"}`. [Source: [Block MCP Design](https://engineering.block.xyz/blog/blocks-playbook-for-designing-mcp-servers)] |
| **Type Safety** | Tools must validate inputs before execution to prevent runtime errors that confuse agents. | Validate with Zod before business logic. Return structured error if validation fails, never throw unhandled exceptions. [Source: [AI Agent Best Practices](https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/)] |
| **Deterministic Responses** | Same input must produce same output. Non-deterministic tools confuse agent learning. | Avoid `ORDER BY RANDOM()`, timestamp-based logic without explicit parameters, or sampling without seeds. |
| **Timeout Protection** | AI agents can't wait indefinitely. Tools must complete or fail within reasonable time. | Implement 30-second timeouts. If operation takes longer, return acknowledgment + async status check tool. [Source: [Best Practices Deploying Agents](https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/)] |
| **Idempotency for Write Operations** | AI agents may retry operations. Create/update actions must not duplicate on retry. | Use idempotency keys for creates. Check existence before insert. Return success for already-completed actions. [Source: [API Design for Agents](https://www.digitalapi.ai/blogs/how-to-make-your-apis-ready-for-ai-agents)] |
| **Clear Success Confirmation** | AI needs to know operation succeeded to update its understanding. | Return explicit confirmation message: "Appointment created successfully. ID: 123, Date: 2026-01-24 10:00 AM" vs just `{id: 123}`. [Source: [MCP Tool Response](https://modelcontextprotocol.io/docs/concepts/tools)] |

## Differentiators

Advantages of Next.js API + MCP approach over N8N sub-workflows.

| Feature | Value Proposition | Implementation |
|---------|-------------------|----------------|
| **Type-Safe Tool Contracts** | Zod schemas provide compile-time safety that N8N sub-workflows lack. Catches parameter mismatches before deployment. | Define tool inputs/outputs with Zod, export as JSON Schema for MCP, use same schema for API validation. Single source of truth. |
| **Hot Reload Development** | Next.js dev server enables instant tool testing. N8N requires workflow save + execution to test changes. | `npm run dev` reflects tool changes immediately. Test with MCP inspector or direct API calls. 10x faster iteration. |
| **Version Control Integration** | Tool code in Git enables proper review, rollback, blame. N8N stores workflows in database, hard to diff/review. | All tools in `src/app/api/agent-tools/`, standard PR process, semantic versioning, changelog tracking. |
| **Centralized Error Handling** | Next.js middleware enables consistent error format across all tools. N8N requires per-workflow error handling. | Create `agentToolWrapper()` middleware that catches errors, formats as MCP-compliant responses, logs to audit system. |
| **Structured Logging** | Next.js APIs integrate with logging services (Datadog, Sentry). N8N execution logs are UI-only, hard to aggregate. | Log tool calls with context: userId, sessionId, tool name, parameters (sanitized PHI), latency, success/error. |
| **Performance Monitoring** | Track tool latency, identify slow operations. N8N shows execution time but no aggregation/alerting. | Instrument with OpenTelemetry or similar. Alert if tool latency > 3s. Dashboard showing p95/p99 per tool. |
| **Granular RBAC** | Next.js APIs can enforce role-based permissions at tool level. N8N workflows run with single credential set. | Check `user.role` in tool handlers. Admin-only tools (e.g., delete patient) reject non-admin calls with 403. |
| **Parallel Tool Execution** | Multiple tools can execute concurrently in Next.js. N8N sub-workflows typically run sequentially. | MCP protocol supports batch tool calls. Next.js handles concurrent API requests natively. Reduces total latency. |
| **Output Schema Validation** | MCP `outputSchema` enables structured validation of responses. Ensures agent receives expected format. | Define Zod output schema, validate before returning. If validation fails, log error and return fallback response. [Source: [MCP Output Schema](https://modelcontextprotocol.io/docs/concepts/tools)] |
| **Resource Links** | MCP tools can return links to resources (patient profile, appointment details) for context expansion. N8N returns flat JSON only. | Return `{type: "resource_link", uri: "/patients/123"}` in content array. Client can fetch additional context if needed. [Source: [MCP Resource Links](https://modelcontextprotocol.io/docs/concepts/tools)] |

## Anti-Features

Things to deliberately NOT build based on common mistakes in AI tool design.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Low-Level CRUD Tools** | Exposing `GET /patient`, `UPDATE /patient` leads to verbose, poorly-scoped responses. AI makes 10+ calls for simple tasks. [Source: [MCP Tool Design](https://useai.substack.com/p/mcp-tool-design-from-apis-to-ai-first)] | **High-level workflow tools**: `buscar_paciente` returns patient + appointments + pre-checkin status in one call. Combine multiple internal operations into single tool optimized for agent tasks. |
| **Generic Tool Names** | Names like `query_database` or `get_data` don't help agent understand when to use the tool. | **Task-specific names**: `buscar_slots_disponiveis`, `criar_agendamento`. Agent knows "if user wants to book appointment, use criar_agendamento". [Source: [Block MCP Playbook](https://engineering.block.xyz/blog/blocks-playbook-for-designing-mcp-servers)] |
| **Too Many Parameters** | Tools with 10+ parameters overwhelm agents, increase token usage, cause selection errors. | **Group related parameters**: Instead of `nome, telefone, email, cpf, endereco, cidade, estado...` use `dadosPaciente` object. Limit to 3-5 top-level params. [Source: [Function Calling Best Practices](https://medium.com/@jamadadeamol/how-many-parameters-should-a-function-have-best-practices-guidelines-315903700082)] |
| **Mixing Read and Write** | Tools that both read AND modify data make risk assessment difficult for users. "Is this safe to call?" | **Separate read/write tools**: `buscar_agendamentos` (read-only, safe) vs `cancelar_agendamento` (write, requires confirmation). Each tool has single risk level. [Source: [MCP Tool Design Mistakes](https://jentic.com/blog/the-mcp-tool-trap)] |
| **Silent Failures** | Returning empty arrays or null without explanation. Agent doesn't know if query failed or no results exist. | **Explicit error/empty messages**: `"No available slots found for 2026-01-24. Try a different date or period."` vs `[]`. Always explain why no results. [Source: [MCP Error Handling](https://medium.com/@sureshddm/mcp-error-handling-dont-let-your-tools-fail-silently-1b5e02fabe4c)] |
| **Hardcoded Configuration** | Embedding clinic hours (08:00-20:00) in tool code. Requires code change to update. | **Database-driven config**: Tools read from `configuracoes_clinica` table. Changes apply immediately without deployment. [Source: [Best Practices MCP Servers](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/)] |
| **Returning Raw Database Rows** | Dumping Supabase query results directly to agent. Includes irrelevant fields, IDs, timestamps. | **Transform for agent consumption**: Return only relevant fields with human-readable names. Format dates as "Monday, Jan 24, 2026 10:00 AM" not ISO8601. |
| **Stateful Tools** | Tools that depend on previous calls or maintain session state. Agent may call in any order. | **Stateless design**: Each tool call is independent. If context needed, require it as parameter. Example: `reagendar_agendamento(agendamentoId, newDateTime)` not `setAppointment(id); reschedule(newDateTime)`. |
| **Complex Conditional Logic** | "If morning AND Monday AND patient is new AND slot available THEN..." Creates brittle, hard-to-debug tools. | **Simple validation + clear errors**: Check each condition separately. Return specific error for each failure. "Cannot book: Clinic closed on Mondays" vs generic "Invalid request". [Source: [MCP Tool Trap](https://jentic.com/blog/the-mcp-tool-trap)] |
| **Exposing Internal IDs** | Returning UUIDs, database IDs that agent/user can't interpret. "Appointment abc-123-def created" | **Human-readable identifiers**: "Appointment created for Maria Silva on Monday, Jan 24 at 10:00 AM with Dr. Paula". IDs only in metadata if needed for debugging. |
| **Embedding Credentials** | Storing API keys, tokens in tool code or prompts. Security risk, hard to rotate. | **Environment variables + secrets manager**: Use Next.js `process.env` for keys. Never log sensitive values. [Source: [MCP Security](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/)] |

## Tool Interface Patterns

How each tool type should be structured for optimal agent interaction.

### 1. Search/Query Tools (buscar_slots_disponiveis, buscar_paciente, buscar_agendamentos)

**Purpose**: Read-only data retrieval for agent decision-making.

**Input Schema Pattern**:
```typescript
{
  toolName: "buscar_slots_disponiveis",
  description: "Find available appointment slots for a specific date and time period. Use when patient asks about availability.",
  inputSchema: {
    type: "object",
    properties: {
      data: {
        type: "string",
        description: "Date in YYYY-MM-DD format (e.g., 2026-01-24)",
        pattern: "^\\d{4}-\\d{2}-\\d{2}$"
      },
      periodo: {
        type: "string",
        enum: ["manha", "tarde", "qualquer"],
        description: "Time period: 'manha' (08:00-12:00), 'tarde' (13:00-20:00), 'qualquer' (all day)"
      }
    },
    required: ["data", "periodo"]
  }
}
```

**Response Pattern**:
```typescript
// Success with results
{
  content: [{
    type: "text",
    text: "Found 5 available slots for Monday, January 24:\n- 10:00 AM (30 min)\n- 11:00 AM (30 min)\n- 2:00 PM (60 min)\n- 3:30 PM (45 min)\n- 5:00 PM (30 min)"
  }],
  isError: false
}

// Success with no results
{
  content: [{
    type: "text",
    text: "No available slots found for Monday, January 24 in the afternoon. Try morning period or a different date."
  }],
  isError: false  // Not an error, just empty result
}

// Error case
{
  content: [{
    type: "text",
    text: "Invalid date format. Please use YYYY-MM-DD (e.g., 2026-01-24)."
  }],
  isError: true
}
```

**Key Principles**:
- Always return results in human-readable format (agent forwards to user)
- Include context in empty results ("why no results")
- Format dates/times for user presentation ("Monday, Jan 24" not "2026-01-24")
- Limit result count to avoid context window overflow (max 20 slots)

### 2. Create/Mutation Tools (criar_agendamento, atualizar_dados_paciente)

**Purpose**: Modify data with validation and confirmation.

**Input Schema Pattern**:
```typescript
{
  toolName: "criar_agendamento",
  description: "Create a new appointment. Use after confirming date/time with patient. Creates patient record if new.",
  inputSchema: {
    type: "object",
    properties: {
      paciente: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Full name" },
          telefone: { type: "string", description: "Phone with country code (5511999999999)" },
          email: { type: "string", description: "Email address (optional)" }
        },
        required: ["nome", "telefone"]
      },
      agendamento: {
        type: "object",
        properties: {
          dataHora: { type: "string", description: "ISO datetime (2026-01-24T10:00:00-03:00)" },
          servicoId: { type: "string", description: "Service ID from available services" }
        },
        required: ["dataHora", "servicoId"]
      }
    },
    required: ["paciente", "agendamento"]
  }
}
```

**Response Pattern**:
```typescript
// Success
{
  content: [{
    type: "text",
    text: "Appointment confirmed! Details:\n\nPatient: Maria Silva\nService: Limpeza de Pele (60 min)\nDate: Monday, January 24, 2026\nTime: 10:00 AM\nProvider: Dra. Paula\n\nA confirmation message will be sent to 5511999999999."
  }],
  structuredContent: {
    appointmentId: "abc-123",
    patientId: "xyz-456",
    dataHora: "2026-01-24T10:00:00-03:00",
    status: "AGENDADO"
  },
  isError: false
}

// Validation error
{
  content: [{
    type: "text",
    text: "Cannot create appointment: Time slot 10:00 AM is no longer available. Please use buscar_slots_disponiveis to find current availability."
  }],
  isError: true
}

// Business logic error
{
  content: [{
    type: "text",
    text: "Cannot create appointment: Clinic requires minimum 2 hours advance notice. Earliest available time is 12:00 PM today."
  }],
  isError: true
}
```

**Key Principles**:
- Validate ALL inputs before making changes
- Return confirmation with all details for user verification
- Include `structuredContent` for system tracking (IDs, status)
- Use specific error messages that guide agent to corrective action
- Implement idempotency (check for duplicate appointment in same time slot)

### 3. Update/State Change Tools (reagendar_agendamento, cancelar_agendamento, confirmar_presenca)

**Purpose**: Modify existing records with state validation.

**Input Schema Pattern**:
```typescript
{
  toolName: "reagendar_agendamento",
  description: "Reschedule an existing appointment to new date/time. Use when patient requests to change appointment.",
  inputSchema: {
    type: "object",
    properties: {
      agendamentoId: {
        type: "string",
        description: "Appointment ID from previous search"
      },
      novaDataHora: {
        type: "string",
        description: "New datetime in ISO format (2026-01-25T14:00:00-03:00)"
      },
      motivo: {
        type: "string",
        description: "Reason for rescheduling (optional)",
        optional: true
      }
    },
    required: ["agendamentoId", "novaDataHora"]
  }
}
```

**Response Pattern**:
```typescript
// Success
{
  content: [{
    type: "text",
    text: "Appointment rescheduled successfully.\n\nOld time: Monday, Jan 24, 2026 at 10:00 AM\nNew time: Tuesday, Jan 25, 2026 at 2:00 PM\n\nPatient Maria Silva will receive a confirmation message."
  }],
  isError: false
}

// State validation error
{
  content: [{
    type: "text",
    text: "Cannot reschedule: Appointment has already been completed. Please create a new appointment instead."
  }],
  isError: true
}

// Not found error
{
  content: [{
    type: "text",
    text: "Appointment not found. The appointment may have been cancelled. Use buscar_agendamentos to find patient's active appointments."
  }],
  isError: true
}
```

**Key Principles**:
- Verify record exists before attempting update
- Check state transitions are valid (can't reschedule completed appointment)
- Return both old and new state for user confirmation
- Trigger side effects (N8N webhooks) asynchronously, don't block response
- Log state changes to audit trail

### 4. Status Check Tools (status_pre_checkin, buscar_instrucoes)

**Purpose**: Retrieve system state or configuration without side effects.

**Input Schema Pattern**:
```typescript
{
  toolName: "status_pre_checkin",
  description: "Check pre-check-in completion status for an appointment. Use when patient asks about pending tasks before appointment.",
  inputSchema: {
    type: "object",
    properties: {
      agendamentoId: { type: "string", description: "Appointment ID" }
    },
    required: ["agendamentoId"]
  }
}
```

**Response Pattern**:
```typescript
// Complete
{
  content: [{
    type: "text",
    text: "Pre-check-in is complete! All items confirmed:\n✓ Personal data verified\n✓ Documents uploaded\n✓ Pre-appointment instructions sent\n\nYou're all set for your appointment on Monday at 10:00 AM."
  }],
  isError: false
}

// Incomplete with details
{
  content: [{
    type: "text",
    text: "Pre-check-in is pending. Missing items:\n✗ Document upload (ID and insurance card)\n✗ Pre-appointment instructions not confirmed\n\nPlease complete these before your appointment on Monday."
  }],
  isError: false  // Pending is not an error, it's expected state
}
```

**Key Principles**:
- Distinguish between error states and normal states (pending is not an error)
- Provide actionable information (what's missing, how to complete)
- Include deadlines/urgency if relevant ("Please complete by 6:00 PM today")

### 5. Document Processing Tools (processar_documento)

**Purpose**: Handle async operations with multi-step workflows.

**Input Schema Pattern**:
```typescript
{
  toolName: "processar_documento",
  description: "Process uploaded document (OCR, validation, storage). Use when patient uploads ID, insurance card, or medical records.",
  inputSchema: {
    type: "object",
    properties: {
      documentoUrl: { type: "string", description: "Public URL of uploaded document" },
      tipoDocumento: {
        type: "string",
        enum: ["rg", "cpf", "carteirinha", "atestado"],
        description: "Document type"
      },
      pacienteId: { type: "string", description: "Patient ID" }
    },
    required: ["documentoUrl", "tipoDocumento", "pacienteId"]
  }
}
```

**Response Pattern**:
```typescript
// Synchronous success (fast processing)
{
  content: [{
    type: "text",
    text: "Document processed successfully. Extracted information:\n\nType: RG (Identity Card)\nNumber: 12.345.678-9\nName: Maria Silva\nIssue Date: 01/15/2020\n\nDocument has been validated and stored securely."
  }],
  isError: false
}

// Async processing started
{
  content: [{
    type: "text",
    text: "Document received and processing started. This may take 1-2 minutes. You'll receive a notification when processing is complete.\n\nTracking ID: doc-abc-123"
  }],
  isError: false
}

// Processing error
{
  content: [{
    type: "text",
    text: "Cannot process document: Image quality too low. Please upload a clearer photo with good lighting and all text visible."
  }],
  isError: true
}
```

**Key Principles**:
- Acknowledge receipt immediately, process asynchronously if needed
- Return tracking ID for status checks
- Provide specific error messages for common issues (blurry, wrong format, etc)
- Never expose internal OCR errors to agent/user

## Error Handling for AI Agents

How tools should report errors to enable agent recovery.

### Error Classification

| Error Type | isError | HTTP Status | Example | Agent Action |
|------------|---------|-------------|---------|--------------|
| **Validation Error** | `true` | 200 (MCP) | Invalid date format, missing required field | Agent reprompts user for correct input |
| **Business Logic Error** | `true` | 200 (MCP) | Slot unavailable, clinic closed, duplicate booking | Agent suggests alternatives |
| **Not Found** | `true` | 200 (MCP) | Appointment ID doesn't exist | Agent searches for correct record |
| **Permission Denied** | `true` | 200 (MCP) | User lacks permission for this action | Agent explains limitation, suggests escalation |
| **External Service Error** | `true` | 200 (MCP) | Supabase timeout, N8N webhook failed | Agent retries or informs user of temporary issue |
| **Protocol Error** | N/A | 400/500 (HTTP) | Malformed JSON, unknown tool name | Client/framework handles, agent never sees |

**Critical Distinction**: Application errors (invalid slot, patient not found) are returned as successful tool calls with `isError: true`. Protocol errors (invalid JSON, server crash) are HTTP errors that the MCP client handles.

[Source: [MCP Error Handling](https://modelcontextprotocol.io/docs/concepts/tools)]

### Error Message Format

**Template**:
```
Cannot {action}: {specific reason}. {corrective guidance}
```

**Examples**:
```typescript
// Good
"Cannot create appointment: Time slot 10:00 AM is no longer available. Please use buscar_slots_disponiveis to find current availability."

// Bad (vague)
"Appointment creation failed."

// Good
"Cannot reschedule: Appointment has already been completed. To book a new appointment, use criar_agendamento with a new date."

// Bad (no guidance)
"Invalid state transition."

// Good
"Cannot process document: File size exceeds 10MB limit. Please compress the image and try again."

// Bad (technical jargon)
"DocumentSizeExceededError: payload too large"
```

[Source: [MCP Error Best Practices](https://mcpcat.io/guides/error-handling-custom-mcp-servers/)]

### Error Recovery Patterns

**1. Retry with Modified Input**
```typescript
// Agent receives
{
  content: [{ type: "text", text: "Date 2026-02-30 is invalid. February only has 28 days in 2026." }],
  isError: true
}

// Agent action: Adjust date to 2026-02-28 and retry
```

**2. Alternative Tool**
```typescript
// Agent receives
{
  content: [{ type: "text", text: "Cannot find patient by CPF. Try searching by phone number using buscar_paciente with telefone parameter." }],
  isError: true
}

// Agent action: Switch to phone search
```

**3. User Confirmation**
```typescript
// Agent receives
{
  content: [{ type: "text", text: "Multiple appointments found for Maria Silva. Please specify the appointment date." }],
  isError: true
}

// Agent action: Ask user "Which appointment? You have bookings on Jan 24 and Jan 30."
```

**4. Escalation**
```typescript
// Agent receives
{
  content: [{ type: "text", text: "Cannot modify appointment: Requires manager approval. Please contact clinic staff." }],
  isError: true
}

// Agent action: Inform user limitation and offer to escalate
```

### Healthcare-Specific Error Handling

**HIPAA Compliance**: Never expose PHI in error messages that might be logged.

```typescript
// Bad (exposes PHI)
"Patient Maria Silva (CPF 123.456.789-00) has unpaid balance of $500"

// Good (generic)
"Cannot book appointment: Patient has pending payment. Please resolve with clinic staff."
```

**Timezone Errors**: Critical for appointment scheduling.

```typescript
// Detect timezone issues
{
  content: [{
    type: "text",
    text: "Appointment time 10:00 AM is ambiguous due to daylight saving transition on Nov 3, 2026. Please specify 10:00 AM BRT (before DST) or 10:00 AM BRST (after DST)."
  }],
  isError: true
}
```

## Response Format Standards

How tools should format successful responses for optimal agent consumption.

### Text Content Structure

**For user-facing messages** (agent forwards to patient):

```typescript
{
  content: [{
    type: "text",
    text: "Appointment confirmed! Details:\n\nPatient: Maria Silva\nService: Limpeza de Pele (60 min)\nDate: Monday, January 24, 2026\nTime: 10:00 AM\nProvider: Dra. Paula\n\nPlease arrive 10 minutes early."
  }],
  isError: false
}
```

**Format guidelines**:
- Use natural language, not JSON dumps
- Format dates as "Monday, January 24, 2026" not "2026-01-24"
- Format times as "10:00 AM" not "10:00:00"
- Include confirmation of key details
- Add next steps or instructions if relevant

### Structured Content for System Tracking

```typescript
{
  content: [{
    type: "text",
    text: "Appointment created successfully. [user-facing message]"
  }],
  structuredContent: {
    appointmentId: "abc-123",
    patientId: "xyz-456",
    dataHora: "2026-01-24T10:00:00-03:00",
    status: "AGENDADO",
    serviceName: "Limpeza de Pele",
    providerName: "Dra. Paula"
  },
  isError: false
}
```

**When to use**:
- Create/update operations that return IDs
- Status checks that need machine-readable state
- Operations where agent might chain multiple calls

[Source: [MCP Structured Content](https://modelcontextprotocol.io/docs/concepts/tools)]

### Resource Links for Context Expansion

```typescript
{
  content: [{
    type: "text",
    text: "Patient found: Maria Silva, phone 5511999999999, 3 appointments (2 completed, 1 upcoming)."
  }, {
    type: "resource_link",
    uri: "/patients/xyz-456",
    name: "Maria Silva - Patient Profile",
    description: "Full patient details, appointment history, documents",
    annotations: {
      audience: ["assistant"],
      priority: 0.8
    }
  }],
  isError: false
}
```

**Use cases**:
- Tool returns summary, links to full details
- Agent can follow link if user asks for more info
- Reduces initial response size, fetches details on-demand

[Source: [MCP Resource Links](https://modelcontextprotocol.io/docs/concepts/tools)]

### List Results Pagination

**For tools that return multiple items** (buscar_agendamentos, buscar_paciente):

```typescript
{
  content: [{
    type: "text",
    text: "Found 23 appointments for Maria Silva:\n\nUpcoming:\n1. Monday, Jan 24 at 10:00 AM - Limpeza de Pele\n2. Friday, Jan 28 at 2:00 PM - Peeling\n\nPast (showing 3 most recent):\n3. Jan 10 - Botox (completed)\n4. Dec 15 - Avaliação Facial (completed)\n5. Nov 20 - Limpeza de Pele (completed)\n\n[18 more past appointments not shown]"
  }],
  structuredContent: {
    total: 23,
    showing: 5,
    hasMore: true,
    appointments: [/* array of structured data */]
  },
  isError: false
}
```

**Pagination strategy**:
- Show most recent/relevant items in text (5-10 max)
- Include total count and "X more not shown"
- Provide structured data for all results if needed
- Don't paginate with cursor/offset (agent can't navigate pages easily)

### Metadata and Annotations

```typescript
{
  content: [{
    type: "text",
    text: "Pre-check-in complete.",
    annotations: {
      audience: ["user"],  // This message is for patient
      priority: 0.9  // High priority, important confirmation
    }
  }, {
    type: "text",
    text: "Internal note: Patient uploaded ID but insurance card pending.",
    annotations: {
      audience: ["assistant"],  // This is context for agent only
      priority: 0.3  // Low priority, supplementary info
    }
  }],
  isError: false
}
```

**Annotations guide agent behavior**:
- `audience: ["user"]` → Include in response to patient
- `audience: ["assistant"]` → Agent internal context, don't forward
- `priority: 0.9` → Important information, show prominently
- `priority: 0.3` → Supplementary, show if user asks

[Source: [MCP Annotations](https://modelcontextprotocol.io/specification/2025-06-18/server/resources#annotations)]

## Dependencies on Existing Features

| Tool | Depends On | Reason |
|------|------------|--------|
| `buscar_slots_disponiveis` | Calendar availability logic (Phase 4) | Uses same slot calculation as calendar UI |
| `criar_agendamento` | Patient CRUD (Phase 3), RBAC (Phase 1) | Creates patient records, requires auth |
| `reagendar_agendamento` | Appointment CRUD, N8N webhook integration | Triggers reminder recalculation in N8N |
| `cancelar_agendamento` | Waitlist auto-fill (Phase 4) | Notifies waitlist when slot opens |
| `buscar_paciente` | Patient search (Phase 3) | Reuses existing search/filter logic |
| `atualizar_dados_paciente` | Audit logging (Phase 1) | Logs PHI changes for HIPAA compliance |
| `confirmar_presenca` | Anti no-show workflow (Phase 2) | Updates reminder status |
| `status_pre_checkin` | Pre-checkin workflow (v1.2) | Queries pre-checkin state |
| `buscar_instrucoes` | Instructions CRUD (v1.2), embedding search | Uses vector similarity search |
| `processar_documento` | Document validation (v1.2), Supabase storage | OCR + validation pipeline |

**Critical path**: All tools require Phase 1 (RBAC, audit logging) and Phase 3 (Patient/Appointment data models). Tools can be built incrementally on top of existing features.

## Migration Strategy from N8N

| N8N Tool | Next.js API Route | Key Changes |
|----------|-------------------|-------------|
| `Tool: Buscar Slots Disponíveis` | `/api/agent-tools/buscar-slots-disponiveis` | Add JSON Schema, improve error messages |
| `Tool: Criar Agendamento` | `/api/agent-tools/criar-agendamento` | Add idempotency check, structured response |
| `Tool: Reagendar Agendamento` | `/api/agent-tools/reagendar-agendamento` | Add state validation, async webhook trigger |
| `Tool: Cancelar Agendamento` | `/api/agent-tools/cancelar-agendamento` | Add reason parameter, waitlist notification |
| `Tool: Buscar Agendamentos` | `/api/agent-tools/buscar-agendamentos` | Add pagination, format dates for user |
| `Tool: Buscar Paciente` | `/api/agent-tools/buscar-paciente` | Include appointment context, sanitize PHI |
| `Tool: Atualizar Dados Paciente` | `/api/agent-tools/atualizar-dados-paciente` | Add field-level validation, audit log |
| `Tool: Confirmar Presenca` | `/api/agent-tools/confirmar-presenca` | Update reminder status, return confirmation |
| `Tool: Consultar Status Pre Check-In` | `/api/agent-tools/status-pre-checkin` | Return actionable checklist, not just status |
| `Tool: Buscar Instruções` | `/api/agent-tools/buscar-instrucoes` | Format instructions for WhatsApp, include images |
| `Tool: Processar Documento` | `/api/agent-tools/processar-documento` | Add async processing, tracking ID, quality check |

**Testing strategy**:
1. Build Next.js API alongside N8N tool
2. Add feature flag to route requests to new API
3. Shadow test (dual write) to verify parity
4. Gradual rollout (1% → 10% → 100%)
5. Deprecate N8N tool after 1 week of 100% Next.js

## Sources

**MCP Specification and Design:**
- [Model Context Protocol Specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Tools Documentation](https://modelcontextprotocol.io/docs/concepts/tools)
- [Block's Playbook for Designing MCP Servers](https://engineering.block.xyz/blog/blocks-playbook-for-designing-mcp-servers)
- [MCP Tool Design: From APIs to AI-First Interfaces](https://useai.substack.com/p/mcp-tool-design-from-apis-to-ai-first)
- [The MCP Tool Trap](https://jentic.com/blog/the-mcp-tool-trap)

**Error Handling Best Practices:**
- [MCP Error Handling: Don't Let Your Tools Fail Silently](https://medium.com/@sureshddm/mcp-error-handling-dont-let-your-tools-fail-silently-1b5e02fabe4c)
- [Error Handling in MCP Servers - Best Practices Guide](https://mcpcat.io/guides/error-handling-custom-mcp-servers/)
- [Error Handling And Debugging MCP Servers](https://www.stainless.com/mcp/error-handling-and-debugging-mcp-servers)

**AI Agent Best Practices:**
- [15 Best Practices for Deploying AI Agents in Production](https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/)
- [How to Make Your APIs Ready for AI Agents](https://www.digitalapi.ai/blogs/how-to-make-your-apis-ready-for-ai-agents)
- [How APIs Power AI Agents: A Comprehensive Guide](https://treblle.com/blog/api-guide-for-ai-agents)
- [Best Practices for AI Agent Implementations: Enterprise Guide 2026](https://onereach.ai/blog/best-practices-for-ai-agent-implementations/)

**OpenAI and Function Calling:**
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Function Calling in the OpenAI API](https://help.openai.com/en/articles/8555517-function-calling-in-the-openai-api)

**Healthcare AI and Scheduling:**
- [AI Agent for Healthcare Appointment Scheduling](https://qubinets.com/how-to-build-an-ai-agent-for-appointment-scheduling/)
- [Clinical Scheduling with Agentic AI](https://www.aalpha.net/blog/clinical-scheduling-with-agentic-ai/)
- [AI Appointment Scheduling Voice Agent](https://techwize.com/ai-voice-agent-for-appointment-booking)

**Common Mistakes and Anti-Patterns:**
- [Common AI Agent Development Mistakes and How to Avoid Them](https://www.wildnetedge.com/blogs/common-ai-agent-development-mistakes-and-how-to-avoid-them)
- [Why AI Agent Pilots Fail in Production (2026 Integration Roadmap)](https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap)
- [5 Best Practices for Building MCP Servers](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/)
- [Common Sub-Agent Anti-Patterns and Pitfalls](https://stevekinney.com/courses/ai-development/subagent-anti-patterns)
