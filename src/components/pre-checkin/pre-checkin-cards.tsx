'use client'

import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { ProgressBar } from './progress-bar'
import { PreCheckin, calculateProgress } from '@/lib/validations/pre-checkin'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, Bell, ClipboardList } from 'lucide-react'
import { dbTimestampToTZDate } from '@/lib/calendar/time-zone-utils'

interface PreCheckinCardsProps {
  data: PreCheckin[]
  onRowClick: (preCheckin: PreCheckin) => void
  onSendReminder: (preCheckin: PreCheckin) => void
}

/**
 * PreCheckinCards Component
 *
 * Mobile card layout for pre-checkin records.
 * Shows the same information as PreCheckinTable but in a card format.
 *
 * Features:
 * - Card header: Patient name + Status badge
 * - Card body: Appointment date/time, service name, progress bar
 * - Card footer: Action buttons (Ver detalhes, Enviar lembrete)
 *
 * Hidden on desktop (md:hidden breakpoint) - use PreCheckinTable for desktop.
 */
export function PreCheckinCards({
  data,
  onRowClick,
  onSendReminder,
}: PreCheckinCardsProps) {
  /**
   * Format appointment date/time from database timestamp.
   */
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return '-'
    try {
      const date = dbTimestampToTZDate(dateString)
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  /**
   * Format phone number for display.
   */
  const formatPhone = (phone: string | undefined): string => {
    if (!phone) return ''
    // Remove non-digits
    const digits = phone.replace(/\D/g, '')
    // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return phone
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <ClipboardList className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum pre-checkin encontrado
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
      {data.map((item) => {
        const progress = calculateProgress(item)
        const isComplete = item.status === 'completo'

        return (
          <div
            key={item.id}
            className="bg-white rounded-lg border p-4 space-y-3 cursor-pointer hover:bg-gray-50"
            onClick={() => onRowClick(item)}
          >
            {/* Header: Patient name + Status badge */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {item.paciente?.nome || 'Paciente desconhecido'}
                </h3>
                {item.paciente?.telefone && (
                  <p className="text-sm text-gray-500 font-mono mt-0.5">
                    {formatPhone(item.paciente.telefone)}
                  </p>
                )}
              </div>
              <StatusBadge status={item.status} />
            </div>

            {/* Details grid */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Consulta:</span>
                <span className="text-gray-900">
                  {formatDateTime(item.agendamento?.data_hora)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Servico:</span>
                <span className="text-gray-900">
                  {item.agendamento?.servico?.nome || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Progresso:</span>
                <ProgressBar value={progress} className="w-24" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onRowClick(item)
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver detalhes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onSendReminder(item)
                }}
                disabled={isComplete}
              >
                <Bell className="h-4 w-4 mr-1" />
                Lembrete
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
