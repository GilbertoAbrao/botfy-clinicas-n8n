import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { AnalyticsDashboard } from './analytics-dashboard'
import { ExportButton } from '@/components/analytics/export-button'
import { Button } from '@/components/ui/button'

/**
 * Analytics Page Metadata
 */
export const metadata = {
  title: 'Analytics e Metricas | Botfy ClinicOps',
  description: 'Dashboard de analytics com KPIs, padroes detectados e exportacao de dados',
}

/**
 * Analytics Page
 *
 * Admin-only page displaying comprehensive analytics dashboard.
 *
 * Features:
 * - KPI cards with booking success, no-show, cancellation rates
 * - Detected patterns from pattern-detector algorithm
 * - Alert volume summary
 * - CSV export buttons for appointments, alerts, and KPIs
 *
 * Access:
 * - ADMIN role required (enforced by admin layout and explicit check)
 */
export default async function AnalyticsPage() {
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/auth/login')
  }

  // Explicit ADMIN check (admin layout also enforces this)
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back Button */}
      <div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Dashboard
          </Button>
        </Link>
      </div>

      {/* Header with export buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics e Metricas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualize KPIs, padroes detectados e exporte dados
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButton type="appointments" variant="outline" size="sm" />
          <ExportButton type="alerts" variant="outline" size="sm" />
          <ExportButton type="kpis" variant="outline" size="sm" />
        </div>
      </div>

      {/* Dashboard content */}
      <AnalyticsDashboard />
    </div>
  )
}
