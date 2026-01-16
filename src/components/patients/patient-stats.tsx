import { Card, CardContent } from '@/components/ui/card'
import { Calendar, CheckCircle, XCircle, TrendingDown } from 'lucide-react'

interface PatientStatsProps {
  appointments: {
    status: string
  }[]
}

export function PatientStats({ appointments }: PatientStatsProps) {
  // Calculate metrics
  const totalAppointments = appointments.length
  const confirmedCount = appointments.filter(
    (a) => a.status === 'confirmed'
  ).length
  const noShowCount = appointments.filter((a) => a.status === 'no_show').length
  const noShowRate =
    totalAppointments > 0
      ? ((noShowCount / totalAppointments) * 100).toFixed(1)
      : '0.0'

  const stats = [
    {
      label: 'Total de Agendamentos',
      value: totalAppointments,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Agendamentos Confirmados',
      value: confirmedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Não Comparecimentos',
      value: noShowCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Taxa de Não Comparecimento',
      value: `${noShowRate}%`,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
