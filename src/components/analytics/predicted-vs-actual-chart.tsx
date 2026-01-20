'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PredictedVsActualData {
  predicted: string
  actualNoShow: number
  actualAttended: number
  accuracy: number
}

interface PredictedVsActualChartProps {
  data: PredictedVsActualData[]
  loading?: boolean
}

/**
 * PredictedVsActualChart Component
 *
 * Displays a grouped bar chart comparing predicted risk levels
 * to actual outcomes (attended vs no-show).
 *
 * Features:
 * - Stacked bars showing attended (green) vs no-show (red)
 * - Accuracy summary below chart
 * - Loading skeleton state
 * - Color-coded accuracy percentages
 */
export function PredictedVsActualChart({ data, loading }: PredictedVsActualChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Predicao vs Resultado Real</CardTitle>
          <CardDescription>Comparacao entre risco previsto e comportamento real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(d => ({
    ...d,
    label: d.predicted.charAt(0).toUpperCase() + d.predicted.slice(1),
    total: d.actualNoShow + d.actualAttended,
  }))

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Predicao vs Resultado Real</CardTitle>
          <CardDescription>Comparacao entre risco previsto e comportamento real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
            Nenhum dado de predicao disponivel
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicao vs Resultado Real</CardTitle>
        <CardDescription>
          Comparacao entre o risco previsto pelo sistema e o comportamento real dos pacientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="actualNoShow" name="Faltou" fill="#ef4444" stackId="a" />
              <Bar dataKey="actualAttended" name="Compareceu" fill="#22c55e" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Accuracy summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
          {chartData.map(d => (
            <div key={d.label} className="p-2 bg-gray-50 rounded">
              <div className="font-medium">Risco {d.label}</div>
              <div className="text-gray-500">
                {d.actualNoShow} faltas / {d.total} total
              </div>
              <div className={`font-semibold ${d.accuracy >= 70 ? 'text-green-600' : d.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {d.accuracy.toFixed(0)}% precisao
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
