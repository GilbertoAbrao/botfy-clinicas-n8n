import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  sender: 'patient' | 'ai' | 'system';
  sentAt: Date | string;
}

interface ConversationThreadProps {
  messages: Message[];
  compact?: boolean;
  conversationId?: string;
}

function getSenderLabel(sender: Message['sender']): string {
  switch (sender) {
    case 'patient':
      return 'Paciente';
    case 'ai':
      return 'I.A';
    case 'system':
      return 'Sistema';
    default:
      return 'Desconhecido';
  }
}

function getSenderColor(sender: Message['sender']): string {
  switch (sender) {
    case 'patient':
      return 'bg-blue-50 border-blue-200';
    case 'ai':
      return 'bg-purple-50 border-purple-200';
    case 'system':
      return 'bg-gray-50 border-gray-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

export function ConversationThread({
  messages,
  compact = false,
  conversationId
}: ConversationThreadProps) {
  // In compact mode, show only last 10 messages
  const displayMessages = compact && messages.length > 10
    ? messages.slice(-10)
    : messages;

  const hasMoreMessages = compact && messages.length > 10;

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>Nenhuma mensagem disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasMoreMessages && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Mostrando as últimas 10 de {messages.length} mensagens</p>
        </div>
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {displayMessages.map((message, index) => {
          const isPatient = message.sender === 'patient';
          const timestamp = typeof message.sentAt === 'string'
            ? new Date(message.sentAt)
            : message.sentAt;

          return (
            <div
              key={message.id || index}
              className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[80%] ${isPatient ? 'items-start' : 'items-end'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {getSenderLabel(message.sender)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(timestamp, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>

                <Card
                  className={`p-3 ${getSenderColor(message.sender)} ${
                    isPatient ? 'rounded-tl-none' : 'rounded-tr-none'
                  } border`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {hasMoreMessages && conversationId && (
        <div className="flex justify-center pt-4 border-t">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/conversations/${conversationId}`}>
              Ver conversa completa
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
