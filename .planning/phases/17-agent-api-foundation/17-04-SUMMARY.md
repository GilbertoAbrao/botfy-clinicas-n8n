---
phase: 17
plan: 04
subsystem: api-authentication
completed: 2026-01-24
duration: "1.6 minutes"
tags: [authentication, security, middleware, bcrypt, api-keys]

requires:
  - phase: 17
    plan: 01
    artifact: "src/lib/agent/types.ts"
  - phase: 17
    plan: 02
    artifact: "src/lib/agent/error-handler.ts"

provides:
  - capability: "API key authentication for N8N AI Agent"
  - capability: "Bearer token validation against bcrypt hashes"
  - capability: "HOF middleware for route authentication"
  - capability: "Secure API key generation tooling"

affects:
  - phase: 17
    plan: 05
    impact: "Appointment service can use withAgentAuth middleware"
  - phase: 18
    plan: "all"
    impact: "All query tool APIs will use withAgentAuth"
  - phase: 19
    plan: "all"
    impact: "All write tool APIs will use withAgentAuth"

tech-stack:
  added:
    - library: "bcrypt"
      version: "6.0.0"
      purpose: "API key hashing and validation"
  patterns:
    - "Higher-Order Function (HOF) middleware for route authentication"
    - "Bearer token authentication with bcrypt comparison"
    - "Correlation ID generation for audit trail linking"

key-files:
  created:
    - path: "src/lib/agent/auth.ts"
      lines: 69
      exports: ["validateApiKey", "extractBearerToken"]
      purpose: "API key validation against database bcrypt hashes"
    - path: "src/lib/agent/middleware.ts"
      lines: 94
      exports: ["withAgentAuth", "withRole"]
      purpose: "HOF middleware wrapper for agent route handlers"
    - path: "scripts/generate-agent-key.ts"
      lines: 69
      exports: []
      purpose: "CLI tool for generating secure agent API keys"

decisions:
  - decision: "Use HOF pattern for middleware instead of global Next.js middleware"
    rationale: "Scoped per-route, doesn't affect all endpoints, easier to test"
    alternatives: ["Global middleware.ts", "Inline auth in each route"]
  - decision: "Iterate through all active agents for bcrypt comparison"
    rationale: "With <10 agents, performance is acceptable (~100ms per agent)"
    alternatives: ["Add key prefix for database lookup", "Use Redis cache"]
  - decision: "Generate correlation ID in validateApiKey()"
    rationale: "Per-request UUID links all audit logs for HIPAA compliance"
    alternatives: ["Generate in middleware", "Client-provided trace ID"]
  - decision: "Support Next.js 15+ async params pattern"
    rationale: "Future-proof for Next.js upgrades, resolve Promise before passing"
    alternatives: ["Ignore async params", "Force synchronous params"]
---

# Phase 17 Plan 04: Agent API Authentication Summary

**One-liner:** Bearer token authentication with bcrypt validation and HOF middleware pattern for N8N AI Agent API access.

## What Was Built

Created complete API key authentication system for N8N AI Agent API endpoints:

1. **API Key Validation** (`src/lib/agent/auth.ts`)
   - `validateApiKey()` - Compares Bearer token against bcrypt hashes in agents table
   - `extractBearerToken()` - Parses Authorization header format
   - Generates correlation ID per-request for audit trail linking
   - Returns AgentContext with agentId, userId, role, and correlationId

2. **HOF Middleware** (`src/lib/agent/middleware.ts`)
   - `withAgentAuth()` - Higher-Order Function wrapping route handlers
   - Handles token extraction, validation, and error responses
   - Resolves Next.js 15+ async params pattern
   - `withRole()` - Optional RBAC enforcement for admin-only endpoints

3. **Key Generation Script** (`scripts/generate-agent-key.ts`)
   - Generates cryptographically secure 256-bit API key
   - Outputs bcrypt hash (12 rounds) for database storage
   - Provides SQL and N8N Credentials setup instructions
   - Security reminder: never store plain key in database

## How It Works

### Authentication Flow

```typescript
// 1. Agent route uses HOF wrapper
export const GET = withAgentAuth(async (req, context, agentContext) => {
  // agentContext pre-validated by middleware
  // Contains: agentId, userId, role, correlationId
  return successResponse({ data: 'example' })
})

// 2. N8N makes request with Bearer token
// Authorization: Bearer <api-key>

// 3. withAgentAuth() extracts token, validates against database

// 4. On success: calls handler with AgentContext
// On failure: returns 401 with ApiResponse format
```

### Security Design

- **bcrypt hashing**: API keys stored as bcrypt hashes (12 salt rounds)
- **Constant-time comparison**: `bcrypt.compare()` prevents timing attacks
- **No plaintext storage**: Original API key only in N8N Credentials (encrypted)
- **Correlation IDs**: UUID per-request links all audit logs for compliance
- **Error sanitization**: Validation failures don't expose details

### HOF Pattern Benefits

- **DRY**: No auth boilerplate in every route handler
- **Consistent**: Same error format across all endpoints
- **Testable**: Middleware logic separate from business logic
- **Scoped**: Only affects routes explicitly wrapped (unlike global middleware)

## Integration Points

### For Agent API Routes (Phase 18-20)

```typescript
// src/app/api/agent/slots/route.ts
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse } from '@/lib/agent/error-handler'

export const GET = withAgentAuth(async (req, context, agentContext) => {
  // Already authenticated, agentContext available
  const slots = await findAvailableSlots(agentContext.userId)

  return successResponse({ slots })
})
```

### For Admin-Only Endpoints

```typescript
import { withAgentAuth, withRole } from '@/lib/agent/middleware'

export const DELETE = withAgentAuth(
  withRole(['ADMIN'])(async (req, context, agentContext) => {
    // Only agents mapped to ADMIN users can access
  })
)
```

### For Audit Logging

```typescript
await logAudit({
  userId: agentContext.userId,
  action: AuditAction.AGENT_VIEW_PATIENT,
  resource: 'patients',
  resourceId: patientId,
  agentId: agentContext.agentId,
  correlationId: agentContext.correlationId, // Links all logs for request
})
```

## Setup Instructions

### 1. Generate API Key

```bash
npx ts-node scripts/generate-agent-key.ts
```

Output:
- API Key (64 hex characters) → Store in N8N Credentials
- API Key Hash (bcrypt) → Store in database

### 2. Insert Agent Record

```sql
INSERT INTO agents (id, name, description, api_key_hash, user_id, active)
VALUES (
  gen_random_uuid(),
  'Marilia - WhatsApp Agent',
  'N8N AI Agent for WhatsApp patient interactions',
  '$2b$12$...',  -- Paste hash from script output
  '<user-id>',   -- Map to existing ATENDENTE or ADMIN user
  true
);
```

### 3. Configure N8N Credentials

1. N8N → Credentials → Add Credential → Header Auth
2. Name: "Botfy API Key"
3. Header Name: `Authorization`
4. Header Value: `Bearer <api-key-from-script>`
5. Save

### 4. Test Authentication

```bash
# Should return 401 (no token)
curl http://localhost:3051/api/agent/test

# Should return 401 (invalid token)
curl -H "Authorization: Bearer invalid" http://localhost:3051/api/agent/test

# Should return 200 (valid token)
curl -H "Authorization: Bearer <api-key>" http://localhost:3051/api/agent/test
```

## Performance Considerations

### bcrypt Comparison Cost

- **Time per comparison**: ~100ms (intentional, prevents brute force)
- **Current design**: Iterates through all active agents
- **Acceptable for**: <10 agents (~1 second max validation time)
- **Future optimization**: Add key prefix to agents table for direct lookup

### Correlation ID Generation

- **Method**: `crypto.randomUUID()` (Node.js built-in)
- **Performance**: <1ms per call
- **Impact**: Negligible overhead per request

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers

None

### Concerns

1. **Agent Role Mapping**: Plan leaves open whether to use ATENDENTE or create dedicated AGENT role
   - Current: Agent maps to existing user (ADMIN or ATENDENTE)
   - Recommendation: Start with ATENDENTE, create AGENT role if permissions diverge
   - Action needed: Decision in Phase 17 planning

2. **API Key Rotation**: No automated rotation strategy yet
   - Current: Manual generation and database update
   - Recommendation: Document rotation process, automate in Phase 21
   - Action needed: Create rotation runbook

### Recommendations

1. **Create test agent during Phase 17 Wave 2**: Use script to generate key, insert record, test auth
2. **Document agent user mapping strategy**: Decide ATENDENTE vs AGENT role before Phase 18
3. **Add health check endpoint**: Create `/api/agent/health` for N8N connectivity testing

## Testing Performed

### TypeScript Compilation

```bash
npx tsc --noEmit
# ✅ No errors
```

### Script Execution

```bash
npx ts-node scripts/generate-agent-key.ts
# ✅ Generated key and hash
# ✅ Output SQL and N8N instructions
```

### Export Verification

```bash
grep "^export" src/lib/agent/auth.ts
# ✅ validateApiKey
# ✅ extractBearerToken

grep "^export" src/lib/agent/middleware.ts
# ✅ withAgentAuth
# ✅ withRole
```

### Integration Readiness

- ✅ Types from 17-01 (AgentContext, ApiResponse, AgentHandler)
- ✅ Error handlers from 17-02 (handleApiError, successResponse, errorResponse)
- ✅ Agent model in Prisma schema
- ✅ bcrypt dependency installed

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| cc260b7 | feat(17-04): implement API key validation with bcrypt | src/lib/agent/auth.ts |
| 4123532 | feat(17-04): implement withAgentAuth HOF middleware | src/lib/agent/middleware.ts |
| 98e0d0a | feat(17-04): add API key generation script | scripts/generate-agent-key.ts |

**Total changes:**
- 3 files created
- 232 lines added
- 0 lines removed

**Git stats:**
```
3 files changed, 232 insertions(+)
```

## Knowledge Captured

### Key Insights

1. **HOF Pattern for Next.js API Routes**: Higher-Order Functions provide cleaner middleware than global `middleware.ts` which affects all routes
2. **bcrypt for API Keys**: Same security model as passwords - hash with salt, never store plaintext
3. **Correlation IDs for HIPAA**: Per-request UUID enables full audit trail reconstruction
4. **Next.js 15+ Async Params**: Future Next.js versions return Promise for params, must await before use

### Patterns Established

1. **Agent Authentication Pattern**: `withAgentAuth(handler)` wrapper for all agent routes
2. **RBAC Extension**: `withRole(['ADMIN'])(handler)` for admin-only endpoints
3. **Key Generation Process**: CLI script → SQL insert → N8N Credentials setup
4. **Security Logging**: Log validation result, never log token or key

### Documentation

- [x] Code comments explain bcrypt performance tradeoffs
- [x] Script outputs detailed setup instructions
- [x] Type definitions include JSDoc examples
- [x] SUMMARY.md covers setup, testing, and integration

---

**Plan Status:** ✅ Complete
**Duration:** 1.6 minutes (2026-01-24 16:58:36 UTC - 17:00:14 UTC)
**Next Plan:** 17-05 (Appointments Service Layer Extraction)
