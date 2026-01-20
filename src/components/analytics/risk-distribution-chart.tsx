'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface RiskDistributionData {
  riskLevel: string
  count: number
  percentage: number
}

interface RiskDistributionChartProps {
  data: RiskDistributionData[]
  loading?: boolean
}

// Color mapping matching existing risk colors
const RISK_COLORS: Record<string, string> = {
  'Baixo': '#22c55e',  // green-500
  'Medio': '#eab308',  // yellow-500
  'Alto': '#ef4444',   // red-500
}

/**
 * RiskDistributionChart Component
 *
 * Displays a horizontal bar chart showing the distribution of patients
 * across risk levels (Baixo, Medio, Alto).
 *
 * Features:
 * - Color-coded bars matching existing risk badge colors
 * - Loading skeleton state
 * - Tooltip showing count and percentage
 * - Legend with percentages below chart
 */
export function RiskDistributionChart({ data, loading }: RiskDistributionChartProps) {
  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuicao de Risco</CardTitle>
          <CardDescription>Como os pacientes sao classificados por risco de no-show</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  // Transform data for display (capitalize labels)
  const chartData = data.map(d => ({
    ...d,
    label: d.riskLevel.charAt(0).toUpperCase() + d.riskLevel.slice(1),
    displayLabel: `${d.riskLevel}: ${d.count} (${d.percentage.toFixed(1)}%)`,
  }))

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuicao de Risco</CardTitle>
          <CardDescription>Como os pacientes sao classificados por risco de no-show</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
            Nenhum dado de risco disponivel
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuicao de Risco</CardTitle>
        <CardDescription>
          Como os pacientes sao classificados por risco de no-show
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="label" type="category" width={80} />
              <Tooltip
                formatter={(value) => [String(value), 'Pacientes']}
                labelFormatter={(label) => `Risco ${label}`}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={RISK_COLORS[entry.label] || '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend with percentages */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          {chartData.map(d => (
            <div key={d.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: RISK_COLORS[d.label] || '#6b7280' }}
              />
              <span>{d.label}: {d.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
