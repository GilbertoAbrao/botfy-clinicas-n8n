/**
 * Pre-Checkin Status Service
 *
 * Provides pre-checkin status aggregation for AI Agent API.
 * Enables N8N AI Agent to tell patients about their pre-checkin progress and pending documents.
 *
 * @module services/pre-checkin-service
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

/**
 * Query parameters for pre-checkin status lookup.
 * At least one parameter is required.
 */
export interface PreCheckinQuery {
  agendamentoId?: number
  pacienteId?: number
  telefone?: string
}

/**
 * Pre-checkin status result with document completion details.
 */
export interface PreCheckinStatusResult {
  /** Whether a pre-checkin record exists for this appointment */
  exists: boolean
  /** Status: 'pendente', 'parcial', 'completo', 'rejeitado' */
  status: string
  /** The appointment ID this pre-checkin is associated with */
  agendamentoId?: number
  /** Whether patient data has been confirmed */
  dadosConfirmados: boolean
  /** Whether required documents have been uploaded */
  documentosEnviados: boolean
  /** Whether procedure instructions have been sent */
  instrucoesEnviadas: boolean
  /** List of pending items (documents, confirmations, etc.) */
  pendencias: string[] | null
  /** When the initial pre-checkin message was sent (ISO 8601) */
  mensagemEnviadaEm: string | null
  /** When the reminder was sent (ISO 8601) */
  lembreteEnviadoEm: string | null
  /** Appointment details for context */
  appointment?: {
    dataHora: string
    tipoConsulta: string
    profissional: string | null
  }
}

/**
 * Get pre-checkin status for an appointment.
 *
 * Can look up by:
 * - agendamentoId: Direct lookup by appointment ID
 * - pacienteId: Finds next upcoming appointment for patient
 * - telefone: Finds patient by phone, then next upcoming appointment
 *
 * Uses Supabase admin client for pre_checkin table (bypasses RLS for agent access).
 * Uses Prisma for appointment lookup (better types).
 *
 * @param query - Search parameters (at least one required)
 * @returns Pre-checkin status with document completion details
 * @throws Error if no search parameter provided
 * @throws Error if Supabase query fails (except for 'not found' which returns pending status)
 */
export async function getPreCheckinStatus(
  query: PreCheckinQuery
): Promise<PreCheckinStatusResult> {
  // Validate at least one search param
  if (!query.agendamentoId && !query.pacienteId && !query.telefone) {
    throw new Error(
      'At least one parameter required (agendamentoId, pacienteId, or telefone)'
    )
  }

  let appointmentId = query.agendamentoId

  // If searching by phone or patient ID, find the next upcoming appointment
  if (!appointmentId && (query.pacienteId || query.telefone)) {
    const appointment = await findNextAppointment(query.pacienteId, query.telefone)
    if (!appointment) {
      return {
        exists: false,
        status: 'pendente',
        dadosConfirmados: false,
        documentosEnviados: false,
        instrucoesEnviadas: false,
        pendencias: null,
        mensagemEnviadaEm: null,
        lembreteEnviadoEm: null,
      }
    }
    appointmentId = appointment.id
  }

  // Query pre_checkin via Supabase admin client (bypasses RLS for agent access)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('pre_checkin')
    .select(
      `
      id,
      status,
      dados_confirmados,
      documentos_enviados,
      instrucoes_enviadas,
      pendencias,
      mensagem_enviada_em,
      lembrete_enviado_em
    `
    )
    .eq('agendamento_id', appointmentId)
    .single()

  // Get appointment details for context
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId! },
    select: {
      dataHora: true,
      tipoConsulta: true,
      profissional: true,
    },
  })

  if (error) {
    if (error.code === 'PGRST116') {
      // No pre-checkin record yet - return pending status
      return {
        exists: false,
        status: 'pendente',
        agendamentoId: appointmentId,
        dadosConfirmados: false,
        documentosEnviados: false,
        instrucoesEnviadas: false,
        pendencias: null,
        mensagemEnviadaEm: null,
        lembreteEnviadoEm: null,
        appointment: appointment
          ? {
              dataHora: appointment.dataHora.toISOString(),
              tipoConsulta: appointment.tipoConsulta,
              profissional: appointment.profissional,
            }
          : undefined,
      }
    }
    throw error
  }

  return {
    exists: true,
    status: data.status,
    agendamentoId: appointmentId,
    dadosConfirmados: data.dados_confirmados ?? false,
    documentosEnviados: data.documentos_enviados ?? false,
    instrucoesEnviadas: data.instrucoes_enviadas ?? false,
    pendencias: data.pendencias,
    mensagemEnviadaEm: data.mensagem_enviada_em,
    lembreteEnviadoEm: data.lembrete_enviado_em,
    appointment: appointment
      ? {
          dataHora: appointment.dataHora.toISOString(),
          tipoConsulta: appointment.tipoConsulta,
          profissional: appointment.profissional,
        }
      : undefined,
  }
}

/**
 * Find the next upcoming appointment for a patient.
 *
 * @param pacienteId - Patient ID (optional)
 * @param telefone - Patient phone number (optional, used if pacienteId not provided)
 * @returns Next appointment or null if none found
 */
async function findNextAppointment(
  pacienteId?: number,
  telefone?: string
): Promise<{ id: number } | null> {
  const now = new Date()

  // Build where clause for active future appointments
  const where: {
    dataHora: { gte: Date }
    status: { notIn: string[] }
    pacienteId?: number
  } = {
    dataHora: { gte: now },
    status: { notIn: ['cancelada', 'faltou'] },
  }

  if (pacienteId) {
    where.pacienteId = pacienteId
  } else if (telefone) {
    // Find patient by phone first
    const normalizedPhone = telefone.replace(/\D/g, '')
    const patient = await prisma.patient.findUnique({
      where: { telefone: normalizedPhone },
      select: { id: true },
    })

    if (!patient) {
      return null
    }

    where.pacienteId = patient.id
  }

  const appointment = await prisma.appointment.findFirst({
    where,
    orderBy: { dataHora: 'asc' },
    select: { id: true },
  })

  return appointment
}
