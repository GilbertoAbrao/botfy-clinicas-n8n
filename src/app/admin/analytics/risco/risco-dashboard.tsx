'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { RiskDistributionChart } from '@/components/analytics/risk-distribution-chart'
import { PredictedVsActualChart } from '@/components/analytics/predicted-vs-actual-chart'
import { NoShowPatternsCharts } from '@/components/analytics/noshow-patterns-charts'

/**
 * Response type from /api/analytics/risco
 */
interface RiskAnalyticsResponse {
  distribution: { riskLevel: string; count: number; percentage: number }[]
  predictedVsActual: { predicted: string; actualNoShow: number; actualAttended: number; accuracy: number }[]
  patterns: {
    byDayOfWeek: { day: string; noShowRate: number; total: number }[]
    byTimeSlot: { slot: string; noShowRate: number; total: number }[]
    byService: { service: string; noShowRate: number; total: number }[]
  }
  period: { start: string; end: string }
  totals: { reminders: number; appointments: number }
  generatedAt: string
}

/**
 * RiscoDashboard Component
 *
 * Client component that fetches risk analytics data and renders charts.
 *
 * Features:
 * - Fetches from /api/analytics/risco
 * - Displays distribution, prediction accuracy, and pattern charts
 * - Loading states for all chart components
 * - Error handling with retry button
 * - Auto-refresh every 5 minutes
 */
export function RiscoDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RiskAnalyticsResponse | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/risco?periodDays=30')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao carregar' }))
        throw new Error(errorData.error || `Status ${response.status}`)
      }

      const analyticsData = await response.json() as RiskAnalyticsResponse
      setData(analyticsData)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('[RiscoDashboard] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar analytics de risco
            </h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Periodo: ultimos 30 dias
            {data?.totals && ` • ${data.totals.reminders} lembretes analisados`}
          </p>
        </div>
        {lastRefreshed && !loading && (
          <Button variant="ghost" size="sm" onClick={fetchData} className="text-gray-500">
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        )}
      </div>

      {/* Distribution and Prediction charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RiskDistributionChart
          data={data?.distribution || []}
          loading={loading}
        />
        <PredictedVsActualChart
          data={data?.predictedVsActual || []}
          loading={loading}
        />
      </div>

      {/* Pattern charts */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Padroes de No-Show
        </h2>
        <NoShowPatternsCharts
          byDayOfWeek={data?.patterns.byDayOfWeek || []}
          byTimeSlot={data?.patterns.byTimeSlot || []}
          byService={data?.patterns.byService || []}
          loading={loading}
        />
      </section>

      {/* Last updated */}
      {lastRefreshed && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Ultima atualizacao: {lastRefreshed.toLocaleTimeString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  )
}
