'use client'

import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MessageBubble, type MessageSender, type MessageStatus } from './message-bubble'

interface Message {
  id: string
  content: string
  sender: 'patient' | 'ai' | 'human' | 'system'
  sentAt: Date | string
  // Optional delivery status (extracted from additional_kwargs if available)
  status?: MessageStatus
}

interface ConversationThreadProps {
  messages: Message[]
  compact?: boolean
  conversationId?: string
}

/**
 * WhatsApp-style conversation thread component
 *
 * Displays messages in a scrollable container with:
 * - Patient messages on the left (green)
 * - Clinic messages (AI/Human) on the right (white/gray)
 * - Auto-scroll to most recent messages
 * - Compact mode shows last 5 messages with "Ver mais..." link
 */
export function ConversationThread({
  messages,
  compact = false,
  conversationId
}: ConversationThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Sort messages by sentAt ascending (oldest first, newest at bottom)
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = typeof a.sentAt === 'string' ? new Date(a.sentAt) : a.sentAt
    const dateB = typeof b.sentAt === 'string' ? new Date(b.sentAt) : b.sentAt
    return dateA.getTime() - dateB.getTime()
  })

  // In compact mode, show only last 5 messages
  const displayMessages = compact && sortedMessages.length > 5
    ? sortedMessages.slice(-5)
    : sortedMessages

  const hasMoreMessages = compact && sortedMessages.length > 5

  // Scroll to bottom when messages change or on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [displayMessages.length])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>Nenhuma mensagem disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hasMoreMessages && (
        <div className="text-center text-sm text-muted-foreground py-2">
          <p>Mostrando as últimas 5 de {sortedMessages.length} mensagens</p>
          {conversationId && (
            <Link
              href={`/conversas/${conversationId}`}
              className="text-primary hover:underline text-xs"
            >
              Ver mais...
            </Link>
          )}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="space-y-3 max-h-[600px] overflow-y-auto px-2 py-2"
      >
        {displayMessages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            content={message.content}
            sender={message.sender as MessageSender}
            timestamp={message.sentAt}
            status={message.status || 'delivered'}
            isCompact={compact}
          />
        ))}
      </div>

      {hasMoreMessages && conversationId && (
        <div className="flex justify-center pt-4 border-t">
          <Button variant="outline" asChild>
            <Link href={`/conversas/${conversationId}`}>
              Ver conversa completa
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
