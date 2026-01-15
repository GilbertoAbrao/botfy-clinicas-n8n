import { Role } from '@prisma/client'

export const PERMISSIONS = {
  // Admin-only permissions
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM_CONFIG: 'MANAGE_SYSTEM_CONFIG',

  // Shared permissions (Admin + Atendente)
  VIEW_ALERTS: 'VIEW_ALERTS',
  MANAGE_ALERTS: 'MANAGE_ALERTS',
  VIEW_PATIENTS: 'VIEW_PATIENTS',
  MANAGE_PATIENTS: 'MANAGE_PATIENTS',
  VIEW_APPOINTMENTS: 'VIEW_APPOINTMENTS',
  MANAGE_APPOINTMENTS: 'MANAGE_APPOINTMENTS',
  VIEW_CONVERSATIONS: 'VIEW_CONVERSATIONS',
  MANAGE_CONVERSATIONS: 'MANAGE_CONVERSATIONS',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Admin has ALL permissions
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SYSTEM_CONFIG,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.MANAGE_ALERTS,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.MANAGE_CONVERSATIONS,
  ],
  ATENDENTE: [
    // Atendente has limited permissions (no user mgmt, no audit logs)
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.MANAGE_ALERTS,
    PERMISSIONS.VIEW_PATIENTS,
    PERMISSIONS.MANAGE_PATIENTS,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.MANAGE_CONVERSATIONS,
  ],
}

export function checkPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function requirePermission(role: Role, permission: Permission) {
  if (!checkPermission(role, permission)) {
    throw new Error('Unauthorized: Insufficient permissions')
  }
}
