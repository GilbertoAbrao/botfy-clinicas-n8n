'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NoShowRiskBadge } from '@/components/appointments/no-show-risk-badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { dbTimestampToTZDate } from '@/lib/calendar/time-zone-utils'
import {
  AppointmentListItem,
  STATUS_APPOINTMENT_LABELS,
  AppointmentStatus
} from '@/lib/validations/appointment'

interface ColumnCallbacks {
  onEdit: (id: string) => void
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
}

export function getColumns(callbacks: ColumnCallbacks): ColumnDef<AppointmentListItem>[] {
  const { onEdit, onConfirm, onCancel } = callbacks

  return [
    // Column 1: Data/Hora
    {
      accessorKey: 'scheduledAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Data/Hora
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const scheduledAt = row.getValue('scheduledAt') as string
        const tzDate = dbTimestampToTZDate(scheduledAt)
        return (
          <div className="font-medium">
            {format(tzDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </div>
        )
      },
    },

    // Column 2: Paciente
    {
      accessorKey: 'patientName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Paciente
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const patientName = row.getValue('patientName') as string
        const patientPhone = row.original.patientPhone
        return (
          <div>
            <div className="font-medium">{patientName}</div>
            {patientPhone && (
              <div className="text-sm text-muted-foreground">{patientPhone}</div>
            )}
          </div>
        )
      },
    },

    // Column 3: Serviço
    {
      accessorKey: 'serviceType',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Serviço
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const serviceType = row.getValue('serviceType') as string
        return <div>{serviceType}</div>
      },
    },

    // Column 4: Profissional
    {
      accessorKey: 'providerName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Profissional
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const providerName = row.getValue('providerName') as string
        const providerColor = row.original.providerColor
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: providerColor }}
            />
            <span>{providerName}</span>
          </div>
        )
      },
    },

    // Column 5: Status
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as AppointmentStatus
        const statusLabel = STATUS_APPOINTMENT_LABELS[status]

        // Map status to badge variant
        const variantMap: Record<AppointmentStatus, 'outline' | 'default' | 'destructive' | 'secondary'> = {
          agendada: 'outline',
          confirmado: 'default',
          cancelada: 'destructive',
          realizada: 'secondary',
          faltou: 'destructive',
        }

        return (
          <Badge variant={variantMap[status]}>
            {statusLabel}
          </Badge>
        )
      },
    },

    // Column 6: Risco
    {
      id: 'risk',
      header: () => <div className="px-2">Risco</div>,
      cell: ({ row }) => {
        const scheduledAt = row.getValue('scheduledAt') as string
        const status = row.getValue('status') as AppointmentStatus
        const appointmentId = row.original.id

        // Only show for future appointments that are not in terminal states
        const isFuture = new Date(scheduledAt) > new Date()
        const isEligible = !['cancelada', 'realizada', 'faltou'].includes(status)

        if (!isFuture || !isEligible) {
          return null
        }

        return <NoShowRiskBadge appointmentId={appointmentId} />
      },
    },

    // Column 7: Ações
    {
      id: 'actions',
      header: () => <div className="px-2">Ações</div>,
      cell: ({ row }) => {
        const appointmentId = row.original.id
        const status = row.getValue('status') as AppointmentStatus

        return (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit button - always visible */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(appointmentId)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>

            {/* Confirm button - only for agendada */}
            {status === 'agendada' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onConfirm(appointmentId)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Confirmar</span>
              </Button>
            )}

            {/* Cancel button - only for agendada or confirmado */}
            {(status === 'agendada' || status === 'confirmado') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(appointmentId)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancelar</span>
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
