import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { fetchConversations } from '@/lib/api/conversations'
import { PatientHeader } from '@/components/patients/patient-header'
import { ContactInfoSection } from '@/components/patients/contact-info-section'
import { PatientStats } from '@/components/patients/patient-stats'
import { AppointmentHistory } from '@/components/patients/appointment-history'
import { ConversationHistory } from '@/components/patients/conversation-history'
import { DocumentSection } from '@/components/patients/document-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function PatientProfilePage({ params }: PageProps) {
  // Await params (Next.js 15+)
  const { id } = await params;

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
    where: { id },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
      },
    },
  })

  // Return 404 if not found
  if (!patient) {
    notFound()
  }

  // Fetch conversations for this patient (by patientId filter)
  let patientConversations: Array<{
    id: string
    whatsappId: string
    status: string
    messages: Array<{ timestamp: string; sender: 'patient' | 'ai' | 'human'; content: string }>
    lastMessageAt: Date
  }> = []

  try {
    const allConversations = await fetchConversations({ patientId: patient.id })
    patientConversations = allConversations.map((thread) => ({
      id: thread.sessionId,
      whatsappId: thread.phoneNumber,
      status: thread.status,
      messages: thread.messages.map((msg) => ({
        timestamp: thread.lastMessageAt.toISOString(),
        sender: msg.type === 'human' ? 'patient' as const : msg.type === 'ai' ? 'ai' as const : 'human' as const,
        content: msg.content,
      })),
      lastMessageAt: thread.lastMessageAt,
    }))
  } catch (error) {
    console.error('Error fetching patient conversations:', error)
    // Continue without conversations - don't fail the page
  }

  // Log audit entry for PHI access (fire-and-forget)
  logAudit({
    userId: user.id,
    action: AuditAction.VIEW_PATIENT,
    resource: 'patients',
    resourceId: patient.id,
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/pacientes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Pacientes
            </Button>
          </Link>
        </div>

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
          <ConversationHistory conversations={patientConversations} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentSection patientId={patient.id} />
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
}
