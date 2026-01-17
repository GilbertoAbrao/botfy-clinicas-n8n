'use client'

import { useState, useCallback, useEffect } from 'react'
import { ConversationThread } from '@/lib/api/conversations'
import { ConversationList } from './conversation-list'
import { useChatHistorySubscription, type ChatHistoryChangeEvent, type SubscriptionState } from '@/lib/realtime/conversations'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ConversationListRealtimeProps {
  initialConversations: ConversationThread[]
}

/**
 * Real-time wrapper for ConversationList component
 *
 * Subscribes to n8n_chat_histories changes via Supabase real-time and refetches conversations.
 * Shows connection status badge and toast notifications for new messages.
 */
export function ConversationListRealtime({ initialConversations }: ConversationListRealtimeProps) {
  const [conversations, setConversations] = useState<ConversationThread[]>(initialConversations)
  const [connectionStatus, setConnectionStatus] = useState<SubscriptionState>({
    status: 'disconnected',
  })
  const router = useRouter()

  // Handle chat history changes from real-time subscription
  const handleChatHistoryChange = useCallback((event: ChatHistoryChangeEvent) => {
    console.log('[ConversationListRealtime] Chat history change:', event.eventType, event.new?.id)

    if (event.eventType === 'INSERT' && event.new) {
      const message = event.new.message as any

      // Show toast notification for new messages
      if (message.type === 'human') {
        toast.info('Nova mensagem do paciente', {
          description: `${event.new.session_id.split('@')[0]}`,
        })
      }

      // Refresh the page to refetch conversations with new message
      // This is simple but effective - in production you'd want to optimize this
      router.refresh()
    } else if (event.eventType === 'UPDATE') {
      // Message updated, refresh
      router.refresh()
    }
  }, [router])

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
  useChatHistorySubscription(handleChatHistoryChange, handleStatusChange)

  // Sync conversations when initialConversations changes (e.g., filters applied or router.refresh())
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
      <ConversationList
        conversations={conversations}
        onMemoryCleared={() => router.refresh()}
      />
    </div>
  )
}
