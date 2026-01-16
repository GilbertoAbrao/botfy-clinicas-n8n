import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserWithRole } from '@/lib/auth/session'
import { signOut } from '@/lib/auth/actions'
import { getUnresolvedAlertCount } from '@/lib/api/alerts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Role } from '@prisma/client'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const userWithRole = await getCurrentUserWithRole()

  if (!user) {
    redirect('/login')
  }

  // Get unresolved alert count for badge
  const unresolvedCount = await getUnresolvedAlertCount()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">Botfy ClinicOps</h1>
            <nav className="flex items-center gap-2">
              <Link href="/dashboard/alerts">
                <Button variant="ghost" size="sm" className="relative">
                  Alertas
                  {unresolvedCount > 0 && (
                    <Badge className="ml-2 bg-blue-500 hover:bg-blue-600 text-white">
                      {unresolvedCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {userWithRole?.role === Role.ADMIN && (
              <>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm">
                    Usuários
                  </Button>
                </Link>
                <Link href="/admin/audit-logs">
                  <Button variant="ghost" size="sm">
                    Audit Logs
                  </Button>
                </Link>
              </>
            )}
            <span className="text-sm text-gray-600">
              {user.email}
              {userWithRole?.role && ` (${userWithRole.role})`}
            </span>
            <form action={signOut}>
              <Button variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600">
            Bem-vindo ao console administrativo Botfy ClinicOps.
          </p>
        </div>
      </main>
    </div>
  )
}
