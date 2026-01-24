# Stack Research: Agent API + MCP Migration

**Project:** Botfy ClinicOps Console Administrativo
**Milestone:** v1.2 - Agent API + MCP Migration
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

For migrating N8N sub-workflow tools to Next.js APIs + MCP Server, add **minimal** stack components: the MCP TypeScript SDK (`@modelcontextprotocol/sdk` v1.25.3) for the MCP server wrapper, API key-based authentication via Next.js middleware, and structured error handling with Zod validation. **Do not add** additional HTTP frameworks, database changes, or complex API versioning. Use existing Next.js 16 API Routes with stdio transport, leveraging the project's established Zod validation, Supabase client, and RBAC patterns.

## Core Additions

### MCP Server SDK
| Component | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| `@modelcontextprotocol/sdk` | `^1.25.3` | MCP server implementation | Official TypeScript SDK with stdio and HTTP transports. Stable v1.x recommended for production. v2 pre-alpha exists but v1.x will receive support for 6+ months after v2 ships (Q1 2026). |
| `zod` | `^4.3.5` | Schema validation (already installed) | Required peer dependency for MCP SDK. Project already uses Zod v4.3.5 for API validation. |

**Why @modelcontextprotocol/sdk?**
- Official SDK maintained by Model Context Protocol organization
- First-class TypeScript support with type inference from Zod schemas
- Two transport options: stdio (local) and Streamable HTTP (remote)
- Zero additional dependencies beyond Zod
- Well-documented tool registration API: `server.registerTool(name, schema, handler)`

**Transport Strategy:**
- **Stdio transport** for local MCP server (Claude Desktop, local AI agents)
- **HTTP/SSE transport** optional for remote N8N integration if needed
- Start with stdio, add HTTP later only if N8N requires direct MCP protocol

### API Design for AI Agents

**Pattern: Tool-Oriented REST APIs**

Each migrated N8N tool becomes a dedicated Next.js API route following this structure:

```typescript
// src/app/api/tools/buscar-slots-disponiveis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateAgent } from '@/lib/auth/agent'

const RequestSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodo: z.enum(['manha', 'tarde', 'qualquer']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Agent Authentication (API key)
    const agent = await authenticateAgent(req)
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate Input with Zod
    const body = await req.json()
    const validated = RequestSchema.parse(body)

    // 3. Business Logic (same as N8N tool)
    const supabase = await createServerClient()
    const slots = await buscarSlotsDisponiveis(supabase, validated.data, validated.periodo)

    // 4. Structured Response
    return NextResponse.json({
      success: true,
      data: slots,
    })
  } catch (error) {
    // 5. Error Handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Tool error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal error'
    }, { status: 500 })
  }
}
```

**Why this pattern?**
- **Tool-oriented routes** map 1:1 with N8N tools for easy migration
- **Zod-first validation** ensures type safety and automatic error messages
- **Structured responses** (`{success, data}` or `{error, details}`) work well with AI agents
- **Explicit error handling** with appropriate HTTP status codes
- **No versioning initially** - add `/v1/` prefix only when breaking changes needed

### Authentication for Agent-to-API

**Pattern: API Key via Bearer Token**

| Method | Implementation | When to Use |
|--------|---------------|-------------|
| **API Key (Bearer Token)** | `Authorization: Bearer <api_key>` header | **Recommended** - Simple, N8N HTTP Request node compatible |
| Service Account JWT | Custom JWT with agent identity | Future - if need fine-grained permissions per agent |

**Implementation:**

```typescript
// src/lib/auth/agent.ts
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.substring(7)

  // Verify API key against environment variable
  // For multiple agents, store in Supabase table later
  if (apiKey !== process.env.N8N_API_KEY) {
    return null
  }

  return { id: 'n8n-agent', name: 'N8N Agent' }
}
```

**Environment Variable:**
```bash
# .env
N8N_API_KEY=<secure-random-string>  # Generate with: openssl rand -hex 32
```

**Why Bearer Token?**
- N8N HTTP Request node has built-in Bearer Auth support
- Simple to implement and test
- No session management overhead
- Suitable for service-to-service auth

**Future Enhancement:**
Store API keys in Supabase `agent_api_keys` table with metadata:
```sql
CREATE TABLE agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  permissions JSONB DEFAULT '{"tools": "*"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### N8N HTTP Request Integration

**Pattern: Direct HTTP Calls to Next.js APIs**

N8N workflow replaces "Execute Workflow" trigger with "HTTP Request" node:

**Before (Sub-workflow):**
```json
{
  "node": "Execute Workflow",
  "workflowId": "8Bke6sYr7r51aeEq",
  "parameters": {
    "data": "2026-01-25",
    "periodo": "manha"
  }
}
```

**After (HTTP Request):**
```json
{
  "node": "HTTP Request",
  "method": "POST",
  "url": "https://console.botfy.clinic/api/tools/buscar-slots-disponiveis",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "httpHeaderAuth": {
    "name": "Authorization",
    "value": "Bearer {{$credentials.n8n_api_key}}"
  },
  "body": {
    "data": "={{$json.data}}",
    "periodo": "={{$json.periodo}}"
  },
  "options": {
    "timeout": 30000,
    "response": {
      "response": {
        "fullResponse": false,
        "neverError": false
      }
    }
  }
}
```

**N8N Configuration:**
1. Create "HTTP Header Auth" credential named `n8n_api_key`
2. Set header name: `Authorization`
3. Set value: `Bearer <API_KEY>`
4. Use credential in all tool HTTP Request nodes

**Error Handling in N8N:**
- HTTP 200: Success, parse `response.data`
- HTTP 400: Validation error, parse `response.details`
- HTTP 401: Authentication failed, alert admin
- HTTP 500: Internal error, retry with exponential backoff

## MCP Server Wrapper

**Purpose:** Expose Next.js APIs as MCP tools for Claude Desktop and other MCP clients.

**Architecture:**
```
[Claude Desktop] --stdio--> [MCP Server] --HTTP--> [Next.js APIs]
```

**Implementation:**

```typescript
// mcp-server/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3051'
const API_KEY = process.env.N8N_API_KEY!

const server = new McpServer({
  name: 'botfy-clinicops',
  version: '1.0.0',
})

// Register tool: buscar_slots_disponiveis
server.registerTool(
  'buscar_slots_disponiveis',
  {
    description: 'Busca horários disponíveis na agenda da clínica',
    inputSchema: {
      data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Data no formato YYYY-MM-DD'),
      periodo: z.enum(['manha', 'tarde', 'qualquer']).optional().describe('Período do dia'),
    },
  },
  async ({ data, periodo }) => {
    const response = await fetch(`${API_BASE}/api/tools/buscar-slots-disponiveis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, periodo }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    const result = await response.json()
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    }
  }
)

// Repeat for all 11 tools...

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Botfy ClinicOps MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
```

**Directory Structure:**
```
botfy-clinicas-n8n/
├── src/app/api/tools/          # Next.js API routes
│   ├── buscar-slots-disponiveis/
│   ├── criar-agendamento/
│   └── ...
├── mcp-server/                 # MCP server wrapper
│   ├── package.json
│   ├── tsconfig.json
│   └── index.ts
└── package.json                # Root workspace
```

**Why separate MCP server?**
- MCP server runs as standalone process (stdio transport)
- Next.js app runs as web server (HTTP transport)
- Claude Desktop launches MCP server directly via config
- N8N calls Next.js APIs directly via HTTP

**Claude Desktop Configuration:**
```json
{
  "mcpServers": {
    "botfy-clinicops": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/build/index.js"],
      "env": {
        "NEXT_PUBLIC_APP_URL": "http://localhost:3051",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## What NOT to Add

### ❌ Express/Fastify/Koa
**Reason:** Next.js 16 API Routes are sufficient. Adding Express adds complexity and deployment overhead. Next.js serverless functions scale better on Vercel/Docker.

### ❌ Separate API Gateway (Kong, Tyk)
**Reason:** Premature. Next.js middleware handles auth. Add gateway only if multiple services need orchestration.

### ❌ GraphQL Layer
**Reason:** N8N HTTP Request node works with REST. GraphQL adds cognitive overhead for simple CRUD tools. REST + Zod schemas are explicit and debuggable.

### ❌ API Versioning Initially
**Reason:** No breaking changes yet. Add `/v1/` prefix when first breaking change occurs. Over-engineering versioning upfront wastes time.

### ❌ OpenAPI/Swagger Auto-Generation
**Reason:** AI agents consume APIs dynamically. MCP server defines schemas via Zod. OpenAPI docs useful later for human developers, not MVP blocker.

### ❌ Rate Limiting Library (express-rate-limit)
**Reason:** Single trusted agent (N8N). Add rate limiting when exposing to multiple agents or public consumption.

### ❌ Database Schema Changes
**Reason:** Existing Supabase schema supports all tool operations. No new tables needed for API layer.

### ❌ Message Queue (RabbitMQ, Redis Queue)
**Reason:** Synchronous operations (< 5s response time). Add queues only if tools require long-running tasks (file processing, batch operations).

### ❌ Alternative MCP SDKs
**Reason:** Official `@modelcontextprotocol/sdk` is TypeScript-first and actively maintained. Alternatives (Python, Java SDKs) introduce language boundary.

## Integration with Existing Stack

### Reuse Existing Patterns

| Existing Component | How APIs Use It |
|-------------------|----------------|
| **Supabase Client** (`createServerClient()`) | API routes call same Supabase queries as current UI |
| **Zod Schemas** (`src/lib/validations/`) | Extend existing schemas or create new ones for tools |
| **RBAC** (`getCurrentUserWithRole()`) | Not used for agent auth, but audit logs still use user IDs |
| **Audit Logging** (`logAudit()`) | API routes log tool calls with `userId: 'system'` or `agentId` |
| **Timezone Utils** (`createClinicDate()`) | APIs use same TZDate logic for DST-safe dates |
| **Prisma Client** | APIs can use Prisma for complex queries (optional, Supabase client sufficient) |

### New Patterns for APIs

**Request/Response Format:**
```typescript
// Success Response
{
  "success": true,
  "data": { /* tool result */ }
}

// Error Response
{
  "error": "Human-readable message",
  "details": [ /* Zod validation errors or stack trace */ ]
}
```

**Middleware for Agent Auth:**
```typescript
// src/middleware.ts (extend existing)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Existing auth logic for UI routes...

  // Agent auth for /api/tools/* routes
  if (request.nextUrl.pathname.startsWith('/api/tools/')) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)
    if (apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/tools/:path*',
    // ... existing matchers
  ],
}
```

**Error Handling Utility:**
```typescript
// src/lib/api/error-handler.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

export function handleApiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      error: 'Validation failed',
      details: error.errors
    }, { status: 400 })
  }

  if (error instanceof Error) {
    // Log to monitoring (Sentry, etc.)
    console.error('API Error:', error)

    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }

  return NextResponse.json({
    error: 'Unknown error'
  }, { status: 500 })
}
```

### Deployment Considerations

**Environment Variables:**
```bash
# .env
N8N_API_KEY=<secure-random-key>
NEXT_PUBLIC_APP_URL=https://console.botfy.clinic
```

**Docker Compose Update:**
```yaml
# docker-compose.yml
services:
  app:
    environment:
      - N8N_API_KEY=${N8N_API_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
```

**N8N Environment Variables:**
```bash
# N8N instance .env
BOTFY_CONSOLE_URL=https://console.botfy.clinic
BOTFY_API_KEY=<same-as-N8N_API_KEY>
```

## Version Matrix

| Component | Current | New | Source |
|-----------|---------|-----|--------|
| Next.js | `16.1.2` | `16.1.2` | Existing (no change) |
| TypeScript | `^5` | `^5` | Existing (no change) |
| Zod | `^4.3.5` | `^4.3.5` | Existing (no change) |
| **MCP SDK** | - | `^1.25.3` | [npm @modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) |
| **API Key Auth** | - | Custom (env var) | Next.js middleware pattern |

## Installation

**Step 1: Add MCP SDK to Root Project**
```bash
cd /Users/gilberto/projetos/botfy/botfy-clinicas-n8n
npm install @modelcontextprotocol/sdk
```

**Step 2: Create MCP Server Subproject**
```bash
mkdir mcp-server
cd mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript
```

**Step 3: Configure TypeScript for MCP Server**
```json
// mcp-server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Step 4: Update Root Package.json**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mcp": "cd mcp-server && npm run build && node build/index.js",
    "build": "next build",
    "build:mcp": "cd mcp-server && npm run build"
  }
}
```

**Step 5: Generate API Key**
```bash
openssl rand -hex 32
# Add to .env as N8N_API_KEY
```

## Migration Path

**Phase 1: Proof of Concept (1 tool)**
1. Migrate `buscar_slots_disponiveis` to Next.js API route
2. Test with N8N HTTP Request node
3. Create MCP server wrapper for this one tool
4. Test with Claude Desktop

**Phase 2: Core Tools (5 tools)**
5. Migrate remaining scheduling tools: `criar_agendamento`, `reagendar_agendamento`, `cancelar_agendamento`, `buscar_agendamentos`
6. Update N8N workflows to use HTTP Request nodes
7. Add tools to MCP server

**Phase 3: Patient Tools (3 tools)**
8. Migrate patient tools: `buscar_paciente`, `atualizar_dados_paciente`, `confirmar_presenca`
9. Update N8N workflows
10. Add to MCP server

**Phase 4: Remaining Tools (3 tools)**
11. Migrate: `status_pre_checkin`, `buscar_instrucoes`, `processar_documento`
12. Complete N8N migration
13. Deprecate old sub-workflows

**Phase 5: Production Hardening**
14. Add rate limiting if needed
15. Implement API key rotation
16. Add monitoring and alerting
17. Create API documentation (OpenAPI spec)

## Testing Strategy

**Unit Tests (API Routes):**
```typescript
// __tests__/api/tools/buscar-slots-disponiveis.test.ts
import { POST } from '@/app/api/tools/buscar-slots-disponiveis/route'

describe('POST /api/tools/buscar-slots-disponiveis', () => {
  it('requires authentication', async () => {
    const req = new Request('http://localhost/api/tools/buscar-slots-disponiveis', {
      method: 'POST',
      body: JSON.stringify({ data: '2026-01-25' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('validates input schema', async () => {
    const req = new Request('http://localhost/api/tools/buscar-slots-disponiveis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({ data: 'invalid-date' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns slots for valid request', async () => {
    const req = new Request('http://localhost/api/tools/buscar-slots-disponiveis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({
        data: '2026-01-25',
        periodo: 'manha'
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

**Integration Tests (N8N):**
- Manual testing via N8N UI during migration
- Automated N8N workflow tests with test webhooks

**E2E Tests (MCP Server):**
- Test MCP server with `@modelcontextprotocol/inspector` tool
- Verify tool definitions and responses

## Sources

### Official Documentation (HIGH Confidence)
- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — Official TypeScript SDK repository
- [@modelcontextprotocol/sdk npm package](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — npm package documentation
- [Build an MCP Server - Official Guide](https://modelcontextprotocol.io/docs/develop/build-server) — Step-by-step server building guide
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) — API route documentation
- [Next.js Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) — Error handling patterns

### Authentication & Security (HIGH Confidence)
- [N8N HTTP Request Credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest/) — N8N authentication methods
- [Next.js Middleware Authentication Guide 2025](https://www.hashbuilds.com/articles/next-js-middleware-authentication-protecting-routes-in-2025) — Middleware auth patterns
- [Secure API Routes in Next.js with Middleware and JWT](https://www.djamware.com/post/68f99de910360530b36a6596/secure-api-routes-in-nextjs-with-middleware-and-jwt) — JWT and middleware security

### API Design Patterns (MEDIUM-HIGH Confidence)
- [API Versioning Strategies 2026](https://medium.com/@erwindev/api-versioning-strategies-from-url-paths-to-headers-and-why-we-chose-deprecation-384b809fa712) — Versioning best practices
- [Agentic AI Design Patterns 2026](https://research.aimultiple.com/agentic-ai-design-patterns/) — AI agent architectural patterns
- [MCP Gateways: Developer's Guide 2026](https://composio.dev/blog/mcp-gateways-guide) — MCP gateway architecture
- [Standardized Response and Error Handling in Next.js](https://dev.to/tahsin000/standardized-response-and-global-error-handling-in-nextjs-api-routes-with-prisma-and-zod-2762) — Error handling patterns

### MCP + Next.js Integration (MEDIUM Confidence)
- [Vercel MCP Handler](https://github.com/vercel/mcp-handler) — Vercel's MCP integration library
- [MCP for Next.js Template](https://github.com/vercel-labs/mcp-for-next.js/) — Official Next.js template
- [Next.js MCP Server Guide](https://nextjs.org/docs/app/guides/mcp) — Official Next.js MCP documentation
- [MCP Server Transports: STDIO, HTTP & SSE](https://godspeed.systems/docs/saarthi/features/mcp/server-transports) — Transport options explained

### AI Agent Tool Use (MEDIUM Confidence)
- [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents) — Anthropic's agent best practices
- [7 Agentic AI Trends to Watch in 2026](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/) — Current trends
- [5 Patterns for Scalable LLM Service Integration](https://latitude-blog.ghost.io/blog/5-patterns-for-scalable-llm-service-integration/) — LLM integration patterns
