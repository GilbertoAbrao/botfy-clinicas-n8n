// src/mcp/tools/write.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { criarAgendamentoTool } from './criar-agendamento'
import { reagendarAgendamentoTool } from './reagendar'
import { cancelarAgendamentoTool } from './cancelar'
import { atualizarDadosPacienteTool } from './atualizar-paciente'
import { confirmarPresencaTool } from './confirmar-presenca'
import { mcpLog } from '../logger'

export function registerWriteTools(server: McpServer): void {
  mcpLog.info('Registering write tools...')

  // 1. criar_agendamento
  server.tool(
    criarAgendamentoTool.name,
    criarAgendamentoTool.description,
    criarAgendamentoTool.inputSchema,
    criarAgendamentoTool.handler
  )
  mcpLog.info(`  ✓ ${criarAgendamentoTool.name}`)

  // 2. reagendar_agendamento
  server.tool(
    reagendarAgendamentoTool.name,
    reagendarAgendamentoTool.description,
    reagendarAgendamentoTool.inputSchema,
    reagendarAgendamentoTool.handler
  )
  mcpLog.info(`  ✓ ${reagendarAgendamentoTool.name}`)

  // 3. cancelar_agendamento
  server.tool(
    cancelarAgendamentoTool.name,
    cancelarAgendamentoTool.description,
    cancelarAgendamentoTool.inputSchema,
    cancelarAgendamentoTool.handler
  )
  mcpLog.info(`  ✓ ${cancelarAgendamentoTool.name}`)

  // 4. atualizar_dados_paciente
  server.tool(
    atualizarDadosPacienteTool.name,
    atualizarDadosPacienteTool.description,
    atualizarDadosPacienteTool.inputSchema,
    atualizarDadosPacienteTool.handler
  )
  mcpLog.info(`  ✓ ${atualizarDadosPacienteTool.name}`)

  // 5. confirmar_presenca
  server.tool(
    confirmarPresencaTool.name,
    confirmarPresencaTool.description,
    confirmarPresencaTool.inputSchema,
    confirmarPresencaTool.handler
  )
  mcpLog.info(`  ✓ ${confirmarPresencaTool.name}`)

  mcpLog.info('Write tools registered: 5')
}
