/**
 * MCP Server HTTP Client
 *
 * Authenticated HTTP client for calling Next.js Agent APIs.
 * Handles Bearer authentication, error handling, and request tracking.
 */

import { config } from './config'
import { mcpLog } from './logger'
import { recordRequest } from './heartbeat'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: Record<string, unknown>
}

export interface CallOptions {
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
  contentType?: string // For multipart support later
}

/**
 * Call a Next.js Agent API endpoint
 *
 * @param method - HTTP method
 * @param path - API path (e.g., '/slots')
 * @param options - Request options (params, body, contentType)
 * @returns Parsed response data
 * @throws {Error} If request fails or returns error
 */
export async function callAgentApi<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options?: CallOptions
): Promise<T> {
  // Build URL with query params
  const url = new URL(`${config.baseUrl}/api/agent${path}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  // Make request with Bearer auth
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiKey}`,
  }

  // Only set Content-Type for JSON (not for multipart)
  if (options?.body && !options?.contentType) {
    headers['Content-Type'] = 'application/json'
  } else if (options?.contentType) {
    headers['Content-Type'] = options.contentType
  }

  try {
    mcpLog.debug(`HTTP ${method} ${url.pathname}${url.search}`)

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    const json = await response.json() as ApiResponse<T>

    // Check BOTH HTTP status AND success field (per research pitfall #3)
    if (!response.ok || !json.success) {
      recordRequest(false)
      const errorMsg = json.error || `HTTP ${response.status}: ${response.statusText}`
      mcpLog.error(`API error: ${errorMsg}`)
      throw new Error(errorMsg)
    }

    recordRequest(true)
    mcpLog.debug(`HTTP ${method} ${url.pathname} - Success`)
    return json.data as T
  } catch (error) {
    recordRequest(false)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    mcpLog.error(`HTTP error: ${errorMsg}`)
    throw error
  }
}
