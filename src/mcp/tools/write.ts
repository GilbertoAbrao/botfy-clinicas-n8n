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
    criarAgendamentoTool.inputSchema.shape,
    { title: criarAgendamentoTool.title },
    criarAgendamentoTool.handler
  )
  mcpLog.info(`  ✓ ${criarAgendamentoTool.name}`)

  // 2. reagendar_agendamento
  server.tool(
    reagendarAgendamentoTool.name,
    reagendarAgendamentoTool.inputSchema.shape,
    { title: reagendarAgendamentoTool.title },
    reagendarAgendamentoTool.handler
  )
  mcpLog.info(`  ✓ ${reagendarAgendamentoTool.name}`)

  // 3. cancelar_agendamento
  server.tool(
    cancelarAgendamentoTool.name,
    cancelarAgendamentoTool.inputSchema.shape,
    { title: cancelarAgendamentoTool.title },
    cancelarAgendamentoTool.handler
  )
  mcpLog.info(`  ✓ ${cancelarAgendamentoTool.name}`)

  // 4. atualizar_dados_paciente
  server.tool(
    atualizarDadosPacienteTool.name,
    atualizarDadosPacienteTool.inputSchema.shape,
    { title: atualizarDadosPacienteTool.title },
    atualizarDadosPacienteTool.handler
  )
  mcpLog.info(`  ✓ ${atualizarDadosPacienteTool.name}`)

  // 5. confirmar_presenca
  server.tool(
    confirmarPresencaTool.name,
    confirmarPresencaTool.inputSchema.shape,
    { title: confirmarPresencaTool.title },
    confirmarPresencaTool.handler
  )
  mcpLog.info(`  ✓ ${confirmarPresencaTool.name}`)

  mcpLog.info('Write tools registered: 5')
}
