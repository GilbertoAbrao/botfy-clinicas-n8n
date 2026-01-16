import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { PatientHeader } from '@/components/patients/patient-header'
import { ContactInfoSection } from '@/components/patients/contact-info-section'
import { PatientStats } from '@/components/patients/patient-stats'
import { AppointmentHistory } from '@/components/patients/appointment-history'
import { ConversationHistory } from '@/components/patients/conversation-history'
import { DocumentSection } from '@/components/patients/document-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PatientProfilePage({ params }: PageProps) {
  // Authentication check
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/entrar')
  }

  // Authorization check - only ADMIN and ATENDENTE can view patient profiles
  if (user.role !== 'ADMIN' && user.role !== 'ATENDENTE') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="mt-2 text-gray-600">
            Você não tem permissão para visualizar perfis de pacientes.
          </p>
        </div>
      </div>
    )
  }

  // Fetch patient with relations
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
      },
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
      },
    },
  })

  // Return 404 if not found
  if (!patient) {
    notFound()
  }

  // Log audit entry for PHI access (fire-and-forget)
  logAudit({
    userId: user.id,
    action: AuditAction.VIEW_PATIENT,
    resource: 'patients',
    resourceId: patient.id,
  })

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <PatientHeader patient={patient} />

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <PatientStats appointments={patient.appointments} />
          <ContactInfoSection patient={patient} />
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <AppointmentHistory appointments={patient.appointments} />
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations">
          <ConversationHistory
            conversations={patient.conversations.map((conv) => ({
              ...conv,
              messages: Array.isArray(conv.messages)
                ? (conv.messages as any[])
                : [],
            }))}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentSection patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
