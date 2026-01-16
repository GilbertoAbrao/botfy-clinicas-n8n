import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { MetricsDashboard } from '@/components/dashboard/metrics-dashboard'
import { ServiceStatus } from '@/components/dashboard/service-status'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral do sistema e métricas operacionais
          </p>
        </div>

        {/* Metrics Dashboard */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Métricas em Tempo Real
          </h2>
          <MetricsDashboard />
        </section>

        {/* Service Status */}
        <section>
          <ServiceStatus />
        </section>
      </div>
    </DashboardLayout>
  )
}
