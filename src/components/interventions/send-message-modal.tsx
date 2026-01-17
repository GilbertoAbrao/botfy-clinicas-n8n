'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, ExternalLink, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  patientName: string
  patientPhone: string
  alertType: string
  appointmentInfo?: {
    serviceName: string
    dateTime: string // ISO format
  }
  onSuccess: () => void
}

// Pre-filled message templates based on alert type
const messageTemplates: Record<string, (patientName: string, serviceName?: string) => string> = {
  conversation_stuck: (patientName) =>
    `Ola ${patientName}, percebemos que voce teve dificuldades com nosso atendimento automatico. Como posso ajudar?`,
  no_show: (patientName, serviceName) =>
    `Ola ${patientName}, sentimos sua falta na consulta${serviceName ? ` de ${serviceName}` : ''}. Gostaria de reagendar?`,
  schedule_conflict: (patientName) =>
    `Ola ${patientName}, houve um conflito no seu agendamento. Vamos encontrar um novo horario?`,
  payment_failed: (patientName) =>
    `Ola ${patientName}, houve um problema com o pagamento. Podemos ajudar a resolver?`,
  default: (patientName) =>
    `Ola ${patientName}, entrando em contato sobre seu atendimento na clinica.`,
}

/**
 * Format phone number for WhatsApp deep link.
 * Removes non-digits and adds Brazil country code (55) if needed.
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')

  // If starts with 0, remove it (local format)
  if (digits.startsWith('0')) {
    digits = digits.substring(1)
  }

  // If doesn't start with 55 (Brazil), add it
  if (!digits.startsWith('55')) {
    digits = '55' + digits
  }

  return digits
}

/**
 * Modal that prepares a WhatsApp message and opens the deep link.
 * Per PROJECT.md constraint: console does NOT send messages directly.
 * Opens wa.me deep link for staff to send manually via WhatsApp.
 */
export function SendMessageModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  alertType,
  appointmentInfo,
  onSuccess,
}: SendMessageModalProps) {
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Get initial message based on alert type
  const getInitialMessage = () => {
    const templateFn = messageTemplates[alertType] || messageTemplates.default
    return templateFn(patientName, appointmentInfo?.serviceName)
  }

  const [message, setMessage] = useState(getInitialMessage)

  // Reset message when modal opens with different patient
  useState(() => {
    setMessage(getInitialMessage())
  })

  const formattedPhone = formatPhoneForWhatsApp(patientPhone)
  const displayPhone = patientPhone // Show original format for display

  // Format appointment info if available
  const formattedAppointment = appointmentInfo
    ? `${appointmentInfo.serviceName} - ${format(
        new Date(appointmentInfo.dateTime),
        "d 'de' MMMM, HH:mm",
        { locale: ptBR }
      )}`
    : null

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(patientPhone)
    setCopied(true)
    toast.success('Telefone copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenWhatsApp = () => {
    // Construct WhatsApp deep link
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank')

    // Show confirmation dialog after a brief delay
    setTimeout(() => {
      setConfirmOpen(true)
    }, 1000)
  }

  const handleConfirmResolved = () => {
    setConfirmOpen(false)
    onSuccess()
    handleClose()
    toast.success('Alerta marcado como resolvido')
  }

  const handleClose = () => {
    setMessage(getInitialMessage())
    setCopied(false)
    setConfirmOpen(false)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Enviar Mensagem: {patientName}
            </DialogTitle>
            <DialogDescription>
              Edite a mensagem e abra o WhatsApp para enviar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Phone number with copy button */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Telefone:
                </span>
                <span className="font-mono">{displayPhone}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPhone}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Appointment info if available */}
            {formattedAppointment && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Consulta:</span> {formattedAppointment}
              </div>
            )}

            {/* Editable message */}
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={5}
                className="resize-none mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A mensagem sera aberta no WhatsApp para voce enviar manualmente.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 sm:h-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOpenWhatsApp}
              className="h-11 sm:h-auto gap-2"
              disabled={!message.trim()}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog after opening WhatsApp */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Resolvido?</AlertDialogTitle>
            <AlertDialogDescription>
              O WhatsApp foi aberto. Se voce enviou a mensagem, deseja marcar
              este alerta como resolvido?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>
              Nao, manter pendente
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResolved}>
              Sim, marcar como resolvido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
