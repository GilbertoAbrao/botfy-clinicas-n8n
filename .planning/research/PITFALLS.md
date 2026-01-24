# Pitfalls Research: Agent API + MCP Migration

**Domain:** AI Agent Tool APIs + MCP Server Implementation
**Migration Context:** N8N Sub-workflows → Next.js APIs + MCP Server
**Researched:** 2026-01-24
**Overall Confidence:** HIGH

## Executive Summary

Migrating from N8N sub-workflow tools to HTTP APIs introduces three critical failure modes: (1) production bot disruption during cutover, (2) AI agent tool calling failures from poor API design, and (3) security vulnerabilities from exposing APIs without proper authentication. The research reveals that most AI agent pilots fail not from model limitations, but from integration architecture mistakes—specifically "brittle connectors" that don't handle third-party API constraints and function calling interfaces that violate the "intern test" (would a human understand how to use this from the description alone?).

For healthcare systems with HIPAA requirements, the stakes are higher: prompt injection attacks can expose PHI, inadequate audit logging breaks compliance, and agent hallucinations during function calls can corrupt patient data. The good news: proven patterns exist for zero-downtime migration (canary + blue-green), secure agent authentication (OAuth 2.1 + short-lived tokens), and hallucination reduction (structured outputs + RAG, reducing error rates from 38% to ~1-2% in 2026 models).

## Critical Pitfalls

### 1. Breaking Production Bot During Migration

**Risk:** Switching all 11 tools to APIs simultaneously causes WhatsApp bot downtime, lost patient conversations, and emergency rollback scramble.

**Root Cause:** "Big bang" API migration without gradual traffic shifting or rollback strategy.

**Warning Signs:**
- No staging environment mirroring production N8N configuration
- No automated tests validating N8N HTTP Request → API integration
- No monitoring for tool calling failures (agent just "stops working")
- Deployment plan has a single cutover timestamp, no phases

**Prevention:**
1. **Canary Migration Pattern**: Migrate tools one at a time in risk order (lowest → highest)
   - Start with: `buscar_paciente` (read-only, simple)
   - Middle: `buscar_slots_disponiveis`, `buscar_agendamentos` (read-only, complex)
   - Last: `criar_agendamento`, `cancelar_agendamento` (write operations)

2. **Blue-Green per Tool**: Maintain both N8N sub-workflow AND API endpoint during transition
   ```javascript
   // N8N HTTP Request Tool with fallback
   const toolResult = await fetch(NEXT_API_URL).catch(async (err) => {
     console.error('[Fallback] API failed, using N8N workflow', err)
     return await executeWorkflow(WORKFLOW_ID) // Fallback to old tool
   })
   ```

3. **Health Checks + Circuit Breaker**: API must expose `/health` endpoint; N8N falls back to workflow if API unhealthy for >30s

4. **Automated Integration Tests**: Test N8N → API path before deploying
   ```bash
   # Test from N8N perspective
   curl "$N8N_URL/webhook/test/tool-migration" -d '{"tool": "buscar_paciente", "telefone": "5511999999999"}'
   ```

**Phase Addressed:** Phase 1 (Migration Infrastructure), Phase 2 (Tool-by-Tool Migration)

**Real-World Evidence:** According to GetYourGuide's API migration post-mortem, issues only surface in production under real load/concurrency—integration tests in staging miss edge cases. Teams that skip staging see 2+ hours downtime before rollback.

---

### 2. AI Agent Can't Call New APIs (Function Calling Schema Mismatch)

**Risk:** APIs work in Postman but agent never calls them, calls with `undefined` parameters, or hallucinates non-existent functions.

**Root Cause:** Function schema violates LLM expectations, descriptions too vague, parameter types mismatched between N8N `$fromAI()` and API schema.

**Warning Signs:**
- Agent says "I can't help with that" when it should call a tool
- Agent execution logs show tool called with `{param: undefined}`
- Agent invents parameters not in schema (e.g., `periodo: "manha"` becomes `period: "morning"`)
- Agent calls wrong tool because descriptions are ambiguous

**Prevention:**

**1. Pass the "Intern Test"**
> "Could an intern correctly use this function given only what you gave the model?"

```typescript
// ❌ FAILS INTERN TEST - Vague description
{
  name: "buscar_slots",
  description: "Busca slots",
  parameters: {
    data: { type: "string" } // What format? YYYY-MM-DD? ISO? Epoch?
  }
}

// ✅ PASSES INTERN TEST - Explicit, unambiguous
{
  name: "buscar_slots_disponiveis",
  description: "Busca horários LIVRES (não ocupados) em data específica. Use quando paciente pergunta 'tem horário amanhã?' ou 'quais horários disponíveis dia 20?'",
  parameters: {
    data: {
      type: "string",
      description: "Data no formato YYYY-MM-DD (exemplo: 2026-01-20)",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$"
    },
    periodo: {
      type: "string",
      enum: ["manha", "tarde", "qualquer"],
      description: "Período do dia: 'manha' (08:00-12:00), 'tarde' (13:00-20:00), 'qualquer' (dia todo)"
    }
  },
  required: ["data"]
}
```

**2. Align N8N Schema with API Schema**

N8N `$fromAI()` configuration MUST match API's Zod schema:

```javascript
// N8N HTTP Request Tool - Edit Fields node preparing request
{
  "data": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}",
  "periodo": "={{ $fromAI('periodo', 'Período: manha, tarde ou qualquer', 'string') }}"
}
```

```typescript
// Next.js API - src/app/api/agent-tools/buscar-slots/route.ts
const schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  periodo: z.enum(['manha', 'tarde', 'qualquer']).optional()
})
```

**CRITICAL BUG**: N8N issue #14274 reports `$fromAI()` in HTTP Request node causes immediate execution failure. Workaround: Use Execute Workflow node with Edit Fields to prepare parameters, THEN HTTP Request.

**3. Use Structured Outputs (Not JSON Mode)**

OpenAI/Anthropic 2026 best practice: Structured Outputs enforce schema compliance at model level.

```typescript
// API response MUST use structured format
return NextResponse.json({
  success: true,
  data: slots.map(s => ({
    data_hora: s.data_hora, // ✅ Explicit field names
    duracao_minutos: s.duracao
  }))
})

// ❌ AVOID - Forces agent to parse nested/ambiguous structure
return NextResponse.json({ result: JSON.stringify(slots) })
```

**4. Limit Function Count (<20 Tools)**

Loading 50+ tools into system prompt causes cost/latency problems and accuracy degradation. Internal Anthropic testing: 58 tools consumed ~55k tokens.

**Mitigation for 11 Tools:**
- Group related functions: `criar_agendamento` also handles patient creation (don't split into `criar_paciente` + `criar_agendamento`)
- Use tool description to narrow scope: "ONLY use for confirmed appointments, NOT for 'maybe' conversations"

**Phase Addressed:** Phase 3 (API Design), Phase 4 (N8N Integration)

**Real-World Evidence:** Prompt Engineering Guide reports function calling hallucinations (misspelled tool names, invalid parameters) correlate with entropy—models guess when descriptions are vague. 2026 best models achieve 1-2% error rates with proper schemas, vs 8-38% with poor design.

---

### 3. Prompt Injection Exposes Patient PHI

**Risk:** Malicious patient messages inject instructions that bypass HIPAA safeguards, leak other patients' data, or corrupt records.

**Root Cause:** Agent APIs trust user input without sanitization; agent has unrestricted database access; no audit trail to detect attacks.

**Warning Signs:**
- API logs show queries like `SELECT * FROM pacientes WHERE telefone = '... OR 1=1 --'`
- Agent returns data for patients other than the requester
- Audit logs missing for sensitive operations (delete, PHI access)
- API doesn't validate user identity matches data access scope

**Prevention:**

**1. Zero Trust Architecture for Agent APIs**

Every agent API call MUST authenticate as if it's a new user request:

```typescript
// src/app/api/agent-tools/buscar-paciente/route.ts
export async function POST(req: NextRequest) {
  // 1. AUTHENTICATE: Verify request from N8N (not random attacker)
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.AGENT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. AUTHORIZE: Verify patient can only access their OWN data
  const { telefone } = await req.json()
  const requestorPhone = req.headers.get('x-requestor-phone') // From N8N
  if (telefone !== requestorPhone) {
    await logAudit({
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      details: { requestor: requestorPhone, target: telefone }
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. SANITIZE: Use parameterized queries (Supabase RLS enforces this)
  const { data } = await supabase
    .from('pacientes')
    .select('*')
    .eq('telefone', telefone) // ✅ Parameterized
    .single()

  return NextResponse.json({ success: true, data })
}
```

**2. Short-Lived Tokens (Not Static API Keys)**

```typescript
// ❌ AVOID - Static key in N8N env vars (if compromised, valid forever)
headers: { 'x-api-key': process.env.NEXT_API_KEY }

// ✅ BETTER - Generate JWT with 5min expiry
const token = jwt.sign(
  { telefone, exp: Math.floor(Date.now() / 1000) + 300 },
  process.env.JWT_SECRET
)
headers: { 'Authorization': `Bearer ${token}` }
```

**3. Audit Logging for ALL Agent Actions**

```typescript
await logAudit({
  userId: 'agent-marilia',
  action: AuditAction.AGENT_BUSCAR_PACIENTE,
  resource: 'pacientes',
  resourceId: patientId,
  details: {
    telefone: requestorPhone,
    timestamp: new Date().toISOString(),
    tool: 'buscar_paciente'
  }
})
```

**4. Rate Limiting per Patient**

Prevent prompt injection loop attacks:

```typescript
// Redis: INCR agent:buscar_paciente:5511999999999
if (await redis.get(`agent:${tool}:${telefone}`) > 10) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
await redis.setex(`agent:${tool}:${telefone}`, 60, callCount + 1)
```

**Phase Addressed:** Phase 5 (Security), throughout all phases

**Real-World Evidence:** CyberArk 2026 AI Agent Security Report: Prompt injection is the #1 attack vector for AI agents with API access. Payment processors reported unauthorized refunds from injected "approve all refunds" prompts. HIPAA compliance requires audit trails for PHI access—agent APIs are NOT exempt.

---

### 4. API Response Format Breaks Agent Conversation Flow

**Risk:** API returns correct data but agent says "An error occurred" or repeats the question, confusing patients.

**Root Cause:** API error messages not descriptive, response structure doesn't match agent's expectations, missing context for agent to formulate natural response.

**Warning Signs:**
- Agent says "I couldn't find that information" when API returned empty array (not an error)
- Agent can't distinguish between "no slots available" vs "date is in the past"
- API returns HTTP 500 with generic "Internal Server Error", agent can't explain to patient
- Agent repeats tool call in infinite loop because response doesn't signal completion

**Prevention:**

**1. Rich, Agent-Friendly Error Messages**

```typescript
// ❌ AVOID - Generic errors agent can't explain
if (!data) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// ✅ BETTER - Descriptive errors agent can relay to patient
if (slots.length === 0) {
  return NextResponse.json({
    success: true,
    data: [],
    message: "Nenhum horário disponível nesta data. Próximas datas com vagas: 2026-01-25 (3 slots), 2026-01-27 (5 slots).",
    metadata: {
      next_available_dates: ['2026-01-25', '2026-01-27'],
      reason: 'fully_booked'
    }
  })
}

// For errors, return valid list of options to save agent another call
if (!isValidPeriodo(periodo)) {
  return NextResponse.json({
    success: false,
    error: `Período inválido: '${periodo}'. Valores aceitos: ${VALID_PERIODOS.join(', ')}`,
    valid_values: VALID_PERIODOS
  }, { status: 400 })
}
```

**2. Consistent Response Envelope**

All agent APIs MUST use same structure:

```typescript
type AgentApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string // Natural language for agent to relay
  metadata?: Record<string, any> // Context for decision-making
}
```

**3. Empty State != Error State**

```typescript
// ✅ Empty array is SUCCESS (agent should offer alternatives)
GET /agent-tools/buscar-slots?data=2026-01-20&periodo=manha
{
  "success": true,
  "data": [],
  "message": "Todos os horários da manhã do dia 20/01 estão ocupados. A tarde tem 3 horários disponíveis."
}

// ❌ Don't return 404 for empty results
```

**4. Prevent Infinite Loops**

When agent calls same tool repeatedly:

```typescript
// Add completion signal to response
{
  "success": true,
  "data": { /* agendamento criado */ },
  "message": "Agendamento criado com sucesso para 2026-01-20 às 14:00.",
  "metadata": {
    "action_completed": true, // Signal: don't retry
    "confirmation_needed": false
  }
}
```

**Phase Addressed:** Phase 3 (API Design), Phase 6 (Testing)

**Real-World Evidence:** N8N community reports (issue #223783) show agent tools fail silently with generic errors, requiring descriptive messages. According to Composio's 2026 Agent Report, "dumb RAG" and poor tool responses cause 70% of agent pilot failures—not model limitations.

---

### 5. N8N HTTP Request Node Configuration Hell

**Risk:** API works in curl/Postman but N8N HTTP Request node returns 401/500/timeout, blocking migration.

**Root Cause:** N8N HTTP Request node quirks: header formatting, JSON body encoding, timeout defaults, SSL certificate validation.

**Warning Signs:**
- curl succeeds, N8N HTTP Request fails with same URL/payload
- API logs show request body as `"[object Object]"` instead of JSON
- Intermittent timeouts on fast API (N8N default timeout too low)
- CORS errors (N8N making preflight OPTIONS requests)

**Prevention:**

**1. N8N HTTP Request Node Best Practices**

```javascript
// N8N HTTP Request Tool Configuration
{
  "method": "POST",
  "url": "={{ $env.NEXT_API_URL }}/api/agent-tools/buscar-slots",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Content-Type",
        "value": "application/json"
      },
      {
        "name": "x-api-key",
        "value": "={{ $env.AGENT_API_SECRET }}"
      },
      {
        "name": "x-requestor-phone",
        "value": "={{ $json.telefone }}" // For authorization
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "data",
        "value": "={{ $json.data }}"
      },
      {
        "name": "periodo",
        "value": "={{ $json.periodo }}"
      }
    ]
  },
  "options": {
    "timeout": 10000, // ✅ 10s (default 5s often too low)
    "response": {
      "response": {
        "responseFormat": "json" // ✅ Auto-parse JSON
      }
    }
  }
}
```

**2. Known N8N Gotchas**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Body sent as `"[object Object]"` | Body type set to "JSON" but not stringified | Use "Body Parameters" option, not raw JSON |
| 401 Unauthorized | Header name case-sensitive | Use exact case: `x-api-key` not `X-API-KEY` |
| Timeout on local dev | N8N can't reach `localhost` | Use Docker network name or ngrok |
| SSL certificate error | Self-signed cert in dev | Set `Ignore SSL Issues: true` (dev only!) |
| `$fromAI()` returns undefined | Missing `specifyInputSchema: true` | See AGENTS.md troubleshooting section |

**3. Test Webhook for N8N → API Validation**

Create test endpoint that logs EXACTLY what N8N sends:

```typescript
// src/app/api/agent-tools/test/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text() // Get raw body
  const headers = Object.fromEntries(req.headers.entries())

  console.log('=== N8N REQUEST DEBUG ===')
  console.log('Headers:', JSON.stringify(headers, null, 2))
  console.log('Body (raw):', body)
  console.log('Body (parsed):', JSON.parse(body))

  return NextResponse.json({
    success: true,
    received: { headers, body: JSON.parse(body) }
  })
}
```

**Phase Addressed:** Phase 4 (N8N Integration)

**Real-World Evidence:** N8N GitHub issues #14274 and community forum posts show HTTP Request node fails with `$fromAI()` in certain configurations. N8N docs recommend using Execute Workflow + Edit Fields workaround.

---

### 6. Missing Rollback Strategy for Data Corruption

**Risk:** New API has bug that corrupts patient data (wrong appointment times, duplicate records), no way to restore.

**Root Cause:** No database snapshots before migration, no soft-delete pattern, no data validation layer.

**Warning Signs:**
- API `DELETE` operations use `DELETE FROM` (hard delete)
- API `UPDATE` operations directly overwrite without history
- No staging database with production data copy for testing
- No automated data integrity checks (referential integrity, required fields)

**Prevention:**

**1. Soft Delete Pattern**

```typescript
// ❌ AVOID - Hard delete (can't undo)
await supabase.from('agendamentos').delete().eq('id', id)

// ✅ BETTER - Soft delete (can restore)
await supabase
  .from('agendamentos')
  .update({
    status: 'cancelada',
    deleted_at: new Date().toISOString(),
    deleted_by: 'agent-marilia'
  })
  .eq('id', id)
```

**2. Audit Trail for Rollback**

```typescript
// Store before/after for all updates
await logAudit({
  action: 'UPDATE_AGENDAMENTO',
  resourceId: id,
  details: {
    before: oldData,
    after: newData,
    changes: diff(oldData, newData)
  }
})

// Rollback function
async function rollbackUpdate(auditId: string) {
  const audit = await getAuditLog(auditId)
  await supabase
    .from('agendamentos')
    .update(audit.details.before)
    .eq('id', audit.resourceId)
}
```

**3. Database Snapshots Before Migration**

```bash
# Before each tool migration
pg_dump -h <SUPABASE_HOST> -U postgres -d postgres > backup-$(date +%Y%m%d-%H%M%S).sql
```

**4. Data Validation Layer**

```typescript
// Validate AFTER database operation
const created = await createAgendamento(data)

// Sanity checks
if (!created.id) throw new Error('Agendamento sem ID')
if (created.paciente_id !== data.paciente_id) throw new Error('Paciente ID mismatch')
if (new Date(created.data_hora) < new Date()) throw new Error('Agendamento no passado')

// Cross-check with Supabase
const verified = await supabase
  .from('agendamentos')
  .select('*')
  .eq('id', created.id)
  .single()

if (!verified.data) {
  throw new Error(`Agendamento ${created.id} não encontrado após criação`)
}
```

**Phase Addressed:** Phase 1 (Migration Infrastructure), Phase 5 (Security)

**Real-World Evidence:** Composio 2026 Agent Report: Data pipeline failures are the #1 cause of AI agents operating incorrectly in production. Payment processor case study: agent API bug caused ~$50k in duplicate charges before detection.

---

### 7. MCP Server Architecture Mismatch

**Risk:** Building MCP server adds complexity without value; or skipping MCP when it would enable better agent orchestration.

**Root Cause:** Misunderstanding when MCP is appropriate vs direct HTTP APIs.

**Warning Signs:**
- MCP server becomes "kitchen sink" with 50+ tools (security nightmare)
- MCP in hot path causes 300-800ms latency for every agent call
- OR: Direct HTTP APIs lack standardization, each tool has different auth/format

**Prevention:**

**DECISION FRAMEWORK: When to Use MCP**

| Scenario | Use MCP? | Rationale |
|----------|----------|-----------|
| Single agent (Marília) calling tools | NO | Direct HTTP simpler, lower latency |
| Multiple agents sharing tools | YES | MCP provides standard interface |
| Tools need context from previous calls | YES | MCP handles session management |
| Real-time customer-facing (WhatsApp) | NO | 300-800ms MCP latency unacceptable |
| Background analysis (dashboards) | YES | Latency tolerance, benefits from caching |
| Tools <20 functions | NO | Direct HTTP sufficient |
| Tools >50 functions | YES | MCP governance/organization needed |

**For Botfy Clinicas (11 tools, single agent, real-time WhatsApp):**
- **Phase 1-4: Direct HTTP APIs** (no MCP)
- **Phase 5 (Optional): MCP Wrapper** for future multi-agent scenarios

**MCP Implementation Anti-Patterns to AVOID:**

```typescript
// ❌ KITCHEN SINK - One MCP server for everything
const mcpServer = new MCPServer({
  tools: [
    buscar_slots, criar_agendamento, cancelar_agendamento, // Calendar
    buscar_paciente, atualizar_paciente, // Patients
    processar_documento, buscar_instrucoes, // Documents
    send_email, create_invoice, run_report // ??? Unrelated functions
  ]
}) // Security nightmare, privilege escalation risk

// ✅ MODULAR - Separate MCP servers by domain
const calendarMCP = new MCPServer({ tools: [buscar_slots, criar_agendamento] })
const patientMCP = new MCPServer({ tools: [buscar_paciente, atualizar_paciente] })

// ❌ MCP IN HOT PATH - Agent waits 500ms for every tool call
async function handleWhatsAppMessage() {
  const response = await mcpServer.callTool('buscar_slots') // 300-800ms latency!
  await sendWhatsApp(response) // User waiting...
}

// ✅ MCP IN BACKGROUND - Dashboard pre-loads data
async function refreshDashboard() {
  const stats = await mcpServer.callTool('aggregate_stats') // Latency OK
  await cache.set('dashboard:stats', stats)
}
```

**Phase Addressed:** Phase 0 (Architecture Decision), Phase 5+ (MCP Implementation)

**Real-World Evidence:** Nate's Newsletter "MCP Implementation Guide": 300-800ms baseline latency can't be cached away—MCP in checkout flows destroys conversion. Descope MCP Security Report: Kitchen Sink servers create privilege escalation risks.

---

## Migration-Specific Risks

### 8. Dual-Write Data Inconsistency

**Risk:** During migration, N8N workflow writes to DB, API also writes to DB, creating duplicate/conflicting records.

**Root Cause:** Both old (N8N) and new (API) systems active simultaneously without coordination.

**Warning Signs:**
- Duplicate appointments in database with same patient/time but different IDs
- API and N8N have different business logic (one validates, other doesn't)
- Race condition: patient creates appointment via WhatsApp (N8N) while agent calls API

**Prevention:**

**1. Read-Heavy First, Write-Heavy Last Migration Order**

```
Phase 1 (Read-only tools, safe to dual-run):
- buscar_paciente
- buscar_slots_disponiveis
- buscar_agendamentos
- status_pre_checkin

Phase 2 (Read with side-effects):
- buscar_instrucoes (embedding search)
- processar_documento (file upload)

Phase 3 (Write operations, LAST):
- criar_agendamento
- reagendar_agendamento
- cancelar_agendamento
- atualizar_dados_paciente
- confirmar_presenca
```

**2. Idempotency Keys for Write Operations**

```typescript
// API accepts idempotency key from N8N
const { idempotency_key } = await req.json()

// Check if already processed
const existing = await supabase
  .from('agendamentos')
  .select('*')
  .eq('idempotency_key', idempotency_key)
  .single()

if (existing.data) {
  return NextResponse.json({
    success: true,
    data: existing.data,
    message: 'Agendamento já criado (idempotent)'
  })
}

// Create with idempotency key
const { data } = await supabase
  .from('agendamentos')
  .insert({ ...appointment, idempotency_key })
```

**3. Feature Flag for Gradual Cutover**

```typescript
// N8N HTTP Request Tool
const USE_API = process.env.TOOL_CRIAR_AGENDAMENTO_USE_API === 'true'

if (USE_API) {
  // Call Next.js API
  const result = await fetch(`${NEXT_API_URL}/agent-tools/criar-agendamento`, {...})
} else {
  // Call old N8N sub-workflow
  const result = await executeWorkflow('eEx2enJk3YpreNUm', {...})
}
```

**Phase Addressed:** Phase 2 (Tool-by-Tool Migration)

**Real-World Evidence:** According to Mulesoft's API Migration STAR Pattern guide, dual-write consistency is the #1 failure mode. Recommendation: Strangler Fig pattern with feature flags for gradual cutover.

---

### 9. Agent Memory Pollution from Failed Migrations

**Risk:** Tool migration fails/errors, but agent's chat memory stores incorrect responses, causing future conversations to reference wrong data.

**Root Cause:** N8N Postgres Chat Memory stores ALL messages (including errors) without cleanup mechanism.

**Warning Signs:**
- Patient asks "what's my appointment?" → Agent says "You have appointment on [wrong date]" from previous failed tool call
- Agent memory shows tool responses with error messages that agent treats as facts
- Chat memory grows unbounded (>1000 messages per patient)

**Prevention:**

**1. Don't Store Failed Tool Calls in Memory**

```javascript
// N8N - AFTER HTTP Request Tool call
const toolResult = $('HTTP Request Tool').first().json

// Only store in chat memory if successful
if (toolResult.success) {
  // Store in Postgres Chat Memory
} else {
  // Log error but don't store in agent memory
  console.error('Tool failed:', toolResult.error)
  // Return error to agent without polluting memory
}
```

**2. Memory Pruning Strategy**

```typescript
// API endpoint to clean stale/corrupt agent memory
export async function POST() {
  // Remove messages older than 30 days
  await supabase
    .from('n8n_chat_histories')
    .delete()
    .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Remove error messages from memory
  await supabase
    .from('n8n_chat_histories')
    .delete()
    .ilike('message->content', '%error%')

  // Keep only last 50 messages per patient
  // (complex query, use RPC function)
}
```

**3. Structured Tool Response Format**

```typescript
// Tool response includes metadata for memory filtering
{
  "success": true,
  "data": { /* actual data */ },
  "metadata": {
    "should_store_in_memory": true, // Explicit flag
    "memory_summary": "Paciente tem agendamento dia 20/01 às 14h" // What to store
  }
}
```

**Phase Addressed:** Phase 4 (N8N Integration), Phase 6 (Testing)

**Real-World Evidence:** AGENTS.md troubleshooting section documents "AI repete perguntas ou fica confusa" caused by corrupted chat memory requiring manual `DELETE FROM n8n_chat_histories`.

---

### 10. Timezone Handling Breaks During Migration

**Risk:** N8N sub-workflows use TZDate correctly, but new APIs use JavaScript Date, causing DST bugs and wrong appointment times.

**Root Cause:** Loss of institutional knowledge during migration—N8N developers knew about Brazil DST (Feb/Nov transitions), API developers don't.

**Warning Signs:**
- Appointments created 1 hour off during DST transition weeks (Feb 15-22, Nov 1-7)
- API logs show times in UTC without timezone indicator
- Frontend shows "14:00" but database stores "17:00" (UTC conversion)

**Prevention:**

**1. ALWAYS Use TZDate in APIs**

```typescript
// ❌ AVOID - JavaScript Date (DST-unaware)
const appointmentTime = new Date(2026, 1, 17, 14, 0) // February 17, 2pm

// ✅ CORRECT - TZDate (DST-aware)
import { TZDate } from '@date-fns/tz'
const appointmentTime = new TZDate(2026, 1, 17, 14, 0, 'America/Sao_Paulo')
```

**2. Validate Timezone in All Date Inputs**

```typescript
const schema = z.object({
  data_hora: z.string().refine(
    (val) => {
      const date = new Date(val)
      // Must include timezone or be in ISO format
      return val.includes('-03:00') || val.includes('Z') || val.match(/T\d{2}:\d{2}:\d{2}/)
    },
    { message: 'data_hora must include timezone' }
  )
})
```

**3. Migration Checklist Item: Audit All Date Operations**

```bash
# Search codebase for Date usage
grep -r "new Date(" src/app/api/agent-tools/

# Flag any usage NOT using TZDate
# Manual review required for each instance
```

**Phase Addressed:** Phase 3 (API Design), Phase 6 (Testing)

**Real-World Evidence:** CLAUDE.md emphasizes "ALWAYS use TZDate for datas/horários" due to Brazil DST transitions. Calendar bugs in production were traced to mixing Date and TZDate.

---

## MCP Implementation Risks

### 11. MCP Security Vulnerabilities (SQL Injection, Confused Deputy)

**Risk:** MCP server trusts client input, allowing SQL injection or unauthorized data access.

**Root Cause:** MCP servers often run with elevated privileges (database access) but don't validate client authorization.

**Warning Signs:**
- MCP server connects to database with admin credentials
- No parameterized queries in MCP tool functions
- MCP server doesn't check which user is calling the tool
- Logs show MCP server executing queries for resources user shouldn't access

**Prevention:**

**1. Parameterized Queries ONLY**

```typescript
// ❌ VULNERABLE - SQL Injection
const mcpServer = new MCPServer({
  tools: {
    buscar_paciente: async ({ telefone }) => {
      // Attacker sends: telefone = "5511999999999' OR '1'='1"
      const result = await db.query(`SELECT * FROM pacientes WHERE telefone = '${telefone}'`)
      return result
    }
  }
})

// ✅ SECURE - Parameterized query
const mcpServer = new MCPServer({
  tools: {
    buscar_paciente: async ({ telefone }) => {
      const result = await supabase
        .from('pacientes')
        .select('*')
        .eq('telefone', telefone) // Supabase auto-parameterizes
        .single()
      return result
    }
  }
})
```

**2. Confused Deputy Prevention**

```typescript
// MCP server checks CALLER identity, not just request data
const mcpServer = new MCPServer({
  tools: {
    buscar_paciente: async ({ telefone }, context) => {
      // Verify caller is authorized for this patient
      if (context.caller.role !== 'ADMIN' && context.caller.telefone !== telefone) {
        throw new Error('Forbidden: Can only access own patient data')
      }

      const result = await supabase
        .from('pacientes')
        .select('*')
        .eq('telefone', telefone)
        .single()
      return result
    }
  }
})
```

**3. Read-Only by Default**

```typescript
// Start with read-only database connection
const readOnlySupabase = createClient(SUPABASE_URL, SUPABASE_READ_ONLY_KEY)

// Only elevate privileges when necessary (and with extra validation)
async function criar_agendamento({ paciente_id, data_hora }) {
  // Extra validation for write operations
  await validateBusinessRules({ paciente_id, data_hora })

  // Use write-enabled client only after validation
  const writeSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const result = await writeSupabase.from('agendamentos').insert(...)
  return result
}
```

**Phase Addressed:** Phase 5+ (MCP Implementation, if applicable)

**Real-World Evidence:** The Hacker News (Jan 2026): Three vulnerabilities in Anthropic's MCP Git Server enabled file access and code execution. Descope MCP Security Guide: SQL injection and confused deputy are top 2 MCP vulnerabilities.

---

### 12. MCP OAuth 2.1 Authentication Misconfiguration

**Risk:** Using deprecated authentication methods or misconfiguring OAuth scopes, allowing unauthorized MCP access.

**Root Cause:** MCP spec historically used custom auth; OAuth 2.1 standardization in 2025 means outdated tutorials are wrong.

**Warning Signs:**
- MCP server uses HTTP Basic Auth or custom API keys
- OAuth implementation uses password grant (deprecated in 2.1)
- Tokens don't expire or refresh
- No scope enforcement (all clients get full access)

**Prevention:**

**1. Use OAuth 2.1 Client Credentials Flow**

```typescript
// MCP Server OAuth 2.1 Configuration
const mcpServer = new MCPServer({
  auth: {
    type: 'oauth2.1',
    tokenEndpoint: 'https://your-auth-server.com/token',
    clientId: process.env.MCP_CLIENT_ID,
    clientSecret: process.env.MCP_CLIENT_SECRET,
    scopes: ['agent:read', 'agent:write:appointments']
  }
})

// Client (N8N) obtains token
const tokenResponse = await fetch('https://your-auth-server.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.MCP_CLIENT_ID,
    client_secret: process.env.MCP_CLIENT_SECRET,
    scope: 'agent:read agent:write:appointments'
  })
})

const { access_token, expires_in } = await tokenResponse.json()

// Use token in MCP calls (expires in 300-3600s)
await mcpServer.callTool('buscar_slots', { data: '2026-01-20' }, {
  headers: { Authorization: `Bearer ${access_token}` }
})
```

**2. Token Expiry and Refresh**

```typescript
// Track token expiry
let accessToken = null
let tokenExpiry = null

async function getValidToken() {
  if (!accessToken || Date.now() > tokenExpiry) {
    const { access_token, expires_in } = await fetchNewToken()
    accessToken = access_token
    tokenExpiry = Date.now() + (expires_in * 1000)
  }
  return accessToken
}
```

**3. Scope Enforcement in MCP Server**

```typescript
const mcpServer = new MCPServer({
  tools: {
    buscar_slots: {
      handler: async (params) => { /* ... */ },
      requiredScopes: ['agent:read'] // Read-only
    },
    criar_agendamento: {
      handler: async (params) => { /* ... */ },
      requiredScopes: ['agent:write:appointments'] // Write
    }
  }
})

// MCP middleware checks scopes
mcpServer.use((context, next) => {
  const token = context.request.headers.authorization.split(' ')[1]
  const { scopes } = jwt.verify(token, process.env.JWT_SECRET)

  if (!tool.requiredScopes.every(s => scopes.includes(s))) {
    throw new Error('Insufficient scopes')
  }

  return next()
})
```

**Phase Addressed:** Phase 5+ (MCP Implementation, if applicable)

**Real-World Evidence:** MCP Security Survival Guide (Towards Data Science): Modern MCP standardized on OAuth 2.1 as of 2025, deprecating basic auth and custom methods. Red Hat MCP Security Report emphasizes scope enforcement to prevent privilege escalation.

---

## Security Considerations

### 13. API Key Exposure in N8N Logs/Webhooks

**Risk:** API keys logged in N8N execution history or webhook payloads, visible to anyone with N8N access.

**Root Cause:** N8N logs all node inputs/outputs by default, including headers with API keys.

**Warning Signs:**
- N8N execution history shows `x-api-key: abc123...` in HTTP Request node
- Webhook test payloads include secrets
- Environment variables printed in Code nodes for debugging

**Prevention:**

**1. Use N8N Credentials (Not Env Vars in Headers)**

```javascript
// ❌ AVOID - API key visible in execution logs
{
  "headerParameters": {
    "parameters": [
      { "name": "x-api-key", "value": "={{ $env.AGENT_API_SECRET }}" } // Logged!
    ]
  }
}

// ✅ BETTER - Use N8N Credentials feature
// 1. Create credential: Settings → Credentials → Create New → Header Auth
// 2. Add header: "x-api-key" with secret value
// 3. In HTTP Request node:
{
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "httpHeaderAuth": "={{ $credentials.AgentAPIKey }}" // Not logged
}
```

**2. Sanitize Logs in Code Nodes**

```javascript
// Code node
const apiKey = $env.AGENT_API_SECRET
const headers = {
  'x-api-key': apiKey
}

// ❌ AVOID
console.log('Calling API with headers:', headers) // Logs secret!

// ✅ BETTER
console.log('Calling API with headers:', {
  ...headers,
  'x-api-key': '[REDACTED]'
})
```

**3. Disable Execution Data Saving for Sensitive Workflows**

```json
// N8N Workflow Settings
{
  "settings": {
    "saveExecutionProgress": false, // Don't log intermediate steps
    "saveDataSuccessExecution": "none", // Don't save successful execution data
    "saveDataErrorExecution": "all" // Only save errors (for debugging)
  }
}
```

**Phase Addressed:** Phase 4 (N8N Integration), Phase 5 (Security)

**Real-World Evidence:** N8N community forum posts report API keys exposed in execution logs. Best practice: Use N8N's credential management system designed to prevent logging secrets.

---

### 14. No Rate Limiting on Agent APIs

**Risk:** Runaway agent loop calls API 1000x/min, exhausting database connections or hitting Supabase rate limits.

**Root Cause:** No rate limiting on API endpoints; agent can call tools unlimited times.

**Warning Signs:**
- Database connection pool exhausted errors
- Supabase returns 429 Too Many Requests
- Agent stuck in loop calling same tool repeatedly (hallucination)
- API costs spike unexpectedly

**Prevention:**

**1. Per-Patient Rate Limiting**

```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis'
const redis = Redis.fromEnv()

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number // seconds
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, window)
  }

  const remaining = limit - current

  return {
    allowed: current <= limit,
    remaining: Math.max(0, remaining)
  }
}

// API route
export async function POST(req: NextRequest) {
  const { telefone } = await req.json()

  const { allowed, remaining } = await checkRateLimit(
    `agent:buscar_slots:${telefone}`,
    10, // 10 calls
    60  // per 60 seconds
  )

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Aguarde 1 minuto antes de tentar novamente.',
        metadata: { retry_after: 60 }
      },
      { status: 429 }
    )
  }

  // Process request...
  return NextResponse.json({ success: true, data: slots })
}
```

**2. Global Rate Limiting per Tool**

```typescript
// Prevent total API overload
const globalLimit = await checkRateLimit(
  `agent:tool:buscar_slots:global`,
  100, // 100 calls
  60   // per minute across all patients
)
```

**3. Circuit Breaker for Database**

```typescript
// lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > 30000) { // 30s cooldown
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker OPEN: Database unavailable')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailure = Date.now()

    if (this.failures >= 5) {
      this.state = 'open'
      console.error('[Circuit Breaker] OPEN - Too many database failures')
    }
  }
}

// Usage in API
const dbCircuitBreaker = new CircuitBreaker()

export async function POST(req: NextRequest) {
  try {
    const result = await dbCircuitBreaker.execute(async () => {
      return await supabase.from('agendamentos').select('*')
    })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error.message.includes('Circuit breaker OPEN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Serviço temporariamente indisponível. Tente novamente em 30 segundos.'
        },
        { status: 503 }
      )
    }
    throw error
  }
}
```

**Phase Addressed:** Phase 3 (API Design), Phase 5 (Security)

**Real-World Evidence:** Composio 2026 Agent Report: "Polling Tax" wastes 95% of API calls and burns through quotas. Rate limiting + circuit breakers prevent runaway costs and database overload.

---

## Testing & Validation

### 15. No Agent End-to-End Testing Before Production

**Risk:** All unit tests pass, but agent can't complete real conversations (e.g., "book appointment for tomorrow at 2pm") in production.

**Root Cause:** Testing tools in isolation, not testing full agent conversation flows.

**Warning Signs:**
- Manual testing shows "buscar_slots works" but agent never calls it in conversation
- Agent successfully calls tools but can't synthesize responses into natural language
- No test data for edge cases (no slots available, patient doesn't exist, DST transition dates)

**Prevention:**

**1. Agent Conversation Test Suite**

```typescript
// tests/agent-e2e/booking-flow.test.ts
describe('Agent Booking Flow', () => {
  test('Happy path: Book appointment for tomorrow 2pm', async () => {
    const conversation = [
      { role: 'user', message: 'Quero agendar para amanhã às 14h' },
    ]

    const agentResponse = await testAgentConversation(conversation)

    // Agent should:
    // 1. Call buscar_slots_disponiveis with tomorrow's date
    expect(agentResponse.toolCalls).toContainEqual({
      tool: 'buscar_slots_disponiveis',
      params: { data: getTomorrowDate(), periodo: 'tarde' }
    })

    // 2. Call criar_agendamento if slot available
    expect(agentResponse.toolCalls).toContainEqual({
      tool: 'criar_agendamento',
      params: expect.objectContaining({
        data_hora: expect.stringMatching(/14:00/)
      })
    })

    // 3. Confirm in natural language
    expect(agentResponse.message).toMatch(/confirmado|agendado/i)
    expect(agentResponse.message).toMatch(/14:00|2.*tarde/i)
  })

  test('No slots available: Offer alternatives', async () => {
    // Mock API to return empty slots
    mockToolResponse('buscar_slots_disponiveis', {
      success: true,
      data: [],
      message: 'Nenhum horário disponível. Próximas datas: 2026-01-25, 2026-01-27'
    })

    const conversation = [
      { role: 'user', message: 'Tem horário amanhã?' }
    ]

    const agentResponse = await testAgentConversation(conversation)

    // Agent should offer alternatives, not give up
    expect(agentResponse.message).toMatch(/próxima|alternativa|outro dia/i)
    expect(agentResponse.message).toMatch(/25|27/i) // Suggest next available dates
  })

  test('DST transition: Correct time handling', async () => {
    // February 15, 2026 (DST transition week)
    const conversation = [
      { role: 'user', message: 'Agendar dia 15/02 às 14h' }
    ]

    const agentResponse = await testAgentConversation(conversation)

    const toolCall = agentResponse.toolCalls.find(t => t.tool === 'criar_agendamento')

    // Verify time is stored correctly with timezone
    expect(toolCall.params.data_hora).toMatch(/-03:00|-02:00/) // Brazil DST offset
    const parsedTime = new Date(toolCall.params.data_hora)
    expect(parsedTime.getHours()).toBe(14) // Should be 2pm in local time
  })
})
```

**2. Load Testing with Real Agent Patterns**

```bash
# Simulate 10 concurrent patient conversations
k6 run tests/load/agent-booking.js

# agent-booking.js
export default function() {
  // Realistic conversation flow
  http.post(`${N8N_URL}/webhook/marilia`, {
    message: 'Quero agendar consulta',
    telefone: `55119${Math.floor(Math.random() * 100000000)}`
  })
  sleep(2) // Wait for agent response

  http.post(`${N8N_URL}/webhook/marilia`, {
    message: 'Amanhã às 14h',
    telefone: lastTelefone
  })
  sleep(2)

  http.post(`${N8N_URL}/webhook/marilia`, {
    message: 'Confirmo',
    telefone: lastTelefone
  })
}
```

**3. Regression Test Suite (Run Before Each Migration)**

```bash
# tests/regression/before-migration.sh

# 1. Capture baseline metrics from current N8N workflows
curl "$N8N_URL/webhook/test/anti-no-show" > baseline/anti-no-show.json
curl "$N8N_URL/webhook/test/pre-checkin" > baseline/pre-checkin.json

# 2. Test all tool sub-workflows
for tool in buscar_slots criar_agendamento buscar_paciente; do
  curl "$N8N_URL/webhook/test/tool/$tool" -d @test-data/$tool.json \
    > baseline/$tool-response.json
done

# 3. Run agent conversation suite
npm run test:agent:e2e -- --reporter json > baseline/agent-e2e.json

# After migration, compare:
diff baseline/ current/ || echo "REGRESSION DETECTED"
```

**Phase Addressed:** Phase 6 (Testing), throughout all phases

**Real-World Evidence:** Theneo API Migration Guide: Deploying with only unit tests misses integration issues. Payment processor case study: skipped staging E2E tests, production checkout failed for 2 hours.

---

## Sources

### AI Agent Development & Best Practices
- [Common AI Agent Development Mistakes and How to Avoid Them](https://www.wildnetedge.com/blogs/common-ai-agent-development-mistakes-and-how-to-avoid-them)
- [12 Reasons AI Agents Still Aren't Ready in 2026](https://research.aimultiple.com/ai-agents-expectations-vs-reality/)
- [The 2025 AI Agent Report: Why AI Pilots Fail in Production and the 2026 Integration Roadmap](https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap)
- [Best Practices for AI Agent Implementations: Enterprise Guide 2026](https://onereach.ai/blog/best-practices-for-ai-agent-implementations/)
- [AI Agents: Reliability Challenges & Proven Solutions [2026]](https://www.edstellar.com/blog/ai-agent-reliability-challenges)

### MCP Server Security & Implementation
- [The MCP Security Survival Guide: Best Practices, Pitfalls, and Real-World Lessons](https://towardsdatascience.com/the-mcp-security-survival-guide-best-practices-pitfalls-and-real-world-lessons/)
- [MCP Server Best Practices for 2026](https://www.cdata.com/blog/mcp-server-best-practices-2026)
- [Implementing model context protocol (MCP): Tips, tricks and pitfalls](https://nearform.com/digital-community/implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls/)
- [Model Context Protocol (MCP): Understanding security risks and controls](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [Three Flaws in Anthropic MCP Git Server Enable File Access and Code Execution](https://thehackernews.com/2026/01/three-flaws-in-anthropic-mcp-git-server.html)
- [How Not to Write an MCP Server](https://towardsdatascience.com/how-not-to-write-an-mcp-server/)
- [The MCP Implementation Guide: Solving the 7 Failure Modes that Doom AI Architectures](https://natesnewsletter.substack.com/p/the-mcp-implementation-guide-solving)
- [Top 6 MCP Vulnerabilities (and How to Fix Them)](https://www.descope.com/blog/post/mcp-vulnerabilities)

### N8N Integration Issues
- [AI Agent node common issues | n8n Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/common-issues/)
- [AI Agent: Issues using "HTTP Request" node with "fromAI" parameter · Issue #14274](https://github.com/n8n-io/n8n/issues/14274)
- [Http request tool does not work with AI Agent - n8n Community](https://community.n8n.io/t/http-request-tool-does-not-work-with-ai-agent/73427)
- [Getting detailed error messages when AI Agent tools fail - n8n Community](https://community.n8n.io/t/getting-detailed-error-messages-when-ai-agent-tools-fail/223783)

### Function Calling & Schema Design
- [Function Calling in AI Agents | Prompt Engineering Guide](https://www.promptingguide.ai/agents/function-calling)
- [Function calling | OpenAI API](https://platform.openai.com/docs/guides/function-calling)
- [Tool Calling Explained: The Core of AI Agents (2026 Guide)](https://composio.dev/blog/ai-agent-tool-calling-guide)
- [Introduction to function calling | Google Cloud Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling)

### API Migration Strategies
- [Managing API Changes: 8 Strategies That Reduce Disruption by 70% (2026 Guide)](https://www.theneo.io/blog/managing-api-changes-strategies)
- [Sustainable API migration with the S*T*A*R pattern](https://blogs.mulesoft.com/dev-guides/api-migration-star-pattern/)
- [The hidden cost of API migrations](https://madewithlove.com/blog/the-hidden-dangers-of-a-big-bang-release/)
- [Final Steps and Key Learnings from Our Public API Migration](https://www.getyourguide.careers/posts/final-steps-and-key-learnings-from-our-public-api-migration)

### Zero Downtime Deployment
- [Zero Downtime Database Migration: Blue-Green & Canary for E-commerce](https://www.devopsschool.com/blog/zero-downtime-database-migration-blue-green-canary-for-e-commerce/)
- [Blue-Green and Canary Deployments Explained](https://www.harness.io/blog/blue-green-canary-deployment-strategies)
- [Canary vs blue-green deployment to reduce downtime](https://circleci.com/blog/canary-vs-blue-green-downtime/)
- [Zero-Downtime Migration Strategies for global API endpoints](https://umatechnology.org/zero-downtime-migration-strategies-for-global-api-endpoints-observed-under-real-world-load/)

### AI Agent Security & Authentication
- [What is AI Agent Security Plan 2026? Threats and Strategies Explained](https://www.uscsinstitute.org/cybersecurity-insights/blog/what-is-ai-agent-security-plan-2026-threats-and-strategies-explained)
- [8 API Security Best Practices For AI Agents](https://curity.io/resources/learn/api-security-best-practice-for-ai-agents/)
- [AI agents and identity risks: How security will shift in 2026](https://www.cyberark.com/resources/blog/ai-agents-and-identity-risks-how-security-will-shift-in-2026)
- [5 Best Practices for AI Agent Access Control](https://prefactor.tech/blog/5-best-practices-for-ai-agent-access-control)
- [Securing AI agents: A guide to authentication, authorization, and defense](https://workos.com/blog/securing-ai-agents)

### Structured Outputs & JSON Schema
- [The guide to structured outputs and function calling with LLMs](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms)
- [Structured model outputs | OpenAI API](https://platform.openai.com/docs/guides/structured-outputs)
- [Introducing Structured Outputs in the API | OpenAI](https://openai.com/index/introducing-structured-outputs-in-the-api/)
- [From Chaos to Structure: Building Production-Ready AI Agents with Guaranteed JSON Responses](https://medium.com/@v31u/from-chaos-to-structure-building-production-ready-ai-agents-with-guaranteed-json-responses-dfd925bad7ea)

### LLM Hallucination Prevention
- [How to Prevent LLM Hallucinations: 5 Proven Strategies](https://www.voiceflow.com/blog/prevent-llm-hallucinations)
- [Detecting Hallucinations in LLM Function Calling with Entropy](https://www.archgw.com/blogs/detecting-hallucinations-in-llm-function-calling-with-entropy-and-varentropy)
- [Stop LLM Hallucinations: Reduce Errors by 60–80%](https://masterofcode.com/blog/hallucinations-in-llms-what-you-need-to-know-before-integration)
- [Reducing LLM Hallucinations: A Developer's Guide](https://www.getzep.com/ai-agents/reducing-llm-hallucinations/)

---

*Pitfalls research for: Agent API + MCP Migration (v2.0)*
*Researched: 2026-01-24*
*Total pitfalls identified: 15 critical, covering migration strategy, API design, security, N8N integration, and testing*
