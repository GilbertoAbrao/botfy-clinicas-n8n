'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { KPICards, type KPIMetrics } from '@/components/analytics/kpi-cards'
import { InsightsPanel, type Pattern } from '@/components/analytics/insights-panel'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Response type from /api/analytics
 */
interface AnalyticsResponse {
  kpis: KPIMetrics
  patterns: Pattern[]
  generatedAt: string
}

/**
 * AnalyticsDashboard Component
 *
 * Client component that fetches and displays analytics data.
 * Combines KPICards and InsightsPanel with error handling.
 *
 * Features:
 * - Auto-fetches analytics on mount
 * - Loading states for both components
 * - Error handling with retry button
 * - Manual refresh capability
 * - Auto-refresh every 5 minutes
 */
export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics?periodDays=30')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch' }))
        throw new Error(errorData.error || `Failed with status ${response.status}`)
      }

      const analyticsData = await response.json() as AnalyticsResponse
      setData(analyticsData)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('[AnalyticsDashboard] Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchAnalytics()

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchAnalytics()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Error state
  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar analytics
            </h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
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
      {/* KPI Cards Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Indicadores de Performance
          </h2>
          {lastRefreshed && !loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAnalytics}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
        <KPICards
          metrics={data?.kpis ? {
            ...data.kpis,
            period: {
              start: new Date(data.kpis.period.start),
              end: new Date(data.kpis.period.end),
            },
          } : null}
          loading={loading}
        />
      </section>

      {/* Insights Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Padroes Detectados
          </h2>
          <InsightsPanel
            patterns={data?.patterns || []}
            loading={loading}
          />
        </div>

        {/* Placeholder for future charts/additional insights */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Resumo de Alertas
          </h2>
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
                </div>
              ) : data?.kpis.alertVolumeByType ? (
                <div className="space-y-3">
                  {Object.entries(data.kpis.alertVolumeByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {count}
                      </span>
                    </div>
                  ))}
                  {data.kpis.totals && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          {data.kpis.totals.alerts}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-500">Resolvidos</span>
                        <span className="text-sm text-green-600">
                          {data.kpis.totals.resolvedAlerts}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Nenhum dado de alertas disponivel
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Last updated timestamp */}
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
