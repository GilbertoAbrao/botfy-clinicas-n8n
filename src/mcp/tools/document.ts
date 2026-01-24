// src/mcp/tools/document.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { processarDocumentoTool } from './processar-documento.js'
import { mcpLog } from '../logger.js'

export function registerDocumentTool(server: McpServer): void {
  mcpLog.info('Registering document tools...')

  server.tool(
    processarDocumentoTool.name,
    processarDocumentoTool.description,
    processarDocumentoTool.inputSchema,
    processarDocumentoTool.handler
  )
  mcpLog.info(`  ✓ ${processarDocumentoTool.name}`)

  mcpLog.info('Document tools registered: 1')
}
