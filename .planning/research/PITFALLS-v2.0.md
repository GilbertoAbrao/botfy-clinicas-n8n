# Pitfalls Research: Agent API + MCP Migration

**Project:** Botfy ClinicOps Console Administrativo
**Milestone:** v2.0 Agent API Migration
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

Migration from N8N sub-workflows to Next.js API routes + MCP Server introduces specific pitfalls around API authentication, error handling consistency, N8N HTTP Request configuration, and MCP server reliability. The existing v1.0 PITFALLS.md covers general platform pitfalls (RLS, auth, realtime); this document focuses specifically on the API migration.

## Critical Pitfalls

### Pitfall 1: API Key Exposure in N8N Workflow Logs

**What goes wrong:**
N8N workflow execution logs capture HTTP Request node configurations including headers. If Authorization headers contain raw API keys, they become visible in workflow execution history, potentially exposed to team members without direct database access.

**Why it happens:**
N8N logs full request/response payloads for debugging. Teams often share workflow execution details. API keys embedded in headers get logged alongside other request data.

**How to avoid:**
- Store API keys in N8N Credentials (encrypted at rest)
- Use `{{$credentials.botfy_api_key}}` expression instead of hardcoded values
- Configure N8N to redact sensitive headers in logs
- Regularly rotate API keys (every 90 days)

```json
// ✅ CORRECT: Use credentials reference
{
  "httpHeaderAuth": {
    "name": "Authorization",
    "value": "Bearer {{$credentials.botfy_api_key}}"
  }
}

// ❌ WRONG: Hardcoded key
{
  "headers": {
    "Authorization": "Bearer sk_live_abc123..."
  }
}
```

**Warning signs:**
- API keys visible in workflow execution details
- Multiple team members have identical credentials
- No credential rotation schedule
- Keys stored in workflow JSON files

**Phase to address:**
Phase 17 (Foundation) - Establish credential management pattern before any HTTP Request nodes

---

### Pitfall 2: Inconsistent Error Response Format Between APIs

**What goes wrong:**
Different API routes return errors in different formats. The N8N AI Agent receives inconsistent error structures, making it difficult to extract meaningful error messages for patient communication. Some errors return `{error: "message"}`, others `{message: "error"}`, others `{errors: [...]}`.

**Why it happens:**
Multiple developers implementing API routes without a shared error handling utility. Copy-paste from different examples. No error response schema validation.

**How to avoid:**
- Create single `handleApiError()` utility (see STACK-agent-api-mcp.md)
- Define TypeScript types for API responses
- Validate responses match schema in tests
- Use Zod for response validation

```typescript
// src/lib/api/response.ts
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: unknown[]
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
```

**Warning signs:**
- AI Agent sometimes can't extract error details
- Different routes have different error handling
- No shared error utility imported
- Error responses don't include `success` field

**Phase to address:**
Phase 17 (Foundation) - Implement shared response types before first API route

---

### Pitfall 3: N8N HTTP Request Timeout Mismatches

**What goes wrong:**
N8N HTTP Request node has default 5-second timeout. Next.js API routes performing Supabase queries can take longer under load. N8N times out, marks tool as failed, but the API continues processing, potentially creating duplicate records on retry.

**Why it happens:**
Default N8N timeout is conservative. API routes don't implement idempotency. N8N retries failed requests automatically. No coordination between timeout and processing time.

**How to avoid:**
- Set N8N HTTP Request timeout to 30000ms (30s)
- Implement idempotency keys for write operations
- Add `X-Idempotency-Key` header support in APIs
- Log request IDs for correlation

```typescript
// API route with idempotency
export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('x-idempotency-key')

  if (idempotencyKey) {
    const cached = await checkIdempotencyCache(idempotencyKey)
    if (cached) return NextResponse.json(cached)
  }

  // Process request...

  if (idempotencyKey) {
    await saveIdempotencyCache(idempotencyKey, result)
  }

  return NextResponse.json(result)
}
```

**Warning signs:**
- Duplicate appointments created during high load
- N8N shows "timeout" but records were created
- Inconsistent state between N8N context and database
- Multiple identical requests in API logs

**Phase to address:**
Phase 18 (Core Tools) - Implement idempotency for write operations (criar_agendamento)

---

### Pitfall 4: MCP Server Crashes Without Graceful Degradation

**What goes wrong:**
MCP Server crashes (OOM, uncaught exception, stdio disconnect). Claude Desktop shows tool as unavailable. User workflow interrupted. No automatic recovery or notification.

**Why it happens:**
MCP Server runs as standalone process. Stdio transport has no built-in health monitoring. Crashes are silent from client perspective. No supervisor process watching MCP server.

**How to avoid:**
- Add global error handlers in MCP server
- Implement heartbeat logging
- Use process manager (PM2) for production
- Add health check endpoint (optional HTTP transport)
- Log crashes with full stack traces

```typescript
// mcp-server/index.ts
process.on('uncaughtException', (error) => {
  console.error('FATAL: Uncaught exception in MCP server:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('FATAL: Unhandled rejection in MCP server:', reason)
  process.exit(1)
})

// Heartbeat every 30s
setInterval(() => {
  console.error(`[HEARTBEAT] MCP server alive at ${new Date().toISOString()}`)
}, 30000)
```

**Warning signs:**
- Claude Desktop shows "tool unavailable" unexpectedly
- No logs when MCP server stops
- Server memory grows unbounded
- Stdio connection drops silently

**Phase to address:**
Phase 21 (MCP Server) - Implement error handling and monitoring before production use

---

### Pitfall 5: Breaking N8N Workflows During Migration

**What goes wrong:**
Migration removes sub-workflow before N8N is updated to use HTTP endpoint. Production agent fails because tool workflow no longer exists. Patients get "system error" messages during transition.

**Why it happens:**
Lack of coordination between API deployment and N8N update. No feature flag or gradual rollout. Sub-workflow deleted instead of deprecated. No rollback plan.

**How to avoid:**
- Deploy API first, test independently
- Update N8N workflow to use HTTP Request
- Keep sub-workflow for 1 week as fallback
- Use N8N workflow versioning
- Implement feature flag in N8N to toggle between old/new

```
Migration order:
1. Deploy Next.js API route
2. Test API with curl/Postman
3. Create new N8N workflow version using HTTP Request
4. A/B test: route 10% of traffic to new version
5. Monitor error rates for 24h
6. Gradually increase to 100%
7. Archive (don't delete) old sub-workflow after 7 days
```

**Warning signs:**
- "Workflow not found" errors in N8N
- Sudden spike in AI Agent failures
- No gradual rollout plan
- Sub-workflows deleted same day as migration

**Phase to address:**
Phase 19 (N8N Integration) - Establish migration protocol with rollback plan

---

### Pitfall 6: Zod Schema Mismatch Between API and N8N

**What goes wrong:**
API expects `date` in `YYYY-MM-DD` format (Zod validation). N8N sends `DD/MM/YYYY` (Brazilian format from user input). All requests fail with 400 validation error. AI Agent retries indefinitely.

**Why it happens:**
No schema documentation shared with N8N workflow. Different date format conventions. N8N doesn't transform data before sending. No request validation testing during development.

**How to avoid:**
- Document exact API schema in README or OpenAPI spec
- Accept multiple date formats, normalize internally
- Add clear Zod error messages with expected format
- Test with real N8N payloads during development

```typescript
// Flexible date parsing
const dateSchema = z.string().transform((val, ctx) => {
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val

  // Try Brazilian format
  const brMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Expected date in YYYY-MM-DD or DD/MM/YYYY format'
  })
  return z.NEVER
})
```

**Warning signs:**
- High rate of 400 errors from N8N
- Zod errors mention "invalid string" without format hint
- Date fields work in Postman but fail from N8N
- N8N sends dates user typed directly

**Phase to address:**
Phase 17 (Foundation) - Define flexible input schemas with clear error messages

---

### Pitfall 7: Missing Audit Logging for Agent Tool Calls

**What goes wrong:**
API routes called by N8N agent don't log tool usage. HIPAA audit trail incomplete. No visibility into which patient data was accessed by AI Agent. Compliance gap discovered during audit.

**Why it happens:**
Agent API routes don't have user context (no session). Developer assumes system calls don't need logging. Audit logger requires `userId` that doesn't exist for agent calls.

**How to avoid:**
- Log agent tool calls with `agentId` instead of `userId`
- Create separate audit action types for agent operations
- Include correlation ID from N8N request
- Log full request parameters (excluding PHI in message)

```typescript
// Agent tool call audit logging
await logAudit({
  userId: null,
  agentId: 'n8n-agent',
  correlationId: req.headers.get('x-n8n-execution-id'),
  action: AuditAction.AGENT_TOOL_CALL,
  resource: 'buscar_slots_disponiveis',
  details: {
    date: params.data,
    periodo: params.periodo,
    resultCount: slots.length
  }
})
```

**Warning signs:**
- Audit logs missing agent tool calls
- No way to trace which patient records AI accessed
- HIPAA audit shows gaps during agent activity
- `userId: null` entries without agentId

**Phase to address:**
Phase 17 (Foundation) - Extend audit logger for agent context before first tool migration

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No idempotency keys | Faster initial implementation | Duplicate records on retry | Never for write operations |
| Hardcoded API keys in N8N | Quick testing | Security exposure, no rotation | Development only |
| Single API key for all tools | Simpler auth | Can't revoke per-tool access | MVP only, add per-tool keys later |
| No MCP server monitoring | Faster deployment | Silent failures, poor UX | Never in production |
| Deleting sub-workflows immediately | Clean N8N workspace | No rollback option | Never during active migration |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| N8N HTTP Request | Using GET for operations with body | Use POST for all tool calls; GET doesn't support body in N8N |
| N8N Credentials | Storing in workflow JSON | Use N8N Credentials system with encryption |
| MCP Stdio | Not handling stderr | MCP server logs to stderr; stdout is for MCP protocol only |
| Zod + N8N | Strict date validation | Accept multiple formats, transform internally |
| API + Agent | Requiring user session | Create separate agent auth middleware |
| Error responses | Returning raw Error objects | Always return structured `{success, error, details}` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in tool APIs | Slow tool response (>2s) | Use joins/batch queries in service layer | >20 records with relations |
| No API response caching | Same availability query repeated | Cache slot availability for 30s | >10 concurrent booking attempts |
| MCP server memory leak | Increasing memory over time | Cleanup after each tool call | >100 tool calls/hour |
| Large response payloads | N8N timeout on large results | Paginate responses, limit defaults | >1000 records returned |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| API key exposure | Phase 17 (Foundation) | N8N credentials encrypted; no keys in workflow JSON |
| Inconsistent errors | Phase 17 (Foundation) | All routes use shared handleApiError() |
| Timeout mismatches | Phase 18 (Core Tools) | N8N timeout = 30s; idempotency for writes |
| MCP crashes | Phase 21 (MCP Server) | Error handlers present; heartbeat logging |
| Breaking N8N workflows | Phase 19 (N8N Integration) | Migration protocol documented; rollback tested |
| Schema mismatch | Phase 17 (Foundation) | Flexible date parsing; clear error messages |
| Missing audit logs | Phase 17 (Foundation) | Agent audit actions defined; correlation IDs logged |

---

## Sources

- [MCP TypeScript SDK - Error Handling](https://github.com/modelcontextprotocol/typescript-sdk) - HIGH confidence
- [N8N HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) - HIGH confidence
- [N8N Credentials](https://docs.n8n.io/credentials/) - HIGH confidence
- [Next.js API Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) - HIGH confidence
- [Idempotency Patterns](https://stripe.com/docs/api/idempotent_requests) - HIGH confidence (Stripe's implementation)

---

*Pitfalls research for: Agent API + MCP Migration*
*Researched: 2026-01-24*
*Total pitfalls identified: 7 critical, specific to API migration from N8N sub-workflows*
