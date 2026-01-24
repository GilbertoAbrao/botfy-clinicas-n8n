import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, extractBearerToken } from './auth'
import { handleApiError, errorResponse } from './error-handler'
import type { AgentContext, AgentHandler, ApiResponse } from './types'

/**
 * Higher-Order Function that wraps route handlers with agent authentication.
 *
 * Usage:
 * ```typescript
 * export const GET = withAgentAuth(async (req, context, agentContext) => {
 *   // agentContext contains: agentId, userId, role, correlationId
 *   return successResponse({ data: 'example' })
 * })
 * ```
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate token against agents table (bcrypt compare)
 * 3. If valid, call wrapped handler with AgentContext
 * 4. If invalid, return 401 with consistent error format
 * 5. Catch any errors and return consistent error response
 *
 * @param handler - The route handler to wrap
 * @returns Wrapped handler with authentication
 */
export function withAgentAuth<T = unknown>(
  handler: AgentHandler<T>
): (req: NextRequest, context: { params?: Promise<Record<string, string>> }) => Promise<NextResponse<ApiResponse<T>>> {
  return async (
    req: NextRequest,
    context: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // 1. Extract Bearer token
      const authHeader = req.headers.get('authorization')
      const token = extractBearerToken(authHeader)

      if (!token) {
        return errorResponse(
          'Missing or invalid Authorization header. Use: Bearer <api_key>',
          401
        ) as NextResponse<ApiResponse<T>>
      }

      // 2. Validate API key
      const agentContext = await validateApiKey(token)

      if (!agentContext) {
        return errorResponse(
          'Invalid API key',
          401
        ) as NextResponse<ApiResponse<T>>
      }

      // 3. Resolve params if they're a Promise (Next.js 15+ pattern)
      const resolvedParams = context.params ? await context.params : undefined

      // 4. Call wrapped handler with agent context
      return await handler(req, { params: resolvedParams }, agentContext)
    } catch (error) {
      // 5. Handle any errors with consistent format
      return handleApiError(error) as NextResponse<ApiResponse<T>>
    }
  }
}

/**
 * Optional: Middleware that requires specific roles.
 * Use when certain agent endpoints need admin access.
 *
 * Usage:
 * ```typescript
 * export const DELETE = withAgentAuth(
 *   withRole(['ADMIN'])(async (req, context, agentContext) => {
 *     // Only ADMIN agents can access
 *   })
 * )
 * ```
 */
export function withRole(allowedRoles: string[]) {
  return <T>(handler: AgentHandler<T>): AgentHandler<T> => {
    return async (req, context, agentContext) => {
      if (!allowedRoles.includes(agentContext.role)) {
        return errorResponse(
          'Insufficient permissions',
          403
        ) as NextResponse<ApiResponse<T>>
      }

      return handler(req, context, agentContext)
    }
  }
}
