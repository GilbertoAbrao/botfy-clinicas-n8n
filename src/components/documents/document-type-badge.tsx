'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'
import {
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from '@/lib/validations/patient-document'

interface DocumentTypeBadgeProps {
  tipo: DocumentType
  className?: string
}

/**
 * DocumentTypeBadge Component
 *
 * Displays a badge showing the document type.
 * Uses secondary variant with a file icon.
 *
 * Document types:
 * - RG (identity card)
 * - CNH (driver's license)
 * - Carteirinha Convenio (insurance card)
 * - Guia de Autorizacao (authorization guide)
 * - Comprovante de Residencia (proof of residence)
 * - Outros (other)
 */
export function DocumentTypeBadge({ tipo, className }: DocumentTypeBadgeProps) {
  const label = DOCUMENT_TYPE_LABELS[tipo]

  return (
    <Badge variant="secondary" className={cn('font-normal', className)}>
      <FileText className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}
