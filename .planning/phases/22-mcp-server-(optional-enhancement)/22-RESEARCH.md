# Phase 22: MCP Server (Optional Enhancement) - Research

**Researched:** 2026-01-24
**Domain:** Model Context Protocol (MCP) server implementation
**Confidence:** HIGH

## Summary

MCP Server is a **wrapper layer** that exposes existing Next.js API routes (already complete in Phases 17-21) as tools for Claude Desktop integration via stdio transport. The implementation does NOT duplicate business logic—it calls the existing HTTP APIs using `fetch()`, translating between MCP's tool protocol and HTTP REST endpoints.

The Model Context Protocol TypeScript SDK (`@modelcontextprotocol/sdk`) is the official and only production-ready library for building MCP servers. The project already has all 11 agent tools as authenticated API routes at `/api/agent/*`, so the MCP server becomes a thin translation layer between Claude Desktop's stdio transport and HTTP requests to localhost.

**Primary recommendation:** Build a standalone Node.js script using `@modelcontextprotocol/sdk/server` with `StdioServerTransport`, where each of the 11 tools makes authenticated HTTP calls to `http://localhost:3051/api/agent/*` with Bearer token.

## Standard Stack

The established libraries/tools for MCP server implementation in TypeScript:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/sdk` | ^1.10.0+ | Official MCP SDK (Server + Stdio) | Only production-ready TypeScript implementation, maintained by Anthropic |
| `zod` | ^4.3.5 | Input/output schema validation | Already in project, MCP SDK uses Zod for tool schema definition |
| `node-fetch` or native `fetch` | Built-in Node 18+ | HTTP client for calling APIs | Wraps existing Next.js API routes via HTTP |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` | ^4.21.0 | TypeScript execution | Already in project (dev dep), used for running MCP server in development |
| `dotenv` | Built-in | Environment variables | Load API key and base URL from `.env.local` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTTP wrapper pattern | Duplicate business logic in MCP server | Would require maintaining two implementations; HTTP wrapper is cleaner |
| HTTP + SSE transport | Stdio transport | Claude Desktop ONLY supports stdio (subprocess spawn), SSE is for web clients |
| Python SDK | TypeScript SDK | Team already uses TypeScript; avoids language/toolchain switching |

**Installation:**
```bash
npm install @modelcontextprotocol/sdk
# OR for global/standalone
npm install -g @modelcontextprotocol/sdk
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── mcp/
│   ├── server.ts              # Main MCP server (stdio transport)
│   ├── tools/
│   │   ├── buscar-slots.ts    # Tool: buscar_slots_disponiveis
│   │   ├── criar-agendamento.ts
│   │   ├── reagendar.ts
│   │   ├── cancelar.ts
│   │   ├── buscar-agendamentos.ts
│   │   ├── buscar-paciente.ts
│   │   ├── atualizar-paciente.ts
│   │   ├── confirmar-presenca.ts
│   │   ├── status-precheckin.ts
│   │   ├── buscar-instrucoes.ts
│   │   └── processar-documento.ts
│   ├── http-client.ts         # Shared HTTP client (fetch wrapper)
│   └── config.ts              # MCP server config (API key, base URL)
└── app/api/agent/*            # Existing Next.js API routes (Phases 17-21)
```

### Pattern 1: HTTP Wrapper Pattern (Recommended)
**What:** MCP server acts as a thin wrapper that translates tool calls to HTTP requests to existing Next.js APIs.

**When to use:** When you already have complete REST APIs and want to expose them via MCP without code duplication.

**Example:**
```typescript
// src/mcp/tools/buscar-slots.ts
import { z } from 'zod'
import { callAgentApi } from '../http-client'

export const buscarSlotsDisponiveisTool = {
  name: 'buscar_slots_disponiveis',
  description: 'Busca horários disponíveis para agendamento em uma data específica',
  inputSchema: {
    data: z.string().describe('Data no formato YYYY-MM-DD'),
    profissional: z.string().optional().describe('Nome do profissional'),
    servicoId: z.number().optional().describe('ID do serviço'),
    duracaoMinutos: z.number().optional().describe('Duração em minutos'),
  },
  outputSchema: {
    date: z.string(),
    slots: z.array(z.string()),
    totalAvailable: z.number(),
    period: z.object({
      morning: z.array(z.string()),
      afternoon: z.array(z.string()),
    }).optional(),
  },
  handler: async (input: {
    data: string
    profissional?: string
    servicoId?: number
    duracaoMinutos?: number
  }) => {
    // Call existing Next.js API via HTTP
    const result = await callAgentApi('GET', '/slots', {
      params: {
        data: input.data,
        profissional: input.profissional,
        servicoId: input.servicoId?.toString(),
        duracaoMinutos: input.duracaoMinutos?.toString(),
      },
    })

    return {
      content: [{ type: 'text', text: JSON.stringify(result.data) }],
      structuredContent: result.data,
    }
  },
}
```

**Source:** [Stainless MCP Portal - From REST API to MCP Server](https://www.stainless.com/mcp/from-rest-api-to-mcp-server)

### Pattern 2: Shared HTTP Client with Authentication
**What:** Centralized HTTP client that attaches Bearer token to all requests.

**When to use:** When all tools need authenticated API calls with consistent error handling.

**Example:**
```typescript
// src/mcp/http-client.ts
import { config } from './config'

export async function callAgentApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options?: {
    params?: Record<string, string | undefined>
    body?: unknown
  }
) {
  const url = new URL(`${config.baseUrl}/api/agent${path}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  const json = await response.json()

  if (!response.ok || !json.success) {
    throw new Error(json.error || `HTTP ${response.status}`)
  }

  return json
}
```

**Source:** [Context7 MCP SDK Documentation](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)

### Pattern 3: Stdio Transport with McpServer
**What:** Main server setup using `McpServer` and `StdioServerTransport` for Claude Desktop integration.

**When to use:** Always—this is the only transport Claude Desktop supports.

**Example:**
```typescript
// src/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { buscarSlotsDisponiveisTool } from './tools/buscar-slots'
import { criarAgendamentoTool } from './tools/criar-agendamento'
// ... import all 11 tools

const server = new McpServer({
  name: 'botfy-clinicops',
  version: '2.0.0',
})

// Register all 11 tools
server.registerTool(
  buscarSlotsDisponiveisTool.name,
  {
    title: 'Buscar Slots Disponíveis',
    description: buscarSlotsDisponiveisTool.description,
    inputSchema: buscarSlotsDisponiveisTool.inputSchema,
    outputSchema: buscarSlotsDisponiveisTool.outputSchema,
  },
  buscarSlotsDisponiveisTool.handler
)

// ... register remaining 10 tools

// Connect via stdio (spawned by Claude Desktop)
const transport = new StdioServerTransport()
await server.connect(transport)

console.error('[MCP] Botfy ClinicOps server started') // stderr for logs
```

**Source:** [Context7 MCP SDK - Create MCP Server with Stdio Transport](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)

### Anti-Patterns to Avoid
- **Duplicating business logic:** MCP server should call HTTP APIs, not reimplement database queries or validation logic
- **Using HTTP/SSE transport:** Claude Desktop only supports stdio; HTTP is for web clients
- **Logging to stdout:** MCP protocol uses stdout for JSON-RPC messages; all logs must go to stderr
- **Hardcoding API key:** Use environment variables (`.env.local`) to configure API key

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP protocol implementation | Custom JSON-RPC over stdio | `@modelcontextprotocol/sdk` | Handles protocol negotiation, version compatibility, session management |
| Tool schema validation | Manual parameter checking | Zod schemas in `inputSchema`/`outputSchema` | MCP SDK auto-validates with Zod; consistent with existing codebase |
| Error handling in tools | Custom error format | Return `{ content: [{ type: 'text', text: error.message }] }` | MCP clients expect this format; SDK handles serialization |
| HTTP to stdio proxy | Custom proxy server | Direct HTTP calls with `fetch()` | Simpler, fewer moving parts, no additional server process |

**Key insight:** MCP server is a **wrapper**, not a replacement. The heavy lifting (auth, validation, business logic) is already done in Next.js API routes. MCP server just translates protocols.

## Common Pitfalls

### Pitfall 1: Logging to stdout Instead of stderr
**What goes wrong:** MCP protocol uses stdout for JSON-RPC messages. If you log to stdout, Claude Desktop receives malformed protocol messages and fails silently.

**Why it happens:** Developers naturally use `console.log()` for debugging, which writes to stdout.

**How to avoid:**
- Use `console.error()` for all logging (writes to stderr)
- Add a logging utility that enforces stderr:
  ```typescript
  export const mcpLog = {
    info: (msg: string) => console.error(`[MCP INFO] ${msg}`),
    error: (msg: string) => console.error(`[MCP ERROR] ${msg}`),
    debug: (msg: string) => console.error(`[MCP DEBUG] ${msg}`),
  }
  ```

**Warning signs:**
- Claude Desktop shows "Server connection failed" but no error details
- Tool discovery works but tool calls hang
- Logs appear missing even though code is running

**Source:** [MCP Best Practices - Logging](https://modelcontextprotocol.io/specification/2025-03-26/server/utilities/logging)

### Pitfall 2: Missing Bearer Token in HTTP Calls
**What goes wrong:** HTTP calls to `/api/agent/*` fail with 401 Unauthorized because MCP server forgot to attach Bearer token.

**Why it happens:** Developer copy-pasted HTTP client code without adding authentication headers.

**How to avoid:**
- Centralize HTTP client with authentication in `http-client.ts`
- Add integration test that verifies Bearer token is present
- Log request headers during development (but redact token in production)

**Warning signs:**
- All tool calls return "Invalid API key" errors
- Audit logs show "Missing Authorization header" from unknown source
- Works in N8N but fails in Claude Desktop

### Pitfall 3: Not Handling API Error Responses
**What goes wrong:** When Next.js API returns `{ success: false, error: '...' }`, MCP tool throws unhandled exception and Claude sees generic error.

**Why it happens:** HTTP wrapper doesn't check `success` field before returning data.

**How to avoid:**
```typescript
const json = await response.json()

// Check both HTTP status AND success field
if (!response.ok || !json.success) {
  throw new Error(json.error || `HTTP ${response.status}`)
}

return json.data // Unwrap data field
```

**Warning signs:**
- Tools fail with "undefined" errors
- Claude shows vague "Tool execution failed" without details
- Error details are present in Next.js logs but not visible to Claude

### Pitfall 4: Forgetting to Restart Claude Desktop After Config Changes
**What goes wrong:** You update `claude_desktop_config.json` but Claude Desktop doesn't load the MCP server because it caches config on startup.

**Why it happens:** Claude Desktop only reads config file once at launch.

**How to avoid:**
- **Completely quit** Claude Desktop (not just close window) using Cmd+Q (macOS) or File → Exit
- Restart Claude Desktop
- Verify MCP server appears in Tools menu

**Warning signs:**
- Config changes have no effect
- Old version of tool still runs
- New tools don't appear in Claude

**Source:** [Claude Help Center - Getting Started with Local MCP Servers](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

### Pitfall 5: Base URL Mismatch (localhost vs 127.0.0.1)
**What goes wrong:** MCP server calls `http://127.0.0.1:3051` but Next.js dev server is bound to `localhost:3051`, causing connection refused.

**Why it happens:** Different environments resolve localhost differently (IPv4 vs IPv6).

**How to avoid:**
- Use `http://localhost:3051` consistently (matches `start-dev.sh` PORT=3051)
- Or use environment variable: `AGENT_API_BASE_URL=http://localhost:3051`
- Test with `curl http://localhost:3051/api/health` before running MCP server

**Warning signs:**
- Connection refused errors despite Next.js running
- Works in browser but fails in MCP server
- Intermittent failures based on DNS resolution

## Code Examples

Verified patterns from official sources:

### Complete MCP Server Setup (Stdio Transport)
```typescript
// src/mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { buscarSlotsDisponiveisTool } from './tools/buscar-slots'
import { mcpLog } from './logger'

async function main() {
  try {
    const server = new McpServer({
      name: 'botfy-clinicops',
      version: '2.0.0',
    })

    mcpLog.info('Registering tools...')

    // Register tool 1: buscar_slots_disponiveis
    server.registerTool(
      buscarSlotsDisponiveisTool.name,
      {
        title: buscarSlotsDisponiveisTool.title,
        description: buscarSlotsDisponiveisTool.description,
        inputSchema: buscarSlotsDisponiveisTool.inputSchema,
        outputSchema: buscarSlotsDisponiveisTool.outputSchema,
      },
      buscarSlotsDisponiveisTool.handler
    )

    // ... register 10 more tools

    mcpLog.info('Connecting to stdio transport...')
    const transport = new StdioServerTransport()
    await server.connect(transport)

    mcpLog.info('Server ready and listening on stdio')
  } catch (error) {
    mcpLog.error(`Fatal error: ${error}`)
    process.exit(1)
  }
}

main()
```

**Source:** [Context7 MCP SDK - Stdio Server Example](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)

### Tool Handler with Error Handling
```typescript
// src/mcp/tools/criar-agendamento.ts
import { z } from 'zod'
import { callAgentApi } from '../http-client'

export const criarAgendamentoTool = {
  name: 'criar_agendamento',
  title: 'Criar Agendamento',
  description: 'Cria um novo agendamento para o paciente',
  inputSchema: {
    pacienteId: z.number().describe('ID do paciente'),
    dataHora: z.string().describe('Data e hora no formato ISO 8601'),
    tipoConsulta: z.string().optional().describe('Tipo de consulta'),
    servicoId: z.number().optional().describe('ID do serviço'),
    profissional: z.string().optional().describe('Nome do profissional'),
    observacoes: z.string().optional().describe('Observações adicionais'),
    idempotencyKey: z.string().optional().describe('Chave de idempotência (UUID)'),
  },
  outputSchema: {
    id: z.number(),
    dataHora: z.string(),
    tipoConsulta: z.string(),
    profissional: z.string().nullable(),
    status: z.string(),
    paciente: z.object({
      id: z.number(),
      nome: z.string(),
      telefone: z.string(),
    }),
  },
  handler: async (input: {
    pacienteId: number
    dataHora: string
    tipoConsulta?: string
    servicoId?: number
    profissional?: string
    observacoes?: string
    idempotencyKey?: string
  }) => {
    try {
      const result = await callAgentApi('POST', '/agendamentos', {
        body: input,
      })

      return {
        content: [{
          type: 'text',
          text: `Agendamento criado com sucesso. ID: ${result.data.id}`,
        }],
        structuredContent: result.data,
      }
    } catch (error) {
      // Return error as content (MCP pattern)
      return {
        content: [{
          type: 'text',
          text: `Erro ao criar agendamento: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      }
    }
  },
}
```

**Source:** [Context7 MCP SDK - Tool Error Handling](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)

### Claude Desktop Configuration File
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
{
  "mcpServers": {
    "botfy-clinicops": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/dist/mcp/server.js"
      ],
      "env": {
        "AGENT_API_BASE_URL": "http://localhost:3051",
        "AGENT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Alternative (using tsx for development):**
```json
{
  "mcpServers": {
    "botfy-clinicops-dev": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "tsx",
        "/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/src/mcp/server.ts"
      ],
      "env": {
        "AGENT_API_BASE_URL": "http://localhost:3051",
        "AGENT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Source:** [Claude Help Center - Getting Started with Local MCP Servers](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

### Heartbeat Logging for Monitoring
```typescript
// src/mcp/heartbeat.ts
import { mcpLog } from './logger'

let requestCount = 0
let errorCount = 0
let lastHeartbeat = Date.now()

export function recordRequest(success: boolean) {
  requestCount++
  if (!success) errorCount++
}

export function startHeartbeat(intervalMs = 60000) {
  setInterval(() => {
    const uptime = Math.floor((Date.now() - lastHeartbeat) / 1000)
    const errorRate = requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) : '0.00'

    mcpLog.info(JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      requests: requestCount,
      errors: errorCount,
      errorRate: `${errorRate}%`,
    }))

    lastHeartbeat = Date.now()
  }, intervalMs)
}
```

**Usage in server:**
```typescript
import { startHeartbeat, recordRequest } from './heartbeat'

// In main()
startHeartbeat(60000) // Log every 60 seconds

// In tool handlers
try {
  const result = await callAgentApi(...)
  recordRequest(true)
  return result
} catch (error) {
  recordRequest(false)
  throw error
}
```

**Source:** [MCP Best Practices - Monitoring](https://www.cdata.com/blog/mcp-server-best-practices-2026)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP + SSE transport | Streamable HTTP or stdio | 2025 Q4 | SSE deprecated; stdio is now standard for local clients |
| Manual JSON-RPC handling | `McpServer` high-level API | SDK v1.0 (2025 Q2) | Simpler tool registration with Zod integration |
| Python-first examples | TypeScript SDK as primary | 2025 Q3 | Official TypeScript SDK now recommended for production |
| Single-purpose servers | Multi-tool servers | Ongoing | Claude Desktop supports multiple tools per server (more efficient than N servers) |

**Deprecated/outdated:**
- **HTTP + SSE transport for local clients**: Claude Desktop only supports stdio; SSE is backward compatibility only
- **Low-level `Server` class**: Use `McpServer` wrapper which provides tool registration helpers
- **Separate process per tool**: Register all tools in one MCP server for efficiency

## Open Questions

Things that couldn't be fully resolved:

1. **Should MCP server run in same process as Next.js or separate?**
   - What we know: Claude Desktop spawns MCP server as subprocess; Next.js runs independently
   - What's unclear: Whether to bundle MCP server code with Next.js app or keep separate
   - Recommendation: Keep separate (`src/mcp/` standalone) for cleaner separation and easier debugging

2. **How to handle Next.js dev server restarts?**
   - What we know: MCP server makes HTTP calls to localhost:3051; if Next.js restarts, calls fail
   - What's unclear: Best retry strategy for temporary Next.js unavailability
   - Recommendation: Add retry logic with exponential backoff (3 retries, 1s/2s/4s delays) in `http-client.ts`

3. **Should API key be shared between N8N and Claude Desktop?**
   - What we know: Both need authentication to agent APIs; agents table supports multiple keys
   - What's unclear: Security implications of sharing vs separate keys
   - Recommendation: Create separate agent record for Claude Desktop with distinct API key (audit trail, revocation)

## Sources

### Primary (HIGH confidence)
- [Model Context Protocol TypeScript SDK](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt) - Official SDK documentation with code examples
- [MCP SDK GitHub Repository](https://github.com/modelcontextprotocol/typescript-sdk) - Source code and official examples
- [Claude Help Center - Getting Started with Local MCP Servers](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop) - Official Claude Desktop configuration guide
- [Model Context Protocol Documentation - Connect Local Servers](https://modelcontextprotocol.io/docs/develop/connect-local-servers) - Official stdio transport setup
- [MCP Specification - Logging](https://modelcontextprotocol.io/specification/2025-03-26/server/utilities/logging) - stdout/stderr requirements

### Secondary (MEDIUM confidence)
- [Stainless MCP Portal - From REST API to MCP Server](https://www.stainless.com/mcp/from-rest-api-to-mcp-server) - HTTP wrapper pattern verified with official examples
- [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/) - Community-verified production patterns
- [MCP Server Best Practices for 2026](https://www.cdata.com/blog/mcp-server-best-practices-2026) - Current industry standards
- [MCPcat Error Handling Guide](https://mcpcat.io/guides/error-handling-custom-mcp-servers/) - Verified error patterns
- [Stainless - Error Handling and Debugging MCP Servers](https://www.stainless.com/mcp/error-handling-and-debugging-mcp-servers) - Production debugging strategies

### Tertiary (LOW confidence)
- [DEV Community - Turn Any REST API into MCP Server](https://dev.to/dbatson/turn-any-rest-api-into-an-mcp-server-in-25-minutes-4e47) - Tutorial format, unverified but aligns with official patterns
- [mcp-proxy GitHub](https://github.com/punkpeye/mcp-proxy) - Community tool for stdio-to-HTTP proxying (not needed for this project but confirms pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK is only production-ready option
- Architecture: HIGH - Verified with Context7 docs and official examples
- Pitfalls: HIGH - Based on official logging spec and Claude Desktop requirements

**Research date:** 2026-01-24
**Valid until:** 2026-02-28 (30 days for stable ecosystem; MCP SDK is in v1.x with mature API)
