import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUserWithRole } from '@/lib/auth/session';
import { NewPatientClient } from './new-patient-client';

export const metadata: Metadata = {
  title: 'Cadastrar Novo Paciente | Botfy ClinicOps',
  description: 'Cadastrar novo paciente no sistema',
};

export default async function NewPatientPage() {
  // Check authentication
  const user = await getCurrentUserWithRole();
  if (!user) {
    redirect('/entrar');
  }

  // Check authorization
  if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
    redirect('/403');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cadastrar Novo Paciente</h1>
        <p className="text-muted-foreground mt-2">
          Preencha os dados do paciente. Campos com * são obrigatórios.
        </p>
      </div>

      <div className="max-w-4xl">
        <NewPatientClient />
      </div>
    </div>
  );
}
