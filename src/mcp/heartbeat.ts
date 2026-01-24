/**
 * MCP Server Heartbeat Monitoring
 *
 * Tracks request counts, error rates, and uptime.
 * Logs statistics to stderr for monitoring.
 */

import { mcpLog } from './logger'

interface HeartbeatStats {
  uptime: number
  requests: number
  errors: number
  errorRate: number
  startTime: number
}

let stats: HeartbeatStats = {
  uptime: 0,
  requests: 0,
  errors: 0,
  errorRate: 0,
  startTime: Date.now(),
}

/**
 * Record a request outcome for monitoring
 *
 * @param success - Whether the request succeeded
 */
export function recordRequest(success: boolean): void {
  stats.requests++
  if (!success) {
    stats.errors++
  }
  stats.errorRate = stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0
}

/**
 * Start heartbeat monitoring
 *
 * Logs statistics to stderr at regular intervals.
 *
 * @param intervalMs - Interval in milliseconds (default: 60000 = 1 minute)
 */
export function startHeartbeat(intervalMs: number = 60000): void {
  mcpLog.info(`Starting heartbeat monitoring (interval: ${intervalMs}ms)`)

  setInterval(() => {
    stats.uptime = Date.now() - stats.startTime

    const heartbeat = {
      timestamp: new Date().toISOString(),
      uptime: stats.uptime,
      uptimeMinutes: Math.floor(stats.uptime / 60000),
      requests: stats.requests,
      errors: stats.errors,
      errorRate: stats.errorRate.toFixed(2) + '%',
    }

    mcpLog.info(`Heartbeat: ${JSON.stringify(heartbeat)}`)
  }, intervalMs)
}

/**
 * Get current statistics (for testing or monitoring)
 */
export function getStats(): HeartbeatStats {
  return { ...stats }
}
