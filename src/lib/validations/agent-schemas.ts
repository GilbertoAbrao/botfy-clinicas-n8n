import { z } from 'zod'
import { TZDate } from '@date-fns/tz'
import { parseISO, isValid } from 'date-fns'

// Clinic timezone constant (Brazil)
const CLINIC_TIMEZONE = 'America/Sao_Paulo'

/**
 * Flexible date schema accepting multiple ISO 8601 formats.
 * Transforms to TZDate in clinic timezone.
 *
 * Accepted formats:
 * - ISO 8601 with timezone: "2026-01-24T14:30:00-03:00"
 * - ISO 8601 UTC: "2026-01-24T14:30:00Z"
 * - Local datetime: "2026-01-24T14:30:00"
 * - Date only: "2026-01-24" (defaults to start of day)
 *
 * All formats are converted to TZDate in America/Sao_Paulo timezone.
 */
export const flexibleDateTimeSchema = z
  .string()
  .refine(
    (val) => {
      // Accept ISO datetime with offset, Z suffix, or local
      const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/
      return isoPattern.test(val)
    },
    { message: 'Invalid date format. Use ISO 8601 (e.g., 2026-01-24T14:30:00-03:00)' }
  )
  .transform((dateStr) => {
    // Parse the ISO string
    const parsed = parseISO(dateStr)

    if (!isValid(parsed)) {
      throw new Error('Invalid date value')
    }

    // Convert to TZDate in clinic timezone
    return new TZDate(parsed, CLINIC_TIMEZONE)
  })

/**
 * Flexible date-only schema (no time component).
 * Returns TZDate at start of day in clinic timezone.
 *
 * Accepted format: "2026-01-24"
 */
export const flexibleDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
  .transform((dateStr) => {
    // Parse date-only string
    const [year, month, day] = dateStr.split('-').map(Number)

    // Create TZDate at start of day in clinic timezone
    return new TZDate(year, month - 1, day, 0, 0, 0, CLINIC_TIMEZONE)
  })

/**
 * Schema for appointment search filters.
 * Used by GET /api/agent/agendamentos
 */
export const agentAppointmentSearchSchema = z.object({
  // Date range (flexible format)
  dataInicio: flexibleDateTimeSchema.optional(),
  dataFim: flexibleDateTimeSchema.optional(),

  // Filter by patient
  pacienteId: z.coerce.number().int().positive().optional(),
  telefone: z.string().min(10).max(15).optional(),

  // Filter by provider
  profissional: z.string().optional(),

  // Filter by status
  status: z.enum(['agendada', 'confirmada', 'presente', 'cancelada', 'faltou']).optional(),

  // Filter by service
  servicoId: z.coerce.number().int().positive().optional(),
  tipoConsulta: z.string().optional(),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type AgentAppointmentSearchInput = z.infer<typeof agentAppointmentSearchSchema>

/**
 * Schema for slot availability search.
 * Used by GET /api/agent/slots
 */
export const agentSlotsSearchSchema = z.object({
  // Required date to search
  data: flexibleDateSchema,

  // Optional filters
  profissional: z.string().optional(),
  servicoId: z.coerce.number().int().positive().optional(),
  duracaoMinutos: z.coerce.number().int().min(15).max(480).default(30),
})

export type AgentSlotsSearchInput = z.infer<typeof agentSlotsSearchSchema>

/**
 * Schema for patient search.
 * Used by GET /api/agent/paciente
 */
export const agentPatientSearchSchema = z.object({
  // Search by phone (most common)
  telefone: z.string().min(10).max(15).optional(),

  // Search by CPF
  cpf: z.string().min(11).max(14).optional(),

  // Search by name (partial match)
  nome: z.string().min(2).optional(),
}).refine(
  (data) => data.telefone || data.cpf || data.nome,
  { message: 'At least one search parameter required (telefone, cpf, or nome)' }
)

export type AgentPatientSearchInput = z.infer<typeof agentPatientSearchSchema>

/**
 * Schema for creating appointments via agent.
 * Used by POST /api/agent/agendamentos
 */
export const agentCreateAppointmentSchema = z.object({
  pacienteId: z.coerce.number().int().positive(),
  servicoId: z.coerce.number().int().positive().optional(),
  tipoConsulta: z.string().min(1).optional(),
  profissional: z.string().optional(),
  dataHora: flexibleDateTimeSchema,
  observacoes: z.string().max(500).optional(),

  // Idempotency key for preventing duplicates on retry
  idempotencyKey: z.string().uuid().optional(),
}).refine(
  (data) => data.servicoId || data.tipoConsulta,
  { message: 'Either servicoId or tipoConsulta is required' }
)

export type AgentCreateAppointmentInput = z.infer<typeof agentCreateAppointmentSchema>

/**
 * Schema for updating appointments via agent.
 * Used by PATCH /api/agent/agendamentos/:id
 */
export const agentUpdateAppointmentSchema = z.object({
  dataHora: flexibleDateTimeSchema.optional(),
  profissional: z.string().optional(),
  observacoes: z.string().max(500).optional(),
  status: z.enum(['agendada', 'confirmada', 'presente', 'cancelada', 'faltou']).optional(),
})

export type AgentUpdateAppointmentInput = z.infer<typeof agentUpdateAppointmentSchema>

/**
 * Schema for canceling appointments via agent.
 * Used by DELETE /api/agent/agendamentos/:id
 */
export const agentCancelAppointmentSchema = z.object({
  motivo: z.string().min(3).max(500),
})

export type AgentCancelAppointmentInput = z.infer<typeof agentCancelAppointmentSchema>

/**
 * Schema for confirming attendance via agent.
 * Used by POST /api/agent/agendamentos/:id/confirmar
 */
export const agentConfirmAppointmentSchema = z.object({
  // Confirmation type: just confirmed or actually present
  tipo: z.enum(['confirmado', 'presente']).default('confirmado'),
})

export type AgentConfirmAppointmentInput = z.infer<typeof agentConfirmAppointmentSchema>

/**
 * Schema for updating patient via agent.
 * Used by PATCH /api/agent/paciente/:id
 */
export const agentUpdatePatientSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  telefone: z.string().min(10).max(15).optional(),
  email: z.string().email().optional(),
  cpf: z.string().min(11).max(14).optional(),
  dataNascimento: flexibleDateSchema.optional(),
  convenio: z.string().max(100).optional(),
  observacoes: z.string().max(1000).optional(),
})

export type AgentUpdatePatientInput = z.infer<typeof agentUpdatePatientSchema>

/**
 * Schema for instructions search via agent.
 * Used by GET /api/agent/instrucoes
 */
export const agentInstructionsSearchSchema = z.object({
  servicoId: z.coerce.number().int().positive().optional(),
  tipoInstrucao: z.string().optional(),
})

export type AgentInstructionsSearchInput = z.infer<typeof agentInstructionsSearchSchema>

/**
 * Schema for pre-checkin status via agent.
 * Used by GET /api/agent/pre-checkin/status
 */
export const agentPreCheckinStatusSchema = z.object({
  agendamentoId: z.coerce.number().int().positive().optional(),
  pacienteId: z.coerce.number().int().positive().optional(),
  telefone: z.string().min(10).max(15).optional(),
}).refine(
  (data) => data.agendamentoId || data.pacienteId || data.telefone,
  { message: 'At least one parameter required (agendamentoId, pacienteId, or telefone)' }
)

export type AgentPreCheckinStatusInput = z.infer<typeof agentPreCheckinStatusSchema>
