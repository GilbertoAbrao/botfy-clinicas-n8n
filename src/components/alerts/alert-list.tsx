'use client'

import { AlertWithRelations } from '@/lib/api/alerts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertType, AlertPriority, AlertStatus } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { AlertPriorityBadge } from './alert-priority-badge'

interface AlertListProps {
  alerts: AlertWithRelations[]
  loading?: boolean
}

// Human-readable alert type labels
const alertTypeLabels: Record<AlertType, string> = {
  conversas_travadas: 'Conversa Travada',
  pre_checkins_pendentes: 'Pré-Checkin Pendente',
  agendamentos_nao_confirmados: 'Agendamento Não Confirmado',
  handoff_normal: 'Handoff Normal',
  handoff_erro: 'Handoff com Erro',
}

// Priority badge colors (Botfy brand colors)
const priorityColors: Record<AlertPriority, string> = {
  urgent: 'bg-red-500 hover:bg-red-600 text-white',
  high: 'bg-orange-500 hover:bg-orange-600 text-white',
  low: 'bg-gray-400 hover:bg-gray-500 text-white',
}

const priorityLabels: Record<AlertPriority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  low: 'Baixa',
}

// Status badge colors (Botfy brand colors)
const statusColors: Record<AlertStatus, string> = {
  new: 'bg-blue-500 hover:bg-blue-600 text-white',
  in_progress: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  resolved: 'bg-green-500 hover:bg-green-600 text-white',
  dismissed: 'bg-gray-400 hover:bg-gray-500 text-white',
}

const statusLabels: Record<AlertStatus, string> = {
  new: 'Novo',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  dismissed: 'Dispensado',
}

export function AlertList({ alerts, loading = false }: AlertListProps) {
  // Loading state with skeleton rows
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prioridade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
                <div className="h-5 w-full bg-gray-200 animate-pulse rounded" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhum alerta encontrado</h3>
            <p className="text-sm text-gray-500 mt-1">
              Não há alertas que correspondam aos filtros selecionados.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prioridade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow
                key={alert.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[alert.priority]}>
                      {priorityLabels[alert.priority]}
                    </Badge>
                    <AlertPriorityBadge alertId={alert.id} />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {alertTypeLabels[alert.type]}
                </TableCell>
                <TableCell>
                  {alert.patient?.nome || '—'}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[alert.status]}>
                    {statusLabels[alert.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {formatDistanceToNow(new Date(alert.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/alerts/${alert.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {alerts.map((alert) => (
          <Link key={alert.id} href={`/dashboard/alerts/${alert.id}`}>
            <Card className="p-4 active:bg-gray-50 transition-colors min-h-[44px] flex flex-col justify-center">
              <div className="space-y-3">
                {/* Priority badge at top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={priorityColors[alert.priority]}>
                      {priorityLabels[alert.priority]}
                    </Badge>
                    <AlertPriorityBadge alertId={alert.id} />
                  </div>
                  <Badge className={statusColors[alert.status]}>
                    {statusLabels[alert.status]}
                  </Badge>
                </div>

                {/* Patient name and alert type as header */}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {alert.patient?.nome || 'Sem paciente'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {alertTypeLabels[alert.type]}
                  </p>
                </div>

                {/* Created time as footer */}
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(alert.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}
