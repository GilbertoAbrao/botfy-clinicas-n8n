import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { getCurrentUserWithRole } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { EditPatientClient } from './edit-patient-client';

interface EditPatientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: EditPatientPageProps): Promise<Metadata> {
  const params = await props.params;
  const patientId = parseInt(params.id, 10);
  const patient = patientId ? await prisma.patient.findUnique({
    where: { id: patientId },
    select: { nome: true },
  }) : null;

  return {
    title: `Editar Paciente - ${patient?.nome || 'Não encontrado'} | Botfy ClinicOps`,
    description: 'Editar informações do paciente',
  };
}

export default async function EditPatientPage(props: EditPatientPageProps) {
  const params = await props.params;

  // Check authentication
  const user = await getCurrentUserWithRole();
  if (!user) {
    redirect('/entrar');
  }

  // Check authorization
  if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
    redirect('/403');
  }

  // Parse patient ID
  const patientId = parseInt(params.id, 10);
  if (isNaN(patientId)) {
    notFound();
  }

  // Fetch patient data
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar Paciente - {patient.nome}</h1>
        <p className="text-muted-foreground mt-2">
          Atualize os dados do paciente. Campos com * são obrigatórios.
        </p>
      </div>

      <div className="max-w-4xl">
        <EditPatientClient patient={patient} />
      </div>
    </div>
  );
}
