'use client'

import { ConversationThread, ChatStatus } from '@/lib/api/conversations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { MessageSquare, Bot, Headset, CheckCircle } from 'lucide-react'

interface ConversationListProps {
  conversations: ConversationThread[]
  loading?: boolean
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

export function ConversationList({ conversations, loading = false }: ConversationListProps) {
  // Loading state with skeleton rows
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Mensagem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
                <div className="h-5 w-full bg-gray-200 animate-pulse rounded" />
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
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
              Não há conversas que correspondam aos filtros selecionados.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Mensagem</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conversation) => (
              <TableRow
                key={conversation.sessionId}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium">
                  {conversation.patient?.nome || (
                    <span className="text-gray-400">
                      {conversation.phoneNumber}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-gray-600 font-mono text-sm">
                  {conversation.phoneNumber}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[conversation.status]}>
                    {statusIcons[conversation.status]}
                    {statusLabels[conversation.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  <div className="flex flex-col">
                    <span className="truncate max-w-xs text-sm">
                      {conversation.lastMessage.content.substring(0, 50)}
                      {conversation.lastMessage.content.length > 50 ? '...' : ''}
                    </span>
                    <span className="text-xs text-gray-500">
                      {conversation.messageCount} {conversation.messageCount === 1 ? 'mensagem' : 'mensagens'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/conversas/${encodeURIComponent(conversation.sessionId)}`}>
                    <Button variant="outline" size="sm">
                      Ver Conversa
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {conversations.map((conversation) => (
          <Link key={conversation.sessionId} href={`/conversas/${encodeURIComponent(conversation.sessionId)}`}>
            <Card className="p-4 active:bg-gray-50 transition-colors min-h-[44px] flex flex-col justify-center">
              <div className="space-y-3">
                {/* Status badge at top */}
                <div className="flex items-center justify-between">
                  <Badge className={statusColors[conversation.status]}>
                    {statusIcons[conversation.status]}
                    {statusLabels[conversation.status]}
                  </Badge>
                </div>

                {/* Patient name or phone number */}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {conversation.patient?.nome || conversation.phoneNumber}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage.content}
                  </p>
                </div>

                {/* Message count */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {conversation.messageCount} {conversation.messageCount === 1 ? 'mensagem' : 'mensagens'}
                  </span>
                  <span className="font-mono">
                    {conversation.phoneNumber}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
