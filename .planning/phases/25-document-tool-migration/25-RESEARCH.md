# Phase 25: Document Tool Migration - Research

**Researched:** 2026-01-25
**Domain:** N8N AI Agent Tool Migration - Document Processing with File/URL Handling
**Confidence:** MEDIUM
**Based on:** Phase 23/24 research + N8N community discussions + API design research

## Summary

This phase migrates the `processar_documento` tool from N8N `toolWorkflow` to `toolHttpRequest`. Unlike previous migrations (Phases 23-24), this tool presents a unique challenge: the current toolWorkflow receives an `arquivo_url` (URL to an image), but the existing Next.js API (`POST /api/agent/documentos/processar`) expects multipart/form-data with an actual file.

Research reveals that N8N's `toolHttpRequest` node has significant limitations with binary file handling in AI Agent contexts. The community reports that passing binary data through AI Agent tools to HTTP requests is problematic, with multiple workarounds required.

**Two viable solutions exist:**

1. **API Enhancement (Recommended):** Modify the Next.js API to accept URL-based input in addition to multipart uploads. The API fetches the image from the URL and processes it.
2. **N8N Workaround:** Use a Code Tool in N8N to fetch the URL and forward to the API, but this requires significant N8N workflow changes.

**Primary recommendation:** Extend the existing Next.js API to accept `imageUrl` parameter. This aligns with API design best practices for image processing and keeps the N8N migration simple.

## Standard Stack

### Core
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `@n8n/n8n-nodes-langchain.toolHttpRequest` | 1.1+ | HTTP tool for AI Agent | Official n8n node for HTTP-based tools |
| Next.js API Route | v15 | Backend endpoint | Already implemented, extensible |
| GPT-4o Vision | Latest | Document field extraction | Already used in document-service |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `file-type` | 19.x | Magic byte validation | Validate fetched images |
| `node-fetch` (native) | Node 18+ | Fetch remote images | Server-side URL fetching |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL-based API | N8N Code Tool workaround | Adds N8N complexity, harder to maintain |
| Single endpoint | Separate URL endpoint | API fragmentation, duplicate logic |
| Pre-signed URL upload | Direct file submission | Adds S3 dependency, overkill for this use case |

## Architecture Patterns

### Current Architecture (Before Migration)

```
AI Agent (bPJamJhBcrVCKgBg)
    |
    +-- toolWorkflow: processar_documento
            |
            +-- Sub-workflow Pc0PyATrZaGefiSJ (13 nodes)
                    |
                    +-- (Fetches image from URL)
                    +-- (Processes with internal logic)
                    +-- (Returns extracted data)
```

**Current tool parameters:**
- `pre_checkin_id` (optional)
- `paciente_id` (required)
- `tipo` (rg/cnh/carteirinha_convenio/guia_autorizacao/outros)
- `arquivo_url` (URL to the image)

### Target Architecture (After Migration)

```
AI Agent (bPJamJhBcrVCKgBg)
    |
    +-- toolHttpRequest: processar_documento
            |
            +-- POST /api/agent/documentos/processar
                    |
                    +-- Accepts: imageUrl OR file (multipart)
                    +-- Fetches image if URL provided
                    +-- Validates with magic bytes
                    +-- Extracts fields via GPT-4o Vision
                    +-- Stores in Supabase Storage
                    +-- Returns extracted data
```

### Pattern 1: URL-Based Document Processing

**What:** API accepts an image URL and fetches it server-side
**When to use:** When the calling system (N8N AI Agent) has a URL but cannot easily send binary data
**Why:** Simplifies client-side logic, centralizes validation

**API Request:**
```json
{
  "patientId": "123",
  "imageUrl": "https://example.com/documents/image.jpg",
  "documentType": "rg"
}
```

**Server-side flow:**
1. Receive URL
2. Validate URL (allowed hosts, format)
3. Fetch image with timeout
4. Validate magic bytes (same as file upload)
5. Process with Vision API
6. Store and return result

### Pattern 2: toolHttpRequest with JSON Body (Recommended)

**What:** Configure toolHttpRequest to send JSON body with URL parameter
**When to use:** Migrating from toolWorkflow to toolHttpRequest

**JSON Structure:**
```json
{
  "parameters": {
    "name": "processar_documento",
    "toolDescription": "Processa documento enviado pelo paciente...",
    "method": "POST",
    "url": "={{ $env.AGENT_API_URL }}/api/agent/documentos/processar",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendBody": "json",
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ patientId: \"{patientId}\", imageUrl: \"{imageUrl}\", documentType: \"{documentType}\" }) }}",
    "placeholderDefinitions": {
      "values": [
        { "name": "patientId", "description": "ID do paciente" },
        { "name": "imageUrl", "description": "URL da imagem do documento" },
        { "name": "documentType", "description": "Tipo: rg, cnh, carteirinha_convenio, guia_autorizacao, outros" }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 1.1,
  "credentials": {
    "httpHeaderAuth": {
      "id": "5TaXKqsLaosPr7U9",
      "name": "Botfy Agent API"
    }
  }
}
```

### Anti-Patterns to Avoid

- **Binary data through toolHttpRequest:** N8N's HTTP Request Tool has known limitations with binary files in AI Agent contexts. Avoid trying to pass binary data through placeholders.
- **Fetching URLs client-side then sending as multipart:** Complex, error-prone, requires N8N Code Tool.
- **Hardcoding allowed URL domains too strictly:** WhatsApp/Evolution API media URLs may vary.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL validation | Regex-only validation | `new URL()` + allowed protocols | Handles edge cases |
| Image fetching | Basic fetch | fetch with timeout + abort controller | Prevents hanging on slow servers |
| File type detection | Extension checking | `file-type` library | Magic byte security |
| MIME type trust | Trust Content-Type header | Validate actual bytes | Headers can lie |

**Key insight:** The document validation logic already exists in `document-validator.ts`. Reuse it for URL-fetched images.

## Common Pitfalls

### Pitfall 1: SSRF (Server-Side Request Forgery) Vulnerability
**What goes wrong:** API fetches URLs from internal/private networks
**Why it happens:** No URL validation before fetching
**How to avoid:**
- Validate URL protocol (only https)
- Block private IP ranges (127.x, 10.x, 192.168.x, 172.16-31.x)
- Limit allowed domains if possible (or at minimum block localhost)
**Warning signs:** API fetching from 127.0.0.1, 192.168.x.x, or file:// URLs

### Pitfall 2: Timeout/Resource Exhaustion
**What goes wrong:** Slow external URLs cause API timeouts or memory issues
**Why it happens:** No timeout on fetch, large files not rejected early
**How to avoid:**
- Set reasonable timeout (10s max)
- Check Content-Length header before full download
- Abort if Content-Length > MAX_FILE_SIZE
**Warning signs:** API hanging, memory spikes

### Pitfall 3: N8N Placeholder Type Issues
**What goes wrong:** Placeholders interpolated as wrong type
**Why it happens:** JSON.stringify with placeholders can create malformed JSON
**How to avoid:**
- Test thoroughly with AI Agent
- Use string placeholders, not numeric for IDs (API should handle both)
**Warning signs:** JSON parse errors in API

### Pitfall 4: WhatsApp Media URL Expiration
**What goes wrong:** WhatsApp/Evolution API media URLs expire quickly
**Why it happens:** WhatsApp media URLs have short TTL (typically minutes)
**How to avoid:**
- Process documents immediately when received
- If storing URL for later, fetch and store content instead
**Warning signs:** 403/404 errors when fetching "valid" URLs

### Pitfall 5: Content-Type Mismatch
**What goes wrong:** Server returns non-image with image Content-Type
**Why it happens:** Trusting headers instead of content
**How to avoid:**
- Use magic byte validation (file-type library)
- Already implemented in document-validator.ts
**Warning signs:** "Unable to determine file type" errors on valid URLs

## Code Examples

### Example 1: API Enhancement - URL Fetching (New Endpoint Logic)

```typescript
// Source: Best practice from research + existing validator
// In: /api/agent/documentos/processar/route.ts

import { validateDocumentUpload, MAX_FILE_SIZE } from '@/lib/document/document-validator'

interface ProcessDocumentBody {
  patientId: string
  imageUrl?: string      // NEW: URL-based input
  documentType?: string  // Optional hint for document type
  idempotencyKey?: string
}

// URL validation helper
function validateImageUrl(url: string): URL {
  const parsed = new URL(url)

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed')
  }

  // Block private IPs (basic SSRF protection)
  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    throw new Error('Private network URLs are not allowed')
  }

  return parsed
}

// Fetch image from URL
async function fetchImageFromUrl(url: string): Promise<File> {
  const validatedUrl = validateImageUrl(url)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(validatedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'image/*,application/pdf',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    // Check Content-Length before downloading
    const contentLength = response.headers.get('Content-Length')
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error('Remote file exceeds 5MB limit')
    }

    const arrayBuffer = await response.arrayBuffer()
    const blob = new Blob([arrayBuffer])
    const filename = validatedUrl.pathname.split('/').pop() || 'document'

    return new File([blob], filename, {
      type: response.headers.get('Content-Type') || 'application/octet-stream',
    })
  } finally {
    clearTimeout(timeout)
  }
}

// In the POST handler:
export const POST = withAgentAuth(async (req: NextRequest, _context, agentContext) => {
  const contentType = req.headers.get('content-type') || ''

  let file: File
  let patientId: string
  let idempotencyKey: string | null = null

  if (contentType.includes('multipart/form-data')) {
    // Existing multipart handling
    const formData = await req.formData()
    file = formData.get('file') as File
    patientId = formData.get('patientId') as string
    idempotencyKey = formData.get('idempotencyKey') as string | null
  } else if (contentType.includes('application/json')) {
    // NEW: JSON body with imageUrl
    const body: ProcessDocumentBody = await req.json()

    if (!body.imageUrl) {
      return errorResponse('imageUrl is required for JSON requests', 400)
    }
    if (!body.patientId) {
      return errorResponse('patientId is required', 400)
    }

    // Fetch the image from URL
    file = await fetchImageFromUrl(body.imageUrl)
    patientId = body.patientId
    idempotencyKey = body.idempotencyKey || null
  } else {
    return errorResponse('Unsupported Content-Type', 415)
  }

  // Rest of processing remains the same...
})
```

### Example 2: toolHttpRequest Configuration

```json
{
  "parameters": {
    "name": "processar_documento",
    "toolDescription": "Processa documento enviado pelo paciente (RG, CNH, carteirinha de convenio, guia de autorizacao). Extrai dados automaticamente via OCR/IA. Parametros: patientId (ID do paciente, obrigatorio), imageUrl (URL da imagem do documento, obrigatorio), documentType (tipo: rg/cnh/carteirinha_convenio/guia_autorizacao/outros, opcional).",
    "method": "POST",
    "url": "={{ $env.AGENT_API_URL }}/api/agent/documentos/processar",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendBody": "json",
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ patientId: \"{patientId}\", imageUrl: \"{imageUrl}\" }) }}",
    "placeholderDefinitions": {
      "values": [
        {
          "name": "patientId",
          "description": "ID do paciente que enviou o documento"
        },
        {
          "name": "imageUrl",
          "description": "URL completa da imagem do documento (deve ser HTTPS)"
        }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
  "typeVersion": 1.1,
  "id": "tool-processar-documento-http",
  "name": "processar_documento",
  "credentials": {
    "httpHeaderAuth": {
      "id": "5TaXKqsLaosPr7U9",
      "name": "Botfy Agent API"
    }
  }
}
```

### Example 3: API Response Format

```json
{
  "success": true,
  "data": {
    "extracted": {
      "documentType": "RG",
      "confidence": "high",
      "fields": {
        "nome": "Maria Silva Santos",
        "rg": "12.345.678-9",
        "cpf": "123.456.789-00",
        "dataNascimento": "1985-03-15",
        "dataEmissao": "2010-06-20",
        "orgaoEmissor": "SSP-SP"
      }
    },
    "storagePath": "123/RG/1706123456789-abc123.jpg",
    "originalFilename": "document.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 245678,
    "processedAt": "2026-01-25T10:30:00.000Z"
  }
}
```

## Tool Migration Reference

### Tool: processar_documento

| Aspect | Current (toolWorkflow) | Target (toolHttpRequest) |
|--------|------------------------|--------------------------|
| **Type** | `@n8n/n8n-nodes-langchain.toolWorkflow` | `@n8n/n8n-nodes-langchain.toolHttpRequest` |
| **Sub-workflow ID** | `Pc0PyATrZaGefiSJ` | N/A (direct HTTP) |
| **Method** | N/A | POST |
| **Endpoint** | N/A | `/api/agent/documentos/processar` |
| **Auth** | Inherited | Bearer token via httpHeaderAuth |
| **Input** | `arquivo_url`, `paciente_id`, `tipo` | `imageUrl`, `patientId`, `documentType` |
| **Output** | Extracted data | Same structure |

### Parameter Mapping

| Old Parameter | New Parameter | Notes |
|---------------|---------------|-------|
| `arquivo_url` | `imageUrl` | Same concept, cleaner name |
| `paciente_id` | `patientId` | Camel case for JSON consistency |
| `tipo` | `documentType` | More descriptive |
| `pre_checkin_id` | (removed) | Not needed for extraction |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multipart-only uploads | URL + Multipart support | 2024-2025 | Better API flexibility for integrations |
| Trust Content-Type | Magic byte validation | Always | Security best practice |
| Unlimited fetch time | Fetch with timeout | Always | Prevents resource exhaustion |

**Deprecated/outdated:**
- Relying solely on file extension for type detection
- Trusting client-provided MIME types
- Processing images without size limits

## Migration Strategy

### Phase 25-01: Enhance API to Accept URL Input

1. Modify `/api/agent/documentos/processar/route.ts`:
   - Add JSON body parsing for `imageUrl` requests
   - Implement `fetchImageFromUrl()` with SSRF protection
   - Reuse existing validation pipeline for fetched images

2. Test API with curl:
   ```bash
   curl -X POST "$API_URL/api/agent/documentos/processar" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"patientId": "123", "imageUrl": "https://example.com/doc.jpg"}'
   ```

### Phase 25-02: Migrate N8N Tool

1. Remove old `processar_documento` toolWorkflow node
2. Add new `processar_documento` toolHttpRequest node
3. Configure JSON body with `patientId` and `imageUrl` placeholders
4. Connect to AI Agent with ai_tool connection
5. Verify end-to-end flow

## Open Questions

1. **WhatsApp Media URL TTL**
   - What we know: WhatsApp media URLs expire, timing varies
   - What's unclear: Exact TTL for Evolution API URLs
   - Recommendation: Process immediately, document URL expiration handling

2. **Allowed URL Domains**
   - What we know: Need to accept Evolution API URLs
   - What's unclear: Full list of domains to whitelist
   - Recommendation: Allow HTTPS, block private IPs, log domain patterns for future refinement

3. **Document Type Parameter**
   - What we know: Current tool has `tipo` parameter
   - What's unclear: Is it used by the extraction service?
   - Recommendation: Make optional, Vision API auto-detects type anyway

## Sources

### Primary (HIGH confidence)
- Phase 23 Research: `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/.planning/phases/23-query-tools-migration/23-RESEARCH.md`
- Phase 24 Research: `/Users/gilberto/projetos/botfy/botfy-clinicas-n8n/.planning/phases/24-write-tools-migration/24-RESEARCH.md`
- Existing API Code: `/src/app/api/agent/documentos/processar/route.ts`
- Document Service: `/src/lib/services/document-service.ts`

### Secondary (MEDIUM confidence)
- [N8N Community - Binary Files in AI Agents](https://community.n8n.io/t/passing-binary-file-directly-to-an-http-request-tool-in-ai-agent/91910) - Confirms toolHttpRequest limitations
- [N8N Community - Image in AI Agent](https://community.n8n.io/t/i-need-help-sending-an-image-to-the-ai-agent-then-to-the-ai-agent-tool-and-then-to-the-api-via-http-request/176857) - Solutions for image handling
- [Speakeasy - File Uploads Best Practices](https://www.speakeasy.com/api-design/file-uploads) - URL-based approach justification

### Tertiary (LOW confidence)
- [N8N HTTP Request Tool Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolhttprequest/) - Limited details on binary handling
- N8N community discussions on multipart issues (multiple threads, inconclusive solutions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Same pattern as Phase 23/24, well-understood
- Architecture: MEDIUM - API enhancement is straightforward, N8N binary handling has known issues
- Pitfalls: HIGH - SSRF, timeouts, and validation are well-documented security concerns
- URL-based approach: MEDIUM - Industry best practice but needs implementation validation

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable technology)
