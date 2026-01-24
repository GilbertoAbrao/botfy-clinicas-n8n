/**
 * Patient Write Service
 *
 * Business logic for patient update operations used by the AI Agent API.
 * Supports partial updates with phone uniqueness validation.
 *
 * @module patient-write-service
 */

import { prisma } from '@/lib/prisma'
import { TZDate } from '@date-fns/tz'

/**
 * Input for updating a patient.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdatePatientInput {
  nome?: string
  telefone?: string
  email?: string
  cpf?: string
  dataNascimento?: TZDate
  convenio?: string
  observacoes?: string
}

/**
 * Result of patient update operation.
 */
export interface UpdatePatientResult {
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
 * Normalize phone number by removing all non-digit characters.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Update a patient with partial data.
 *
 * Features:
 * - Partial updates: Only provided fields are changed
 * - Phone uniqueness: Validates phone is not used by another patient
 * - Date conversion: Converts TZDate to Date for Prisma
 *
 * @param patientId - ID of the patient to update
 * @param input - Fields to update (partial)
 * @returns Updated patient data
 * @throws Error('Patient not found') if patient doesn't exist
 * @throws Error('Phone number already in use by another patient') if phone conflict
 */
export async function updatePatient(
  patientId: number,
  input: UpdatePatientInput
): Promise<UpdatePatientResult> {
  // 1. Verify patient exists
  const existingPatient = await prisma.patient.findUnique({
    where: { id: patientId },
  })

  if (!existingPatient) {
    throw new Error('Patient not found')
  }

  // 2. If telefone provided and different from current, check uniqueness
  if (input.telefone) {
    const normalizedNewPhone = normalizePhone(input.telefone)
    const normalizedCurrentPhone = normalizePhone(existingPatient.telefone)

    if (normalizedNewPhone !== normalizedCurrentPhone) {
      const phoneInUse = await prisma.patient.findUnique({
        where: { telefone: normalizedNewPhone },
      })

      if (phoneInUse && phoneInUse.id !== patientId) {
        throw new Error('Phone number already in use by another patient')
      }
    }
  }

  // 3. Build update data object (only include defined fields)
  const updateData: {
    nome?: string
    telefone?: string
    email?: string
    cpf?: string
    dataNascimento?: Date
    convenio?: string
    observacoes?: string
  } = {}

  if (input.nome !== undefined) {
    updateData.nome = input.nome
  }

  if (input.telefone !== undefined) {
    updateData.telefone = normalizePhone(input.telefone)
  }

  if (input.email !== undefined) {
    updateData.email = input.email
  }

  if (input.cpf !== undefined) {
    // Normalize CPF by removing non-digits
    updateData.cpf = input.cpf.replace(/\D/g, '')
  }

  if (input.dataNascimento !== undefined) {
    // Convert TZDate to Date for Prisma
    updateData.dataNascimento = new Date(input.dataNascimento)
  }

  if (input.convenio !== undefined) {
    updateData.convenio = input.convenio
  }

  if (input.observacoes !== undefined) {
    updateData.observacoes = input.observacoes
  }

  // 4. Update patient
  const updatedPatient = await prisma.patient.update({
    where: { id: patientId },
    data: updateData,
  })

  // 5. Format and return result
  return {
    id: updatedPatient.id,
    nome: updatedPatient.nome,
    telefone: updatedPatient.telefone,
    email: updatedPatient.email,
    cpf: updatedPatient.cpf,
    dataNascimento: updatedPatient.dataNascimento
      ? updatedPatient.dataNascimento.toISOString().split('T')[0]
      : null,
    convenio: updatedPatient.convenio,
    observacoes: updatedPatient.observacoes,
  }
}
