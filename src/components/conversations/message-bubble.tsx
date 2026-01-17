'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, CheckCheck, X, Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MessageSender = 'patient' | 'ai' | 'human' | 'system'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageBubbleProps {
  content: string
  sender: MessageSender
  timestamp: Date | string
  status?: MessageStatus
  isCompact?: boolean
}

/**
 * Format timestamp for display in message bubble
 * - Today: "14:30"
 * - Yesterday: "Ontem 14:30"
 * - Other: "15/01 14:30"
 */
function formatMessageTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

  if (isNaN(date.getTime())) {
    return ''
  }

  const time = format(date, 'HH:mm', { locale: ptBR })

  if (isToday(date)) {
    return time
  }

  if (isYesterday(date)) {
    return `Ontem ${time}`
  }

  return format(date, "dd/MM HH:mm", { locale: ptBR })
}

/**
 * Render delivery status indicator for clinic messages
 */
function StatusIndicator({ status }: { status?: MessageStatus }) {
  if (!status) return null

  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3 text-gray-400" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    case 'failed':
      return <X className="h-3 w-3 text-red-500" />
    default:
      return null
  }
}

/**
 * Sender badge for AI/Human distinction
 */
function SenderBadge({ sender }: { sender: MessageSender }) {
  if (sender === 'patient' || sender === 'system') {
    return null
  }

  if (sender === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
        <Bot className="h-3 w-3" />
        IA
      </span>
    )
  }

  // Human (clinic staff)
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      <User className="h-3 w-3" />
      Humano
    </span>
  )
}

/**
 * WhatsApp-style message bubble component
 *
 * - Patient messages: aligned LEFT, green background
 * - Clinic/AI messages: aligned RIGHT, white/gray background
 * - Shows sender badge (AI/Human) for clinic messages
 * - Shows delivery status for clinic messages
 */
export function MessageBubble({
  content,
  sender,
  timestamp,
  status,
  isCompact = false,
}: MessageBubbleProps) {
  const isPatient = sender === 'patient'
  const isSystem = sender === 'system'
  const isClinic = sender === 'ai' || sender === 'human'

  // System messages have special styling (centered, subtle)
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className={cn(
          "px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800",
          "text-xs text-gray-500 dark:text-gray-400 text-center",
          "max-w-[90%]"
        )}>
          <p className="whitespace-pre-wrap break-words">{content}</p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
            {formatMessageTime(timestamp)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex",
      isPatient ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[80%] relative",
        isCompact ? "max-w-[85%]" : "max-w-[80%]"
      )}>
        {/* Sender badge for clinic messages */}
        {isClinic && (
          <div className={cn(
            "mb-1",
            isPatient ? "text-left" : "text-right"
          )}>
            <SenderBadge sender={sender} />
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          "relative px-3 py-2 rounded-lg shadow-sm",
          // Patient messages: green background, left aligned with tail on left
          isPatient && "bg-green-100 dark:bg-green-900/30 rounded-tl-none",
          // Clinic messages: white/gray background, right aligned with tail on right
          isClinic && "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tr-none",
          // Compact mode adjustments
          isCompact && "px-2 py-1.5"
        )}>
          {/* Message content */}
          <p className={cn(
            "whitespace-pre-wrap break-words",
            isCompact ? "text-xs" : "text-sm",
            isPatient ? "text-gray-800 dark:text-gray-100" : "text-gray-800 dark:text-gray-100"
          )}>
            {content}
          </p>

          {/* Footer: timestamp and status */}
          <div className={cn(
            "flex items-center gap-1 mt-1",
            isPatient ? "justify-end" : "justify-end"
          )}>
            <span className={cn(
              "text-gray-500 dark:text-gray-400",
              isCompact ? "text-[9px]" : "text-[10px]"
            )}>
              {formatMessageTime(timestamp)}
            </span>
            {/* Show delivery status only for clinic messages */}
            {isClinic && <StatusIndicator status={status} />}
          </div>
        </div>
      </div>
    </div>
  )
}
