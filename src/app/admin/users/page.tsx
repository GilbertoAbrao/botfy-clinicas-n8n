import { getCurrentUserWithRole } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UsersPage() {
  const user = await getCurrentUserWithRole()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gerenciar Usuários</h1>
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Você está logado como: {user?.email} (Role: {user?.role})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Esta página só é acessível por usuários com role ADMIN.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            User management UI será implementado em Phase 7 (System Configuration).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
