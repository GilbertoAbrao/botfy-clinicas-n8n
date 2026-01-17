'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getCurrentUserWithRole } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { patientSchema, type PatientFormData } from '@/lib/validations/patient';

export async function createPatient(data: PatientFormData) {
  // Validate session
  const user = await getCurrentUserWithRole();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Check authorization - Only ADMIN and ATENDENTE can create patients
  if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
    return { success: false, error: 'Sem permissão para criar pacientes' };
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

  try {
    // Check CPF uniqueness if provided
    if (validatedData.cpf && validatedData.cpf !== '') {
      const existing = await prisma.patient.findUnique({
        where: { cpf: validatedData.cpf },
      });

      if (existing) {
        return { success: false, error: 'CPF já cadastrado' };
      }
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        nome: validatedData.nome,
        telefone: validatedData.telefone,
        email: validatedData.email || null,
        cpf: validatedData.cpf || null,
        dataNascimento: validatedData.dataNascimento
          ? new Date(validatedData.dataNascimento)
          : null,
        endereco: validatedData.endereco || null,
        convenio: validatedData.convenio || null,
        numeroCarteirinha: validatedData.numeroCarteirinha || null,
      },
    });

    // Get request headers for audit log
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || undefined;
    const userAgent = headersList.get('user-agent') || undefined;

    // Log audit entry
    await logAudit({
      userId: user.id,
      action: AuditAction.CREATE_PATIENT,
      resource: 'patients',
      resourceId: patient.id,
      details: {
        patientName: patient.nome,
        telefone: patient.telefone,
      },
      ipAddress,
      userAgent,
    });

    // Revalidate patients list
    revalidatePath('/pacientes');
    revalidatePath(`/pacientes/${patient.id}`);

    return { success: true, patientId: patient.id };
  } catch (error) {
    console.error('[CREATE_PATIENT_ERROR]', error);
    return {
      success: false,
      error: 'Erro ao criar paciente. Tente novamente.',
    };
  }
}
