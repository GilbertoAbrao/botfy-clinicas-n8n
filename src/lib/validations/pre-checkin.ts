import { z } from 'zod'

// Status enum for pre-checkin (lowercase as stored in DB)
export const STATUS_PRE_CHECKIN = ['pendente', 'em_andamento', 'completo', 'incompleto'] as const
export type PreCheckinStatus = typeof STATUS_PRE_CHECKIN[number]

// Labels for status display in Portuguese
export const STATUS_PRE_CHECKIN_LABELS: Record<PreCheckinStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  completo: 'Completo',
  incompleto: 'Incompleto',
}

// Status badge colors for UI
export const STATUS_PRE_CHECKIN_COLORS: Record<PreCheckinStatus, string> = {
  pendente: 'blue',
  em_andamento: 'yellow',
  completo: 'green',
  incompleto: 'red',
}

// Type for pre-checkin record (joined data from API)
export interface PreCheckin {
  id: number
  agendamento_id: number
  paciente_id: number
  status: PreCheckinStatus
  dados_confirmados: boolean | null
  documentos_enviados: boolean | null
  instrucoes_enviadas: boolean | null
  pendencias: Record<string, unknown> | null // JSONB
  mensagem_enviada_em: string | null
  lembrete_enviado_em: string | null
  created_at: string
  updated_at: string
  // Related data from joins
  agendamento: {
    id: number
    data_hora: string
    servico: {
      nome: string
    } | null
  } | null
  paciente: {
    id: number
    nome: string
    telefone: string
  } | null
}

// Filters for pre-checkin list queries
export interface PreCheckinFilters {
  status?: PreCheckinStatus
  dateStart?: string // ISO date string
  dateEnd?: string   // ISO date string
  search?: string    // patient name
  page?: number
  limit?: number
}

// Query params validation schema
export const preCheckinFiltersSchema = z.object({
  status: z.enum(STATUS_PRE_CHECKIN).optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export type PreCheckinFiltersQuery = z.infer<typeof preCheckinFiltersSchema>

/**
 * Calculate progress percentage for a pre-checkin record.
 * Based on three boolean fields: dados_confirmados, documentos_enviados, instrucoes_enviadas.
 * Returns 0, 33, 66, or 100 based on how many are true.
 */
export function calculateProgress(preCheckin: PreCheckin): number {
  const fields = [
    preCheckin.dados_confirmados,
    preCheckin.documentos_enviados,
    preCheckin.instrucoes_enviadas,
  ]

  const completedCount = fields.filter(Boolean).length

  // Return percentage based on completed fields (0, 33, 66, or 100)
  switch (completedCount) {
    case 0:
      return 0
    case 1:
      return 33
    case 2:
      return 66
    case 3:
      return 100
    default:
      return 0
  }
}
