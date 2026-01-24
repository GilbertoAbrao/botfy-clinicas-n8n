import { prisma } from '@/lib/prisma'
import { TZDate } from '@date-fns/tz'

/**
 * Query parameters for searching appointments.
 * All filters are optional - defaults to returning all appointments.
 */
export interface AppointmentQuery {
  pacienteId?: number
  telefone?: string
  dataInicio?: TZDate
  dataFim?: TZDate
  status?: string
  servicoId?: number
  tipoConsulta?: string
  profissional?: string
  page?: number
  limit?: number
}

/**
 * Single appointment result with patient context.
 * Includes patient name and phone for AI Agent conversation context.
 */
export interface AppointmentResult {
  id: number
  dataHora: string           // ISO 8601 format
  tipoConsulta: string
  profissional: string | null
  status: string | null
  observacoes: string | null
  paciente: {
    id: number
    nome: string
    telefone: string
  }
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Paginated appointment search result.
 */
export interface AppointmentSearchResult {
  agendamentos: AppointmentResult[]
  pagination: PaginationMeta
}

/**
 * Search appointments with filters and pagination.
 *
 * Supports filtering by:
 * - Patient ID or phone (partial match)
 * - Date range (dataInicio to dataFim)
 * - Status (agendada, confirmada, presente, cancelada, faltou)
 * - Service ID or type (partial match)
 * - Provider name (partial match)
 *
 * Returns appointments ordered by date ascending with patient info.
 *
 * @param query - Search filters and pagination parameters
 * @returns Paginated list of appointments with patient context
 */
export async function searchAppointments(query: AppointmentQuery): Promise<AppointmentSearchResult> {
  const page = query.page || 1
  const limit = Math.min(query.limit || 20, 100) // Max 100 per page
  const skip = (page - 1) * limit

  // Build where clause dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  // Filter by patient ID directly
  if (query.pacienteId) {
    where.pacienteId = query.pacienteId
  }

  // Filter by patient phone (requires join)
  if (query.telefone) {
    where.paciente = {
      telefone: {
        contains: query.telefone,
        mode: 'insensitive',
      },
    }
  }

  // Date range filters
  if (query.dataInicio || query.dataFim) {
    where.dataHora = {}
    if (query.dataInicio) {
      where.dataHora.gte = query.dataInicio
    }
    if (query.dataFim) {
      where.dataHora.lte = query.dataFim
    }
  }

  // Status filter
  if (query.status) {
    where.status = query.status
  }

  // Service filters
  if (query.servicoId) {
    where.servicoId = query.servicoId
  }
  if (query.tipoConsulta) {
    where.tipoConsulta = {
      contains: query.tipoConsulta,
      mode: 'insensitive',
    }
  }

  // Provider filter
  if (query.profissional) {
    where.profissional = {
      contains: query.profissional,
      mode: 'insensitive',
    }
  }

  // Execute count and find in parallel for efficiency
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dataHora: 'asc' },
      include: {
        paciente: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ])

  // Transform to API response format
  const agendamentos: AppointmentResult[] = appointments.map((apt) => ({
    id: apt.id,
    dataHora: apt.dataHora.toISOString(),
    tipoConsulta: apt.tipoConsulta,
    profissional: apt.profissional,
    status: apt.status,
    observacoes: apt.observacoes,
    paciente: {
      id: apt.paciente.id,
      nome: apt.paciente.nome,
      telefone: apt.paciente.telefone,
    },
  }))

  return {
    agendamentos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
