import { z } from 'zod'

// Status enum for type safety (lowercase as stored in DB)
export const STATUS_APPOINTMENT = ['agendada', 'confirmado', 'cancelada', 'realizada', 'faltou'] as const
export type AppointmentStatus = typeof STATUS_APPOINTMENT[number]

// Labels for status display in Portuguese
export const STATUS_APPOINTMENT_LABELS: Record<AppointmentStatus, string> = {
  agendada: 'Agendada',
  confirmado: 'Confirmado',
  cancelada: 'Cancelada',
  realizada: 'Realizada',
  faltou: 'Faltou',
}

// Type for appointment list item (joined data from API)
export interface AppointmentListItem {
  id: string
  scheduledAt: string // ISO timestamp
  patientId: string
  patientName: string
  patientPhone: string | null
  serviceType: string
  providerId: string
  providerName: string
  providerColor: string
  status: AppointmentStatus
  duration: number
}

// Filters for appointment list queries
export interface AppointmentFilters {
  dateStart?: string // ISO date string
  dateEnd?: string   // ISO date string
  providerId?: string // comma-separated for multi-select
  serviceType?: string
  status?: AppointmentStatus
  search?: string // patient name or phone
  page?: number
  limit?: number
}

// Query params validation schema
export const appointmentFiltersSchema = z.object({
  dateStart: z.string().optional(), // ISO date string (flexible format)
  dateEnd: z.string().optional(),   // ISO date string (flexible format)
  providerId: z.string().optional(), // comma-separated list
  serviceType: z.string().optional(),
  status: z.enum(STATUS_APPOINTMENT).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
})

export type AppointmentFiltersQuery = z.infer<typeof appointmentFiltersSchema>

// Create appointment schema
export const createAppointmentSchema = z.object({
  pacienteId: z.string().uuid({ message: 'ID do paciente inválido' }),
  servicoId: z.string().uuid({ message: 'ID do serviço inválido' }),
  providerId: z.string().uuid({ message: 'ID do profissional inválido' }).optional(),
  dataHora: z.string().datetime({ message: 'Data e hora inválidas' }),
  observacoes: z.string().optional(),
  status: z.enum(['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'FALTOU']).default('AGENDADO'),
})

// Update appointment schema (all fields optional for partial updates)
export const updateAppointmentSchema = z.object({
  pacienteId: z.string().uuid().optional(),
  servicoId: z.string().min(1).optional(), // Can be UUID or service name
  providerId: z.string().uuid().optional(),
  dataHora: z.string().min(1).optional(), // Accepts datetime-local format (YYYY-MM-DDTHH:mm)
  observacoes: z.string().optional(),
  status: z.enum(['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'FALTOU']).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
