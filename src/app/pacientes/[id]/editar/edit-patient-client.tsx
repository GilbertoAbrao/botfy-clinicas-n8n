'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Patient } from '@prisma/client';

import { PatientForm } from '@/components/patients/patient-form';
import type { PatientFormData } from '@/lib/validations/patient';
import { updatePatient } from './actions';

interface EditPatientClientProps {
  patient: Patient;
}

export function EditPatientClient({ patient }: EditPatientClientProps) {
  const router = useRouter();

  async function handleSubmit(data: PatientFormData) {
    const result = await updatePatient(patient.id, data);

    if (result.success) {
      toast.success('Paciente atualizado com sucesso');
      router.push(`/pacientes/${patient.id}`);
    } else {
      toast.error(result.error || 'Erro ao atualizar paciente');
      throw new Error(result.error);
    }
  }

  function handleCancel() {
    router.push(`/pacientes/${patient.id}`);
  }

  return (
    <PatientForm
      mode="edit"
      initialData={patient}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
