/**
 * MCP Server Configuration
 *
 * Loads configuration from environment variables and provides validation.
 */

export const config = {
  baseUrl: process.env.AGENT_API_BASE_URL || 'http://localhost:3051',
  apiKey: process.env.AGENT_API_KEY || '',
}

/**
 * Validate configuration on startup
 *
 * @throws {Error} If AGENT_API_KEY is not set
 */
export function validateConfig(): void {
  if (!config.apiKey) {
    throw new Error('AGENT_API_KEY environment variable is required')
  }

  if (!config.baseUrl) {
    throw new Error('AGENT_API_BASE_URL environment variable is required')
  }
}
