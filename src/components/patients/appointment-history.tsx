import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock } from 'lucide-react'

interface Appointment {
  id: number
  tipoConsulta: string
  dataHora: Date
  duracaoMinutos: number | null
  status: string | null
}

interface AppointmentHistoryProps {
  appointments: Appointment[]
}

function getStatusBadgeVariant(
  status: string | null
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmada':
    case 'confirmed':
      return 'default' // green
    case 'agendada':
    case 'tentative':
      return 'secondary' // yellow
    case 'nao_compareceu':
    case 'no_show':
      return 'destructive' // red
    case 'cancelada':
    case 'cancelled':
      return 'outline' // gray
    case 'concluida':
    case 'completed':
      return 'default' // blue
    default:
      return 'outline'
  }
}

function getStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    agendada: 'Agendado',
    confirmada: 'Confirmado',
    concluida: 'Concluído',
    cancelada: 'Cancelado',
    nao_compareceu: 'Não Compareceu',
    confirmed: 'Confirmado',
    tentative: 'Tentativo',
    no_show: 'Não Compareceu',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  }
  return status ? (labels[status] || status) : 'Pendente'
}

export function AppointmentHistory({ appointments }: AppointmentHistoryProps) {
  // Sort by dataHora descending (most recent first)
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  )

  // Separate past and upcoming appointments
  const now = new Date()
  const upcomingAppointments = sortedAppointments.filter(
    (a) => !isBefore(new Date(a.dataHora), now)
  )
  const pastAppointments = sortedAppointments.filter((a) =>
    isBefore(new Date(a.dataHora), now)
  )

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-gray-500">
            Nenhum agendamento encontrado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Próximos Agendamentos
          </h3>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {appointment.tipoConsulta}
                        </h4>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(appointment.dataHora),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.duracaoMinutos || 30} minutos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Histórico de Agendamentos
          </h3>
          <div className="space-y-4">
            {pastAppointments.map((appointment) => (
              <Card key={appointment.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {appointment.tipoConsulta}
                        </h4>
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(appointment.dataHora),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.duracaoMinutos || 30} minutos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
