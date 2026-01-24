# Phase 18: Query Tools (Read Operations) - Research

**Researched:** 2026-01-24
**Domain:** Next.js API Routes, Service Layer Architecture, REST API Design
**Confidence:** HIGH

## Summary

Phase 18 implements 5 read-only API endpoints for the AI Agent to query appointments, available slots, patient data, pre-checkin status, and procedure instructions. The research reveals that:

1. **Existing business logic is already available** in Console UI routes but needs extraction into reusable service functions
2. **Next.js App Router** supports multiple service layer patterns; the codebase already uses inline logic in route handlers
3. **Pagination should be implemented** for all list endpoints to avoid unbounded responses (HIPAA compliance and performance)
4. **Caching is NOT recommended** for read-only APIs serving dynamic appointment data (slots change frequently)
5. **N8N HTTP Request node** is straightforward to configure with Bearer token authentication and expects JSON responses

**Primary recommendation:** Extract business logic from existing Console routes into `/src/lib/services/` modules, then build Agent API routes that call these services with Agent authentication. Use page-based pagination (simpler than cursor-based for small datasets). NO caching for dynamic appointment data.

## Standard Stack

### Core Dependencies (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.x | App Router API routes | Official framework for React SSR and API routes |
| Prisma | Latest | ORM with PostgreSQL | Type-safe database queries, already in use |
| Zod | Latest | Request/response validation | Runtime type safety, already in use for agent schemas |
| bcrypt | Latest | API key hashing | Industry standard for password/key hashing |
| @date-fns/tz | Latest | Timezone-aware dates | Critical for Brazil DST handling (America/Sao_Paulo) |

### Supporting Libraries (Already Available)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `@/lib/auth/session` | User authentication | Console UI routes (NOT Agent API routes) |
| `@/lib/agent/auth` | Agent API key validation | Agent API routes with `withAgentAuth()` HOF |
| `@/lib/audit/logger` | HIPAA audit logging | All operations accessing PHI data |
| `@/lib/supabase/server` | Supabase client | Direct Supabase queries (legacy N8N compatibility) |
| `@/lib/prisma` | Prisma client | Modern type-safe queries (preferred) |

### No New Dependencies Required

All necessary libraries are already installed and configured in Phase 17.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── api/
│       ├── agent/                    # Agent API endpoints (NEW)
│       │   ├── slots/
│       │   │   └── route.ts          # GET /api/agent/slots
│       │   ├── agendamentos/
│       │   │   └── route.ts          # GET /api/agent/agendamentos
│       │   ├── paciente/
│       │   │   └── route.ts          # GET /api/agent/paciente
│       │   ├── pre-checkin/
│       │   │   └── status/
│       │   │       └── route.ts      # GET /api/agent/pre-checkin/status
│       │   └── instrucoes/
│       │       └── route.ts          # GET /api/agent/instrucoes
│       ├── agendamentos/
│       │   └── route.ts              # Console UI route (existing)
│       └── pacientes/
│           └── route.ts              # Console UI route (existing)
├── lib/
│   ├── services/                     # Business logic layer (NEW)
│   │   ├── slot-service.ts           # Slot availability calculation
│   │   ├── appointment-service.ts    # Appointment queries
│   │   ├── patient-service.ts        # Patient search
│   │   ├── pre-checkin-service.ts    # Pre-checkin status aggregation
│   │   └── instruction-service.ts    # Instruction search
│   ├── calendar/                     # Calendar utilities (existing)
│   │   ├── availability-calculator.ts # Slot generation logic
│   │   └── conflict-detection.ts     # Overlap detection
│   └── validations/
│       └── agent-schemas.ts          # Zod schemas (existing)
```

### Pattern 1: Service Layer Extraction

**What:** Extract business logic from route handlers into reusable service functions in `/src/lib/services/`.

**When to use:** When the same logic is needed in both Console UI routes and Agent API routes.

**Example:**

```typescript
// src/lib/services/slot-service.ts
import { prisma } from '@/lib/prisma'
import { calculateAvailableSlots, DEFAULT_WORKING_HOURS } from '@/lib/calendar/availability-calculator'
import { TimeSlot } from '@/lib/calendar/conflict-detection'
import { TZDate } from '@date-fns/tz'

export interface SlotQuery {
  date: Date
  period?: 'manha' | 'tarde' | 'qualquer'
  providerId?: string
  serviceDuration?: number
}

export async function getAvailableSlots(query: SlotQuery) {
  const { date, period = 'qualquer', providerId = 'default-provider', serviceDuration = 60 } = query

  // Fetch existing appointments for the day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      dataHora: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        not: 'CANCELADO',
      },
    },
    include: {
      servico: {
        select: { duracaoMinutos: true },
      },
    },
  })

  // Convert to TimeSlot format
  const existingSlots: TimeSlot[] = appointments.map(apt => {
    const start = new Date(apt.dataHora)
    const duration = apt.servico?.duracaoMinutos || 60
    const end = new Date(start.getTime() + duration * 60000)
    return { id: apt.id.toString(), providerId, start, end }
  })

  // Filter working hours by period
  let workingHours = DEFAULT_WORKING_HOURS
  if (period === 'manha') {
    workingHours = workingHours.filter(h => parseInt(h.start.split(':')[0]) < 12)
  } else if (period === 'tarde') {
    workingHours = workingHours.filter(h => parseInt(h.start.split(':')[0]) >= 13)
  }

  // Calculate available slots
  const availableSlots = calculateAvailableSlots(
    date,
    { providerId, workingHours, appointmentDuration: serviceDuration, bufferMinutes: 15 },
    existingSlots
  )

  return {
    date: date.toISOString().split('T')[0],
    period,
    slots: availableSlots.map(slot => slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
    totalAvailable: availableSlots.length,
  }
}
```

**Benefits:**
- **Reusability:** Same logic used by Console UI and Agent API
- **Testability:** Services can be unit tested independently
- **Maintainability:** Business logic changes in one place
- **Type Safety:** Prisma types flow through the service layer

**Source:** [GitHub - nextjs-service-layer-pattern](https://github.com/ugurkellecioglu/nextjs-service-layer-pattern)

### Pattern 2: Agent API Route with withAgentAuth HOF

**What:** Wrap Agent API route handlers with `withAgentAuth()` for authentication and inject `AgentContext`.

**When to use:** All Agent API routes in `/api/agent/*`.

**Example:**

```typescript
// src/app/api/agent/slots/route.ts
import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/auth'
import { successResponse, errorResponse } from '@/lib/agent/error-handler'
import { getAvailableSlots } from '@/lib/services/slot-service'
import { slotQuerySchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export const GET = withAgentAuth(async (req: NextRequest, context) => {
  try {
    // 1. Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = slotQuerySchema.parse(searchParams)

    // 2. Call service layer
    const result = await getAvailableSlots({
      date: query.date,
      period: query.period,
      providerId: query.providerId,
      serviceDuration: query.serviceDuration,
    })

    // 3. Audit log
    await logAudit({
      userId: context.userId,
      action: AuditAction.AGENT_QUERY_SLOTS,
      resource: 'agent_api',
      details: {
        agentId: context.agentId,
        correlationId: context.correlationId,
        query: { date: query.date, period: query.period },
        resultCount: result.totalAvailable,
      },
    })

    // 4. Return success response
    return successResponse(result)
  } catch (error) {
    return errorResponse(error, req, context)
  }
})
```

**Source:** Phase 17 deliverables (`src/lib/agent/auth.ts`)

### Pattern 3: Pagination with Metadata

**What:** Return paginated results with `page`, `limit`, `total`, `totalPages` metadata.

**When to use:** All list endpoints (`/agendamentos`, `/instrucoes`).

**Example:**

```typescript
// src/lib/services/appointment-service.ts
export interface AppointmentQuery {
  patientId?: number
  dateStart?: Date
  dateEnd?: Date
  status?: string
  page?: number
  limit?: number
}

export async function searchAppointments(query: AppointmentQuery) {
  const page = query.page || 1
  const limit = Math.min(query.limit || 20, 100) // Max 100 per page
  const skip = (page - 1) * limit

  const where: any = {}
  if (query.patientId) where.pacienteId = query.patientId
  if (query.dateStart) where.dataHora = { gte: query.dateStart }
  if (query.dateEnd) where.dataHora = { ...where.dataHora, lte: query.dateEnd }
  if (query.status) where.status = query.status

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dataHora: 'asc' },
      include: {
        paciente: { select: { nome: true, telefone: true } },
        servico: { select: { nome: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ])

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

**Source:** Existing Console routes (`src/app/api/pacientes/route.ts`, `src/app/api/pre-checkin/route.ts`)

### Anti-Patterns to Avoid

- **Inline business logic in route handlers:** Extract to services for reusability
- **No pagination on list endpoints:** Always paginate to avoid unbounded responses
- **Caching dynamic appointment data:** Slots change frequently, cache invalidation is complex
- **Mixing Prisma and Supabase clients:** Prefer Prisma for new code (better types)
- **Exposing PHI in error messages:** Use generic error messages, log details server-side

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slot availability calculation | Custom date/time loops | `calculateAvailableSlots()` from Phase 4 | Already handles DST transitions, buffer time, working hours |
| Conflict detection | Manual overlap checking | `findConflicts()` from Phase 4 | Handles provider isolation, self-exclusion for updates |
| Patient search with partial CPF/phone | Custom regex matching | Prisma `contains` mode + Postgres `ILIKE` | Database-optimized, handles accents/case-insensitive |
| Pagination logic | Manual offset/limit | Prisma `skip`/`take` with `count()` | Type-safe, optimized SQL queries |
| Date validation | Manual parsing | `flexibleDateTimeSchema` from Phase 17 | Handles 4 ISO 8601 variants, DST-aware TZDate |

**Key insight:** The existing codebase has robust calendar utilities from Phase 4 (Calendar Scheduling). DO NOT reimplement slot calculation or conflict detection—reuse `src/lib/calendar/availability-calculator.ts` and `src/lib/calendar/conflict-detection.ts`.

## Common Pitfalls

### Pitfall 1: Service Layer Over-Engineering

**What goes wrong:** Creating complex repository pattern with interfaces and DI containers for a simple CRUD app.

**Why it happens:** Following enterprise patterns from large-scale apps (Nest.js, Spring Boot) in a small Next.js project.

**How to avoid:** Use **simple service functions** (not classes) in `/src/lib/services/`. Export async functions that call Prisma directly. Only add abstraction layers when you have multiple data sources.

**Warning signs:**
- Creating `IPatientRepository` interfaces with single implementations
- Using dependency injection containers (not needed in Next.js)
- Multiple layers of abstraction (Controller → Service → Repository → DAO)

**Recommended approach:**
```typescript
// SIMPLE (recommended for this project)
export async function getPatientByPhone(phone: string) {
  return await prisma.patient.findUnique({ where: { telefone: phone } })
}

// OVER-ENGINEERED (avoid)
interface IPatientRepository {
  findByPhone(phone: string): Promise<Patient | null>
}
class PatientService {
  constructor(private repo: IPatientRepository) {}
  async getByPhone(phone: string) { return this.repo.findByPhone(phone) }
}
```

**Source:** [Clean Architecture with Next.js - DEV Community](https://dev.to/dan1618/clean-architecture-with-nextjs-43cg)

### Pitfall 2: Unbounded List Responses

**What goes wrong:** Agent API returns all 10,000 appointments without pagination, causing timeouts and memory issues.

**Why it happens:** N8N sub-workflows currently don't paginate (small dataset in testing), but production will have thousands of records.

**How to avoid:** **ALWAYS implement pagination** on list endpoints with:
- Default `limit=20` (max `limit=100`)
- Return `{ data: [...], pagination: { page, limit, total, totalPages } }`
- N8N can loop through pages if needed

**Warning signs:**
- Using Prisma `findMany()` without `take` parameter
- No `page`/`limit` query parameters in API route
- Response time > 2 seconds for list endpoints

**Example:**
```typescript
// BAD - unbounded
const appointments = await prisma.appointment.findMany({ where })

// GOOD - paginated
const limit = Math.min(query.limit || 20, 100)
const skip = (query.page - 1) * limit
const appointments = await prisma.appointment.findMany({ where, skip, take: limit })
```

**Source:** [10 RESTful API Pagination Best Practices - Nordic APIs](https://nordicapis.com/restful-api-pagination-best-practices/)

### Pitfall 3: Caching Dynamic Appointment Data

**What goes wrong:** Implementing `unstable_cache()` for slot availability endpoint, causing stale data (showing booked slots as available).

**Why it happens:** Misunderstanding Next.js caching docs—caching is great for static data (blog posts), terrible for dynamic schedules.

**How to avoid:**
- **NO caching** for `/api/agent/slots`, `/api/agent/agendamentos`
- **Short-lived cache (60s)** for `/api/agent/instrucoes` (rarely changes)
- **NO cache** for patient data (PHI must be fresh)

**Warning signs:**
- Using `{ cache: 'force-cache' }` in Agent API routes
- Adding `revalidate: 3600` to appointment queries
- Cache invalidation logic on every appointment create/update

**Correct approach:**
```typescript
// NO cache for dynamic appointment data
export const GET = withAgentAuth(async (req, context) => {
  const slots = await getAvailableSlots(query) // Fresh query every time
  return successResponse(slots)
})
```

**Source:** [Next.js App Router: Fetching Data with Caching Strategies](https://context7.com)

### Pitfall 4: Partial CPF/Phone Matching Performance

**What goes wrong:** Using Prisma `contains` on `telefone` field without proper indexing causes full table scans.

**Why it happens:** N8N workflow uses partial matching (`LIKE '%999%'`) for flexible patient search.

**How to avoid:**
- **Exact match preferred:** Use `where: { telefone: exact }` first (indexed, fast)
- **Partial match fallback:** If no exact match, use `contains` with `mode: 'insensitive'`
- **Limit results:** Add `take: 10` to partial match queries

**Warning signs:**
- Query time > 500ms for patient search
- Using `contains` without `take` limit
- No index on `telefone` field (already exists in schema)

**Example:**
```typescript
// Efficient patient search
const exactMatch = await prisma.patient.findUnique({ where: { telefone: phone } })
if (exactMatch) return exactMatch

// Fallback to partial match (slower, limit results)
const partialMatches = await prisma.patient.findMany({
  where: { telefone: { contains: phone, mode: 'insensitive' } },
  take: 10,
})
```

**Source:** Existing Console implementation (`src/app/api/pacientes/route.ts`)

### Pitfall 5: N8N Response Parsing Assumptions

**What goes wrong:** Agent API returns `{ success: true, data: {...} }` but N8N expects flat JSON like `{ slots: [...] }`.

**Why it happens:** Phase 17 defined `ApiResponse<T>` wrapper, but N8N HTTP Request node may not unwrap it automatically.

**How to avoid:**
- **N8N can handle both formats** (wrapped or flat), but be consistent
- **Test with N8N early:** Create HTTP Request node and verify response parsing
- **Use `$json` in N8N:** Access response fields with `{{ $json.data.slots }}` if wrapped

**Correct approach (choose one):**
```typescript
// Option A: Wrapped (Phase 17 standard)
return successResponse({ slots: [...], totalAvailable: 10 })
// N8N accesses with: {{ $json.data.slots }}

// Option B: Flat (simpler for N8N)
return NextResponse.json({ slots: [...], totalAvailable: 10 })
// N8N accesses with: {{ $json.slots }}
```

**Recommendation:** Use **Option A (wrapped)** for consistency with Phase 17 error handling. N8N can easily access `$json.data`.

**Source:** [n8n HTTP Request node documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Slot Availability API Route

```typescript
// src/app/api/agent/slots/route.ts
import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/auth'
import { successResponse, errorResponse } from '@/lib/agent/error-handler'
import { getAvailableSlots } from '@/lib/services/slot-service'
import { slotQuerySchema } from '@/lib/validations/agent-schemas'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export const GET = withAgentAuth(async (req: NextRequest, context) => {
  try {
    // Parse query params: ?date=2026-01-25&period=manha
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = slotQuerySchema.parse(searchParams)

    // Call service layer
    const result = await getAvailableSlots({
      date: query.date,
      period: query.period,
    })

    // Audit log
    await logAudit({
      userId: context.userId,
      action: AuditAction.AGENT_QUERY_SLOTS,
      resource: 'agent_api',
      details: {
        agentId: context.agentId,
        correlationId: context.correlationId,
        resultCount: result.totalAvailable,
      },
    })

    return successResponse(result)
  } catch (error) {
    return errorResponse(error, req, context)
  }
})
```

**Source:** Phase 17 `withAgentAuth()` HOF pattern + existing Console routes

### Example 2: Patient Search with Exact/Partial Matching

```typescript
// src/lib/services/patient-service.ts
import { prisma } from '@/lib/prisma'

export interface PatientSearchQuery {
  phone?: string
  cpf?: string
}

export async function searchPatient(query: PatientSearchQuery) {
  if (query.phone) {
    // Try exact match first (fast, indexed)
    const exactMatch = await prisma.patient.findUnique({
      where: { telefone: query.phone },
      include: {
        agendamentos: {
          where: {
            dataHora: { gte: new Date() }, // Future appointments only
          },
          orderBy: { dataHora: 'asc' },
          take: 5,
        },
      },
    })

    if (exactMatch) return { patient: exactMatch, matchType: 'exact' }

    // Fallback to partial match (slower, limit results)
    const partialMatches = await prisma.patient.findMany({
      where: {
        telefone: { contains: query.phone, mode: 'insensitive' },
      },
      take: 10,
    })

    return { patients: partialMatches, matchType: 'partial' }
  }

  if (query.cpf) {
    const patient = await prisma.patient.findFirst({
      where: { cpf: query.cpf },
    })
    return { patient, matchType: 'exact' }
  }

  throw new Error('Phone or CPF required')
}
```

**Source:** Existing Console implementation + [Prisma query patterns](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)

### Example 3: Paginated Appointment Search

```typescript
// src/lib/services/appointment-service.ts
import { prisma } from '@/lib/prisma'

export async function searchAppointments(query: {
  patientId?: number
  dateStart?: Date
  dateEnd?: Date
  status?: string
  page?: number
  limit?: number
}) {
  const page = query.page || 1
  const limit = Math.min(query.limit || 20, 100)
  const skip = (page - 1) * limit

  const where: any = {}
  if (query.patientId) where.pacienteId = query.patientId
  if (query.dateStart || query.dateEnd) {
    where.dataHora = {}
    if (query.dateStart) where.dataHora.gte = query.dateStart
    if (query.dateEnd) where.dataHora.lte = query.dateEnd
  }
  if (query.status) where.status = query.status

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dataHora: 'asc' },
      include: {
        paciente: { select: { nome: true, telefone: true } },
        servico: { select: { nome: true, duracaoMinutos: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ])

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

**Source:** Existing Console routes (`src/app/api/pre-checkin/route.ts`)

### Example 4: Pre-Checkin Status Aggregation

```typescript
// src/lib/services/pre-checkin-service.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getPreCheckinStatus(appointmentId: number) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('pre_checkin')
    .select(`
      id,
      status,
      dados_confirmados,
      documentos_enviados,
      instrucoes_enviadas,
      pendencias,
      mensagem_enviada_em,
      lembrete_enviado_em
    `)
    .eq('agendamento_id', appointmentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No pre-checkin record yet
      return { status: 'pendente', exists: false }
    }
    throw error
  }

  return {
    status: data.status,
    exists: true,
    dadosConfirmados: data.dados_confirmados,
    documentosEnviados: data.documentos_enviados,
    instrucoesEnviadas: data.instrucoes_enviadas,
    pendencias: data.pendencias,
    mensagemEnviadaEm: data.mensagem_enviada_em,
    lembreteEnviadoEm: data.lembrete_enviado_em,
  }
}
```

**Source:** N8N workflow `Tool: Consultar Status Pre Check-In` + Supabase patterns

### Example 5: N8N HTTP Request Node Configuration

```json
{
  "name": "Query Available Slots",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://console.example.com/api/agent/slots",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "date", "value": "={{ $json.date }}"},
        {"name": "period", "value": "={{ $json.period }}"}
      ]
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  },
  "credentials": {
    "httpHeaderAuth": {
      "id": "agent-api-key",
      "name": "Agent API Key"
    }
  }
}
```

**Credential configuration:**
```json
{
  "name": "Agent API Key",
  "type": "httpHeaderAuth",
  "data": {
    "name": "Authorization",
    "value": "=Bearer {{$credentials.apiKey}}"
  }
}
```

**Source:** [n8n HTTP Request node docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N8N sub-workflows with Supabase nodes | Next.js API routes with Prisma | Phase 18 (now) | Type safety, better error handling, easier testing |
| Offset-based pagination (`OFFSET 20 LIMIT 10`) | Page-based with metadata (`page=2&limit=10`) | 2024+ | More user-friendly, standard REST pattern |
| Cursor pagination for large datasets | Page-based for small datasets (<10k records) | N/A | Simpler implementation, acceptable performance |
| Manual date parsing | Zod + TZDate validation | Phase 17 | DST-aware, validates 4 ISO 8601 formats |
| Global error handling | Per-route error handling with `errorResponse()` | Phase 17 | Structured errors with correlation IDs |

**Deprecated/outdated:**
- **Supabase nodes in N8N:** Deprecated by N8N, replaced with Postgres nodes (but still functional)
- **`getStaticProps`/`getServerSideProps`:** Replaced by Server Components in Next.js App Router
- **Pages Router API routes:** Replaced by App Router `route.ts` files

## Open Questions

### Question 1: Should we use Prisma or Supabase client for Agent APIs?

**What we know:**
- Existing Console routes use **both** (Prisma for new features, Supabase for N8N compatibility)
- Prisma has better TypeScript types and query builder
- Supabase client is already used in `pre_checkin` and N8N workflows

**What's unclear:**
- Performance difference for read-only queries (likely negligible)
- Risk of mixing two clients in same codebase

**Recommendation:**
- **Use Prisma** for new Agent API endpoints (better types, easier to test)
- **Only use Supabase** if query requires RLS (Row Level Security) or table not in Prisma schema
- **Pre-checkin status endpoint:** Use Supabase (already has RLS policies)

### Question 2: Should we implement cursor-based pagination now for future scalability?

**What we know:**
- Current dataset: ~500 appointments, ~100 patients (small)
- Cursor pagination is better for large, fast-changing datasets (social feeds, logs)
- Page-based pagination is simpler and sufficient for <10k records

**What's unclear:**
- Growth projection: Will clinic have >10k appointments in next 2 years?
- N8N ease of use: Can N8N HTTP Request node handle cursor pagination?

**Recommendation:**
- **Start with page-based pagination** (simpler, meets current needs)
- **Monitor performance:** If queries take >500ms, consider cursor pagination
- **Easy migration path:** Service layer abstraction makes switching pagination styles transparent to API consumers

**Source:** [API Pagination: Offset vs. Cursor-Based - Embedded Blog](https://embedded.gusto.com/blog/api-pagination/)

### Question 3: Should we cache procedure instructions (rarely change)?

**What we know:**
- Procedure instructions change infrequently (maybe once per month)
- Other data (slots, appointments) changes constantly
- Next.js `unstable_cache()` requires manual invalidation

**What's unclear:**
- Cache invalidation complexity: How to invalidate when instruction is updated?
- Performance gain: Is 60s cache worth the complexity?

**Recommendation:**
- **NO cache for Phase 18** (keep it simple, all endpoints consistent)
- **Add cache in Phase 19+** if performance monitoring shows slow instruction queries
- **If caching later:** Use `unstable_cache()` with `revalidate: 60` and `cacheTag: ['instructions']`

## Sources

### Primary (HIGH confidence)

- **/llmstxt/nextjs_llms-full_txt** - Next.js App Router API routes, caching strategies, query parameters
- **/n8n-io/n8n-docs** - HTTP Request node configuration, Bearer authentication, error handling
- **Existing codebase** - Phase 17 deliverables, Phase 4 calendar utilities, Console routes
- [Prisma Documentation](https://www.prisma.io/docs) - Query patterns, pagination, filtering

### Secondary (MEDIUM confidence)

- [GitHub - nextjs-service-layer-pattern](https://github.com/ugurkellecioglu/nextjs-service-layer-pattern) - Service layer organization
- [Clean Architecture with Next.js - DEV Community](https://dev.to/dan1618/clean-architecture-with-nextjs-43cg) - Architecture patterns
- [10 RESTful API Pagination Best Practices - Nordic APIs](https://nordicapis.com/restful-api-pagination-best-practices/) - Pagination strategies
- [API Pagination: Offset vs. Cursor-Based - Embedded Blog](https://embedded.gusto.com/blog/api-pagination/) - Pagination comparison

### Tertiary (LOW confidence)

- [Demystifying Refactoring: Martin Fowler's Best Practices in Next.js - Medium](https://medium.com/@alvinxrw/demystifying-refactoring-implementing-martin-fowlers-best-practices-in-next-js-and-nest-js-8d456d7d5c25) - Enterprise patterns (may be overkill)
- [Repository vs Service Pattern - Startup House](https://startup-house.com/glossary/repository-vs-service-pattern) - Pattern comparison

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and tested in Phase 17
- Architecture: HIGH - Patterns verified in existing Console routes and Phase 17 implementation
- Service layer: MEDIUM - Simple functions recommended over complex repository pattern
- Pagination: HIGH - Page-based pagination is standard REST practice for small datasets
- Caching: HIGH - NO caching for dynamic appointment data (verified best practice)
- N8N integration: HIGH - HTTP Request node patterns from official docs

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, unlikely to change)

## Key Takeaways for Planning

1. **Reuse existing logic:** Phase 4 calendar utilities (`availability-calculator.ts`, `conflict-detection.ts`) already solve slot availability
2. **Extract services NOW:** Create `/src/lib/services/` to avoid duplicating logic between Console UI and Agent API
3. **Always paginate:** Every list endpoint must have `page`/`limit` params and return pagination metadata
4. **NO caching (yet):** Dynamic appointment data changes too frequently, cache invalidation adds complexity
5. **Simple service functions:** Export async functions from services, NOT classes with DI containers
6. **Test with N8N early:** Create HTTP Request nodes in Phase 18 to verify response parsing before Phase 21 migration
