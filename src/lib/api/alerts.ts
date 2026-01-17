'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { AppError, handleApiError, getUserFriendlyMessage } from '@/lib/utils/error-handler'
import type { Alert, Patient, Appointment, AlertType, AlertStatus, AlertPriority, Prisma } from '@prisma/client'

// Conversation data for alert context (fetched separately from n8n_chat_histories)
export interface AlertConversation {
  id: string
  status: 'IA' | 'HUMANO' | 'FINALIZADO'
  messages: Array<{ id: string; content: string; sender: 'patient' | 'ai' | 'system'; sentAt: Date | string }>
  lastMessageAt: Date
}

// Types for API responses
export type AlertWithRelations = Alert & {
  patient: Patient | null
  appointment: Appointment | null
  // Conversation is optional and fetched separately from n8n_chat_histories
  conversation?: AlertConversation | null
  resolver?: { email: string } | null
}

export interface AlertFilters {
  type?: AlertType
  status?: AlertStatus
  dateFrom?: Date
  dateTo?: Date
  sortBy?: AlertSortBy
  sortOrder?: 'asc' | 'desc'
}

export type AlertSortBy = 'priority' | 'date' | 'patient' | 'status'

/**
 * Fetch all alerts with optional filters
 * Used by alert list page to display alert queue
 */
export async function fetchAlerts(filters?: AlertFilters): Promise<AlertWithRelations[]> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Build Prisma where clause from filters
    const where: Prisma.AlertWhereInput = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    // Build Prisma orderBy clause from sort parameters
    const orderBy: Prisma.AlertOrderByWithRelationInput[] = []

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'priority':
          // Order: urgent > high > low (custom order with CASE would be better, but Prisma doesn't support it directly)
          // We'll use a workaround: order by priority as string
          orderBy.push({ priority: filters.sortOrder || 'asc' })
          break
        case 'date':
          orderBy.push({ createdAt: filters.sortOrder || 'desc' })
          break
        case 'patient':
          orderBy.push({ patient: { nome: filters.sortOrder || 'asc' } })
          break
        case 'status':
          orderBy.push({ status: filters.sortOrder || 'asc' })
          break
      }
    } else {
      // Default sort: priority (urgent first), then date (newest first)
      orderBy.push({ priority: 'asc' })
      orderBy.push({ createdAt: 'desc' })
    }

    // Fetch alerts with relations
    const alerts = await prisma.alert.findMany({
      where,
      orderBy,
      take: 100, // Limit to 100 alerts (pagination in future)
      include: {
        patient: true,
        appointment: true,
      },
    })

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_ALERT,
      resource: 'alerts',
      details: { filters },
    })

    return alerts
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[fetchAlerts] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Get single alert with full context
 * Used by alert detail page
 */
export async function getAlertById(id: string): Promise<AlertWithRelations | null> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        patient: true,
        appointment: true,
        resolver: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!alert) {
      return null
    }

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.VIEW_ALERT,
      resource: 'alerts',
      resourceId: id,
    })

    return alert
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[getAlertById] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Update alert status
 * Used when resolving/dismissing alerts
 */
export async function updateAlertStatus(
  id: string,
  status: AlertStatus
): Promise<Alert> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Prepare update data
    const updateData: Prisma.AlertUpdateInput = {
      status,
    }

    // Set resolvedAt and connect resolver if status is resolved or dismissed
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date()
      updateData.resolver = {
        connect: { id: user.id }
      }
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: updateData,
    })

    // Log audit trail (fire-and-forget)
    logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_ALERT_STATUS,
      resource: 'alerts',
      resourceId: id,
      details: { oldStatus: updatedAlert.status, newStatus: status },
    })

    return updatedAlert
  } catch (error) {
    const appError = handleApiError(error)
    console.error('[updateAlertStatus] Error:', getUserFriendlyMessage(appError), error)
    throw appError
  }
}

/**
 * Get count of unresolved alerts
 * Used for navigation badge
 */
export async function getUnresolvedAlertCount(): Promise<number> {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return 0
    }

    const count = await prisma.alert.count({
      where: {
        status: {
          in: ['new', 'in_progress'],
        },
      },
    })

    return count
  } catch (error) {
    console.error('[getUnresolvedAlertCount] Error:', error)
    return 0
  }
}
