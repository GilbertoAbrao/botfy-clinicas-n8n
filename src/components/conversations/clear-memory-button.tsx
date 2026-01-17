'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ClearMemoryButtonProps {
  sessionId: string
  onCleared?: () => void
}

/**
 * Button with confirmation dialog to clear AI memory for a conversation.
 * Deletes all chat history for the session, forcing the AI to start fresh.
 *
 * Use case: When AI enters a loop or gets confused, staff can reset context.
 */
export function ClearMemoryButton({ sessionId, onCleared }: ClearMemoryButtonProps) {
  const [isClearing, setIsClearing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleClearMemory = async () => {
    setIsClearing(true)
    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(sessionId)}/memory`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao limpar memoria')
      }

      toast.success(`Memoria limpa! ${data.deletedCount} mensagens removidas.`)
      setIsOpen(false)
      onCleared?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao limpar memoria'
      toast.error(message)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Limpar Memoria
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar Memoria da IA?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta acao ira apagar todo o historico de conversas desta sessao.
              A IA perdera o contexto e comecara do zero.
            </p>
            <p className="font-medium text-amber-600">
              Use quando a IA estiver em loop ou respondendo de forma incorreta.
            </p>
            <p className="text-xs text-muted-foreground">
              Esta acao e irreversivel e sera registrada no log de auditoria.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearMemory}
            disabled={isClearing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isClearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirmar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
