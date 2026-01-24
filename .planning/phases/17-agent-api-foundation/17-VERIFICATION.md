---
phase: 17-agent-api-foundation
verified: 2026-01-24T17:30:00Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "Service layer functions are reusable across both Console UI and Agent API routes"
    status: failed
    reason: "Service layer extraction was not implemented - no service layer exists"
    artifacts:
      - path: "src/lib/services/"
        issue: "Directory does not exist - no service layer created"
    missing:
      - "Create src/lib/services/ directory structure"
      - "Extract business logic from API routes into service functions"
      - "Create reusable service functions for appointments, patients, slots"
      - "Wire service functions to both Console UI routes and future Agent API routes"
---

# Phase 17: Agent API Foundation Verification Report

**Phase Goal:** Agent authentication, error handling, audit logging, and service layer infrastructure
**Verified:** 2026-01-24T17:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | N8N AI Agent can authenticate to APIs using Bearer token from encrypted credential | ✓ VERIFIED | `withAgentAuth()` middleware validates Bearer tokens via bcrypt comparison against `agents.apiKeyHash`, returns `AgentContext` on success |
| 2 | All API routes return consistent `{success, data?, error?, details?}` response format | ✓ VERIFIED | `ApiResponse<T>` interface enforced, `successResponse()` and `errorResponse()` utilities ensure consistency, ZodError mapped to field-level details |
| 3 | Agent tool calls are logged with `agentId` and correlation ID for HIPAA audit trail | ✓ VERIFIED | `logAudit()` accepts `agentId` and `correlationId` params, stored in `auditLog.details` JSON, 11 new `AGENT_*` actions defined |
| 4 | Service layer functions are reusable across both Console UI and Agent API routes | ✗ FAILED | No service layer exists - `src/lib/services/` directory not created, business logic not extracted from API routes |
| 5 | API validation accepts multiple date formats (ISO 8601, Brazil locale) via flexible Zod schemas | ✓ VERIFIED | `flexibleDateTimeSchema` accepts 4 ISO 8601 variants with TZDate transformation to `America/Sao_Paulo`, 12 agent schemas created |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/agent/types.ts` | AgentContext, ApiResponse, AgentHandler types | ✓ VERIFIED | 103 lines, exports all 3 core types, imports Role from Prisma, substantive with JSDoc |
| `src/lib/agent/auth.ts` | API key validation with bcrypt | ✓ VERIFIED | 69 lines, `validateApiKey()` compares against bcrypt hashes, `extractBearerToken()` parses header, returns AgentContext with correlationId |
| `src/lib/agent/middleware.ts` | `withAgentAuth()` HOF wrapper | ✓ VERIFIED | 94 lines, wraps route handlers with auth, resolves Next.js 15+ async params, includes `withRole()` for RBAC |
| `src/lib/agent/error-handler.ts` | Consistent error response format | ✓ VERIFIED | 114 lines, `handleApiError()` detects ZodError, maps known errors to status codes, never exposes internals |
| `src/lib/validations/agent-schemas.ts` | Flexible date validation schemas | ✓ VERIFIED | 220 lines, `flexibleDateTimeSchema` and `flexibleDateSchema` with TZDate transformation, 12 agent-specific schemas for Phase 18-20 |
| `src/lib/audit/logger.ts` | Extended with agent context | ✓ VERIFIED | Modified, added `agentId` and `correlationId` optional params, 11 new AGENT_ actions (AGENT_SEARCH_SLOTS, AGENT_CREATE_APPOINTMENT, etc.) |
| `prisma/schema.prisma` | Agent model with bcrypt hash | ✓ VERIFIED | Agent model added with `apiKeyHash`, `userId` FK, `active` flag, indexes on `userId` and `active`, User.agents relation |
| `scripts/generate-agent-key.ts` | API key generation tool | ✓ VERIFIED | 69 lines, generates 256-bit key, bcrypt hash, outputs SQL and N8N setup instructions |
| `package.json` | bcrypt dependency | ✓ VERIFIED | `bcrypt@6.0.0` installed and verified via `npm ls bcrypt` |
| `src/lib/services/` | Service layer directory | ✗ MISSING | Directory does not exist, no service functions created |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| middleware.ts | auth.ts | import | ✓ WIRED | `middleware.ts` imports `validateApiKey` and `extractBearerToken` from `./auth`, calls in `withAgentAuth()` |
| middleware.ts | error-handler.ts | import | ✓ WIRED | `middleware.ts` imports `handleApiError` and `errorResponse`, uses in error handling |
| middleware.ts | types.ts | import | ✓ WIRED | `middleware.ts` imports `AgentContext`, `AgentHandler`, `ApiResponse` from `./types` |
| auth.ts | types.ts | import | ✓ WIRED | `auth.ts` imports `AgentContext` from `./types`, returns in `validateApiKey()` |
| error-handler.ts | types.ts | import | ✓ WIRED | `error-handler.ts` imports `ApiResponse` from `./types`, uses in return types |
| auth.ts | prisma | query | ✓ WIRED | `auth.ts` queries `prisma.agent.findMany()` with user relation, bcrypt comparison in loop |
| audit/logger.ts | agentId/correlationId | data flow | ✓ WIRED | `logAudit()` accepts `agentId` and `correlationId`, stores in `details` JSON via spread operator |
| validation schemas | TZDate | transformation | ✓ WIRED | `flexibleDateTimeSchema` transforms parsed dates to `new TZDate(parsed, CLINIC_TIMEZONE)`, used in 12 agent schemas |
| Future agent APIs | middleware | usage | ⚠️ ORPHANED | `withAgentAuth()` not used anywhere yet - no agent API routes created (expected: Phase 18-20) |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| FOUND-01: Agent authentication via API key (Bearer token) | ✓ SATISFIED | None - `withAgentAuth()` middleware complete |
| FOUND-02: Shared error handling returning `{success, error, details}` | ✓ SATISFIED | None - `handleApiError()`, `successResponse()`, `errorResponse()` complete |
| FOUND-03: Agent audit logging with agentId and correlation ID | ✓ SATISFIED | None - `logAudit()` extended, 11 AGENT_ actions defined |
| FOUND-04: Service layer extraction for business logic reuse | ✗ BLOCKED | No service layer created - gap identified |
| FOUND-05: Flexible input validation with Zod accepting multiple date formats | ✓ SATISFIED | None - `flexibleDateTimeSchema` with TZDate transformation complete |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/lib/agent/error-handler.ts | 30 | `console.error()` for error logging | ℹ️ Info | Acceptable for development, should use external monitoring (DataDog/Sentry) in production |
| src/lib/agent/auth.ts | 52 | `console.error()` for validation errors | ℹ️ Info | Acceptable for development, should use external monitoring in production |
| src/lib/audit/logger.ts | 127 | `console.error()` for audit log failures | ℹ️ Info | Acceptable fallback, comment indicates external monitoring needed |

**No blocker anti-patterns found.** Console logging is acceptable for development phase. Production should add DataDog/Sentry integration.

### Human Verification Required

#### 1. API Key Generation and Authentication Flow

**Test:** 
1. Run `npx ts-node scripts/generate-agent-key.ts`
2. Copy API key and hash from output
3. Insert agent record into database using provided SQL
4. Create test API route using `withAgentAuth()` wrapper
5. Test with `curl -H "Authorization: Bearer <api-key>" http://localhost:3051/api/agent/test`

**Expected:** 
- Script generates 64-character hex key and bcrypt hash
- SQL insertion succeeds
- Request with valid key returns 200 with `{success: true, data: ...}`
- Request with invalid key returns 401 with `{success: false, error: "Invalid API key"}`
- Request without header returns 401 with `{success: false, error: "Missing or invalid Authorization header..."}`

**Why human:** Requires database access, running dev server, and testing full authentication flow end-to-end

#### 2. Agent Audit Logging with Correlation ID

**Test:**
1. Create test agent API route that calls `logAudit()` with `agentId` and `correlationId` from `AgentContext`
2. Make authenticated request to the route
3. Query `audit_logs` table for the created log
4. Verify `details` JSON contains `agentId` and `correlationId` fields

**Expected:**
- Audit log created with correct `userId` (from agent's mapped user)
- `details` JSON contains `{"agentId": "<uuid>", "correlationId": "<uuid>", ...}`
- Correlation ID is unique per-request (different on each call)
- Action uses new `AGENT_*` enum values (e.g., `AGENT_SEARCH_SLOTS`)

**Why human:** Requires database inspection, verifying JSON structure in details field

#### 3. Flexible Date Validation with TZDate

**Test:**
1. Create test route using `agentSlotsSearchSchema`
2. Send requests with different date formats:
   - ISO with offset: `{"data": "2026-01-24T14:30:00-03:00"}`
   - ISO UTC: `{"data": "2026-01-24T14:30:00Z"}`
   - Local datetime: `{"data": "2026-01-24T14:30:00"}`
   - Date only: `{"data": "2026-01-24"}`
3. Verify all parse successfully and return TZDate in America/Sao_Paulo timezone

**Expected:**
- All 4 formats validate successfully (no ZodError)
- Parsed dates are TZDate instances (check via `instanceof TZDate`)
- Timezone is `America/Sao_Paulo` (check via `.getTimezone()`)
- Date-only format defaults to start of day (00:00:00)

**Why human:** Requires running code, inspecting parsed date objects, verifying timezone handling

#### 4. Database Schema Migration

**Test:**
1. Run `npx prisma db push` or deploy migration
2. Verify `agents` table exists in database
3. Check table has columns: `id`, `name`, `description`, `api_key_hash`, `user_id`, `active`, `created_at`, `updated_at`
4. Verify indexes exist on `user_id` and `active`
5. Check `User` model has `agents` relation

**Expected:**
- `agents` table created successfully
- All columns present with correct types (UUID, TEXT, BOOLEAN, TIMESTAMP)
- Foreign key constraint on `user_id` → `users.id`
- Indexes improve query performance for `WHERE active = true` and joins on `user_id`

**Why human:** Requires database access and schema inspection

### Gaps Summary

**Criterion 4 (Service Layer Extraction) Failed:**

The phase goal included "service layer infrastructure" but **no service layer was created**. The 4 plans (17-01 through 17-04) focused on:
- Types and database schema (17-01)
- Error handling and audit logging (17-02)  
- Validation schemas (17-03)
- Authentication middleware (17-04)

**Service layer extraction was mentioned in the phase goal but never planned or implemented as a discrete task.**

**Why this matters:**
- Without a service layer, business logic will be duplicated between Console UI API routes (`/api/`) and Agent API routes (`/api/agent/`)
- Future agent APIs (Phase 18-20) will need to reimplement appointment creation, patient updates, slot searching, etc.
- Code duplication increases maintenance burden and bug risk

**What's missing:**
1. `src/lib/services/` directory structure
2. Service modules for core domains:
   - `appointments-service.ts` — Create, update, cancel, confirm appointments
   - `patients-service.ts` — Search, create, update patient records
   - `slots-service.ts` — Find available appointment slots
   - `pre-checkin-service.ts` — Check document status, send reminders
   - `instructions-service.ts` — Retrieve procedure instructions
3. Extraction of business logic from existing Console UI API routes into service functions
4. Wiring of service functions to both UI routes and future agent routes

**Recommendation:**
- Add Plan 17-05: "Service Layer Extraction" or incorporate into Phase 18 planning
- Extract core business logic before implementing agent APIs to avoid duplication
- Service functions should accept plain parameters (not NextRequest), return domain objects (not NextResponse)

---

_Verified: 2026-01-24T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
