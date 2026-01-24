# Architecture Research: Agent API + MCP Migration

**Project:** Botfy ClinicOps Console Administrativo
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

The migration from N8N sub-workflows to Next.js API routes + MCP Server follows a **dual-track architecture**. Agent tools become standard REST API endpoints at `/api/agent/*` with N8N calling them directly via HTTP Request nodes. MCP Server acts as an optional wrapper that can be added later for Claude Desktop integration, but N8N agents call the HTTP APIs directly. This approach maximizes code reuse, enables testing, and maintains security through existing RBAC middleware while avoiding MCP complexity for the primary N8N use case.

**Key finding:** MCP and REST APIs are complementary, not competitive. Use REST APIs for N8N agent tool calls, optionally add MCP wrapper later for Claude Desktop integration.

## Current Architecture (v1.2)

### Directory Structure
```
src/
├── app/
│   ├── (auth)/                    # Protected route group
│   ├── (dashboard)/               # Dashboard pages
│   └── api/                       # API Routes (35 endpoints)
│       ├── agendamentos/
│       ├── pacientes/
│       ├── pre-checkin/
│       └── [other resources]/
├── components/                    # React components (shadcn/ui)
├── lib/
│   ├── supabase/                  # Client factories
│   │   ├── server.ts              # Server-side client (RLS)
│   │   ├── admin.ts               # Admin client (bypass RLS)
│   │   └── client.ts              # Browser client
│   ├── auth/                      # Authentication & session
│   │   ├── session.ts             # getCurrentUserWithRole()
│   │   └── actions.ts
│   ├── rbac/                      # Role-based access control
│   │   ├── permissions.ts         # Permission definitions
│   │   └── middleware.ts          # Defense-in-depth
│   ├── calendar/                  # Calendar utilities
│   │   ├── availability-calculator.ts
│   │   ├── conflict-detection.ts
│   │   ├── time-zone-utils.ts     # TZDate DST handling
│   │   └── n8n-sync.ts            # N8N webhook triggers
│   ├── analytics/                 # Business logic
│   │   ├── kpi-calculator.ts
│   │   ├── no-show-predictor.ts
│   │   ├── pattern-detector.ts
│   │   └── risk-calculator.ts
│   ├── validations/               # Zod schemas (12 resources)
│   │   ├── appointment.ts
│   │   ├── patient.ts
│   │   └── [others]/
│   └── audit/                     # HIPAA audit logging
│       └── logger.ts
├── hooks/                         # Custom React hooks
└── prisma/                        # Prisma schema
```

### Existing API Route Pattern

All API routes follow this structure:

```typescript
// src/app/api/agendamentos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/appointment'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Authorization (RBAC)
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Validation (Zod)
    const body = await req.json()
    const validatedData = createAppointmentSchema.parse(body)

    // 4. Business Logic
    const supabase = await createServerSupabaseClient()
    // ... conflict detection, data transformation

    // 5. Database Operation
    const { data, error } = await supabase
      .from('agendamentos')
      .insert(validatedData)
      .single()

    if (error) throw error

    // 6. Audit Logging
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_APPOINTMENT,
      resource: 'agendamentos',
      resourceId: data.id,
      details: { ... }
    })

    // 7. N8N Webhook (async, non-blocking)
    notifyN8NAppointmentCreated(data).catch(err =>
      console.error('N8N sync failed:', err)
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

### Supabase Client Strategy

**Three client types for different use cases:**

1. **Server Client (with RLS)**: `createServerSupabaseClient()`
   - Uses cookies for user session
   - Respects Row Level Security policies
   - Default for authenticated user operations

2. **Admin Client (bypass RLS)**: `createAdminSupabaseClient()`
   - Uses service role key
   - Bypasses RLS
   - Used for N8N tables (`n8n_chat_histories`, `lembretes_enviados`)
   - **Important:** Handle authorization in application code

3. **Browser Client**: `createBrowserSupabaseClient()`
   - Singleton pattern (avoids SSR hydration mismatch)
   - Client-side operations only

### N8N Integration Pattern

**Current flow (Console → N8N):**
```
Console → Supabase → N8N Webhook (async)
```

**Example:**
```typescript
// src/lib/calendar/n8n-sync.ts
export async function notifyN8NAppointmentCreated(
  payload: AppointmentWebhookPayload
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_APPOINTMENT_CREATED

  if (!webhookUrl) {
    console.warn('N8N webhook not configured, skipping')
    return
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error('N8N notification failed:', error)
    // Don't throw - webhook failure shouldn't block operation
  }
}
```

---

## Target Architecture: Agent API + MCP

### High-Level Data Flow

**Dual-track approach:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        N8N AI Agent (Marília)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI Agent Node → HTTP Request Tool → Next.js API          │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼ (HTTP POST with API key)
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API Routes (/api/agent/*)              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Auth (API key → userId)                               │   │
│  │ 2. Authorization (RBAC for agents)                       │   │
│  │ 3. Validation (Zod schema)                               │   │
│  │ 4. Business Logic (reuse existing lib/)                  │   │
│  │ 5. Database (Supabase with RLS/admin)                    │   │
│  │ 6. Audit Log (track agent actions)                       │   │
│  │ 7. Response (JSON)                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server (Optional Future)                  │
│  Wraps /api/agent/* endpoints for Claude Desktop integration    │
│  - Tool discovery (list available tools)                         │
│  - Schema introspection (describe inputs/outputs)                │
│  - Standard MCP protocol compliance                              │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** N8N agents call REST APIs directly, not MCP. MCP is a future enhancement for Claude Desktop integration.

---

## Directory Structure (New)

```
src/
├── app/
│   └── api/
│       ├── agent/                      # NEW: Agent tool endpoints
│       │   ├── auth/                   # Agent authentication
│       │   │   └── route.ts            # API key validation
│       │   ├── slots/
│       │   │   └── route.ts            # GET /api/agent/slots
│       │   ├── appointments/
│       │   │   ├── route.ts            # POST /api/agent/appointments
│       │   │   └── [id]/
│       │   │       └── route.ts        # PUT/DELETE /api/agent/appointments/:id
│       │   ├── patients/
│       │   │   ├── route.ts            # GET/POST /api/agent/patients
│       │   │   └── [id]/
│       │   │       └── route.ts        # GET/PUT /api/agent/patients/:id
│       │   ├── pre-checkin/
│       │   │   └── status/
│       │   │       └── route.ts        # GET /api/agent/pre-checkin/status
│       │   ├── instructions/
│       │   │   └── search/
│       │   │       └── route.ts        # POST /api/agent/instructions/search
│       │   └── documents/
│       │       └── route.ts            # POST /api/agent/documents
│       ├── agendamentos/               # Existing endpoints
│       ├── pacientes/
│       └── [others]/
│
├── lib/
│   ├── agent/                          # NEW: Agent-specific utilities
│   │   ├── auth.ts                     # API key authentication
│   │   ├── middleware.ts               # Agent auth middleware
│   │   └── audit.ts                    # Agent audit logging wrapper
│   ├── services/                       # NEW: Business logic layer
│   │   ├── appointments.ts             # Extracted from API routes
│   │   ├── patients.ts
│   │   ├── slots.ts
│   │   └── pre-checkin.ts
│   ├── supabase/                       # Existing (no changes)
│   ├── auth/                           # Existing + agent auth
│   ├── rbac/                           # Existing + agent permissions
│   ├── calendar/                       # Existing (reuse)
│   ├── analytics/                      # Existing (reuse)
│   └── validations/                    # Existing + agent schemas
│
└── mcp-server/                         # NEW: Optional MCP wrapper
    ├── index.ts                        # MCP server entry point
    ├── tools.ts                        # Tool definitions
    └── package.json                    # Separate deployment
```

---

## API Routes Structure

### Agent Authentication

**New middleware for API key authentication:**

```typescript
// src/lib/agent/auth.ts
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface AgentAuthResult {
  agentUserId: string
  agentName: string
}

export async function authenticateAgent(
  req: NextRequest
): Promise<AgentAuthResult | null> {
  // Extract API key from Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.substring(7)

  // Validate API key against agents table
  const supabase = await createServerSupabaseClient()
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, user_id, active')
    .eq('api_key_hash', hashApiKey(apiKey))
    .eq('active', true)
    .single()

  if (error || !agent) {
    return null
  }

  return {
    agentUserId: agent.user_id,
    agentName: agent.name
  }
}

function hashApiKey(apiKey: string): string {
  // Use bcrypt or similar for production
  // For now, store hashed keys in database
  return apiKey // PLACEHOLDER - implement hashing
}
```

### Agent Endpoint Pattern

**Example: Buscar Slots Disponíveis**

```typescript
// src/app/api/agent/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import { logAgentAudit } from '@/lib/agent/audit'
import { buscarSlotsDisponiveisSchema } from '@/lib/validations/agent/slots'
import { findAvailableSlots } from '@/lib/services/slots'

async function handler(req: NextRequest, agent: AgentAuthResult) {
  try {
    // 1. Parse query params
    const { searchParams } = new URL(req.url)
    const data = {
      data: searchParams.get('data'),
      periodo: searchParams.get('periodo'),
      servicoId: searchParams.get('servicoId')
    }

    // 2. Validate input
    const validated = buscarSlotsDisponiveisSchema.parse(data)

    // 3. Call service layer
    const slots = await findAvailableSlots(validated)

    // 4. Audit log
    await logAgentAudit({
      agentUserId: agent.agentUserId,
      agentName: agent.agentName,
      action: 'BUSCAR_SLOTS',
      details: { data: validated.data, periodo: validated.periodo }
    })

    // 5. Return response
    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error finding slots:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

export const GET = withAgentAuth(handler)
```

---

## Service Layer Reuse

**Which existing services can be reused:**

| Utility | Current Use | Agent API Reuse |
|---------|-------------|-----------------|
| `lib/calendar/conflict-detection.ts` | Console appointment creation | `POST /api/agent/appointments` |
| `lib/calendar/availability-calculator.ts` | Calendar view | `GET /api/agent/slots` |
| `lib/calendar/time-zone-utils.ts` | All date handling | All agent endpoints |
| `lib/validations/*.ts` | API route validation | Agent endpoint validation |
| `lib/supabase/server.ts` | Console APIs | Agent APIs (with RLS) |
| `lib/supabase/admin.ts` | N8N table access | Agent APIs (for N8N tables) |
| `lib/audit/logger.ts` | Console actions | Agent actions (new action types) |
| `lib/rbac/permissions.ts` | Console RBAC | Agent RBAC (new AGENT role) |
| `lib/analytics/risk-calculator.ts` | Dashboard KPIs | Pre-checkin status API |

**New utilities needed:**

| Utility | Purpose |
|---------|---------|
| `lib/agent/auth.ts` | API key authentication |
| `lib/agent/middleware.ts` | Agent auth wrapper |
| `lib/agent/audit.ts` | Agent-specific audit logging |
| `lib/services/appointments.ts` | Extracted business logic |
| `lib/services/patients.ts` | Extracted business logic |
| `lib/services/slots.ts` | Extracted business logic |
| `lib/validations/agent/*.ts` | Agent-specific schemas (if different) |

---

## MCP Server Integration

### Option 1: Integrated (Next.js Route)

**Use Vercel's `@vercel/mcp-handler` for in-process MCP:**

```typescript
// src/app/api/mcp/route.ts
import { createMcpHandler } from '@vercel/mcp-handler'
import { agentTools } from '@/lib/mcp/tools'

export const { GET, POST } = createMcpHandler({
  name: 'botfy-clinicops',
  version: '1.0.0',
  tools: agentTools
})
```

**Pros:**
- No separate deployment
- Shares Next.js infrastructure
- Easy development workflow

**Cons:**
- Tied to Next.js lifecycle
- Cannot be used independently
- Less flexible for non-Next.js clients

---

### Option 2: Standalone (Separate Process)

**Use `@modelcontextprotocol/sdk` for independent MCP server:**

```typescript
// mcp-server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({
  name: 'botfy-clinicops',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
})

// Register tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'buscar_slots_disponiveis',
      description: 'Busca horários livres para agendamento',
      inputSchema: {
        type: 'object',
        properties: {
          data: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          periodo: { type: 'string', enum: ['manha', 'tarde', 'qualquer'] },
          servicoId: { type: 'string', format: 'uuid' }
        },
        required: ['data', 'periodo']
      }
    }
  ]
}))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'buscar_slots_disponiveis') {
    // Call Next.js API with API key
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/agent/slots?` + new URLSearchParams(args),
      {
        headers: {
          'Authorization': `Bearer ${process.env.AGENT_API_KEY}`
        }
      }
    )
    const data = await response.json()
    return { content: [{ type: 'text', text: JSON.stringify(data) }] }
  }

  throw new Error(`Unknown tool: ${name}`)
})

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)
```

**Pros:**
- Independent lifecycle
- Can be used by any MCP client (Claude Desktop, Cursor, etc.)
- Easier to test in isolation
- Flexible deployment (local, Docker, serverless)

**Cons:**
- Requires separate deployment
- More complex infrastructure
- Needs its own API key management

---

### Recommendation: Start with Option 2 (Standalone)

**Rationale:**
1. **Flexibility**: MCP server can evolve independently of Next.js app
2. **Future-proof**: Easier to add non-N8N clients (Claude Desktop, Cursor)
3. **Testing**: Standalone server is easier to test in isolation
4. **Deployment**: Can deploy to different environments (local for dev, cloud for prod)

**Migration path:**
1. **Phase 1**: Build `/api/agent/*` REST endpoints (N8N calls these)
2. **Phase 2**: Build standalone MCP server (wraps REST endpoints)
3. **Phase 3**: Integrate with Claude Desktop (optional)

---

## Authentication Flow

### Agent Authentication

**Two authentication paths:**

1. **Console Users** (existing): Supabase Auth + cookies
2. **N8N Agents** (new): API key in Authorization header

```typescript
// New table: agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Marília', 'AgendamentoBot', etc.
  api_key_hash TEXT NOT NULL UNIQUE,     -- bcrypt hash of API key
  user_id UUID NOT NULL,                 -- Links to users table for audit
  role TEXT NOT NULL DEFAULT 'AGENT',    -- 'AGENT' role for RBAC
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- RLS policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage agents"
  ON agents FOR ALL
  USING (auth.jwt() ->> 'role' = 'ADMIN');
```

**N8N configuration:**

```
N8N Credential: "Botfy API Key"
Type: Header Auth
Header Name: Authorization
Header Value: Bearer botfy_abc123...
```

---

## Data Flow Diagrams

### Before (Current N8N Sub-workflows)

```
┌─────────────────────────────────────────────────────────────────┐
│                        N8N AI Agent Workflow                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI Agent Node                                            │   │
│  │   ↓ (toolWorkflow: Execute Workflow)                     │   │
│  │ Tool: Buscar Slots (9 nodes)                             │   │
│  │   - Parse input                                          │   │
│  │   - Supabase query (slots, agendamentos)                 │   │
│  │   - Business logic (conflict detection, filtering)       │   │
│  │   - Format response                                      │   │
│  │   - Return string to AI Agent                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                            Supabase
                         (direct queries)
```

**Problems:**
- No code review (visual nodes)
- No type safety (JSON everywhere)
- Hard to test (manual N8N execution)
- No reuse (Console has separate logic)
- No versioning (workflows overwrite)
- Debugging via N8N UI only

---

### After (Agent APIs + MCP)

```
┌─────────────────────────────────────────────────────────────────┐
│                        N8N AI Agent Workflow                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AI Agent Node                                            │   │
│  │   ↓ (HTTP Request Tool)                                  │   │
│  │ POST /api/agent/slots?data=2026-01-20&periodo=manha      │   │
│  │   Headers: { Authorization: Bearer botfy_abc123... }     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼ (HTTP POST)
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API Route                              │
│  src/app/api/agent/slots/route.ts                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Agent Auth (API key validation)                       │   │
│  │ 2. Validation (Zod schema)                               │   │
│  │ 3. Service Call (findAvailableSlots)                     │   │
│  │ 4. Audit Log                                             │   │
│  │ 5. JSON Response                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  src/lib/services/slots.ts                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ - Reused by Console APIs (/api/agendamentos)            │   │
│  │ - Reused by Agent APIs (/api/agent/slots)               │   │
│  │ - Business logic (conflict detection, availability)      │   │
│  │ - Supabase queries (RLS-aware)                           │   │
│  │ - Type-safe (TypeScript + Zod)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                            Supabase
                        (via server client)
```

**Benefits:**
- ✅ Code review (Git/PR workflow)
- ✅ Type safety (TypeScript + Zod)
- ✅ Testable (Jest/Vitest)
- ✅ DRY (services reused by Console + Agents)
- ✅ Versioned (Git history)
- ✅ Debuggable (VS Code breakpoints, logs)
- ✅ Auditable (HIPAA compliance)

---

## Build Order

**Suggested phase sequence (dependencies considered):**

### Phase 1: Foundation (No blocking dependencies)
1. **Agent Authentication Infrastructure**
   - Create `agents` table (Prisma migration)
   - Implement API key generation endpoint (`/api/admin/agents`)
   - Build `lib/agent/auth.ts` and `lib/agent/middleware.ts`
   - Test API key validation

2. **Service Layer Extraction**
   - Extract `lib/services/slots.ts` from `/api/agendamentos`
   - Extract `lib/services/appointments.ts`
   - Extract `lib/services/patients.ts`
   - Add unit tests for services

### Phase 2: Simple Tools (Low complexity)
3. **Buscar Slots Disponíveis** (`GET /api/agent/slots`)
   - Reuses `calculateAvailableSlots` from `lib/calendar/availability-calculator.ts`
   - No write operations (safest to start)
   - Test with N8N HTTP Request node

4. **Buscar Paciente** (`GET /api/agent/patients/:id`)
   - Simple read operation
   - Reuses patient queries

5. **Buscar Agendamentos** (`GET /api/agent/appointments`)
   - Read-only endpoint
   - Query parameter filtering

### Phase 3: Write Operations (Higher complexity)
6. **Criar Agendamento** (`POST /api/agent/appointments`)
   - Reuses `createAppointment` service
   - Conflict detection
   - N8N webhook trigger

7. **Reagendar Agendamento** (`PUT /api/agent/appointments/:id`)
   - Update operation
   - Conflict detection
   - Audit logging

8. **Cancelar Agendamento** (`DELETE /api/agent/appointments/:id`)
   - Soft delete (status update)
   - Waitlist notification

9. **Atualizar Dados Paciente** (`PUT /api/agent/patients/:id`)
   - Partial updates
   - CPF uniqueness validation

10. **Confirmar Presença** (`POST /api/agent/appointments/:id/confirm`)
    - Status update to 'confirmado'
    - Updates `lembretes_enviados` table

### Phase 4: Complex Tools (Embeddings, file handling)
11. **Buscar Instruções** (`POST /api/agent/instructions/search`)
    - Vector similarity search (pgvector)
    - Embedding generation (OpenAI)

12. **Processar Documento** (`POST /api/agent/documents`)
    - File upload (multipart/form-data)
    - Storage (Supabase Storage)
    - Document parsing

13. **Consultar Status Pre Check-In** (`GET /api/agent/pre-checkin/status`)
    - Multi-table join
    - Status aggregation

### Phase 5: N8N Integration
14. **Update N8N AI Agent Workflow**
    - Replace Execute Workflow nodes with HTTP Request nodes
    - Configure API key credential
    - Test each tool endpoint
    - Deploy to production N8N

### Phase 6: MCP Server (Optional future)
15. **Standalone MCP Server**
    - Set up `mcp-server/` directory
    - Implement tool definitions
    - Proxy to `/api/agent/*` endpoints
    - Test with Claude Desktop

**Dependencies:**
- Phase 2 depends on Phase 1 (auth infrastructure)
- Phase 3 depends on Phase 2 (services working)
- Phase 5 depends on Phases 1-4 (all tools ready)
- Phase 6 is independent (optional enhancement)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| API Routes Structure | **HIGH** | Follows existing patterns, well-documented |
| Service Layer Reuse | **HIGH** | Clear extraction points identified |
| Agent Authentication | **MEDIUM** | Standard API key pattern, needs security review |
| MCP Server Integration | **MEDIUM** | MCP is new (2025), but well-documented |
| N8N HTTP Request Tool | **HIGH** | N8N has robust HTTP Request node |
| Performance | **MEDIUM** | Needs load testing to validate targets |

---

## Sources

**MCP Integration:**
- [Next.js MCP Server Guide](https://nextjs.org/docs/app/guides/mcp)
- [Vercel MCP Templates](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)
- [AI SDK MCP Tools Cookbook](https://ai-sdk.dev/cookbook/next/mcp-tools)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Building Remote MCP Server with Next.js](https://medium.com/@kevin.moechel/building-a-remote-mcp-server-with-next-js-and-vercels-mcp-adapter-d078b27a9119)
- [From REST to MCP: Why Developers Should Embrace MCP](https://bytebridge.medium.com/from-rest-to-mcp-why-developers-should-embrace-the-model-context-protocol-003e3806874a)

**N8N Integration:**
- [N8N AI Agents Guide 2026](https://strapi.io/blog/build-ai-agents-n8n)
- [N8N HTTP Request Tool Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolhttprequest/)
- [N8N Agent Tools Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/tools-agent/)
- [N8N API Workflow Tool Examples](https://docs.n8n.io/advanced-ai/examples/api-workflow-tool/)

**Authentication:**
- [Azure AI Agent Bearer Token Authentication](https://learn.microsoft.com/en-us/answers/questions/2283465/azure-ai-foundry-ai-agents-api-tool-use-authentica)
- [Agent-to-Agent OAuth Guide](https://stytch.com/blog/agent-to-agent-oauth-guide/)
- [Secure AI Agent Infrastructure 2026](https://dev.to/composiodev/from-auth-to-action-the-complete-guide-to-secure-scalable-ai-agent-infrastructure-2026-2ieb)

**Official Documentation:**
- Next.js 16 App Router
- Supabase SSR
- Prisma ORM
- Zod Validation

---

**Research completed:** 2026-01-24
**Confidence:** HIGH (backed by existing codebase analysis and current 2026 best practices)
