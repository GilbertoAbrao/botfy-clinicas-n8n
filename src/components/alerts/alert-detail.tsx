'use client'

import { AlertWithRelations } from '@/lib/api/alerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertStatusUpdater } from './alert-status-updater'
import { ConversationThread } from '../conversations/conversation-thread'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { Copy, Phone, Mail, User, Calendar, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface AlertDetailProps {
  alert: AlertWithRelations
  onStatusChange?: () => void
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

export function AlertDetail({ alert, onStatusChange }: AlertDetailProps) {
  const createdAt = new Date(alert.createdAt)

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
              <Button variant="outline" size="sm" disabled>
                Ver perfil completo
                <span className="ml-2 text-xs text-muted-foreground">
                  (Fase 3)
                </span>
              </Button>
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
                {alert.appointment.serviceType}
              </p>
            </div>

            <div className="text-sm">
              <p className="font-medium text-muted-foreground">Data e Horário</p>
              <p>
                {format(
                  new Date(alert.appointment.scheduledAt),
                  "d 'de' MMMM 'de' yyyy, HH:mm",
                  { locale: ptBR }
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {appointmentStatusLabels[alert.appointment.status] ||
                  alert.appointment.status}
              </Badge>
              {alert.appointment.duration && (
                <span className="text-sm text-muted-foreground">
                  {alert.appointment.duration} minutos
                </span>
              )}
            </div>

            {alert.appointment.notes && (
              <div className="text-sm">
                <p className="font-medium text-muted-foreground">Observações</p>
                <p className="whitespace-pre-wrap">{alert.appointment.notes}</p>
              </div>
            )}

            <div className="pt-2">
              <Button variant="outline" size="sm" disabled>
                Ver agendamento completo
                <span className="ml-2 text-xs text-muted-foreground">
                  (Fase 4)
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Section */}
      {alert.conversation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {conversationStatusLabels[alert.conversation.status] ||
                  alert.conversation.status}
              </Badge>
              {alert.conversation.lastMessageAt && (
                <span className="text-sm text-muted-foreground">
                  Última mensagem{' '}
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

            <ConversationThread
              messages={conversationMessages}
              compact={true}
              conversationId={alert.conversation.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intervenções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Ações de intervenção rápida estarão disponíveis na Fase 6.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled className="h-11 sm:h-auto">
                Reagendar
                <span className="ml-2 text-xs text-muted-foreground">
                  (Fase 6)
                </span>
              </Button>
              <Button variant="outline" disabled className="h-11 sm:h-auto">
                Enviar Mensagem
                <span className="ml-2 text-xs text-muted-foreground">
                  (Fase 6)
                </span>
              </Button>
              <Button variant="outline" disabled className="h-11 sm:h-auto">
                Limpar Memória
                <span className="ml-2 text-xs text-muted-foreground">
                  (Fase 6)
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
