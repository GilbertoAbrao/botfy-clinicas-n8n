'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface DocumentRejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  isBulk?: boolean
  count?: number
}

/**
 * DocumentRejectModal Component
 *
 * Modal for rejecting documents with required reason.
 * Used for both single document rejection and bulk rejection.
 *
 * Features:
 * - Required reason field (min 5 characters)
 * - Client-side validation with error message
 * - Loading state during submission
 * - Bulk mode shows document count
 * - Clears form on close
 */
export function DocumentRejectModal({
  isOpen,
  onClose,
  onConfirm,
  isBulk = false,
  count = 1,
}: DocumentRejectModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    // Validate reason
    if (reason.trim().length < 5) {
      setError('Motivo deve ter pelo menos 5 caracteres')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onConfirm(reason.trim())
      setReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar documento')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const title = isBulk
    ? `Rejeitar ${count} documento${count > 1 ? 's' : ''}`
    : 'Rejeitar documento'

  const description = isBulk
    ? `Voce esta prestes a rejeitar ${count} documento${count > 1 ? 's' : ''}. Esta acao nao pode ser desfeita.`
    : 'Voce esta prestes a rejeitar este documento. Esta acao nao pode ser desfeita.'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo da rejeicao <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Informe o motivo da rejeicao do documento..."
              rows={4}
              disabled={loading}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimo de 5 caracteres. O paciente sera notificado sobre a rejeicao.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 5}
            variant="destructive"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
