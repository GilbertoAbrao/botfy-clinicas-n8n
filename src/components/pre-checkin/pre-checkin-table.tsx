'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './status-badge'
import { ProgressBar } from './progress-bar'
import { PreCheckin, calculateProgress } from '@/lib/validations/pre-checkin'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, Bell, MoreHorizontal, ClipboardList } from 'lucide-react'
import { dbTimestampToTZDate } from '@/lib/calendar/time-zone-utils'

interface PreCheckinTableProps {
  data: PreCheckin[]
  onRowClick: (preCheckin: PreCheckin) => void
  onSendReminder: (preCheckin: PreCheckin) => void
}

/**
 * PreCheckinTable Component
 *
 * Desktop table view for pre-checkin records.
 * Shows patient, appointment, service, status, progress, and actions.
 *
 * Features:
 * - Columns: Paciente, Consulta, Servico, Status, Progresso, Acoes
 * - Row click navigates to detail view
 * - Dropdown menu for actions (Ver detalhes, Enviar lembrete)
 * - Empty state with helpful message
 *
 * Hidden on mobile (md:hidden breakpoint) - use PreCheckinCards for mobile.
 */
export function PreCheckinTable({
  data,
  onRowClick,
  onSendReminder,
}: PreCheckinTableProps) {
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
      <div className="hidden md:block bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Consulta</TableHead>
              <TableHead>Servico</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 opacity-50" />
                  <div>
                    <p className="font-medium">Nenhum pre-checkin encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros de busca.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Consulta</TableHead>
            <TableHead>Servico</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const progress = calculateProgress(item)

            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(item)}
              >
                {/* Paciente */}
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.paciente?.nome || 'Paciente desconhecido'}
                    </p>
                    {item.paciente?.telefone && (
                      <p className="text-sm text-gray-500 font-mono">
                        {formatPhone(item.paciente.telefone)}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Consulta */}
                <TableCell>
                  <span className="text-gray-700">
                    {formatDateTime(item.agendamento?.data_hora)}
                  </span>
                </TableCell>

                {/* Servico */}
                <TableCell>
                  <span className="text-gray-700">
                    {item.agendamento?.servico?.nome || '-'}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>

                {/* Progresso */}
                <TableCell>
                  <ProgressBar value={progress} className="max-w-[120px]" />
                </TableCell>

                {/* Acoes */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowClick(item)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onSendReminder(item)
                        }}
                        disabled={item.status === 'completo'}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Enviar lembrete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
