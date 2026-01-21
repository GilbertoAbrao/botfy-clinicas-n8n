'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

/**
 * Status configuration with labels, colors, and icons for pre-checkin status display.
 * Colors follow the specification: blue=pendente, yellow=em_andamento, green=completo, red=incompleto
 */
export const STATUS_CONFIG = {
  pendente: {
    label: 'Pendente',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    icon: Clock,
  },
  em_andamento: {
    label: 'Em Andamento',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    icon: Loader2,
  },
  completo: {
    label: 'Completo',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
    icon: CheckCircle,
  },
  incompleto: {
    label: 'Incompleto',
    variant: 'secondary' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
    icon: XCircle,
  },
} as const

export type PreCheckinStatusKey = keyof typeof STATUS_CONFIG

interface StatusBadgeProps {
  status: PreCheckinStatusKey
  className?: string
}

/**
 * StatusBadge Component
 *
 * Displays a colored badge for pre-checkin status with an icon.
 * Uses consistent color coding:
 * - Blue: Pendente (waiting)
 * - Yellow: Em Andamento (in progress)
 * - Green: Completo (complete)
 * - Red: Incompleto (incomplete)
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      <Icon className={cn('h-3 w-3 mr-1', status === 'em_andamento' && 'animate-spin')} />
      {config.label}
    </Badge>
  )
}
