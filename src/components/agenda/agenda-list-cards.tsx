'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NoShowRiskBadge } from '@/components/appointments/no-show-risk-badge'
import { Calendar, Pencil, Check, X } from 'lucide-react'
import {
  AppointmentListItem,
  STATUS_APPOINTMENT_LABELS,
  AppointmentStatus,
} from '@/lib/validations/appointment'
import { dbTimestampToTZDate } from '@/lib/calendar/time-zone-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AgendaListCardsProps {
  data: AppointmentListItem[]
  onEdit: (id: string) => void
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onRowClick?: (id: string) => void
}

/**
 * AgendaListCards Component
 *
 * Mobile card layout for appointment list.
 * Shows appointment details in card format on mobile screens (hidden on desktop).
 * Includes patient name, date/time, service, provider, status, and action buttons.
 */
export function AgendaListCards({
  data,
  onEdit,
  onConfirm,
  onCancel,
  onRowClick,
}: AgendaListCardsProps) {
  // Helper: Get status badge variant
  const getStatusVariant = (
    status: AppointmentStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmado':
        return 'default'
      case 'cancelada':
      case 'faltou':
        return 'destructive'
      case 'realizada':
        return 'secondary'
      case 'agendada':
      default:
        return 'outline'
    }
  }

  // Helper: Check if appointment is in the future
  const isFutureAppointment = (scheduledAt: string): boolean => {
    const appointmentDate = dbTimestampToTZDate(scheduledAt)
    const now = new Date()
    return appointmentDate.getTime() > now.getTime()
  }

  // Helper: Check if risk badge should be shown
  const shouldShowRiskBadge = (appointment: AppointmentListItem): boolean => {
    const excludedStatuses: AppointmentStatus[] = ['cancelada', 'realizada', 'faltou']
    return (
      isFutureAppointment(appointment.scheduledAt) &&
      !excludedStatuses.includes(appointment.status)
    )
  }

  // Helper: Check if action buttons should be shown
  const shouldShowConfirm = (status: AppointmentStatus): boolean => {
    return status === 'agendada'
  }

  const shouldShowCancel = (status: AppointmentStatus): boolean => {
    return ['agendada', 'confirmado'].includes(status)
  }

  // Helper: Format date/time
  const formatDateTime = (scheduledAt: string): string => {
    try {
      const date = dbTimestampToTZDate(scheduledAt)
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros de busca.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="md:hidden space-y-3">
      {data.map((appointment) => {
        const statusLabel = STATUS_APPOINTMENT_LABELS[appointment.status]
        const statusVariant = getStatusVariant(appointment.status)
        const showRiskBadge = shouldShowRiskBadge(appointment)
        const showConfirm = shouldShowConfirm(appointment.status)
        const showCancel = shouldShowCancel(appointment.status)
        const formattedDateTime = formatDateTime(appointment.scheduledAt)

        return (
          <div
            key={appointment.id}
            className="bg-white rounded-lg border p-4 space-y-3 cursor-pointer hover:bg-gray-50"
            onClick={() => onRowClick?.(appointment.id)}
          >
            {/* Header: Patient name + Risk badge */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {appointment.patientName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
              </div>
              {showRiskBadge && (
                <NoShowRiskBadge
                  appointmentId={appointment.id}
                  className="ml-2 flex-shrink-0"
                />
              )}
            </div>

            {/* Details grid */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Data/Hora:</span>
                <span className="text-gray-900">{formattedDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Serviço:</span>
                <span className="text-gray-900">{appointment.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profissional:</span>
                <span className="text-gray-900 flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: appointment.providerColor }}
                  />
                  {appointment.providerName}
                </span>
              </div>
              {appointment.patientPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefone:</span>
                  <span className="text-gray-900 font-mono">
                    {appointment.patientPhone}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(appointment.id)
                }}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              {showConfirm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfirm(appointment.id)
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              )}
              {showCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel(appointment.id)
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
