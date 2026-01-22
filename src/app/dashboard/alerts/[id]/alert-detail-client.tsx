'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertDetail } from '@/components/alerts/alert-detail'
import { AlertWithRelations } from '@/lib/api/alerts'
import { useAlertDetailSubscription, type SubscriptionState } from '@/lib/realtime/alerts'
import { toast } from 'sonner'
import type { Alert as AlertType } from '@prisma/client'
import { Badge } from '@/components/ui/badge'

interface AlertDetailClientProps {
  alert: AlertWithRelations
}

export function AlertDetailClient({ alert: initialAlert }: AlertDetailClientProps) {
  const router = useRouter()
  const [alert, setAlert] = useState<AlertWithRelations>(initialAlert)
  const [connectionStatus, setConnectionStatus] = useState<SubscriptionState>({
    status: 'disconnected',
  })
  const [isUserEditing, setIsUserEditing] = useState(false)

  // Handle alert updates from real-time subscription
  const handleAlertUpdate = useCallback((updatedAlert: AlertType) => {
    console.log('[AlertDetailClient] Alert updated:', updatedAlert.id)

    // Check if user is currently editing status
    if (isUserEditing) {
      // Show warning about concurrent edit
      toast.warning('Outro usuário modificou este alerta. As alterações mais recentes estão sendo exibidas.')
    } else {
      // Show subtle notification
      toast.info('Este alerta foi atualizado em tempo real')
    }

    // Update alert state with new data (keep existing relations)
    setAlert((prev) => ({
      ...prev,
      ...updatedAlert,
      // Keep existing relations (full relations not sent in real-time payload)
      patient: prev.patient,
      appointment: prev.appointment,
      resolver: prev.resolver,
    }))

    // Also refresh the page to get full data with relations
    router.refresh()
  }, [isUserEditing, router])

  // Handle connection status changes
  const handleStatusChange = useCallback((state: SubscriptionState) => {
    console.log('[AlertDetailClient] Status change:', state.status)
    setConnectionStatus(state)

    // Show error toast if connection fails
    if (state.status === 'error') {
      toast.error(state.error || 'Falha ao conectar atualizações em tempo real')
    }
  }, [])

  // Subscribe to real-time updates for this alert
  useAlertDetailSubscription(alert.id, handleAlertUpdate, handleStatusChange)

  const handleStatusChangeStart = () => {
    // Mark that user is editing to detect conflicts
    setIsUserEditing(true)
  }

  const handleStatusChangeComplete = () => {
    // User finished editing
    setIsUserEditing(false)
    // Refresh the server component data after status change
    router.refresh()
  }

  // Sync alert when initialAlert changes (page navigation)
  useEffect(() => {
    setAlert(initialAlert)
  }, [initialAlert])

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connectionStatus.status === 'subscribed' && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse" />
              Conectado
            </Badge>
          )}
          {connectionStatus.status === 'disconnected' && (
            <Badge variant="outline" className="text-gray-500 border-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2" />
              Desconectado
            </Badge>
          )}
          {connectionStatus.status === 'error' && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2" />
              Erro de Conexão
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            Atualizações em tempo real
          </span>
        </div>
      </div>

      {/* Alert detail */}
      <AlertDetail
        alert={alert}
        onStatusChange={handleStatusChangeComplete}
        onStatusChangeStart={handleStatusChangeStart}
      />
    </div>
  )
}
