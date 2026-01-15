import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'

export function requireRole(userRole: Role | null | undefined, allowedRoles: Role[]) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/dashboard') // Redirect to safe page if unauthorized
  }
}
