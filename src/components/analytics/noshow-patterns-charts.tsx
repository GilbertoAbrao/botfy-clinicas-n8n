'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PatternData {
  label: string
  noShowRate: number
  total: number
}

interface NoShowPatternsChartsProps {
  byDayOfWeek: { day: string; noShowRate: number; total: number }[]
  byTimeSlot: { slot: string; noShowRate: number; total: number }[]
  byService: { service: string; noShowRate: number; total: number }[]
  loading?: boolean
}

/**
 * Returns a color based on no-show rate severity.
 * Higher rates get warmer colors (red).
 */
function getRateColor(rate: number): string {
  if (rate >= 25) return '#ef4444'  // red-500
  if (rate >= 15) return '#f97316'  // orange-500
  if (rate >= 10) return '#eab308'  // yellow-500
  return '#22c55e'  // green-500
}

/**
 * PatternBarChart Component
 *
 * Internal component for rendering a single pattern bar chart.
 */
function PatternBarChart({ data, title, description }: {
  data: PatternData[]
  title: string
  description: string
}) {
  // Empty state
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-center justify-center text-gray-500 text-sm">
            Sem dados
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="label" type="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Taxa de Falta']}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="noShowRate" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRateColor(entry.noShowRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * NoShowPatternsCharts Component
 *
 * Displays three compact bar charts showing no-show patterns by:
 * - Day of week
 * - Time slot (morning/afternoon/evening)
 * - Service type
 *
 * Features:
 * - Color-coded bars by rate severity (green to red)
 * - Portuguese labels
 * - Responsive grid layout (3 columns on desktop)
 * - Loading skeleton states
 * - Top 6 services for readability
 */
export function NoShowPatternsCharts({ byDayOfWeek, byTimeSlot, byService, loading }: NoShowPatternsChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full bg-gray-100 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PatternBarChart
        data={byDayOfWeek.map(d => ({ label: d.day, noShowRate: d.noShowRate, total: d.total }))}
        title="Por Dia da Semana"
        description="Taxa de falta por dia"
      />
      <PatternBarChart
        data={byTimeSlot.map(d => ({ label: d.slot, noShowRate: d.noShowRate, total: d.total }))}
        title="Por Horario"
        description="Taxa de falta por periodo"
      />
      <PatternBarChart
        data={byService.slice(0, 6).map(d => ({
          label: d.service.length > 15 ? d.service.substring(0, 15) + '...' : d.service,
          noShowRate: d.noShowRate,
          total: d.total
        }))}
        title="Por Servico"
        description="Taxa de falta por tipo"
      />
    </div>
  )
}
