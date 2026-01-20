import { redirect } from 'next/navigation'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { RiscoDashboard } from './risco-dashboard'
import { TrendingDown } from 'lucide-react'

/**
 * Risk Analytics Page Metadata
 */
export const metadata = {
  title: 'Analytics de Risco | Botfy ClinicOps',
  description: 'Analise de risco de no-show e padroes de faltas',
}

/**
 * Risk Analytics Page
 *
 * Admin-only page displaying risk analytics dashboard.
 *
 * Features:
 * - Risk distribution chart (baixo/medio/alto)
 * - Predicted vs actual outcomes comparison
 * - No-show patterns by day, time, and service
 *
 * Access:
 * - ADMIN role required
 */
export default async function RiscoAnalyticsPage() {
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/auth/login')
  }

  // Only ADMIN can access risk analytics
  if (user.role !== 'ADMIN') {
    redirect('/admin')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Analytics de Risco No-Show
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analise de distribuicao de risco, precisao de predicoes e padroes de faltas
          </p>
        </div>
      </div>

      <RiscoDashboard />
    </div>
  )
}
