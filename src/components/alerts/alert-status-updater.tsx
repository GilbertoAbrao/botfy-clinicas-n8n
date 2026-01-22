'use client'

import { useState } from 'react'
import type { AlertStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateAlertStatus } from '@/lib/api/alerts'
import { toast } from 'sonner'

interface AlertStatusUpdaterProps {
  currentStatus: AlertStatus
  alertId: string
  onStatusChange?: () => void
  onStatusChangeStart?: () => void
}

const statusLabels: Record<AlertStatus, string> = {
  new: 'Novo',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  dismissed: 'Descartado',
}

const statusColors: Record<AlertStatus, string> = {
  new: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  dismissed: 'bg-gray-100 text-gray-800 border-gray-300',
}

export function AlertStatusUpdater({
  currentStatus,
  alertId,
  onStatusChange,
  onStatusChangeStart,
}: AlertStatusUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<AlertStatus | null>(null)
  const [note, setNote] = useState('')

  const handleStatusClick = (newStatus: AlertStatus) => {
    // Notify parent that user is starting to edit
    if (onStatusChangeStart) {
      onStatusChangeStart()
    }

    // For resolved/dismissed, show confirmation dialog
    if (newStatus === 'resolved' || newStatus === 'dismissed') {
      setPendingStatus(newStatus)
      setShowDialog(true)
    } else {
      // For in_progress, update immediately
      updateStatus(newStatus)
    }
  }

  const updateStatus = async (newStatus: AlertStatus, noteText?: string) => {
    setIsUpdating(true)

    try {
      await updateAlertStatus(alertId, newStatus)

      // Audit logging is handled by the server action

      toast.success(
        `Status atualizado para ${statusLabels[newStatus].toLowerCase()}`
      )

      // Close dialog and reset state
      setShowDialog(false)
      setPendingStatus(null)
      setNote('')

      // Call callback to refresh data
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error('Error updating alert status:', error)
      toast.error('Erro ao atualizar status. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConfirm = () => {
    if (pendingStatus) {
      updateStatus(pendingStatus, note)
    }
  }

  const handleCancel = () => {
    setShowDialog(false)
    setPendingStatus(null)
    setNote('')
  }

  // Show status badge only for resolved/dismissed (no more actions available)
  if (currentStatus === 'resolved' || currentStatus === 'dismissed') {
    return (
      <div>
        <Badge className={statusColors[currentStatus]} variant="outline">
          {statusLabels[currentStatus]}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Status atual:
        </span>
        <Badge className={statusColors[currentStatus]} variant="outline">
          {statusLabels[currentStatus]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {currentStatus === 'new' && (
          <Button
            onClick={() => handleStatusClick('in_progress')}
            disabled={isUpdating}
            className="h-11 sm:h-auto"
          >
            Iniciar
          </Button>
        )}

        {currentStatus === 'in_progress' && (
          <>
            <Button
              onClick={() => handleStatusClick('resolved')}
              disabled={isUpdating}
              variant="default"
              className="h-11 sm:h-auto bg-green-600 hover:bg-green-700"
            >
              Resolver
            </Button>
            <Button
              onClick={() => handleStatusClick('dismissed')}
              disabled={isUpdating}
              variant="outline"
              className="h-11 sm:h-auto"
            >
              Descartar
            </Button>
          </>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'resolved'
                ? 'Resolver Alerta'
                : 'Descartar Alerta'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === 'resolved'
                ? 'Confirma que o problema foi resolvido?'
                : 'Confirma que este alerta deve ser descartado?'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="note">
              Observações (opcional)
            </Label>
            <Textarea
              id="note"
              placeholder="Adicione uma nota sobre a resolução..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isUpdating}
              className={
                pendingStatus === 'resolved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {isUpdating ? 'Atualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
