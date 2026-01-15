'use server'

import { getCurrentUserWithRole } from '@/lib/auth/session'
import { requireRole } from '@/lib/rbac/middleware'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logAudit, AuditAction } from './logger'

export async function getAuditLogs(page: number = 1, limit: number = 50) {
  const user = await getCurrentUserWithRole()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Only admins can view audit logs (AUTH-09)
  requireRole(user.role, [Role.ADMIN])

  // Log the audit log access (meta-logging)
  await logAudit({
    userId: user.id,
    action: AuditAction.VIEW_AUDIT_LOGS,
    resource: 'audit_logs',
  })

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
