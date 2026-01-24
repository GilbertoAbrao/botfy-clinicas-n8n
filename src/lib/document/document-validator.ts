/**
 * Document File Validator
 *
 * Secure file validation with OWASP-compliant magic byte verification.
 * Validates file type using actual file content, not just MIME type or extension.
 *
 * Security features:
 * - Magic byte validation (not just extension)
 * - MIME type spoofing detection
 * - Size limits enforced before full read
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
 */

import { fileTypeFromBuffer } from 'file-type'

// =============================================================================
// Constants
// =============================================================================

/**
 * Maximum allowed file size: 5MB
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Allowed MIME types for document uploads
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/pdf',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

// =============================================================================
// Types
// =============================================================================

/**
 * Result of successful file validation
 */
export interface ValidatedFile {
  buffer: Buffer
  mimeType: AllowedMimeType
  extension: string
}

// =============================================================================
// Validation Function
// =============================================================================

/**
 * Validates a document upload using magic byte verification
 *
 * @param file - The File object to validate
 * @returns ValidatedFile with buffer and detected type
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * const formData = await request.formData()
 * const file = formData.get('file') as File
 * const validated = await validateDocumentUpload(file)
 * // validated.buffer, validated.mimeType, validated.extension
 * ```
 */
export async function validateDocumentUpload(file: File): Promise<ValidatedFile> {
  // 1. Check file size before reading content
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit')
  }

  // 2. Check for empty files
  if (file.size === 0) {
    throw new Error('File is empty')
  }

  // 3. Read file content into buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 4. Detect file type from magic bytes
  const detected = await fileTypeFromBuffer(buffer)

  if (!detected) {
    throw new Error('Unable to determine file type from content')
  }

  // 5. Check if detected type is allowed
  if (!ALLOWED_MIME_TYPES.includes(detected.mime as AllowedMimeType)) {
    throw new Error(
      `File type '${detected.mime}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    )
  }

  // 6. Check for MIME type spoofing
  // If client declared a type, it must match what we detected
  if (file.type && file.type !== detected.mime) {
    throw new Error(
      `MIME type mismatch: declared '${file.type}', actual '${detected.mime}'. Possible file type spoofing attempt.`
    )
  }

  return {
    buffer,
    mimeType: detected.mime as AllowedMimeType,
    extension: detected.ext,
  }
}

/**
 * Helper to format file size for error messages
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
