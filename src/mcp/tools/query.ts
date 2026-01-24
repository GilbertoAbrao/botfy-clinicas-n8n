/**
 * Query Tools Registration
 *
 * Registers all 5 read-only (query) tools with the MCP server.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { buscarSlotsDisponiveisTool } from './buscar-slots'
import { buscarAgendamentosTool } from './buscar-agendamentos'
import { buscarPacienteTool } from './buscar-paciente'
import { statusPreCheckinTool } from './status-precheckin'
import { buscarInstrucoesTool } from './buscar-instrucoes'
import { mcpLog } from '../logger'

/**
 * Register all query tools with the MCP server
 *
 * Query tools are read-only operations that retrieve data without side effects.
 * All tools use GET requests and return structured data for Claude consumption.
 *
 * @param server - MCP server instance
 */
export function registerQueryTools(server: McpServer): void {
  mcpLog.info('Registering query tools...')

  // 1. buscar_slots_disponiveis
  server.tool(
    buscarSlotsDisponiveisTool.name,
    buscarSlotsDisponiveisTool.inputSchema.shape,
    { title: buscarSlotsDisponiveisTool.title },
    buscarSlotsDisponiveisTool.handler
  )
  mcpLog.info(`  ✓ ${buscarSlotsDisponiveisTool.name}`)

  // 2. buscar_agendamentos
  server.tool(
    buscarAgendamentosTool.name,
    buscarAgendamentosTool.inputSchema.shape,
    { title: buscarAgendamentosTool.title },
    buscarAgendamentosTool.handler
  )
  mcpLog.info(`  ✓ ${buscarAgendamentosTool.name}`)

  // 3. buscar_paciente
  server.tool(
    buscarPacienteTool.name,
    buscarPacienteTool.inputSchema.shape,
    { title: buscarPacienteTool.title },
    buscarPacienteTool.handler
  )
  mcpLog.info(`  ✓ ${buscarPacienteTool.name}`)

  // 4. status_pre_checkin
  server.tool(
    statusPreCheckinTool.name,
    statusPreCheckinTool.inputSchema.shape,
    { title: statusPreCheckinTool.title },
    statusPreCheckinTool.handler
  )
  mcpLog.info(`  ✓ ${statusPreCheckinTool.name}`)

  // 5. buscar_instrucoes
  server.tool(
    buscarInstrucoesTool.name,
    buscarInstrucoesTool.inputSchema.shape,
    { title: buscarInstrucoesTool.title },
    buscarInstrucoesTool.handler
  )
  mcpLog.info(`  ✓ ${buscarInstrucoesTool.name}`)

  mcpLog.info('Query tools registered: 5')
}
