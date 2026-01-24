import { Role } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * AgentContext - Authentication context for AI Agent API requests
 *
 * This context is created after successful API key authentication and passed to
 * all agent route handlers. It provides the authenticated agent's identity and
 * the mapped system user for RBAC enforcement.
 *
 * @property agentId - UUID from agents table identifying the authenticated agent
 * @property userId - Mapped system user ID for RBAC permission checks
 * @property role - Role inherited from mapped user (ADMIN or ATENDENTE)
 * @property correlationId - Generated per-request UUID for audit trail linking
 *
 * @example
 * ```typescript
 * const context: AgentContext = {
 *   agentId: 'a1b2c3d4-...',
 *   userId: 'user123',
 *   role: 'ATENDENTE',
 *   correlationId: 'req-xyz789'
 * }
 * ```
 */
export interface AgentContext {
  agentId: string        // UUID from agents table
  userId: string         // Mapped system user for RBAC
  role: Role             // Inherited from mapped user (ADMIN or ATENDENTE)
  correlationId: string  // Generated per-request for audit trail linking
}

/**
 * ApiResponse<T> - Consistent response format for all agent API endpoints
 *
 * All agent API routes return this standardized structure to ensure predictable
 * response handling by N8N workflows and MCP Server.
 *
 * @typeParam T - Type of the data payload (defaults to unknown)
 *
 * @property success - Boolean indicating if the request succeeded
 * @property data - Response payload when success=true (optional)
 * @property error - Error message when success=false (optional)
 * @property details - Additional context for errors or metadata (optional)
 *
 * @example Success response
 * ```typescript
 * const response: ApiResponse<{ slotCount: number }> = {
 *   success: true,
 *   data: { slotCount: 5 }
 * }
 * ```
 *
 * @example Error response
 * ```typescript
 * const response: ApiResponse = {
 *   success: false,
 *   error: 'Patient not found',
 *   details: { patientId: '123' }
 * }
 * ```
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: Record<string, unknown>
}

/**
 * AgentHandler<T> - Type signature for agent API route handlers
 *
 * Route handlers wrapped by withAgentAuth() must match this signature.
 * The middleware handles authentication and provides the AgentContext.
 *
 * @typeParam T - Type of the response data payload (defaults to unknown)
 *
 * @param req - Next.js request object
 * @param context - Next.js route context (contains params for dynamic routes)
 * @param agentContext - Authenticated agent context (provided by withAgentAuth middleware)
 *
 * @returns NextResponse with ApiResponse<T> body
 *
 * @example
 * ```typescript
 * const handler: AgentHandler<{ slots: Slot[] }> = async (req, context, agentContext) => {
 *   // agentContext already verified by middleware
 *   const slots = await findSlots(agentContext.userId)
 *
 *   return NextResponse.json({
 *     success: true,
 *     data: { slots }
 *   })
 * }
 *
 * export const POST = withAgentAuth(handler)
 * ```
 */
export type AgentHandler<T = unknown> = (
  req: NextRequest,
  context: { params?: Record<string, string> },
  agentContext: AgentContext
) => Promise<NextResponse<ApiResponse<T>>>
