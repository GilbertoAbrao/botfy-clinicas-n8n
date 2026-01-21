'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface SendReminderDialogProps {
  open: boolean
  patientName: string
  loading?: boolean
  disabled?: boolean
  disabledReason?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * SendReminderDialog Component
 *
 * Confirmation dialog shown before sending a pre-checkin reminder.
 * Shows patient name and handles rate limiting disabled state.
 *
 * Features:
 * - Confirmation before sending
 * - Loading state with spinner
 * - Disabled state with reason (for rate limiting)
 */
export function SendReminderDialog({
  open,
  patientName,
  loading = false,
  disabled = false,
  disabledReason,
  onConfirm,
  onCancel,
}: SendReminderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enviar lembrete?</AlertDialogTitle>
          <AlertDialogDescription>
            {disabled ? (
              <span className="text-amber-600">{disabledReason}</span>
            ) : (
              <>
                Deseja enviar lembrete de pre-checkin para{' '}
                <span className="font-semibold">{patientName}</span>?
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading || disabled}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
