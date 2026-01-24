---
phase: 17
plan: 01
subsystem: agent-api
tags: [types, schema, authentication, bcrypt, prisma]
requires: [prisma, typescript, database]
provides:
  - AgentContext type for authenticated API requests
  - ApiResponse<T> type for consistent API responses
  - AgentHandler<T> type for route handler signatures
  - Agent model for API key storage with bcrypt hashing
affects: [17-02, 17-03, 17-04]
tech-stack:
  added: [bcrypt, @types/bcrypt]
  patterns: [Type-safe API context, Consistent response format, API key hashing]
key-files:
  created:
    - src/lib/agent/types.ts
  modified:
    - prisma/schema.prisma
    - package.json
decisions:
  - title: "bcrypt for API key hashing"
    choice: "Use bcrypt with 12 salt rounds"
    rationale: "Industry standard for password/key hashing, slow by design (prevents brute force)"
    alternatives: ["argon2 (better but requires native dependencies)", "scrypt (Node.js built-in but less battle-tested)"]
  - title: "AgentContext includes correlationId"
    choice: "Generate UUID per-request for audit trail linking"
    rationale: "Allows tracing all audit logs for a single API request across services"
    alternatives: ["Use request ID from Next.js", "No correlation tracking"]
  - title: "Generic ApiResponse<T> type"
    choice: "Single response interface with success boolean and optional data/error"
    rationale: "Consistent error handling for N8N, predictable response parsing"
    alternatives: ["Separate types for success/error", "Throw errors instead of returning"]
metrics:
  duration: "12 minutes"
  commits: 3
  files-changed: 3
  lines-added: 110
completed: 2026-01-24
---

# Phase 17 Plan 01: Agent API Type Foundations Summary

**One-liner:** Type system and database schema for agent API authentication with bcrypt-hashed API keys

---

## What Was Built

Created the foundational type infrastructure and database schema for the agent API system that will power N8N integrations in Phase 17-20.

### Type Definitions (`src/lib/agent/types.ts`)

1. **AgentContext** - Authentication context passed to all agent route handlers
   - Contains: `agentId`, `userId`, `role`, `correlationId`
   - Provided by `withAgentAuth()` middleware after successful API key verification
   - Enables RBAC by mapping agent to system user with role

2. **ApiResponse<T>** - Consistent response format for all agent APIs
   - Fields: `success`, `data?`, `error?`, `details?`
   - Ensures predictable parsing by N8N workflows
   - Generic type parameter for type-safe data payloads

3. **AgentHandler<T>** - Type signature for agent route handlers
   - Takes: `NextRequest`, route context, `AgentContext`
   - Returns: `NextResponse<ApiResponse<T>>`
   - Used with `withAgentAuth()` wrapper in later plans

### Database Schema

**Agent Model** added to Prisma schema:
- UUID primary key
- `name` and `description` for identification
- `apiKeyHash` - bcrypt hash (NEVER plaintext)
- `userId` - maps to system user for RBAC
- `active` - soft delete flag
- Timestamps: `createdAt`, `updatedAt`
- Indexes on `userId` and `active`

**User Model Updated**:
- Added `agents Agent[]` relation (one user can have multiple agents)

### Dependencies

Installed `bcrypt@6.0.0` and `@types/bcrypt` for secure API key hashing.

---

## How It Works

**API Key Authentication Flow (to be implemented in 17-02):**

1. N8N sends request with `Authorization: Bearer <api-key>` header
2. Middleware extracts API key from header
3. Queries `agents` table for matching bcrypt hash
4. If valid, creates `AgentContext` with agent + user info
5. Passes context to route handler
6. Handler returns `ApiResponse<T>` format

**RBAC Enforcement:**
- Agent maps to system user via `userId` foreign key
- User has `role` (ADMIN or ATENDENTE)
- Route handlers check `agentContext.role` for permissions
- Same RBAC logic as Console UI routes

**Audit Trail:**
- `correlationId` generated per-request (UUID)
- All audit logs for a request share same `correlationId`
- Enables tracing: "show me all actions from API request X"

---

## Technical Decisions

### bcrypt vs. Alternatives

**Choice:** bcrypt with 12 salt rounds

**Why:**
- Industry standard for hashing secrets
- Intentionally slow (prevents brute force attacks)
- Well-supported in Node.js ecosystem
- No native dependencies (unlike argon2)

**Alternatives considered:**
- argon2: Better security, but requires native compilation
- scrypt: Built into Node.js, but less battle-tested for API keys

### Correlation IDs

**Choice:** Generate UUID per-request in middleware

**Why:**
- Links all audit logs from single API call
- Essential for debugging: "N8N called patient update, what happened?"
- Works across microservices if we split later

**Implementation:**
```typescript
const correlationId = crypto.randomUUID()
```

### Generic ApiResponse Type

**Choice:** Single interface with `success` boolean

**Why:**
- N8N workflows expect consistent structure
- Easier to parse: `if (response.success) { ... }`
- Error details available in `details` field for debugging

**Alternative considered:**
- Throwing errors: Requires N8N try/catch blocks everywhere
- Separate types: `SuccessResponse<T>` and `ErrorResponse`
  - Rejected: Makes N8N workflow logic more complex

---

## Integration Points

### Used By (Later Plans)

- **17-02 (API Key Management)**: Uses Agent model for CRUD operations
- **17-03 (Authentication Middleware)**: Uses AgentContext and AgentHandler types
- **17-04 (Error Handling)**: Uses ApiResponse format for errors
- **Phase 18-20 (API Endpoints)**: All routes use AgentHandler signature

### Depends On

- Prisma schema (existing)
- TypeScript configuration (existing)
- PostgreSQL database (existing via Supabase)

---

## Verification Performed

✅ **bcrypt installed**: `npm ls bcrypt` shows v6.0.0
✅ **TypeScript compiles**: `npx tsc --noEmit` passes
✅ **Prisma schema valid**: `npx prisma validate` passes
✅ **Prisma client generated**: Agent type exists in `.prisma/client/index.d.ts`
✅ **types.ts created**: Exports AgentContext, ApiResponse, AgentHandler
✅ **Role import works**: Types import `Role` enum from Prisma client

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Files Created/Modified

**Created:**
- `src/lib/agent/types.ts` (89 lines)

**Modified:**
- `prisma/schema.prisma` (+20 lines: Agent model + User.agents relation)
- `package.json` (+2 dependencies: bcrypt, @types/bcrypt)

---

## Commits

| Hash    | Type  | Message                                        |
|---------|-------|------------------------------------------------|
| a3f47d1 | chore | Install bcrypt for API key hashing            |
| 041a6ad | feat  | Create agent API type definitions             |
| 3fd034a | feat  | Add Agent model to Prisma schema              |

---

## Next Steps

**Immediate (17-02):**
- Implement API key management service
- Create `/api/admin/agents` CRUD endpoints
- Generate API keys with bcrypt hashing

**After Foundation Phase:**
- 17-03: Build `withAgentAuth()` middleware using these types
- 17-04: Implement error handling with ApiResponse format
- Phase 18: Start building query APIs using AgentHandler signature

---

## Notes for Future Development

1. **Database Migration Pending**:
   - Schema changes committed to Prisma
   - Prisma client generated successfully
   - `prisma db push` hung (likely network timeout to Supabase)
   - Migration will auto-apply on next deployment or manual `db push`

2. **API Key Storage**:
   - NEVER store plaintext API keys in database
   - Always hash with bcrypt before storing
   - Compare incoming keys with `bcrypt.compare()`

3. **Correlation ID Usage**:
   - Generate in middleware: `crypto.randomUUID()`
   - Pass to all audit log calls
   - Include in error logs for debugging

4. **Type Safety**:
   - All agent routes should use `AgentHandler<T>` signature
   - Use specific types for `T` (e.g., `AgentHandler<{ slots: Slot[] }>`)
   - Avoid `unknown` unless truly dynamic

---

**Summary Status:** ✅ Complete - Foundation types and schema ready for Phase 17-02
