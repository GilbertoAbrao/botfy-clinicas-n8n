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

  // Document validation (PHI)
  APPROVE_DOCUMENT = 'APPROVE_DOCUMENT',
  REJECT_DOCUMENT = 'REJECT_DOCUMENT',
  BULK_APPROVE_DOCUMENTS = 'BULK_APPROVE_DOCUMENTS',
  BULK_REJECT_DOCUMENTS = 'BULK_REJECT_DOCUMENTS',

  // Conversation management
  CLEAR_CHAT_MEMORY = 'CLEAR_CHAT_MEMORY',

  // Service management
  VIEW_SERVICE = 'VIEW_SERVICE',
  CREATE_SERVICE = 'CREATE_SERVICE',
  UPDATE_SERVICE = 'UPDATE_SERVICE',
  DELETE_SERVICE = 'DELETE_SERVICE',

  // System admin actions
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  DEACTIVATE_USER = 'DEACTIVATE_USER',

  // System configuration
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // Config Lembretes management
  VIEW_CONFIG_LEMBRETE = 'VIEW_CONFIG_LEMBRETE',
  CREATE_CONFIG_LEMBRETE = 'CREATE_CONFIG_LEMBRETE',
  UPDATE_CONFIG_LEMBRETE = 'UPDATE_CONFIG_LEMBRETE',
  DELETE_CONFIG_LEMBRETE = 'DELETE_CONFIG_LEMBRETE',

  // Data export (HIPAA compliance)
  EXPORT_DATA = 'EXPORT_DATA',

  // Pre-checkin management
  VIEW_PRE_CHECKIN = 'VIEW_PRE_CHECKIN',
  UPDATE_PRE_CHECKIN = 'UPDATE_PRE_CHECKIN',
  SEND_PRE_CHECKIN_REMINDER = 'SEND_PRE_CHECKIN_REMINDER',

  // Instruction management
  VIEW_INSTRUCTION = 'VIEW_INSTRUCTION',
  CREATE_INSTRUCTION = 'CREATE_INSTRUCTION',
  UPDATE_INSTRUCTION = 'UPDATE_INSTRUCTION',
  DEACTIVATE_INSTRUCTION = 'DEACTIVATE_INSTRUCTION',

  // Agent API actions (Phase 17+)
  AGENT_SEARCH_SLOTS = 'AGENT_SEARCH_SLOTS',
  AGENT_VIEW_APPOINTMENTS = 'AGENT_VIEW_APPOINTMENTS',
  AGENT_CREATE_APPOINTMENT = 'AGENT_CREATE_APPOINTMENT',
  AGENT_UPDATE_APPOINTMENT = 'AGENT_UPDATE_APPOINTMENT',
  AGENT_CANCEL_APPOINTMENT = 'AGENT_CANCEL_APPOINTMENT',
  AGENT_VIEW_PATIENT = 'AGENT_VIEW_PATIENT',
  AGENT_UPDATE_PATIENT = 'AGENT_UPDATE_PATIENT',
  AGENT_VIEW_INSTRUCTIONS = 'AGENT_VIEW_INSTRUCTIONS',
  AGENT_VIEW_PRE_CHECKIN = 'AGENT_VIEW_PRE_CHECKIN',
  AGENT_CONFIRM_APPOINTMENT = 'AGENT_CONFIRM_APPOINTMENT',
  AGENT_PROCESS_DOCUMENT = 'AGENT_PROCESS_DOCUMENT',
}

interface LogAuditParams {
  userId: string
  action: AuditAction
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  agentId?: string         // NEW: Agent identifier (for AI Agent API calls)
  correlationId?: string   // NEW: Request chain tracking (for AI Agent API calls)
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: {
          ...(params.details || {}),
          ...(params.agentId && { agentId: params.agentId }),
          ...(params.correlationId && { correlationId: params.correlationId }),
        },
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
