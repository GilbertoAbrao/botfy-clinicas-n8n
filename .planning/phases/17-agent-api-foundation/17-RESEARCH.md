# Phase 17: Agent API Foundation - Research

**Researched:** 2026-01-24
**Domain:** API Authentication, Service Layer Architecture, Error Handling, Audit Logging
**Confidence:** HIGH

## Summary

Phase 17 establishes the foundation infrastructure for N8N AI Agent API access, enabling secure, auditable, and maintainable API routes that will be used by both the AI agent and future MCP server integration. This research focuses on brownfield implementation patterns specific to the existing Next.js 16 codebase.

The phase requires implementing five core components: (1) API key authentication for N8N agents using Bearer tokens stored as bcrypt hashes, (2) consistent error response format across all endpoints, (3) agent-specific audit logging with correlation IDs for HIPAA compliance, (4) service layer extraction to enable code reuse between Console UI and Agent APIs, and (5) flexible date validation in Zod to accept multiple ISO 8601 formats.

**Key findings:**
- Next.js 16 has stable middleware patterns suitable for API key validation
- Existing audit logger can be extended with agent context and correlation tracking
- Service layer extraction follows established Data Access Layer (DAL) patterns
- Zod v4 provides flexible ISO 8601 parsing with `z.iso.datetime()` and coercion
- Higher-Order Functions (HOF) enable reusable middleware wrapping of route handlers

**Primary recommendation:** Use Higher-Order Function pattern for `withAgentAuth()` middleware, extend existing `logAudit()` function for agent context, and extract service layer incrementally starting with appointments service.

## Standard Stack

The established libraries/tools for agent API infrastructure in the existing codebase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.2 | API Routes framework | Already in use, stable App Router patterns |
| Zod | 4.3.5 | Input validation | Already in use, flexible ISO 8601 support |
| Prisma | 7.2.0 | Database access | Already in use for audit logging |
| bcrypt | Latest | API key hashing | Industry standard for password/key hashing |
| @date-fns/tz | 1.4.1 | Timezone-aware date parsing | Already in use, DST-safe for Brazil timezone |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date parsing utilities | Flexible date format handling |
| @supabase/ssr | 0.8.0 | Database client | Service layer database queries |
| crypto (Node.js) | Built-in | Correlation ID generation | UUID generation for request tracking |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bcrypt | argon2 | Argon2 is newer but bcrypt more widely documented for Node.js |
| HOF pattern | Next.js middleware.ts | Middleware runs on all routes, HOF is scoped per-route |
| Extend audit logger | New agent logger | Separate logger increases complexity, reduces audit trail consistency |

**Installation:**
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── agent/                    # NEW: Agent-specific infrastructure
│   │   ├── auth.ts              # API key validation, agent user lookup
│   │   ├── middleware.ts        # withAgentAuth() HOF wrapper
│   │   └── types.ts             # AgentContext, ApiResponse types
│   ├── services/                # NEW: Business logic layer
│   │   ├── appointments.ts      # Appointment CRUD, conflict detection
│   │   ├── patients.ts          # Patient CRUD, search
│   │   └── slots.ts             # Availability calculation
│   ├── validations/             # EXISTING: Extend with flexible schemas
│   │   └── agent-schemas.ts     # NEW: Flexible date parsing schemas
│   └── audit/                   # EXISTING: Extend logger
│       └── logger.ts            # Extended with agent context
└── app/
    └── api/
        └── agent/               # NEW: Agent API routes
            ├── appointments/
            ├── patients/
            └── slots/
```

### Pattern 1: API Key Authentication (Bearer Token)
**What:** Validate API key from Authorization header, map to agent user context
**When to use:** All `/api/agent/*` routes
**Example:**
```typescript
// Source: Existing auth patterns + Bearer token best practices
// lib/agent/auth.ts
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

export interface AgentContext {
  agentId: string
  userId: string      // Mapped system user for RBAC
  role: Role
  correlationId: string  // Request tracking
}

export async function validateApiKey(
  apiKey: string
): Promise<AgentContext | null> {
  try {
    // Find agent by API key (bcrypt comparison)
    const agents = await prisma.agent.findMany()

    for (const agent of agents) {
      const isValid = await bcrypt.compare(apiKey, agent.apiKeyHash)
      if (isValid && agent.active) {
        return {
          agentId: agent.id,
          userId: agent.userId,
          role: agent.role,
          correlationId: crypto.randomUUID(), // Per-request correlation
        }
      }
    }

    return null
  } catch (error) {
    console.error('[API Key Validation Error]', error)
    return null
  }
}
```

### Pattern 2: Higher-Order Function Middleware
**What:** Wrap route handlers with authentication and error handling
**When to use:** All agent API routes to avoid code duplication
**Example:**
```typescript
// Source: Next.js 16 HOF pattern discussions
// lib/agent/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, AgentContext } from './auth'
import { handleApiError } from './error-handler'

type AgentHandler = (
  req: NextRequest,
  context: { params?: any },
  agentContext: AgentContext
) => Promise<NextResponse>

export function withAgentAuth(handler: AgentHandler) {
  return async (req: NextRequest, context: { params?: any }) => {
    try {
      // 1. Extract Bearer token
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      }

      const apiKey = authHeader.substring(7)

      // 2. Validate API key
      const agentContext = await validateApiKey(apiKey)
      if (!agentContext) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        )
      }

      // 3. Call wrapped handler with agent context
      return await handler(req, context, agentContext)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
```

### Pattern 3: Service Layer Extraction
**What:** Extract business logic from API routes into reusable service functions
**When to use:** Any logic that might be shared between Console UI and Agent APIs
**Example:**
```typescript
// Source: DAL pattern + existing API route analysis
// lib/services/appointments.ts
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export interface CreateAppointmentParams {
  pacienteId: number
  servicoId: number
  providerId?: string
  dataHora: Date  // Already parsed TZDate
  observacoes?: string
  userId: string  // For audit logging
}

export async function createAppointment(
  params: CreateAppointmentParams
) {
  const supabase = await createServerClient()

  // 1. Check for conflicts (business logic)
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      dataHora: params.dataHora,
      profissional: params.providerId,
      status: { notIn: ['cancelada'] },
    },
  })

  if (conflictingAppointment) {
    throw new Error('Time slot already booked')
  }

  // 2. Get service details
  const service = await prisma.servico.findUnique({
    where: { id: params.servicoId },
  })

  if (!service) {
    throw new Error('Service not found')
  }

  // 3. Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      pacienteId: params.pacienteId,
      tipoConsulta: service.nome,
      servicoId: params.servicoId,
      profissional: params.providerId,
      dataHora: params.dataHora,
      duracaoMinutos: service.duracaoMinutos,
      observacoes: params.observacoes,
      status: 'agendada',
    },
  })

  return appointment
}
```

### Pattern 4: Flexible Date Validation (Agent APIs)
**What:** Accept multiple date formats (ISO 8601, datetime-local) via Zod schemas
**When to use:** Agent API input validation where N8N may send various formats
**Example:**
```typescript
// Source: Zod v4 ISO datetime validation
// lib/validations/agent-schemas.ts
import { z } from 'zod'
import { TZDate } from '@date-fns/tz'
import { CLINIC_TIMEZONE } from '@/lib/calendar/time-zone-utils'

// Flexible date schema accepting multiple ISO 8601 formats
export const flexibleDateSchema = z.union([
  // Full ISO 8601 with timezone offset: "2026-01-24T14:30:00-03:00"
  z.string().datetime({ offset: true }),

  // Local datetime: "2026-01-24T14:30:00"
  z.string().datetime({ local: true }),

  // Date-only (will default to midnight clinic time): "2026-01-24"
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
])
  .transform((dateStr) => {
    // Convert to TZDate in clinic timezone
    const date = new Date(dateStr)
    return new TZDate(date, CLINIC_TIMEZONE)
  })

// Agent appointment creation schema
export const agentCreateAppointmentSchema = z.object({
  pacienteId: z.coerce.number().int().positive(),
  servicoId: z.coerce.number().int().positive(),
  providerId: z.string().uuid().optional(),
  dataHora: flexibleDateSchema,  // Flexible date parsing
  observacoes: z.string().optional(),
})

export type AgentCreateAppointmentInput = z.infer<typeof agentCreateAppointmentSchema>
```

### Pattern 5: Consistent Error Response Format
**What:** Unified error response structure across all agent APIs
**When to use:** All error cases in agent API routes
**Example:**
```typescript
// Source: RFC 9457 Problem Details + API error handling best practices
// lib/agent/error-handler.ts
import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: Record<string, any>
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('[API Error]', error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          issues: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    // Known errors with specific messages
    const knownErrors: Record<string, number> = {
      'Time slot already booked': 409,
      'Patient not found': 404,
      'Service not found': 404,
    }

    const status = knownErrors[error.message] || 500

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status }
    )
  }

  // Unknown error
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  )
}

export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  })
}
```

### Pattern 6: Agent Audit Logging Extension
**What:** Extend existing audit logger to track agent actions with correlation IDs
**When to use:** All agent API operations that access PHI or modify data
**Example:**
```typescript
// Source: Existing audit logger + HIPAA audit trail requirements
// lib/audit/logger.ts (extension)

// Add new agent-specific actions to existing enum
export enum AuditAction {
  // ... existing actions ...

  // Agent API actions
  AGENT_VIEW_PATIENT = 'AGENT_VIEW_PATIENT',
  AGENT_CREATE_APPOINTMENT = 'AGENT_CREATE_APPOINTMENT',
  AGENT_UPDATE_APPOINTMENT = 'AGENT_UPDATE_APPOINTMENT',
  AGENT_CANCEL_APPOINTMENT = 'AGENT_CANCEL_APPOINTMENT',
  AGENT_SEARCH_SLOTS = 'AGENT_SEARCH_SLOTS',
}

interface LogAuditParams {
  userId: string
  action: AuditAction
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  agentId?: string           // NEW: Agent identifier
  correlationId?: string     // NEW: Request tracking
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: {
          ...(params.details || {}),
          agentId: params.agentId,           // Track agent context
          correlationId: params.correlationId,  // Track request chain
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (error) {
    console.error('[AUDIT LOG FAILURE]', error)
  }
}
```

### Anti-Patterns to Avoid
- **Validating API keys in every route handler:** Use HOF middleware instead
- **Storing plain text API keys:** Always bcrypt hash, never retrieve original key
- **Inconsistent error formats:** Use shared `handleApiError()` utility
- **Duplicating business logic in routes:** Extract to service layer
- **Skipping audit logs for agent actions:** HIPAA requires all PHI access tracking
- **Hardcoding date parsing:** Use flexible Zod schemas with timezone awareness

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request correlation tracking | Custom UUID generator | `crypto.randomUUID()` (Node.js built-in) | Standard, performant, no dependencies |
| Date parsing from multiple formats | Custom regex parser | Zod `z.iso.datetime()` + transform | Handles edge cases, validates, type-safe |
| API route authentication | Inline auth checks | HOF `withAgentAuth()` pattern | DRY, consistent, easier to test |
| Password/key hashing | Custom hash function | bcrypt library | Time-tested, configurable work factor |
| Error response formatting | Per-route error handling | Shared `handleApiError()` utility | Consistency, AI agent can parse reliably |
| Business logic in routes | Inline database queries | Service layer functions | Reusable across UI and APIs, testable |

**Key insight:** Agent APIs require consistent, predictable responses for AI parsing. Hand-rolling solutions leads to inconsistencies that confuse the agent and make debugging harder.

## Common Pitfalls

### Pitfall 1: API Key Exposure in Logs or Storage
**What goes wrong:** API keys logged in plaintext or stored unhashed in database
**Why it happens:** Developer forgets N8N execution logs capture request details
**How to avoid:**
- Store only bcrypt hashes in database (never plaintext)
- Use N8N Credentials system with `{{$credentials.botfy_api_key}}`
- Never log full Authorization header, only validation result
**Warning signs:**
- API keys visible in database queries
- Authorization headers in console.log output
- N8N workflow JSON contains hardcoded keys

### Pitfall 2: Missing Correlation IDs in Audit Trail
**What goes wrong:** Agent makes multiple API calls for one patient interaction, no way to link them
**Why it happens:** Each API route generates separate audit log without linking
**How to avoid:**
- Generate correlation ID in `withAgentAuth()` middleware
- Pass to all service layer functions
- Include in all audit log entries for the request
**Warning signs:**
- Cannot trace patient conversation to API calls
- Audit logs show individual actions but no context
- HIPAA compliance gap (cannot reconstruct access timeline)

### Pitfall 3: Service Layer Still Calls User Auth
**What goes wrong:** Service function expects `getCurrentUserWithRole()` but agent has different auth model
**Why it happens:** Extracting service from route without removing auth coupling
**How to avoid:**
- Service functions accept `userId` as parameter
- Caller (route or agent) handles authentication
- Service assumes authenticated context
**Warning signs:**
- Service function has auth imports
- Agent API fails with "user not found" despite valid agent auth
- Cannot reuse service in background jobs

### Pitfall 4: Timezone Lost in Date Parsing
**What goes wrong:** Agent sends "2026-01-24T14:30:00", stored as UTC, displayed wrong to users
**Why it happens:** Forgetting to apply clinic timezone during parsing
**How to avoid:**
- Use `flexibleDateSchema` with TZDate transform
- Always create TZDate with `CLINIC_TIMEZONE`
- Never use `new Date()` directly for appointment times
**Warning signs:**
- Appointments show wrong time after DST change
- Agent-created appointments off by 2-3 hours
- Patient sees different time than agent intended

### Pitfall 5: Inconsistent Error Responses Break Agent
**What goes wrong:** Some routes return `{error: "msg"}`, others `{message: "msg"}`, agent confused
**Why it happens:** Copy-pasting error handling from different examples
**How to avoid:**
- Use shared `handleApiError()` for all errors
- Define `ApiResponse<T>` type and enforce it
- Test agent integration with error scenarios
**Warning signs:**
- Agent retries successful requests
- Agent cannot parse error messages
- N8N workflow shows "Cannot read property 'error'"

### Pitfall 6: Agent Bypasses RBAC
**What goes wrong:** Agent user mapped to ADMIN role, accesses everything without checks
**Why it happens:** Setting up agent with highest privilege for convenience
**How to avoid:**
- Create dedicated "AGENT" role or use ATENDENTE
- Map agent to user with appropriate permissions
- Service layer checks RBAC via passed user context
**Warning signs:**
- Agent can delete users or modify system config
- No permission checks in agent API routes
- Audit logs show ADMIN actions from agent

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete Agent API Route Implementation
```typescript
// Source: Combining HOF pattern + existing API route structure
// src/app/api/agent/appointments/route.ts
import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { successResponse } from '@/lib/agent/error-handler'
import { agentCreateAppointmentSchema } from '@/lib/validations/agent-schemas'
import { createAppointment } from '@/lib/services/appointments'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export const POST = withAgentAuth(async (req, context, agentContext) => {
  // 1. Parse and validate input
  const body = await req.json()
  const validatedData = agentCreateAppointmentSchema.parse(body)

  // 2. Call service layer (business logic)
  const appointment = await createAppointment({
    ...validatedData,
    userId: agentContext.userId,  // For audit
  })

  // 3. Audit log (HIPAA compliance)
  await logAudit({
    userId: agentContext.userId,
    action: AuditAction.AGENT_CREATE_APPOINTMENT,
    resource: 'appointments',
    resourceId: String(appointment.id),
    details: {
      pacienteId: appointment.pacienteId,
      dataHora: appointment.dataHora.toISOString(),
    },
    agentId: agentContext.agentId,
    correlationId: agentContext.correlationId,
  })

  // 4. Return consistent response
  return successResponse({
    appointmentId: appointment.id,
    scheduledAt: appointment.dataHora.toISOString(),
    status: appointment.status,
  })
})
```

### Agents Table Schema (Database Migration)
```prisma
// Source: Existing Prisma schema patterns
// prisma/schema.prisma (addition)

model Agent {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   // e.g., "Marília - WhatsApp Agent"
  description String?
  apiKeyHash  String   @map("api_key_hash") // bcrypt hash, never plaintext
  userId      String   @map("user_id")      // Maps to system user for RBAC
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("agents")
}

// Update User model to include agent relation
model User {
  // ... existing fields ...
  agents Agent[]  // NEW: User can have multiple agents mapped
}
```

### API Key Generation Script
```typescript
// Source: bcrypt best practices + existing seed patterns
// scripts/generate-agent-key.ts
import bcrypt from 'bcrypt'
import crypto from 'crypto'

async function generateAgentApiKey() {
  // 1. Generate secure random key
  const apiKey = crypto.randomBytes(32).toString('hex')

  // 2. Hash with bcrypt (10-12 rounds recommended)
  const saltRounds = 12
  const apiKeyHash = await bcrypt.hash(apiKey, saltRounds)

  console.log('=== AGENT API KEY GENERATED ===')
  console.log('API Key (store in N8N Credentials):')
  console.log(apiKey)
  console.log('\nAPI Key Hash (store in database):')
  console.log(apiKeyHash)
  console.log('\nNEVER store the plain API key in database!')
  console.log('Store only the hash, use the plain key in N8N.')
}

generateAgentApiKey()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API auth in middleware.ts | HOF `withAgentAuth()` per route | Next.js 16 (2025) | Better scoping, doesn't affect all routes |
| date-fns-tz (separate package) | @date-fns/tz (official) | date-fns v4.0 (2024) | First-class timezone support with TZDate |
| Manual error formatting | RFC 9457 Problem Details | 2023-2024 | Standardized API error responses |
| Inline business logic | Service Layer / DAL pattern | Growing 2025-2026 | Reusability, testability, maintainability |
| z.string().datetime() rejects local | z.iso.datetime({ local: true }) | Zod v4 (2024) | Flexible datetime parsing for agents |

**Deprecated/outdated:**
- **Next.js Pages API Routes:** App Router `/api/` routes are current standard
- **date-fns-tz package:** Replaced by @date-fns/tz in date-fns v4
- **Middleware for API auth:** Too broad, use scoped HOF pattern instead

## Open Questions

Things that couldn't be fully resolved:

1. **Agent User Role: ATENDENTE or dedicated AGENT?**
   - What we know: Existing RBAC has ADMIN and ATENDENTE roles
   - What's unclear: Should agent have same permissions as ATENDENTE or custom role?
   - Recommendation: Start with ATENDENTE, create dedicated AGENT role if permissions diverge

2. **API Key Rotation Strategy**
   - What we know: bcrypt hashes stored in database
   - What's unclear: How often to rotate? How to update N8N credentials?
   - Recommendation: Manual rotation initially, document process, automate in Phase 21

3. **Idempotency Implementation**
   - What we know: Needed for write operations (Phase 19 requirement)
   - What's unclear: Use Redis cache or database table for idempotency keys?
   - Recommendation: Database table initially (no Redis dependency), migrate to Redis if performance issues

4. **Service Layer Error Handling**
   - What we know: Service functions throw errors caught by HOF
   - What's unclear: Should services return Result<T, E> type or throw exceptions?
   - Recommendation: Throw exceptions initially (matches existing patterns), refactor to Result if needed

## Sources

### Primary (HIGH confidence)
- **Next.js Official Documentation:** [Next.js 16 API Routes](https://nextjs.org/docs/app/guides/authentication), [Middleware Patterns](https://nextjs.org/docs/14/app/building-your-application/routing/middleware)
- **Zod Official Documentation:** [String Format Validators](https://zod.dev/api), [ISO DateTime Support](https://zod.dev/codecs)
- **date-fns Official Blog:** [v4.0 Time Zone Support](https://blog.date-fns.org/v40-with-time-zone-support/)
- **bcrypt npm package:** [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- **Existing Codebase:** `src/lib/audit/logger.ts`, `src/lib/auth/session.ts`, `src/app/api/pacientes/route.ts`

### Secondary (MEDIUM confidence)
- [Next.js 16 Route Handlers Explained: 3 Advanced Use Cases](https://strapi.io/blog/nextjs-16-route-handlers-explained-3-advanced-usecases) - HOF middleware pattern
- [Best Practices for API Error Handling](https://zuplo.com/learning-center/best-practices-for-api-error-handling) - RFC 9457 Problem Details
- [HIPAA Audit Logs: Complete Requirements for Healthcare Compliance in 2025](https://www.kiteworks.com/hipaa-compliance/hipaa-audit-log-requirements/) - Correlation ID tracking
- [Next.js Service Layer Pattern](https://github.com/ugurkellecioglu/nextjs-service-layer-pattern) - Service layer extraction
- [Building a Secure & Scalable BFF Architecture with Next.js](https://vishal-vishal-gupta48.medium.com/building-a-secure-scalable-bff-backend-for-frontend-architecture-with-next-js-api-routes-cbc8c101bff0) - Bearer token patterns

### Tertiary (LOW confidence)
- [Next.js API Routes: Implementing middlewares](https://diasjunior.medium.com/next-js-api-routes-implementing-middlewares-15b7d6b028ae) - Older pattern, verify with Next.js 16
- [Password hashing in Node.js with bcrypt](https://blog.logrocket.com/password-hashing-node-js-bcrypt/) - General bcrypt usage (not API key specific)

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - All libraries already in use except bcrypt (well-documented)
- **Architecture patterns:** HIGH - HOF pattern verified in Next.js 16, service layer is standard DAL
- **Pitfalls:** HIGH - Based on existing codebase analysis and HIPAA audit requirements
- **Date parsing:** MEDIUM - Zod v4 ISO support confirmed, but specific edge cases may need testing
- **Agent RBAC:** MEDIUM - Design decision pending (ATENDENTE vs AGENT role)

**Research date:** 2026-01-24
**Valid until:** 90 days (stable technologies, Next.js 16 is current LTS)

**Phase-specific focus areas validated:**
1. ✅ API key authentication structure (bcrypt + HOF pattern)
2. ✅ Audit logger extension (agent context + correlation ID)
3. ✅ Service layer extraction (DAL pattern confirmed)
4. ✅ Flexible date parsing (Zod v4 ISO datetime validated)
5. ✅ Middleware patterns (HOF over global middleware)

**Ready for planning:** All foundation patterns validated, no blocking uncertainties.
