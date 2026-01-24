#!/usr/bin/env node
/**
 * Botfy ClinicOps MCP Server
 *
 * Model Context Protocol server for Claude Desktop integration.
 * Provides 11 AI agent tools via stdio transport.
 *
 * Architecture:
 * - stdio transport (required for Claude Desktop)
 * - Bearer token authentication to Next.js APIs
 * - stderr-only logging (stdout reserved for JSON-RPC)
 * - Heartbeat monitoring with request/error tracking
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { validateConfig } from './config.js'
import { mcpLog } from './logger.js'
import { startHeartbeat } from './heartbeat.js'

// Tool imports will be added in subsequent plans
// import { registerQueryTools } from './tools/query.js'
// import { registerWriteTools } from './tools/write.js'
// import { registerDocumentTool } from './tools/document.js'

async function main(): Promise<void> {
  try {
    // 1. Validate configuration
    mcpLog.info('Validating configuration...')
    validateConfig()

    // 2. Create MCP server
    mcpLog.info('Creating MCP server...')
    const server = new McpServer({
      name: 'botfy-clinicops',
      version: '2.0.0',
    })

    // 3. Register tools (added in plans 22-02, 22-03, 22-04)
    mcpLog.info('Registering tools...')
    // registerQueryTools(server)
    // registerWriteTools(server)
    // registerDocumentTool(server)
    mcpLog.info('No tools registered yet (will be added in plans 22-02, 22-03, 22-04)')

    // 4. Start heartbeat monitoring
    startHeartbeat(60000) // Every 60 seconds

    // 5. Connect via stdio transport (required for Claude Desktop)
    mcpLog.info('Connecting to stdio transport...')
    const transport = new StdioServerTransport()
    await server.connect(transport)

    mcpLog.info('Botfy ClinicOps MCP Server ready')
  } catch (error) {
    mcpLog.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  mcpLog.info('Shutting down (SIGINT)...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  mcpLog.info('Shutting down (SIGTERM)...')
  process.exit(0)
})

main()
