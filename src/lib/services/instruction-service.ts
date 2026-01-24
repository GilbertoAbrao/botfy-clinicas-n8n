import { prisma } from '@/lib/prisma'

export interface InstructionQuery {
  servicoId?: number
  tipoInstrucao?: string
}

export interface InstructionResult {
  id: number
  servicoId: number | null
  tipoInstrucao: string
  titulo: string
  conteudo: string
  prioridade: number
  servico?: {
    id: number
    nome: string
  }
}

export interface InstructionSearchResult {
  instrucoes: InstructionResult[]
  total: number
  filters: {
    servicoId?: number
    tipoInstrucao?: string
  }
}

// Instruction type categories for reference
export const INSTRUCTION_TYPES = [
  'jejum',           // Fasting instructions
  'hidratacao',      // Hydration instructions
  'medicamentos',    // Medication instructions
  'documentos',      // Document requirements
  'vestimenta',      // Clothing/preparation
  'acompanhante',    // Companion requirements
  'geral',           // General instructions
] as const

export async function searchInstructions(query: InstructionQuery): Promise<InstructionSearchResult> {
  // Build where clause
  const where: {
    ativo: boolean
    servicoId?: number
    tipoInstrucao?: { equals: string; mode: 'insensitive' }
  } = {
    ativo: true,  // Only active instructions
  }

  if (query.servicoId) {
    where.servicoId = query.servicoId
  }

  if (query.tipoInstrucao) {
    where.tipoInstrucao = {
      equals: query.tipoInstrucao,
      mode: 'insensitive',
    }
  }

  // Query with service info
  const instructions = await prisma.procedureInstruction.findMany({
    where,
    orderBy: [
      { prioridade: 'desc' },  // Higher priority first
      { tipoInstrucao: 'asc' }, // Then by type
    ],
    include: {
      servico: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  })

  // Transform to API response format
  const instrucoes: InstructionResult[] = instructions.map((inst) => ({
    id: inst.id,
    servicoId: inst.servicoId,
    tipoInstrucao: inst.tipoInstrucao,
    titulo: inst.titulo,
    conteudo: inst.conteudo,
    prioridade: inst.prioridade,
    servico: inst.servico
      ? {
          id: inst.servico.id,
          nome: inst.servico.nome,
        }
      : undefined,
  }))

  return {
    instrucoes,
    total: instrucoes.length,
    filters: {
      servicoId: query.servicoId,
      tipoInstrucao: query.tipoInstrucao,
    },
  }
}

/**
 * Get instructions for a specific appointment based on its service.
 * This is a convenience method for N8N workflows.
 */
export async function getInstructionsForAppointment(appointmentId: number): Promise<InstructionSearchResult> {
  // Get appointment's service
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { servicoId: true },
  })

  if (!appointment?.servicoId) {
    // No service linked - return general instructions
    return searchInstructions({ tipoInstrucao: 'geral' })
  }

  return searchInstructions({ servicoId: appointment.servicoId })
}
