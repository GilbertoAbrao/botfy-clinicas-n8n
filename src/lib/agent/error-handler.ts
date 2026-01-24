import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { ApiResponse } from './types'

/**
 * Map of known error messages to HTTP status codes.
 * Add new known errors here as the agent API expands.
 */
const KNOWN_ERROR_STATUS_MAP: Record<string, number> = {
  'Time slot already booked': 409,
  'Patient not found': 404,
  'Service not found': 404,
  'Appointment not found': 404,
  'Provider not found': 404,
  'Invalid date format': 400,
  'Conflict detected': 409,
  'Unauthorized': 401,
  'Forbidden': 403,
  // Document processing errors (Phase 20)
  'File size exceeds 5MB limit': 413,
  'File is empty': 400,
  'Unable to determine file type from content': 400,
  'File type not allowed': 415, // Unsupported Media Type
  'MIME type mismatch': 400,
  'Failed to extract document fields': 422,
  'Document extraction refused': 422,
  'Failed to upload document': 500,
  'No file provided': 400,
  'patientId is required': 400,
}

/**
 * Handles errors from agent API routes, returning consistent ApiResponse format.
 * Automatically detects ZodError for validation failures.
 *
 * @param error - The error to handle
 * @returns NextResponse with appropriate status and ApiResponse body
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Log error for debugging (sanitized - no PHI)
  console.error('[Agent API Error]', error instanceof Error ? error.message : 'Unknown error')

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: {
          issues: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
      },
      { status: 400 }
    )
  }

  // Handle known errors with specific status codes
  if (error instanceof Error) {
    const status = KNOWN_ERROR_STATUS_MAP[error.message] || 500

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status }
    )
  }

  // Unknown error - return generic 500
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  )
}

/**
 * Creates a successful API response with consistent format.
 *
 * @param data - The data to include in the response
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with ApiResponse body
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Creates an error response manually (for non-exception errors).
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional additional details
 * @returns NextResponse with ApiResponse body
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}
