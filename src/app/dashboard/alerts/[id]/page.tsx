import { notFound, redirect } from 'next/navigation'
import { getAlertById } from '@/lib/api/alerts'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { requirePermission, PERMISSIONS } from '@/lib/rbac/permissions'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { AlertDetailClient } from './alert-detail-client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const alertTypeLabels: Record<string, string> = {
  no_show: 'Falta em Consulta',
  conversation_stuck: 'Conversa Travada',
  schedule_conflict: 'Conflito de Horário',
  payment_failed: 'Falha no Pagamento',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AlertDetailPage({ params }: PageProps) {
  // Get current user and check permissions
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/login')
  }

  // Check RBAC permission for viewing alerts
  try {
    requirePermission(user.role, PERMISSIONS.VIEW_ALERTS)
  } catch (error) {
    redirect('/dashboard')
  }

  // Get alert ID from params
  const { id } = await params

  // Fetch alert with full relations
  const alert = await getAlertById(id)

  if (!alert) {
    notFound()
  }

  // Log audit trail for viewing alert detail
  await logAudit({
    userId: user.id,
    action: AuditAction.VIEW_ALERT,
    resource: 'alerts',
    resourceId: id,
  })

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/alerts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <nav className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            {' / '}
            <Link href="/dashboard/alerts" className="hover:underline">
              Alertas
            </Link>
            {' / '}
            <span className="text-foreground">
              {alertTypeLabels[alert.type] || alert.type}
            </span>
          </nav>
          <h1 className="text-3xl font-bold">Detalhes do Alerta</h1>
        </div>
      </div>

      {/* Alert Detail Component */}
      <AlertDetailClient alert={alert} />
    </div>
  )
}
