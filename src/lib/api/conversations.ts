'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { AppError, handleApiError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Conversation, Patient, ConversationStatus, Prisma } from '@prisma/client'

// Types for API responses
export type ConversationWithPatient = Conversation & {
  patient: Patient
}

export interface ConversationFilters {
  status?: ConversationStatus
  dateFrom?: Date
  dateTo?: Date
  patientId?: string
  sortBy?: ConversationSortBy
  sortOrder?: 'asc' | 'desc'
}

export type ConversationSortBy = 'recent' | 'status' | 'patient'

/**
 * Fetch all conversations with optional filters
 * Used by conversation list page
 */
export async function fetchConversations(filters?: ConversationFilters): Promise<ConversationWithPatient[]> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Build Prisma where clause from filters
    const where: Prisma.ConversationWhereInput = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.lastMessageAt = {}
      if (filters.dateFrom) {
        where.lastMessageAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.lastMessageAt.lte = filters.dateTo
      }
    }

    // Build Prisma orderBy clause from sort parameters
    const orderBy: Prisma.ConversationOrderByWithRelationInput[] = []

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          orderBy.push({ lastMessageAt: filters.sortOrder || 'desc' })
          break
        case 'status':
          orderBy.push({ status: filters.sortOrder || 'asc' })
          break
        case 'patient':
          orderBy.push({ patient: { nome: filters.sortOrder || 'asc' } })
          break
      }
    } else {
      // Default sort: most recent first
      orderBy.push({ lastMessageAt: 'desc' })
    }

    // Fetch conversations with patient relation
    const conversations = await prisma.conversation.findMany({
      where,
      orderBy,
      take: 100, // Limit to 100 conversations (pagination in future)
      include: {
        patient: true,
      },
    })

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONVERSATION,
      resource: 'conversations',
      details: { filters },
    })

    return conversations
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[fetchConversations] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Get single conversation with full context
 * Used by conversation detail page
 */
export async function getConversationById(id: string): Promise<ConversationWithPatient | null> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    })

    if (!conversation) {
      return null
    }

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_CONVERSATION,
      resource: 'conversations',
      resourceId: id,
      details: { patientId: conversation.patientId },
    })

    return conversation
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[getConversationById] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Update conversation status
 * Used when escalating to human or finishing conversation
 */
export async function updateConversationStatus(
  id: string,
  status: ConversationStatus
): Promise<Conversation> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { status },
    })

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_CONVERSATION_STATUS,
      resource: 'conversations',
      resourceId: id,
      details: { newStatus: status },
    })

    return updatedConversation
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[updateConversationStatus] Error:', getUserFriendlyMessage(appError), error)
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

    const count = await prisma.conversation.count({
      where: {
        status: {
          in: ['IA', 'HUMANO'],
        },
      },
    })

    return count
  } catch (error) {
    console.error('[getActiveConversationCount] Error:', error)
    return 0
  }
}
