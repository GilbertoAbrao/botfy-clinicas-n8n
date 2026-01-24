/**
 * POST /api/agent/documentos/processar
 *
 * Process an uploaded document (RG, CPF, CNS, insurance card).
 * Validates file, extracts fields using GPT-4o Vision, stores in Supabase.
 *
 * Authentication: Bearer token (API key from agents table)
 *
 * Request body (multipart/form-data):
 * - file: File (required) - Image or PDF document (max 5MB)
 * - patientId: string (required) - Patient ID for storage organization
 * - idempotencyKey: string (optional) - UUID for duplicate prevention
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     extracted: {
 *       documentType: "RG" | "CPF" | "CNS" | "CARTEIRINHA_CONVENIO" | "UNKNOWN",
 *       confidence: "high" | "medium" | "low",
 *       // ... type-specific fields
 *     },
 *     storagePath: string,
 *     originalFilename: string,
 *     mimeType: string,
 *     fileSize: number,
 *     processedAt: string (ISO 8601)
 *   }
 * }
 *
 * Errors:
 * - 400: Missing file, missing patientId, validation error
 * - 413: File too large (>5MB)
 * - 415: Unsupported file type
 * - 422: Extraction failed, idempotency key mismatch
 * - 500: Storage or API error
 */

import { NextRequest } from 'next/server'
import { withAgentAuth } from '@/lib/agent/middleware'
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/agent/error-handler'
import { processDocument } from '@/lib/services/document-service'
import {
  checkIdempotencyKey,
  storeIdempotencyResult,
  hashRequestBody,
} from '@/lib/idempotency/idempotency-service'
import { logAudit, AuditAction } from '@/lib/audit/logger'

// =============================================================================
// POST Handler
// =============================================================================

export const POST = withAgentAuth(async (req: NextRequest, _context, agentContext) => {
  try {
    // 1. Parse multipart form data (native Next.js)
    const formData = await req.formData()

    // 2. Extract fields
    const file = formData.get('file') as File | null
    const patientId = formData.get('patientId') as string | null
    const idempotencyKey = formData.get('idempotencyKey') as string | null

    // 3. Validate required fields
    if (!file) {
      return errorResponse('No file provided', 400)
    }

    if (!patientId) {
      return errorResponse('patientId is required', 400)
    }

    // 4. Handle idempotency
    let idempotencyHash: string | undefined
    if (idempotencyKey) {
      // Use provided key + patientId hash (file metadata, not content for performance)
      idempotencyHash = hashRequestBody({
        patientId,
        filename: file.name,
        size: file.size,
      })

      try {
        const idempotencyResult = await checkIdempotencyKey(
          idempotencyKey,
          idempotencyHash
        )

        if (!idempotencyResult.isNew && idempotencyResult.storedResponse) {
          // Log idempotent hit (no PHI)
          logAudit({
            userId: agentContext.userId,
            action: AuditAction.AGENT_PROCESS_DOCUMENT,
            resource: 'agent_api',
            details: {
              agentId: agentContext.agentId,
              correlationId: agentContext.correlationId,
              idempotencyKey,
              idempotencyHit: true,
            },
          }).catch(console.error)

          return successResponse(idempotencyResult.storedResponse)
        }
      } catch (idempotencyError) {
        // Handle idempotency key reuse with different body
        if (
          idempotencyError instanceof Error &&
          idempotencyError.message.includes('Idempotency key reused')
        ) {
          return errorResponse(idempotencyError.message, 422)
        }
        throw idempotencyError
      }
    }

    // 5. Process document (validation + extraction + storage)
    const result = await processDocument({
      file,
      patientId,
      agentContext,
    })

    // 6. Store idempotency result if key was provided
    if (idempotencyKey && idempotencyHash) {
      await storeIdempotencyResult(idempotencyKey, idempotencyHash, result)
    }

    // 7. Audit log (no PHI - only document type and metadata)
    logAudit({
      userId: agentContext.userId,
      action: AuditAction.AGENT_PROCESS_DOCUMENT,
      resource: 'agent_api',
      resourceId: result.storagePath,
      details: {
        agentId: agentContext.agentId,
        correlationId: agentContext.correlationId,
        patientId,
        documentType: result.extracted.documentType,
        confidence: result.extracted.confidence,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        idempotencyKey,
      },
    }).catch(console.error)

    // 8. Return result
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
})
