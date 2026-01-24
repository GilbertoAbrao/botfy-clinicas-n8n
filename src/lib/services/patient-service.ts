/**
 * Patient Service
 *
 * Business logic for patient search operations used by the AI Agent API.
 * Supports exact and partial matching by phone, CPF, or name.
 *
 * @module patient-service
 */

import { prisma } from '@/lib/prisma'

/**
 * Query parameters for patient search.
 * At least one parameter is required.
 */
export interface PatientSearchQuery {
  telefone?: string
  cpf?: string
  nome?: string
}

/**
 * Patient data returned by search.
 * Contains core patient information without internal metadata.
 */
export interface PatientResult {
  id: number
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  dataNascimento: string | null // YYYY-MM-DD
  convenio: string | null
  observacoes: string | null
}

/**
 * Upcoming appointment summary for patient context.
 */
export interface UpcomingAppointment {
  id: number
  dataHora: string // ISO 8601
  tipoConsulta: string
  profissional: string | null
  status: string | null
}

/**
 * Search result with match type indicator.
 *
 * - exact: Single patient found (includes upcoming appointments)
 * - partial: Multiple patients found (no appointments)
 * - none: No patients found
 */
export interface PatientSearchResult {
  patient: PatientResult | null
  patients?: PatientResult[] // Only when partial match
  matchType: 'exact' | 'partial' | 'none'
  upcomingAppointments?: UpcomingAppointment[]
}

/**
 * Search for a patient by phone, CPF, or name.
 *
 * Priority order:
 * 1. Phone (most common for WhatsApp identification)
 * 2. CPF (exact match only)
 * 3. Name (partial match)
 *
 * Phone search tries exact match first (indexed, fast), then falls back
 * to partial match. Single partial match is treated as exact.
 *
 * @param query - Search parameters (at least one required)
 * @returns Search result with patient(s) and match type
 * @throws Error if no search parameters provided
 */
export async function searchPatient(
  query: PatientSearchQuery
): Promise<PatientSearchResult> {
  // Validate at least one search param
  if (!query.telefone && !query.cpf && !query.nome) {
    throw new Error(
      'At least one search parameter required (telefone, cpf, or nome)'
    )
  }

  // Priority 1: Search by phone (most common for WhatsApp)
  if (query.telefone) {
    return searchByPhone(query.telefone)
  }

  // Priority 2: Search by CPF
  if (query.cpf) {
    return searchByCpf(query.cpf)
  }

  // Priority 3: Search by name (partial match only)
  if (query.nome) {
    return searchByName(query.nome)
  }

  return { patient: null, matchType: 'none' }
}

/**
 * Normalize phone number by removing all non-digit characters.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Normalize CPF by removing all non-digit characters.
 */
function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Search for patient by phone number.
 * Tries exact match first, then partial match.
 */
async function searchByPhone(telefone: string): Promise<PatientSearchResult> {
  const normalizedPhone = normalizePhone(telefone)

  // Try exact match first (fast, indexed)
  const exactMatch = await prisma.patient.findUnique({
    where: { telefone: normalizedPhone },
  })

  if (exactMatch) {
    const upcomingAppointments = await getUpcomingAppointments(exactMatch.id)
    return {
      patient: formatPatient(exactMatch),
      matchType: 'exact',
      upcomingAppointments,
    }
  }

  // Fallback to partial match (slower, limit results)
  const partialMatches = await prisma.patient.findMany({
    where: {
      telefone: {
        contains: normalizedPhone,
      },
    },
    take: 10,
  })

  if (partialMatches.length === 1) {
    // Single partial match - treat as exact
    const upcomingAppointments = await getUpcomingAppointments(
      partialMatches[0].id
    )
    return {
      patient: formatPatient(partialMatches[0]),
      matchType: 'exact',
      upcomingAppointments,
    }
  }

  if (partialMatches.length > 1) {
    return {
      patient: null,
      patients: partialMatches.map(formatPatient),
      matchType: 'partial',
    }
  }

  return { patient: null, matchType: 'none' }
}

/**
 * Search for patient by CPF (exact match only).
 */
async function searchByCpf(cpf: string): Promise<PatientSearchResult> {
  const normalizedCpf = normalizeCpf(cpf)

  const patient = await prisma.patient.findFirst({
    where: { cpf: normalizedCpf },
  })

  if (patient) {
    const upcomingAppointments = await getUpcomingAppointments(patient.id)
    return {
      patient: formatPatient(patient),
      matchType: 'exact',
      upcomingAppointments,
    }
  }

  return { patient: null, matchType: 'none' }
}

/**
 * Search for patient by name (partial match).
 */
async function searchByName(nome: string): Promise<PatientSearchResult> {
  const patients = await prisma.patient.findMany({
    where: {
      nome: {
        contains: nome,
        mode: 'insensitive',
      },
    },
    take: 10,
  })

  if (patients.length === 1) {
    const upcomingAppointments = await getUpcomingAppointments(patients[0].id)
    return {
      patient: formatPatient(patients[0]),
      matchType: 'exact',
      upcomingAppointments,
    }
  }

  if (patients.length > 1) {
    return {
      patient: null,
      patients: patients.map(formatPatient),
      matchType: 'partial',
    }
  }

  return { patient: null, matchType: 'none' }
}

/**
 * Get upcoming appointments for a patient.
 * Returns up to 5 future appointments (not cancelled or missed).
 */
async function getUpcomingAppointments(
  patientId: number
): Promise<UpcomingAppointment[]> {
  const now = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      pacienteId: patientId,
      dataHora: { gte: now },
      status: {
        notIn: ['cancelada', 'faltou'],
      },
    },
    orderBy: { dataHora: 'asc' },
    take: 5,
    select: {
      id: true,
      dataHora: true,
      tipoConsulta: true,
      profissional: true,
      status: true,
    },
  })

  return appointments.map((apt) => ({
    id: apt.id,
    dataHora: apt.dataHora.toISOString(),
    tipoConsulta: apt.tipoConsulta,
    profissional: apt.profissional,
    status: apt.status,
  }))
}

/**
 * Format patient record for API response.
 * Converts Date to ISO string and extracts relevant fields.
 */
function formatPatient(
  patient: Awaited<ReturnType<typeof prisma.patient.findUnique>>
): PatientResult {
  if (!patient) {
    throw new Error('Patient cannot be null')
  }

  return {
    id: patient.id,
    nome: patient.nome,
    telefone: patient.telefone,
    email: patient.email,
    cpf: patient.cpf,
    dataNascimento: patient.dataNascimento
      ? patient.dataNascimento.toISOString().split('T')[0]
      : null,
    convenio: patient.convenio,
    observacoes: patient.observacoes,
  }
}
