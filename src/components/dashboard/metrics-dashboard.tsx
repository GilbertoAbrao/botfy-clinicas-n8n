'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, CheckCircle, MessageCircle } from 'lucide-react'
import { getAllMetrics, type MetricsData } from '@/lib/api/metrics'

/**
 * Metrics Dashboard Widget
 *
 * Displays key operational metrics in card grid:
 * - Agendamentos Hoje: Appointments scheduled for today
 * - Taxa de Confirmação: Percentage of confirmed appointments
 * - Conversas Ativas: Active AI/human conversations
 *
 * Auto-refreshes every 5 minutes to stay current.
 */
export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setError(null)
      const data = await getAllMetrics()
      setMetrics(data)
    } catch (err) {
      console.error('[MetricsDashboard] Error fetching metrics:', err)
      setError('Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchMetrics()

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchMetrics()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
              <div className="h-5 w-5 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-3 w-40 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // No data
  if (!metrics) {
    return null
  }

  // Get color for confirmation rate
  const getConfirmationColor = (rate: number | null): string => {
    if (rate === null) return 'text-gray-600'
    if (rate >= 70) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const confirmationRate = metrics.taxaConfirmacao

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Agendamentos Hoje */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Agendamentos Hoje
          </CardTitle>
          <Calendar className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.agendamentosHoje}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            agendados para hoje
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Taxa de Confirmação */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Taxa de Confirmação
          </CardTitle>
          <CheckCircle className={`h-5 w-5 ${getConfirmationColor(confirmationRate)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${getConfirmationColor(confirmationRate)}`}>
            {confirmationRate !== null ? `${confirmationRate}%` : '—'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            confirmação de agendamentos
          </p>
        </CardContent>
      </Card>

      {/* Card 3: Conversas Ativas */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Conversas Ativas
          </CardTitle>
          <MessageCircle className="h-5 w-5 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.conversasAtivas}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            conversas em andamento
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
