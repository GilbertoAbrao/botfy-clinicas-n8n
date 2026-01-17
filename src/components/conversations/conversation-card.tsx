'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronUp, User, Bot, Headset, CheckCircle, MessageSquare, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ConversationThread } from './conversation-thread'
import { ClearMemoryButton } from './clear-memory-button'
import type { ChatMessage, ChatStatus } from '@/lib/api/conversations'
import type { Patient } from '@prisma/client'

interface ConversationCardProps {
  conversation: {
    sessionId: string
    patient: Patient | null
    phoneNumber: string
    status: ChatStatus
    lastMessage: ChatMessage | null
    lastMessageAt: Date | null
    messageCount: number
    messages: ChatMessage[]
  }
  onMemoryCleared?: () => void
}

// Status badge colors (Botfy brand colors)
const statusColors: Record<ChatStatus, string> = {
  IA: 'bg-purple-500 hover:bg-purple-600 text-white',
  HUMANO: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  FINALIZADO: 'bg-gray-400 hover:bg-gray-500 text-white',
}

const statusLabels: Record<ChatStatus, string> = {
  IA: 'IA',
  HUMANO: 'Humano',
  FINALIZADO: 'Finalizado',
}

const statusIcons: Record<ChatStatus, React.ReactNode> = {
  IA: <Bot className="h-3 w-3 mr-1" />,
  HUMANO: <Headset className="h-3 w-3 mr-1" />,
  FINALIZADO: <CheckCircle className="h-3 w-3 mr-1" />,
}

/**
 * Expandable card component for conversation list.
 *
 * Collapsed: Shows summary (patient name, status, last message preview, time)
 * Expanded: Shows full ConversationThread with WhatsApp styling and ClearMemoryButton
 */
export function ConversationCard({ conversation, onMemoryCleared }: ConversationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Truncate last message for preview (60 chars max)
  const lastMessageContent = conversation.lastMessage?.content || 'Sem mensagens'
  const lastMessagePreview = lastMessageContent.length > 60
    ? lastMessageContent.substring(0, 60) + '...'
    : lastMessageContent

  // Format time since last message
  const timeSinceLastMessage = conversation.lastMessageAt
    ? formatDistanceToNow(conversation.lastMessageAt, {
        addSuffix: true,
        locale: ptBR,
      })
    : 'Nunca'

  // Convert ChatMessage[] to format expected by ConversationThread
  const formattedMessages = conversation.messages.map((msg, index) => ({
    id: `${conversation.sessionId}-${index}`,
    content: msg.content,
    sender: msg.type === 'human' ? 'patient' : msg.type as 'patient' | 'ai' | 'human' | 'system',
    sentAt: new Date(), // We don't have exact timestamps, use current as approximation
  }))

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={`transition-all duration-200 ${isExpanded ? 'shadow-lg border-primary/20' : 'hover:bg-gray-50/50 cursor-pointer'}`}>
        <CollapsibleTrigger asChild>
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left section: Patient info and last message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {/* Patient name/phone */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">
                      {conversation.patient?.nome || conversation.phoneNumber}
                    </span>
                  </div>

                  {/* Status badge */}
                  <Badge className={statusColors[conversation.status]}>
                    {statusIcons[conversation.status]}
                    {statusLabels[conversation.status]}
                  </Badge>
                </div>

                {/* Last message preview */}
                <p className="text-sm text-gray-600 truncate mb-2">
                  {lastMessagePreview}
                </p>

                {/* Meta info row */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {conversation.messageCount} {conversation.messageCount === 1 ? 'mensagem' : 'mensagens'}
                  </span>
                  <span>{timeSinceLastMessage}</span>
                  {!conversation.patient && (
                    <span className="text-amber-600">Paciente nao vinculado</span>
                  )}
                </div>
              </div>

              {/* Right section: Chevron indicator */}
              <div className="flex-shrink-0 flex items-center">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {/* Divider */}
            <div className="border-t mb-4" />

            {/* Action bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Clear Memory button */}
                <ClearMemoryButton
                  sessionId={conversation.sessionId}
                  onCleared={onMemoryCleared}
                />

                {/* View patient profile link (if patient exists) */}
                {conversation.patient && (
                  <Link href={`/pacientes/${conversation.patient.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-3 w-3" />
                      Ver perfil do paciente
                    </Button>
                  </Link>
                )}
              </div>

              {/* Phone number display */}
              <div className="text-xs text-gray-500 font-mono">
                {conversation.phoneNumber}
              </div>
            </div>

            {/* Full conversation thread */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <ConversationThread
                messages={formattedMessages}
                compact={false}
                conversationId={conversation.sessionId}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
