import { prisma } from '@/lib/prisma'

export enum AuditAction {
  // Patient PHI access
  VIEW_PATIENT = 'VIEW_PATIENT',
  CREATE_PATIENT = 'CREATE_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',

  // Appointment access
  VIEW_APPOINTMENT = 'VIEW_APPOINTMENT',
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT = 'DELETE_APPOINTMENT',

  // Conversation access (PHI)
  VIEW_CONVERSATION = 'VIEW_CONVERSATION',
  UPDATE_CONVERSATION = 'UPDATE_CONVERSATION',
  UPDATE_CONVERSATION_STATUS = 'UPDATE_CONVERSATION_STATUS',

  // Alert management
  VIEW_ALERT = 'VIEW_ALERT',
  UPDATE_ALERT_STATUS = 'UPDATE_ALERT_STATUS',
  RESOLVE_ALERT = 'RESOLVE_ALERT',

  // Waitlist management
  ADD_WAITLIST = 'ADD_WAITLIST',
  REMOVE_WAITLIST = 'REMOVE_WAITLIST',

  // Document management (PHI)
  VIEW_DOCUMENTS = 'VIEW_DOCUMENTS',
  VIEW_DOCUMENT = 'VIEW_DOCUMENT',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',

  // Conversation management
  CLEAR_CHAT_MEMORY = 'CLEAR_CHAT_MEMORY',

  // System admin actions
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
}

interface LogAuditParams {
  userId: string
  action: AuditAction
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (error) {
    // CRITICAL: Audit logging failure should NOT break the application
    // Log to external monitoring (DataDog, Sentry) in production
    console.error('[AUDIT LOG FAILURE]', error)
  }
}
