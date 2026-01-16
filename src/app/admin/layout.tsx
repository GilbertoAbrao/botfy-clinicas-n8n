import { redirect } from 'next/navigation'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { requireRole } from '@/lib/rbac/middleware'
import { Role } from '@prisma/client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/login')
  }

  // RBAC: Only Admins can access /admin routes
  requireRole(user.role, [Role.ADMIN])

  return <>{children}</>
}
