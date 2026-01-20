'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getCurrentUserWithRole } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { patientSchema, type PatientFormData } from '@/lib/validations/patient';

export async function updatePatient(id: string, data: PatientFormData) {
  // Validate session
  const user = await getCurrentUserWithRole();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Check authorization - Only ADMIN and ATENDENTE can update patients
  if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
    return { success: false, error: 'Sem permissão para editar pacientes' };
  }

  // Validate data with Zod schema
  const validation = patientSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: 'Dados inválidos: ' + validation.error.issues[0].message,
    };
  }

  const validatedData = validation.data;
  const patientId = parseInt(id, 10);

  if (isNaN(patientId)) {
    return { success: false, error: 'ID de paciente inválido' };
  }

  try {
    // Check if patient exists
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existingPatient) {
      return { success: false, error: 'Paciente não encontrado' };
    }

    // Check CPF uniqueness if changed (exclude current patient)
    if (validatedData.cpf && validatedData.cpf !== '') {
      const cpfConflict = await prisma.patient.findFirst({
        where: {
          cpf: validatedData.cpf,
          id: { not: patientId },
        },
      });

      if (cpfConflict) {
        return { success: false, error: 'CPF já cadastrado em outro paciente' };
      }
    }

    // Track what changed for audit log
    const changes: Record<string, { from: any; to: any }> = {};

    if (existingPatient.nome !== validatedData.nome) {
      changes.nome = { from: existingPatient.nome, to: validatedData.nome };
    }
    if (existingPatient.telefone !== validatedData.telefone) {
      changes.telefone = { from: existingPatient.telefone, to: validatedData.telefone };
    }
    if (existingPatient.email !== (validatedData.email || null)) {
      changes.email = { from: existingPatient.email, to: validatedData.email || null };
    }
    if (existingPatient.cpf !== (validatedData.cpf || null)) {
      changes.cpf = { from: existingPatient.cpf, to: validatedData.cpf || null };
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        nome: validatedData.nome,
        telefone: validatedData.telefone,
        email: validatedData.email || null,
        cpf: validatedData.cpf || null,
        dataNascimento: validatedData.dataNascimento
          ? new Date(validatedData.dataNascimento)
          : null,
        convenio: validatedData.convenio || null,
        observacoes: validatedData.observacoes || null,
      },
    });

    // Get request headers for audit log
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || undefined;
    const userAgent = headersList.get('user-agent') || undefined;

    // Log audit entry with changed fields
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_PATIENT,
      resource: 'pacientes',
      resourceId: String(updatedPatient.id),
      details: {
        patientName: updatedPatient.nome,
        changes,
      },
      ipAddress,
      userAgent,
    });

    // Revalidate patient pages
    revalidatePath('/pacientes');
    revalidatePath(`/pacientes/${id}`);
    revalidatePath(`/pacientes/${id}/editar`);

    return { success: true };
  } catch (error) {
    console.error('[UPDATE_PATIENT_ERROR]', error);
    return {
      success: false,
      error: 'Erro ao atualizar paciente. Tente novamente.',
    };
  }
}
