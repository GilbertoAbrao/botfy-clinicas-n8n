'use client'

import { useState, useCallback, useEffect } from 'react'
import { ConversationWithPatient } from '@/lib/api/conversations'
import { ConversationList } from './conversation-list'
import { useConversationSubscription, type ConversationChangeEvent, type SubscriptionState } from '@/lib/realtime/conversations'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ConversationListRealtimeProps {
  initialConversations: ConversationWithPatient[]
}

/**
 * Real-time wrapper for ConversationList component
 *
 * Subscribes to conversation changes via Supabase real-time and updates the list automatically.
 * Shows connection status badge and toast notifications for new conversations.
 */
export function ConversationListRealtime({ initialConversations }: ConversationListRealtimeProps) {
  const [conversations, setConversations] = useState<ConversationWithPatient[]>(initialConversations)
  const [connectionStatus, setConnectionStatus] = useState<SubscriptionState>({
    status: 'disconnected',
  })

  // Handle conversation changes from real-time subscription
  const handleConversationChange = useCallback((event: ConversationChangeEvent) => {
    console.log('[ConversationListRealtime] Conversation change:', event.eventType, event.new?.id)

    if (event.eventType === 'INSERT' && event.new) {
      // Add new conversation to the list (prepend to maintain recency sort)
      setConversations((prev) => {
        // Deduplicate: check if conversation already exists
        const exists = prev.some((c) => c.id === event.new!.id)
        if (exists) {
          return prev
        }

        // Add new conversation at the beginning
        // Note: patient relation will not be available in realtime payload
        // In production, you'd want to refetch or handle this more gracefully
        const newConversation: any = {
          ...event.new!,
          patient: { nome: 'Carregando...', telefone: '' }, // Placeholder
        }

        // Show toast notification for new conversations
        toast.info('Nova conversa iniciada!', {
          description: `WhatsApp: ${event.new!.whatsappId}`,
        })

        return [newConversation, ...prev]
      })
    } else if (event.eventType === 'UPDATE' && event.new) {
      // Update existing conversation in list
      setConversations((prev) => {
        return prev.map((conversation) => {
          if (conversation.id === event.new!.id) {
            return {
              ...conversation,
              ...event.new,
              // Keep existing patient relation (not sent in real-time payload)
              patient: conversation.patient,
            }
          }
          return conversation
        })
      })

      // Show notification for status changes to HUMANO (escalation)
      if (event.new.status === 'HUMANO' && event.old?.status === 'IA') {
        toast.warning('Conversa escalada para atendimento humano', {
          description: `WhatsApp: ${event.new.whatsappId}`,
        })
      }
    } else if (event.eventType === 'DELETE' && event.old) {
      // Remove deleted conversation from list
      setConversations((prev) => prev.filter((conversation) => conversation.id !== event.old!.id))
    }
  }, [])

  // Handle connection status changes
  const handleStatusChange = useCallback((state: SubscriptionState) => {
    console.log('[ConversationListRealtime] Status change:', state.status)
    setConnectionStatus(state)

    // Show error toast if connection fails
    if (state.status === 'error') {
      toast.error(state.error || 'Falha ao conectar atualizações em tempo real')
    }
  }, [])

  // Subscribe to real-time updates
  useConversationSubscription(handleConversationChange, handleStatusChange)

  // Sync conversations when initialConversations changes (e.g., filters applied)
  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

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

      {/* Conversation list */}
      <ConversationList conversations={conversations} />
    </div>
  )
}
