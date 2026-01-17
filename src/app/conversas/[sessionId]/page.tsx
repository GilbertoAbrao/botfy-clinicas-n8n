import { Suspense } from 'react'
import Link from 'next/link'
import { getConversationBySessionId } from '@/lib/api/conversations'
import { ConversationThread } from '@/components/conversations/conversation-thread'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, User, Phone, MessageSquare } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

interface PageProps {
  params: Promise<{
    sessionId: string
  }>
}

export default async function ConversationDetailPage({ params }: PageProps) {
  // Check authentication
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/auth/login')
  }

  // Await params (Next.js 15+)
  const { sessionId } = await params
  const decodedSessionId = decodeURIComponent(sessionId)

  // Fetch conversation
  const conversation = await getConversationBySessionId(decodedSessionId)

  if (!conversation) {
    notFound()
  }

  // Status colors
  const statusColors = {
    IA: 'bg-purple-500 text-white',
    HUMANO: 'bg-yellow-500 text-white',
    FINALIZADO: 'bg-gray-400 text-white',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/conversas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Conversas
            </Button>
          </Link>
        </div>

        {/* Header with conversation info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversation.patient ? (
                <div>
                  <p className="font-semibold text-lg">{conversation.patient.nome}</p>
                  {conversation.patient.email && (
                    <p className="text-sm text-gray-600">{conversation.patient.email}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">Paciente não identificado</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Telefone não corresponde a nenhum paciente cadastrado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg">{conversation.phoneNumber}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {conversation.sessionId}
              </p>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Status da Conversa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={statusColors[conversation.status]}>
                {conversation.status}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                {conversation.messageCount} {conversation.messageCount === 1 ? 'mensagem' : 'mensagens'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversation Thread */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationThread
              messages={conversation.messages.map((msg, idx) => ({
                id: `${conversation.sessionId}-${idx}`,
                content: msg.content,
                sender: msg.type === 'human' ? 'patient' : msg.type === 'ai' ? 'ai' : 'system',
                sentAt: new Date(), // We don't have timestamps in the data
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
