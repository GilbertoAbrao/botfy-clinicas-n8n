import { z } from 'zod'

// Create appointment schema
export const createAppointmentSchema = z.object({
  pacienteId: z.string().uuid({ message: 'ID do paciente inválido' }),
  servicoId: z.string().uuid({ message: 'ID do serviço inválido' }),
  dataHora: z.string().datetime({ message: 'Data e hora inválidas' }),
  observacoes: z.string().optional(),
  status: z.enum(['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'FALTOU']).default('AGENDADO'),
})

// Update appointment schema (all fields optional for partial updates)
export const updateAppointmentSchema = z.object({
  pacienteId: z.string().uuid().optional(),
  servicoId: z.string().uuid().optional(),
  dataHora: z.string().datetime().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'FALTOU']).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
