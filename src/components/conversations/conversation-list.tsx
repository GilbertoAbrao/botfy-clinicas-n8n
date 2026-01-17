'use client'

import { ConversationThread as ConversationThreadType, ChatStatus } from '@/lib/api/conversations'
import { Card } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import { ConversationCard } from './conversation-card'

interface ConversationListProps {
  conversations: ConversationThreadType[]
  loading?: boolean
  onMemoryCleared?: () => void
}

/**
 * Conversation list using expandable cards.
 *
 * Each card shows a summary when collapsed and full thread when expanded.
 * Replaces the previous table/card layout with a more interactive design.
 */
export function ConversationList({ conversations, loading = false, onMemoryCleared }: ConversationListProps) {
  // Loading state with skeleton cards
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              {/* Header skeleton */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
              </div>
              {/* Message preview skeleton */}
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
              {/* Meta info skeleton */}
              <div className="flex gap-4">
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhuma conversa encontrada</h3>
            <p className="text-sm text-gray-500 mt-1">
              Nao ha conversas que correspondam aos filtros selecionados.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.sessionId}
          conversation={conversation}
          onMemoryCleared={onMemoryCleared}
        />
      ))}
    </div>
  )
}
