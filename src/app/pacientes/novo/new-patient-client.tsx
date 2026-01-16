'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PatientForm } from '@/components/patients/patient-form';
import type { PatientFormData } from '@/lib/validations/patient';
import { createPatient } from './actions';

export function NewPatientClient() {
  const router = useRouter();

  async function handleSubmit(data: PatientFormData) {
    const result = await createPatient(data);

    if (result.success && result.patientId) {
      toast.success('Paciente cadastrado com sucesso');
      router.push(`/pacientes/${result.patientId}`);
    } else {
      toast.error(result.error || 'Erro ao cadastrar paciente');
      throw new Error(result.error);
    }
  }

  function handleCancel() {
    router.push('/pacientes');
  }

  return (
    <PatientForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
