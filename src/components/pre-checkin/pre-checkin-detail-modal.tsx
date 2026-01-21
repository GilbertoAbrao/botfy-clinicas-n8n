'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from './status-badge'
import { WorkflowTimeline, TimelineStep } from './workflow-timeline'
import { SendReminderDialog } from './send-reminder-dialog'
import { PreCheckin, calculateProgress } from '@/lib/validations/pre-checkin'
import { dbTimestampToTZDate } from '@/lib/calendar/time-zone-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Bell,
  Phone,
  Calendar,
  Package,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface PreCheckinDetailModalProps {
  preCheckin: PreCheckin | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: () => void // Called after status update to refresh list
}

/**
 * PreCheckinDetailModal Component
 *
 * Full detail modal for pre-checkin records showing:
 * - Header with patient name and status badge
 * - Info section (appointment, service, phone, progress)
 * - Checklist (dados, documentos, instrucoes)
 * - Timeline showing workflow progression
 * - Actions (mark complete/incomplete, send reminder)
 */
export function PreCheckinDetailModal({
  preCheckin,
  isOpen,
  onClose,
  onStatusChange,
}: PreCheckinDetailModalProps) {
  // State
  const [loading, setLoading] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [canSendReminderState, setCanSendReminderState] = useState(true)
  const [reminderDisabledReason, setReminderDisabledReason] = useState<string | null>(null)

  // Check if reminder can be sent (rate limit)
  const checkCanSendReminder = useCallback(async () => {
    if (!preCheckin) return

    // If last reminder was sent, calculate if 4 hours have passed
    if (preCheckin.lembrete_enviado_em) {
      const now = new Date()
      const lastReminder = new Date(preCheckin.lembrete_enviado_em)
      const hoursSince = Math.floor((now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60))

      if (hoursSince < 4) {
        setCanSendReminderState(false)
        setReminderDisabledReason(`Proximo envio disponivel em ${Math.ceil(4 - hoursSince)} horas`)
        return
      }
    }

    setCanSendReminderState(true)
    setReminderDisabledReason(null)
  }, [preCheckin])

  // Check rate limit when modal opens
  useEffect(() => {
    if (isOpen && preCheckin) {
      checkCanSendReminder()
    }
  }, [isOpen, preCheckin, checkCanSendReminder])

  // Early return if no preCheckin
  if (!preCheckin) return null

  // Helpers
  const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) return '-'
    try {
      const date = dbTimestampToTZDate(dateString)
      return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
    } catch {
      return '-'
    }
  }

  const formatPhone = (phone: string | undefined): string => {
    if (!phone) return '-'
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return phone
  }

  const progress = calculateProgress(preCheckin)

  // Build timeline steps
  const buildTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = []

    // Step 1: Criado (always completed)
    steps.push({
      label: 'Pre-checkin criado',
      status: 'completed',
      timestamp: preCheckin.created_at,
    })

    // Step 2: Mensagem enviada
    if (preCheckin.mensagem_enviada_em) {
      steps.push({
        label: 'Mensagem enviada',
        status: 'completed',
        timestamp: preCheckin.mensagem_enviada_em,
      })
    }

    // Step 3: Lembrete enviado
    if (preCheckin.lembrete_enviado_em) {
      steps.push({
        label: 'Lembrete enviado',
        status: 'completed',
        timestamp: preCheckin.lembrete_enviado_em,
      })
    }

    // Step 4: Determine current/pending status
    if (preCheckin.status === 'completo') {
      steps.push({
        label: 'Completo',
        status: 'completed',
        timestamp: preCheckin.updated_at,
      })
    } else if (preCheckin.status === 'incompleto') {
      steps.push({
        label: 'Incompleto',
        status: 'completed',
        timestamp: preCheckin.updated_at,
      })
    } else {
      // Add current step based on status
      if (preCheckin.status === 'em_andamento') {
        steps.push({
          label: 'Em andamento',
          status: 'current',
          timestamp: null,
        })
        steps.push({
          label: 'Aguardando conclusao',
          status: 'pending',
          timestamp: null,
        })
      } else {
        // pendente
        steps.push({
          label: 'Aguardando paciente',
          status: 'current',
          timestamp: null,
        })
      }
    }

    return steps
  }

  // Action handlers
  const handleMarkStatus = async (status: 'completo' | 'incompleto') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pre-checkin/${preCheckin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar status')
      }

      toast.success(
        status === 'completo'
          ? 'Pre-checkin marcado como completo!'
          : 'Pre-checkin marcado como incompleto!'
      )
      onStatusChange()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async () => {
    setReminderLoading(true)
    try {
      const response = await fetch(`/api/pre-checkin/${preCheckin.id}/send-reminder`, {
        method: 'POST',
      })

      if (response.status === 429) {
        const data = await response.json()
        toast.error(data.error || 'Lembrete ja enviado recentemente')
        setCanSendReminderState(false)
        setReminderDisabledReason(data.error)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao enviar lembrete')
      }

      toast.success('Lembrete enviado!')
      setConfirmDialogOpen(false)
      onStatusChange()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar lembrete', {
        action: {
          label: 'Tentar novamente',
          onClick: () => handleSendReminder(),
        },
      })
    } finally {
      setReminderLoading(false)
    }
  }

  const timelineSteps = buildTimelineSteps()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{preCheckin.paciente?.nome || 'Paciente desconhecido'}</span>
              <StatusBadge status={preCheckin.status} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info section */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Consulta</p>
                  <p className="font-medium">
                    {formatDateTime(preCheckin.agendamento?.data_hora)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Servico</p>
                  <p className="font-medium">
                    {preCheckin.agendamento?.servico?.nome || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium font-mono">
                    {formatPhone(preCheckin.paciente?.telefone)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Progresso</p>
                  <p className="font-medium">{progress}%</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Checklist section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Checklist</h3>
              <div className="space-y-2">
                {/* Dados confirmados */}
                <div className="flex items-center gap-2">
                  {preCheckin.dados_confirmados ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                  <span
                    className={
                      preCheckin.dados_confirmados
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }
                  >
                    Dados confirmados
                  </span>
                </div>

                {/* Documentos enviados */}
                <div className="flex items-center gap-2">
                  {preCheckin.documentos_enviados ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                  <span
                    className={
                      preCheckin.documentos_enviados
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }
                  >
                    Documentos enviados
                  </span>
                </div>

                {/* Instrucoes enviadas */}
                <div className="flex items-center gap-2">
                  {preCheckin.instrucoes_enviadas ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                  <span
                    className={
                      preCheckin.instrucoes_enviadas
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }
                  >
                    Instrucoes enviadas
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Historico</h3>
              <WorkflowTimeline steps={timelineSteps} />
            </div>

            <Separator />

            {/* Actions section */}
            <div className="flex flex-wrap gap-2">
              {preCheckin.status !== 'completo' && (
                <Button
                  onClick={() => handleMarkStatus('completo')}
                  disabled={loading}
                  className="flex-1 min-w-[140px]"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar Completo
                </Button>
              )}

              {preCheckin.status !== 'incompleto' && (
                <Button
                  variant="outline"
                  onClick={() => handleMarkStatus('incompleto')}
                  disabled={loading}
                  className="flex-1 min-w-[140px]"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <XCircle className="h-4 w-4 mr-2" />
                  Marcar Incompleto
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={loading || !canSendReminderState}
                title={reminderDisabledReason || undefined}
                className="flex-1 min-w-[140px]"
              >
                <Bell className="h-4 w-4 mr-2" />
                Enviar Lembrete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Confirmation Dialog */}
      <SendReminderDialog
        open={confirmDialogOpen}
        patientName={preCheckin.paciente?.nome || 'Paciente'}
        loading={reminderLoading}
        disabled={!canSendReminderState}
        disabledReason={reminderDisabledReason || undefined}
        onConfirm={handleSendReminder}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </>
  )
}
