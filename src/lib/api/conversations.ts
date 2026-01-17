'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { AppError, handleApiError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Patient } from '@prisma/client'

// Chat status based on last message
export type ChatStatus = 'IA' | 'HUMANO' | 'FINALIZADO'

// Message structure from n8n_chat_histories
export interface ChatMessage {
  type: 'human' | 'ai' | 'system'
  content: string
  additional_kwargs?: Record<string, any>
  response_metadata?: Record<string, any>
  tool_calls?: any[]
  invalid_tool_calls?: any[]
}

// Conversation thread (grouped by session_id)
export interface ConversationThread {
  sessionId: string // remotejID from n8n
  phoneNumber: string // extracted from sessionId
  patient: Patient | null
  messages: ChatMessage[]
  messageCount: number
  lastMessage: ChatMessage
  lastMessageAt: Date
  status: ChatStatus
}

export interface ConversationFilters {
  status?: ChatStatus
  dateFrom?: Date
  dateTo?: Date
  patientId?: string
}

/**
 * Extract phone number from WhatsApp session_id
 * Format: "5511999999999@s.whatsapp.net-calendar" -> "5511999999999"
 */
function extractPhoneNumber(sessionId: string): string {
  return sessionId.split('@')[0]
}

/**
 * Normalize phone number for matching
 * Removes +, spaces, and ensures it starts with country code
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[+\s-]/g, '')
}

/**
 * Determine chat status based on message history
 * - If last message is from human -> HUMANO (waiting for response)
 * - If last message is from ai -> IA (bot responded)
 * - If session is old (>7 days) -> FINALIZADO
 */
function determineStatus(lastMessage: ChatMessage, lastMessageAt: Date): ChatStatus {
  const daysSinceLastMessage = (Date.now() - lastMessageAt.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceLastMessage > 7) {
    return 'FINALIZADO'
  }

  if (lastMessage.type === 'human') {
    return 'HUMANO' // Waiting for response
  }

  return 'IA' // Bot is handling it
}

/**
 * Fetch all conversation threads with optional filters
 * Groups messages by session_id and joins with patients
 */
export async function fetchConversations(filters?: ConversationFilters): Promise<ConversationThread[]> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Fetch all chat messages ordered by creation time
    const chatHistories = await prisma.chatHistory.findMany({
      orderBy: { createdAt: 'asc' },
    })

    // Fetch all patients for joining
    const patients = await prisma.patient.findMany()

    // Group messages by session_id, tracking last message timestamp
    const sessionMap = new Map<string, { messages: ChatMessage[], lastMessageAt: Date }>()

    for (const history of chatHistories) {
      const existing = sessionMap.get(history.sessionId)
      const message = history.message as unknown as ChatMessage

      if (!existing) {
        sessionMap.set(history.sessionId, {
          messages: [message],
          lastMessageAt: history.createdAt,
        })
      } else {
        existing.messages.push(message)
        // Update to most recent timestamp
        if (history.createdAt > existing.lastMessageAt) {
          existing.lastMessageAt = history.createdAt
        }
      }
    }

    // Build conversation threads
    const threads: ConversationThread[] = []

    for (const [sessionId, data] of sessionMap.entries()) {
      const phoneNumber = extractPhoneNumber(sessionId)
      const normalizedPhone = normalizePhone(phoneNumber)

      // Try to find matching patient
      const patient = patients.find(p => {
        const patientPhone = normalizePhone(p.telefone)
        return (
          patientPhone === normalizedPhone ||
          `55${patientPhone}` === normalizedPhone ||
          patientPhone === `55${normalizedPhone}`
        )
      }) || null

      const lastMessage = data.messages[data.messages.length - 1]
      const lastMessageAt = data.lastMessageAt

      const status = determineStatus(lastMessage, lastMessageAt)

      // Apply filters
      if (filters?.status && status !== filters.status) {
        continue
      }

      if (filters?.patientId && patient?.id !== filters.patientId) {
        continue
      }

      threads.push({
        sessionId,
        phoneNumber,
        patient,
        messages: data.messages,
        messageCount: data.messages.length,
        lastMessage,
        lastMessageAt,
        status,
      })
    }

    // Sort by most recent message first
    threads.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONVERSATION,
      resource: 'conversations',
      details: { filters, threadCount: threads.length },
    })

    return threads
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[fetchConversations] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Get single conversation thread by session_id
 */
export async function getConversationBySessionId(sessionId: string): Promise<ConversationThread | null> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const chatHistories = await prisma.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    if (chatHistories.length === 0) {
      return null
    }

    const messages = chatHistories.map(h => h.message as unknown as ChatMessage)
    const phoneNumber = extractPhoneNumber(sessionId)
    const normalizedPhone = normalizePhone(phoneNumber)

    // Try to find matching patient
    const patients = await prisma.patient.findMany()
    const patient = patients.find(p => {
      const patientPhone = normalizePhone(p.telefone)
      return (
        patientPhone === normalizedPhone ||
        `55${patientPhone}` === normalizedPhone ||
        patientPhone === `55${normalizedPhone}`
      )
    }) || null

    const lastMessage = messages[messages.length - 1]
    const lastHistory = chatHistories[chatHistories.length - 1]
    const lastMessageAt = lastHistory.createdAt
    const status = determineStatus(lastMessage, lastMessageAt)

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONVERSATION,
      resource: 'conversations',
      resourceId: sessionId,
      details: { patientId: patient?.id },
    })

    return {
      sessionId,
      phoneNumber,
      patient,
      messages,
      messageCount: messages.length,
      lastMessage,
      lastMessageAt,
      status,
    }
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[getConversationBySessionId] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Get count of active conversations (IA or HUMANO status)
 * Used for navigation badge
 */
export async function getActiveConversationCount(): Promise<number> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return 0
    }

    const threads = await fetchConversations()
    const activeCount = threads.filter(t => t.status === 'IA' || t.status === 'HUMANO').length

    return activeCount
  } catch (error) {
    console.error('[getActiveConversationCount] Error:', error)
    return 0
  }
}
