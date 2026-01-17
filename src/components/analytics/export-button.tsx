'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

/**
 * Valid export types
 */
export type ExportType = 'appointments' | 'alerts' | 'kpis'

/**
 * Props for ExportButton component
 */
export interface ExportButtonProps {
  /** Type of data to export */
  type: ExportType
  /** Custom button label (defaults to type name) */
  label?: string
  /** Custom start date for export range */
  startDate?: Date
  /** Custom end date for export range */
  endDate?: Date
  /** Variant of the button */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  /** Size of the button */
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * Get default label for export type
 */
function getDefaultLabel(type: ExportType): string {
  switch (type) {
    case 'appointments':
      return 'Exportar Agendamentos'
    case 'alerts':
      return 'Exportar Alertas'
    case 'kpis':
      return 'Exportar Metricas'
    default:
      return 'Exportar'
  }
}

/**
 * ExportButton Component
 *
 * Triggers CSV download from /api/export endpoint.
 *
 * Features:
 * - Loading spinner during download
 * - Error handling with alert
 * - Configurable export type and date range
 * - ADMIN role required on backend
 */
export function ExportButton({
  type,
  label,
  startDate,
  endDate,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build URL with query parameters
      const params = new URLSearchParams()
      params.set('type', type)

      if (startDate) {
        params.set('startDate', startDate.toISOString())
      }
      if (endDate) {
        params.set('endDate', endDate.toISOString())
      }

      const url = `/api/export?${params.toString()}`

      // Fetch the CSV data
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(errorData.error || `Export failed with status ${response.status}`)
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Get blob and trigger download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('[ExportButton] Error:', err)
      const message = err instanceof Error ? err.message : 'Erro ao exportar dados'
      setError(message)
      // Show error as alert since there's no toast component
      alert(`Erro na exportacao: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading}
      className="min-w-[140px]"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label || getDefaultLabel(type)}
        </>
      )}
    </Button>
  )
}
