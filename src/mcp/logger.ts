/**
 * MCP Server Logging Utilities
 *
 * CRITICAL: MCP protocol uses stdout for JSON-RPC communication.
 * All logs MUST go to stderr to avoid corrupting the protocol.
 */

/**
 * Format timestamp for log messages
 */
function timestamp(): string {
  return new Date().toISOString()
}

/**
 * MCP Logger - All output goes to stderr
 */
export const mcpLog = {
  /**
   * Log informational message to stderr
   */
  info(message: string): void {
    console.error(`[${timestamp()}] INFO: ${message}`)
  },

  /**
   * Log error message to stderr
   */
  error(message: string): void {
    console.error(`[${timestamp()}] ERROR: ${message}`)
  },

  /**
   * Log debug message to stderr
   */
  debug(message: string): void {
    console.error(`[${timestamp()}] DEBUG: ${message}`)
  },

  /**
   * Log warning message to stderr
   */
  warn(message: string): void {
    console.error(`[${timestamp()}] WARN: ${message}`)
  },
}
