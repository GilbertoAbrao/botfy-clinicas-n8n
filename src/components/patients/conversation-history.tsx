import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, User, Bot, Headset } from 'lucide-react'

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

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'IA':
      return 'default' // blue
    case 'HUMANO':
      return 'secondary' // yellow
    case 'FINALIZADO':
      return 'outline' // gray
    default:
      return 'outline'
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IA: 'IA',
    HUMANO: 'Humano',
    FINALIZADO: 'Finalizado',
  }
  return labels[status] || status
}

function getSenderLabel(sender: string): string {
  const labels: Record<string, string> = {
    patient: 'Paciente',
    ai: 'IA',
    human: 'Atendente Humano',
  }
  return labels[sender] || sender
}

function getSenderIcon(sender: string) {
  switch (sender) {
    case 'patient':
      return <User className="h-4 w-4" />
    case 'ai':
      return <Bot className="h-4 w-4" />
    case 'human':
      return <Headset className="h-4 w-4" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}

function isMessageArray(value: unknown): value is Message[] {
  return Array.isArray(value)
}

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
          <p className="text-center text-sm text-gray-500">
            Nenhuma conversa registrada
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-4">
        {sortedConversations.map((conversation) => {
          // Safe JSON parsing with type guard
          const messages = isMessageArray(conversation.messages)
            ? conversation.messages
            : []

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
                          WhatsApp: {conversation.whatsappId}
                        </p>
                        <Badge variant={getStatusBadgeVariant(conversation.status)}>
                          {getStatusLabel(conversation.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {messages.length}{' '}
                        {messages.length === 1 ? 'mensagem' : 'mensagens'} •{' '}
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
                  {messages.map((message, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-full p-2 ${
                            message.sender === 'patient'
                              ? 'bg-blue-100 text-blue-600'
                              : message.sender === 'ai'
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {getSenderIcon(message.sender)}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {getSenderLabel(message.sender)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(
                              new Date(message.timestamp),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
