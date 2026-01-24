/**
 * Type definitions for AI Agent API infrastructure.
 *
 * These types define the contract between N8N AI agents and the Next.js API endpoints.
 * All agent APIs must return ApiResponse format for consistent error handling.
 */

/**
 * Consistent response format for all agent API endpoints.
 *
 * Success responses include data, error responses include error message.
 * The success boolean allows agents to quickly determine if the request succeeded.
 *
 * @template T - The type of data returned on success
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request was successful */
  success: boolean

  /** Data returned on success */
  data?: T

  /** Error message on failure */
  error?: string

  /** Additional details (e.g., validation errors, conflict details) */
  details?: Record<string, unknown>
}
