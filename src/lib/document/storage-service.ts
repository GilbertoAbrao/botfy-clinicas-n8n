/**
 * Supabase Storage Service for Patient Documents
 *
 * Handles secure storage of patient documents in Supabase Storage.
 * Uses admin client to bypass RLS - authentication is handled at the API route level.
 *
 * Storage structure:
 * patient-documents/
 *   {patientId}/
 *     {documentType}/
 *       {timestamp}-{uuid}.{ext}
 */

import { randomUUID } from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

// =============================================================================
// Constants
// =============================================================================

/**
 * Supabase Storage bucket name for patient documents
 * Must be created in Supabase dashboard with appropriate RLS policies
 */
const BUCKET_NAME = 'patient-documents'

/**
 * Signed URL expiry time in seconds (1 hour)
 */
const SIGNED_URL_EXPIRY = 3600

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'application/pdf': 'pdf',
  }
  return mimeToExt[mimeType] || 'bin'
}

// =============================================================================
// Storage Functions
// =============================================================================

/**
 * Upload a patient document to Supabase Storage
 *
 * @param patientId - Patient ID for folder organization
 * @param buffer - File data as Buffer
 * @param mimeType - MIME type of the file
 * @param documentType - Type of document (RG, CPF, CNS, etc.)
 * @param originalFilename - Original filename (for logging, not used in storage path)
 * @returns Storage path (NOT full URL for security)
 * @throws Error if upload fails
 *
 * @example
 * ```typescript
 * const path = await uploadPatientDocument(
 *   123,
 *   fileBuffer,
 *   'image/jpeg',
 *   'RG',
 *   'document.jpg'
 * )
 * // path: "123/RG/1706123456789-abc123.jpg"
 * ```
 */
export async function uploadPatientDocument(
  patientId: string | number,
  buffer: Buffer,
  mimeType: string,
  documentType: string,
  originalFilename: string
): Promise<string> {
  const supabase = createAdminSupabaseClient()

  // Generate unique filename with timestamp and UUID
  const timestamp = Date.now()
  const uuid = randomUUID()
  const extension = getExtensionFromMime(mimeType)
  const filename = `${patientId}/${documentType}/${timestamp}-${uuid}.${extension}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(
    filename,
    buffer,
    {
      contentType: mimeType,
      upsert: false, // Prevent accidental overwrites
      cacheControl: '3600', // 1 hour cache
    }
  )

  if (error) {
    // Log error without PHI
    console.error('Supabase storage upload failed:', {
      error: error.message,
      patientId,
      documentType,
      // Do NOT log originalFilename as it may contain PHI
    })
    throw new Error(`Failed to upload document: ${error.message}`)
  }

  // Return storage path (NOT the full URL for security)
  return data.path
}

/**
 * Generate a signed URL for viewing a document
 *
 * @param storagePath - Path returned from uploadPatientDocument
 * @returns Signed URL valid for SIGNED_URL_EXPIRY seconds
 * @throws Error if URL generation fails
 *
 * @example
 * ```typescript
 * const url = await getDocumentSignedUrl("123/RG/1706123456789-abc123.jpg")
 * // Returns signed URL valid for 1 hour
 * ```
 */
export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error) {
    console.error('Failed to generate signed URL:', {
      error: error.message,
      // Do NOT log storagePath as it contains patient ID
    })
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Delete a document from storage
 *
 * @param storagePath - Path returned from uploadPatientDocument
 * @throws Error if deletion fails
 *
 * @example
 * ```typescript
 * await deleteDocument("123/RG/1706123456789-abc123.jpg")
 * ```
 */
export async function deleteDocument(storagePath: string): Promise<void> {
  const supabase = createAdminSupabaseClient()

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])

  if (error) {
    console.error('Failed to delete document:', {
      error: error.message,
    })
    throw new Error(`Failed to delete document: ${error.message}`)
  }
}
