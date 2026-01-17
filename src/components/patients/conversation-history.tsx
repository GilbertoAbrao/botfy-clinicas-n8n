'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, ExternalLink, Bot, Headset, CheckCircle } from 'lucide-react'
import { ConversationThread } from '@/components/conversations/conversation-thread'
import { ClearMemoryButton } from '@/components/conversations/clear-memory-button'

interface Message {
  timestamp: string
  sender: 'patient' | 'ai' | 'human'
  content: string
}

interface Conversation {
  id: string
  whatsappId: string
  status: string
  messages: Message[]
  lastMessageAt: Date
}

interface ConversationHistoryProps {
  conversations: Conversation[]
}

// Status badge colors matching Botfy brand
const statusColors: Record<string, string> = {
  IA: 'bg-purple-500 hover:bg-purple-600 text-white',
  HUMANO: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  FINALIZADO: 'bg-gray-400 hover:bg-gray-500 text-white',
}

const statusLabels: Record<string, string> = {
  IA: 'IA',
  HUMANO: 'Humano',
  FINALIZADO: 'Finalizado',
}

const statusIcons: Record<string, React.ReactNode> = {
  IA: <Bot className="h-3 w-3 mr-1" />,
  HUMANO: <Headset className="h-3 w-3 mr-1" />,
  FINALIZADO: <CheckCircle className="h-3 w-3 mr-1" />,
}

function isMessageArray(value: unknown): value is Message[] {
  return Array.isArray(value)
}

/**
 * Conversation history component for patient profile.
 *
 * Shows accordion of conversations with WhatsApp-style message threading
 * and Clear Memory button for each conversation.
 */
export function ConversationHistory({
  conversations,
}: ConversationHistoryProps) {
  // Sort by lastMessageAt descending (most recent first)
  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() -
      new Date(a.lastMessageAt).getTime()
  )

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300" />
            <p className="text-sm text-gray-500">
              Nenhuma conversa registrada para este paciente
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-4">
        {sortedConversations.map((conversation) => {
          // Safe JSON parsing with type guard
          const rawMessages = isMessageArray(conversation.messages)
            ? conversation.messages
            : []

          // Convert to format expected by ConversationThread
          const formattedMessages = rawMessages.map((msg, index) => ({
            id: `${conversation.id}-${index}`,
            content: msg.content,
            sender: msg.sender as 'patient' | 'ai' | 'human' | 'system',
            sentAt: msg.timestamp,
          }))

          return (
            <AccordionItem
              key={conversation.id}
              value={conversation.id}
              className="rounded-lg border bg-white px-6"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between pr-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {conversation.whatsappId.split('@')[0]}
                        </p>
                        <Badge className={statusColors[conversation.status] || 'bg-gray-400 text-white'}>
                          {statusIcons[conversation.status]}
                          {statusLabels[conversation.status] || conversation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {rawMessages.length}{' '}
                        {rawMessages.length === 1 ? 'mensagem' : 'mensagens'} •{' '}
                        {formatDistanceToNow(
                          new Date(conversation.lastMessageAt),
                          {
                            addSuffix: true,
                            locale: ptBR,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {/* Action bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b">
                    <ClearMemoryButton sessionId={conversation.whatsappId} />
                    <Link href={`/conversas/${encodeURIComponent(conversation.whatsappId)}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Ver no painel
                      </Button>
                    </Link>
                  </div>

                  {/* WhatsApp-style conversation thread */}
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <ConversationThread
                      messages={formattedMessages}
                      compact={false}
                      conversationId={conversation.whatsappId}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
