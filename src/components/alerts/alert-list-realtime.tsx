'use client'

import { useState, useCallback, useEffect } from 'react'
import { AlertWithRelations } from '@/lib/api/alerts'
import { AlertList } from './alert-list'
import { useAlertSubscription, type AlertChangeEvent, type SubscriptionState } from '@/lib/realtime/alerts'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AlertPriority } from '@prisma/client'

interface AlertListRealtimeProps {
  initialAlerts: AlertWithRelations[]
}

/**
 * Real-time wrapper for AlertList component
 *
 * Subscribes to alert changes via Supabase real-time and updates the list automatically.
 * Shows connection status badge and toast notifications for urgent alerts.
 */
export function AlertListRealtime({ initialAlerts }: AlertListRealtimeProps) {
  const [alerts, setAlerts] = useState<AlertWithRelations[]>(initialAlerts)
  const [connectionStatus, setConnectionStatus] = useState<SubscriptionState>({
    status: 'disconnected',
  })

  // Handle alert changes from real-time subscription
  const handleAlertChange = useCallback((event: AlertChangeEvent) => {
    console.log('[AlertListRealtime] Alert change:', event.eventType, event.new?.id)

    if (event.eventType === 'INSERT' && event.new) {
      // Add new alert to the list (prepend to maintain priority sort)
      setAlerts((prev) => {
        // Deduplicate: check if alert already exists
        const exists = prev.some((a) => a.id === event.new!.id)
        if (exists) {
          return prev
        }

        // Add new alert at the beginning
        const newAlert: AlertWithRelations = {
          ...event.new!,
          patient: null, // Will be populated by refetch if needed
          appointment: null,
          conversation: null,
          resolver: null,
        }

        // Show toast notification for urgent alerts
        if (event.new!.priority === 'urgent') {
          toast.error('Novo Alerta Urgente!')

          // Optional: Play subtle sound (disabled by default)
          // playNotificationSound()
        }

        return [newAlert, ...prev]
      })
    } else if (event.eventType === 'UPDATE' && event.new) {
      // Update existing alert in list
      setAlerts((prev) => {
        return prev.map((alert) => {
          if (alert.id === event.new!.id) {
            return {
              ...alert,
              ...event.new,
              // Keep existing relations (full relations not sent in real-time payload)
              patient: alert.patient,
              appointment: alert.appointment,
              conversation: alert.conversation,
              resolver: alert.resolver,
            }
          }
          return alert
        })
      })
    } else if (event.eventType === 'DELETE' && event.old) {
      // Remove deleted alert from list
      setAlerts((prev) => prev.filter((alert) => alert.id !== event.old!.id))
    }
  }, [])

  // Handle connection status changes
  const handleStatusChange = useCallback((state: SubscriptionState) => {
    console.log('[AlertListRealtime] Status change:', state.status)
    setConnectionStatus(state)

    // Show error toast if connection fails
    if (state.status === 'error') {
      toast.error(state.error || 'Falha ao conectar atualizações em tempo real')
    }
  }, [])

  // Subscribe to real-time updates
  useAlertSubscription(handleAlertChange, handleStatusChange)

  // Sync alerts when initialAlerts changes (e.g., filters applied)
  useEffect(() => {
    setAlerts(initialAlerts)
  }, [initialAlerts])

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
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

      {/* Alert list */}
      <AlertList alerts={alerts} />
    </div>
  )
}

/**
 * Optional: Play subtle notification sound for urgent alerts
 * Disabled by default to avoid being too noisy
 */
function playNotificationSound() {
  try {
    // Using Web Audio API for subtle notification beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // 800 Hz
    gainNode.gain.value = 0.1 // Quiet volume

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1) // Very short beep
  } catch (error) {
    // Ignore audio errors (browser may not support or permissions denied)
    console.warn('[AlertListRealtime] Audio notification failed:', error)
  }
}
