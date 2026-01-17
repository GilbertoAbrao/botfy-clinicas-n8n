'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  patientName: string
  serviceName: string
  currentDateTime: string // ISO format
  onSuccess: () => void
}

/**
 * Modal for rescheduling appointments directly from alert detail.
 * Shows current appointment info and allows selecting new date/time.
 * Handles conflict detection via 409 response from API.
 */
export function RescheduleModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  serviceName,
  currentDateTime,
  onSuccess,
}: RescheduleModalProps) {
  const [loading, setLoading] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [newDateTime, setNewDateTime] = useState('')
  const [notes, setNotes] = useState('')

  // Format current date/time for display
  const currentDate = new Date(currentDateTime)
  const formattedCurrentDateTime = format(
    currentDate,
    "d 'de' MMMM 'de' yyyy, HH:mm",
    { locale: ptBR }
  )

  // Format for datetime-local input
  const getDateTimeLocalFormat = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Set default new time to same time tomorrow
  const handleOpen = () => {
    if (isOpen && !newDateTime) {
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      setNewDateTime(getDateTimeLocalFormat(tomorrow))
    }
  }

  // Reset state when modal opens
  useState(() => {
    handleOpen()
  })

  const handleSubmit = async () => {
    if (!newDateTime) {
      toast.error('Selecione a nova data e horario')
      return
    }

    setLoading(true)
    setConflictError(null)

    try {
      const response = await fetch(`/api/agendamentos/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataHora: newDateTime,
          observacoes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle conflict error specially
        if (response.status === 409) {
          setConflictError(
            'Conflito de horario: ja existe um agendamento neste horario para este profissional. Escolha outro horario.'
          )
          toast.error('Horario indisponivel')
          return
        }

        throw new Error(data.error || 'Erro ao reagendar')
      }

      toast.success('Agendamento reagendado com sucesso!')
      onSuccess()
      handleClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reagendar'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNewDateTime('')
    setNotes('')
    setConflictError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reagendar: {patientName}
          </DialogTitle>
          <DialogDescription>
            Selecione a nova data e horario para o agendamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Conflict error warning */}
          {conflictError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{conflictError}</p>
            </div>
          )}

          {/* Current appointment info (read-only) */}
          <div className="p-3 bg-muted rounded-md space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Servico:</span>
              <span>{serviceName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Atual:</span>
              <span>{formattedCurrentDateTime}</span>
            </div>
          </div>

          {/* New date/time input */}
          <div>
            <Label htmlFor="newDateTime">Nova Data e Horario</Label>
            <Input
              id="newDateTime"
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => {
                setNewDateTime(e.target.value)
                setConflictError(null) // Clear conflict error when user changes time
              }}
              className="h-11" // Mobile-friendly touch target
              min={new Date().toISOString().slice(0, 16)} // Prevent past dates
            />
          </div>

          {/* Notes textarea */}
          <div>
            <Label htmlFor="notes">Observacoes (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo do reagendamento, instrucoes especiais..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="h-11 sm:h-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !newDateTime}
            className="h-11 sm:h-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reagendando...
              </>
            ) : (
              'Confirmar Reagendamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
