/**
 * Document Processing Service
 *
 * Orchestrates the full document processing pipeline:
 * 1. File validation (magic bytes, size, MIME type)
 * 2. Field extraction (GPT-4o Vision API)
 * 3. Storage (Supabase Storage)
 *
 * This service is the main entry point for document processing
 * and is used by the POST /api/agent/documentos/processar endpoint.
 */

import { validateDocumentUpload } from '@/lib/document/document-validator'
import { extractDocumentFields } from '@/lib/document/vision-extractor'
import { uploadPatientDocument } from '@/lib/document/storage-service'
import type { ProcessDocumentResult } from '@/lib/document/document-types'
import type { AgentContext } from '@/lib/agent/types'

// =============================================================================
// Types
// =============================================================================

/**
 * Input parameters for document processing
 */
export interface ProcessDocumentInput {
  /** The uploaded file to process */
  file: File
  /** Patient ID for storage organization */
  patientId: string | number
  /** Agent context for audit logging (passed through for future use) */
  agentContext: AgentContext
}

// =============================================================================
// Main Processing Function
// =============================================================================

/**
 * Process an uploaded document through the full pipeline
 *
 * Pipeline steps:
 * 1. Validate file (magic bytes, size, MIME type)
 * 2. Convert buffer to base64 for Vision API
 * 3. Extract fields using GPT-4o Vision
 * 4. Upload original file to Supabase Storage
 * 5. Build and return result
 *
 * @param input - Processing input with file, patientId, and agentContext
 * @returns ProcessDocumentResult with extracted fields and storage path
 * @throws Error if any step in the pipeline fails
 *
 * @example
 * ```typescript
 * const result = await processDocument({
 *   file: uploadedFile,
 *   patientId: '123',
 *   agentContext,
 * })
 * // result.extracted.documentType === 'RG'
 * // result.storagePath === '123/RG/1706123456789-abc123.jpg'
 * ```
 */
export async function processDocument(
  input: ProcessDocumentInput
): Promise<ProcessDocumentResult> {
  const { file, patientId, agentContext: _agentContext } = input
  const startTime = Date.now()

  // 1. Validate file (magic bytes, size, MIME type)
  const validated = await validateDocumentUpload(file)

  // 2. Convert buffer to base64 for Vision API
  const imageBase64 = validated.buffer.toString('base64')

  // 3. Extract fields using GPT-4o Vision
  const extracted = await extractDocumentFields(imageBase64, validated.mimeType)

  // 4. Upload original file to Supabase Storage
  const storagePath = await uploadPatientDocument(
    String(patientId),
    validated.buffer,
    validated.mimeType,
    extracted.documentType,
    file.name
  )

  // 5. Build result
  const result: ProcessDocumentResult = {
    extracted,
    storagePath,
    originalFilename: file.name,
    mimeType: validated.mimeType,
    fileSize: file.size,
    processedAt: new Date().toISOString(),
  }

  // Log processing time (for monitoring Vision API latency)
  // No PHI is logged - only document type, duration, and confidence level
  const duration = Date.now() - startTime
  console.log(
    `[Document Processing] Type: ${extracted.documentType}, Duration: ${duration}ms, Confidence: ${extracted.confidence}`
  )

  return result
}
