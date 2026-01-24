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
import { registerQueryTools } from './tools/query.js'
import { registerWriteTools } from './tools/write.js'
import { registerDocumentTool } from './tools/document.js'

async function main(): Promise<void> {
  try {
    // 1. Validate configuration
    mcpLog.info('='.repeat(50))
    mcpLog.info('Botfy ClinicOps MCP Server v2.0.0')
    mcpLog.info('='.repeat(50))

    mcpLog.info('Validating configuration...')
    validateConfig()
    mcpLog.info('  ✓ Configuration valid')

    // 2. Create MCP server
    mcpLog.info('Creating MCP server...')
    const server = new McpServer({
      name: 'botfy-clinicops',
      version: '2.0.0',
    })
    mcpLog.info('  ✓ Server created')

    // 3. Register all 11 tools
    mcpLog.info('Registering tools...')

    // Query tools (5)
    registerQueryTools(server)

    // Write tools (5)
    registerWriteTools(server)

    // Document tool (1)
    registerDocumentTool(server)

    mcpLog.info('-'.repeat(50))
    mcpLog.info('Total tools registered: 11')
    mcpLog.info('-'.repeat(50))

    // 4. Start heartbeat monitoring
    startHeartbeat(60000) // Log stats every 60 seconds
    mcpLog.info('  ✓ Heartbeat monitoring started (60s interval)')

    // 5. Connect via stdio transport (required for Claude Desktop)
    mcpLog.info('Connecting to stdio transport...')
    const transport = new StdioServerTransport()
    await server.connect(transport)

    mcpLog.info('='.repeat(50))
    mcpLog.info('MCP Server ready and listening on stdio')
    mcpLog.info('='.repeat(50))
  } catch (error) {
    mcpLog.error(`Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  mcpLog.info('Received SIGINT, shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  mcpLog.info('Received SIGTERM, shutting down...')
  process.exit(0)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  mcpLog.error(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  mcpLog.error(`Unhandled rejection: ${reason}`)
  process.exit(1)
})

main()
