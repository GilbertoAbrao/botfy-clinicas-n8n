import { MetricsDashboard } from '@/components/dashboard/metrics-dashboard'
import { ServiceStatus } from '@/components/dashboard/service-status'

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Visao geral do sistema e metricas operacionais
        </p>
      </div>

      {/* Metrics Dashboard */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Metricas em Tempo Real
        </h2>
        <MetricsDashboard />
      </section>

      {/* Service Status */}
      <section>
        <ServiceStatus />
      </section>
    </div>
  )
}
