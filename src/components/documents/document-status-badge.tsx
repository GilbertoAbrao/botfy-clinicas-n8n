'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import {
  DocumentStatus,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
} from '@/lib/validations/patient-document'

/**
 * Status icon mapping for document status badges.
 * - pendente: Clock (waiting)
 * - aprovado: CheckCircle (approved)
 * - rejeitado: XCircle (rejected)
 */
const STATUS_ICONS = {
  pendente: Clock,
  aprovado: CheckCircle,
  rejeitado: XCircle,
} as const

/**
 * Tailwind color classes for each status color.
 * Uses className override for consistent colors across theme variations.
 */
const COLOR_CLASSES = {
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
  green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
} as const

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

/**
 * DocumentStatusBadge Component
 *
 * Displays a colored badge for document validation status with an icon.
 * Uses consistent color coding:
 * - Yellow: Pendente (pending validation)
 * - Green: Aprovado (approved/validated)
 * - Red: Rejeitado (rejected)
 */
export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const label = DOCUMENT_STATUS_LABELS[status]
  const color = DOCUMENT_STATUS_COLORS[status] as keyof typeof COLOR_CLASSES
  const Icon = STATUS_ICONS[status]

  return (
    <Badge
      variant="outline"
      className={cn(COLOR_CLASSES[color], className)}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}
