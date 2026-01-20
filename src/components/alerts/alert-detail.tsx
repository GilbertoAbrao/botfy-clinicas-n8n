'use client'

import { useState } from 'react'
import { AlertWithRelations } from '@/lib/api/alerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertStatusUpdater } from './alert-status-updater'
import { ConversationThread } from '../conversations/conversation-thread'
import { ClearMemoryButton } from '../conversations/clear-memory-button'
import { RescheduleModal, SendMessageModal } from '../interventions'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Copy, Phone, Mail, User, Calendar, MessageSquare, CalendarClock, Send } from 'lucide-react'
import { toast } from 'sonner'

interface AlertDetailProps {
  alert: AlertWithRelations
  onStatusChange?: () => void
  onStatusChangeStart?: () => void
}

const alertTypeLabels: Record<string, string> = {
  no_show: 'Falta em Consulta',
  conversation_stuck: 'Conversa Travada',
  schedule_conflict: 'Conflito de Horário',
  payment_failed: 'Falha no Pagamento',
}

const priorityLabels: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alto',
  low: 'Baixo',
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
}

const appointmentStatusLabels: Record<string, string> = {
  tentative: 'Tentativa',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
}

const conversationStatusLabels: Record<string, string> = {
  ai_handling: 'IA Atendendo',
  human_required: 'Requer Humano',
  completed: 'Finalizado',
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copiado`)
}

export function AlertDetail({ alert, onStatusChange, onStatusChangeStart }: AlertDetailProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [sendMessageOpen, setSendMessageOpen] = useState(false)

  const createdAt = new Date(alert.createdAt)

  // Resolve alert via API after successful intervention
  const resolveAlert = async (interventionType: 'reschedule' | 'send_message' | 'clear_memory') => {
    try {
      const response = await fetch(`/api/alerts/${alert.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interventionType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao resolver alerta')
      }

      // Notify parent to refresh
      onStatusChange?.()
    } catch (error) {
      console.error('Error resolving alert:', error)
      // Don't show error toast - the intervention was successful, just the auto-resolve failed
      // The user can manually resolve if needed
    }
  }

  const handleRescheduleSuccess = () => {
    resolveAlert('reschedule')
    setRescheduleOpen(false)
    toast.success('Agendamento reagendado e alerta resolvido')
  }

  const handleSendMessageSuccess = () => {
    resolveAlert('send_message')
    setSendMessageOpen(false)
  }

  // Parse conversation messages if available
  // The messages field is JSON, so we need to safely parse it
  let conversationMessages: Array<{
    id: string
    content: string
    sender: 'patient' | 'ai' | 'system'
    sentAt: Date | string
  }> = []

  if (alert.conversation?.messages) {
    try {
      const messages = alert.conversation.messages as unknown
      if (Array.isArray(messages)) {
        conversationMessages = messages.filter(
          (m: unknown): m is { id: string; content: string; sender: 'patient' | 'ai' | 'system'; sentAt: Date | string } =>
            m !== null &&
            typeof m === 'object' &&
            'id' in m &&
            'content' in m &&
            'sender' in m &&
            'sentAt' in m
        )
      }
    } catch (e) {
      console.error('Failed to parse conversation messages:', e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{alert.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(createdAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {alertTypeLabels[alert.type] || alert.type}
              </Badge>
              <Badge className={priorityColors[alert.priority]} variant="outline">
                {priorityLabels[alert.priority] || alert.priority}
              </Badge>
            </div>
          </div>
          {alert.description && (
            <p className="text-sm text-muted-foreground pt-2">
              {alert.description}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertStatusUpdater
            currentStatus={alert.status}
            alertId={alert.id}
            onStatusChange={onStatusChange}
            onStatusChangeStart={onStatusChangeStart}
          />
          {alert.resolvedAt && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              <p>
                Resolvido {formatDistanceToNow(new Date(alert.resolvedAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
              {alert.resolver?.email && (
                <p>por {alert.resolver.email}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Section */}
      {alert.patient ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-lg font-semibold">{alert.patient.nome}</p>
            </div>

            {alert.patient.telefone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${alert.patient.telefone}`}
                    className="text-sm hover:underline"
                  >
                    {alert.patient.telefone}
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(alert.patient!.telefone!, 'Telefone')
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {alert.patient.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${alert.patient.email}`}
                    className="text-sm hover:underline"
                  >
                    {alert.patient.email}
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(alert.patient!.email!, 'E-mail')
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {alert.patient.cpf && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">CPF:</span> {alert.patient.cpf}
              </div>
            )}

            <div className="pt-2">
              <Link href={`/pacientes/${alert.patient.id}`}>
                <Button variant="outline" size="sm">
                  Ver perfil completo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Paciente não vinculado</p>
          </CardContent>
        </Card>
      )}

      {/* Appointment Section */}
      {alert.appointment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-lg font-semibold">
                {alert.appointment.tipoConsulta}
              </p>
            </div>

            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Data e Horário</p>
              <p>
                {format(
                  new Date(alert.appointment.dataHora),
                  "d 'de' MMMM 'de' yyyy, HH:mm",
                  { locale: ptBR }
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {(alert.appointment.status && appointmentStatusLabels[alert.appointment.status]) ||
                  alert.appointment.status || 'Pendente'}
              </Badge>
              {alert.appointment.duracaoMinutos && (
                <span className="text-sm text-muted-foreground">
                  {alert.appointment.duracaoMinutos} minutos
                </span>
              )}
            </div>

            {alert.appointment.observacoes && (
              <div className="text-sm">
                <p className="font-medium text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap">{alert.appointment.observacoes}</p>
              </div>
            )}

            <div className="pt-2">
              <Link href="/agenda">
                <Button variant="outline" size="sm">
                  Ver agenda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Section */}
      {alert.conversation && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversa
            </CardTitle>
            {/* Clear Memory button in header */}
            {alert.chatSessionId && (
              <ClearMemoryButton sessionId={alert.chatSessionId} />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="outline">
                {conversationStatusLabels[alert.conversation.status] ||
                  alert.conversation.status}
              </Badge>
              {alert.conversation.lastMessageAt && (
                <span className="text-sm text-muted-foreground">
                  Ultima mensagem{' '}
                  {formatDistanceToNow(
                    new Date(alert.conversation.lastMessageAt),
                    {
                      addSuffix: true,
                      locale: ptBR,
                    }
                  )}
                </span>
              )}
            </div>

            {/* Conversation thread with WhatsApp styling */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <ConversationThread
                messages={conversationMessages}
                compact={true}
                conversationId={alert.conversation.id}
              />
            </div>

            {/* Link to full conversation */}
            {alert.chatSessionId && (
              <div className="flex justify-end pt-2">
                <Link href={`/conversas/${encodeURIComponent(alert.chatSessionId)}`}>
                  <Button variant="outline" size="sm">
                    Ver conversa completa
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intervencoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Acoes rapidas para resolver este alerta.
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Reagendar button - only if appointment exists */}
              <Button
                variant="outline"
                className="h-11 sm:h-auto gap-2"
                onClick={() => setRescheduleOpen(true)}
                disabled={!alert.appointment}
                title={!alert.appointment ? 'Sem agendamento vinculado' : undefined}
              >
                <CalendarClock className="h-4 w-4" />
                Reagendar
              </Button>

              {/* Enviar Mensagem button - only if patient phone exists */}
              <Button
                variant="outline"
                className="h-11 sm:h-auto gap-2"
                onClick={() => setSendMessageOpen(true)}
                disabled={!alert.patient?.telefone}
                title={!alert.patient?.telefone ? 'Paciente sem telefone cadastrado' : undefined}
              >
                <Send className="h-4 w-4" />
                Enviar Mensagem
              </Button>

              {/* Clear Memory is functional */}
              {alert.chatSessionId && (
                <ClearMemoryButton sessionId={alert.chatSessionId} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reschedule Modal */}
      {alert.appointment && (
        <RescheduleModal
          isOpen={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          appointmentId={String(alert.appointment.id)}
          patientName={alert.patient?.nome || 'Paciente'}
          serviceName={alert.appointment.tipoConsulta || 'Consulta'}
          currentDateTime={
            typeof alert.appointment.dataHora === 'string'
              ? alert.appointment.dataHora
              : alert.appointment.dataHora.toISOString()
          }
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Send Message Modal */}
      {alert.patient?.telefone && (
        <SendMessageModal
          isOpen={sendMessageOpen}
          onClose={() => setSendMessageOpen(false)}
          patientName={alert.patient.nome}
          patientPhone={alert.patient.telefone}
          alertType={alert.type}
          appointmentInfo={
            alert.appointment
              ? {
                  serviceName: alert.appointment.tipoConsulta || 'Consulta',
                  dateTime:
                    typeof alert.appointment.dataHora === 'string'
                      ? alert.appointment.dataHora
                      : alert.appointment.dataHora.toISOString(),
                }
              : undefined
          }
          onSuccess={handleSendMessageSuccess}
        />
      )}
    </div>
  )
}
