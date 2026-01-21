'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, FileText, AlertCircle } from 'lucide-react'
import {
  PatientDocument,
  getDocumentStatus,
  DOCUMENT_TYPE_LABELS,
} from '@/lib/validations/patient-document'
import { DocumentStatusBadge } from './document-status-badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DocumentPreviewModalProps {
  document: PatientDocument | null
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
  onApprove: () => void
  onReject: () => void
}

/**
 * DocumentPreviewModal Component
 *
 * Modal for previewing document content.
 * Fetches signed URL from API and displays image or PDF.
 *
 * Features:
 * - Fetches preview URL on open
 * - Displays images directly with object-contain
 * - Displays PDFs via iframe
 * - Shows extracted data if available
 * - Action buttons: Download, Approve, Reject
 * - Loading and error states
 */
export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
  onDownload,
  onApprove,
  onReject,
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreviewUrl = useCallback(async () => {
    if (!document) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/patient-documents/${document.id}/preview`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao carregar preview')
      }
      const data = await res.json()
      setPreviewUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar preview')
    } finally {
      setLoading(false)
    }
  }, [document])

  useEffect(() => {
    if (isOpen && document) {
      fetchPreviewUrl()
    } else {
      setPreviewUrl(null)
      setError(null)
    }
  }, [isOpen, document, fetchPreviewUrl])

  if (!document) return null

  const status = getDocumentStatus(document.validado)

  // Detect file type from path
  const filePath = document.arquivo_path.toLowerCase()
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath)
  const isPdf = /\.pdf$/i.test(filePath)

  // Format upload date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
    } catch {
      return '-'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <FileText className="h-5 w-5" />
            {DOCUMENT_TYPE_LABELS[document.tipo]}
            <DocumentStatusBadge status={status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Paciente:</span>{' '}
              <span className="font-medium">{document.paciente?.nome || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Upload:</span>{' '}
              <span className="font-medium">{formatDate(document.created_at)}</span>
            </div>
          </div>

          {/* Preview area */}
          <div className="border rounded-lg min-h-[400px] flex items-center justify-center bg-muted/50">
            {loading && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Carregando preview...</span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-2 text-red-500">
                <AlertCircle className="h-8 w-8" />
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchPreviewUrl}>
                  Tentar novamente
                </Button>
              </div>
            )}

            {previewUrl && !loading && !error && (
              <>
                {isImage && (
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="max-w-full max-h-[500px] object-contain"
                  />
                )}
                {isPdf && (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[500px] border-0"
                    title="PDF preview"
                  />
                )}
                {!isImage && !isPdf && (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-12 w-12" />
                    <span>Preview nao disponivel para este tipo de arquivo.</span>
                    <span className="text-sm">Use o botao de download para visualizar.</span>
                  </div>
                )}
              </>
            )}

            {!previewUrl && !loading && !error && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <span>Carregando documento...</span>
              </div>
            )}
          </div>

          {/* Extracted data if available */}
          {document.dados_extraidos && Object.keys(document.dados_extraidos).length > 0 && (
            <div className="text-sm">
              <div className="font-medium mb-2 flex items-center gap-2">
                <span>Dados extraidos</span>
                {document.confianca_extracao !== null && (
                  <span className="text-xs text-muted-foreground">
                    (Confianca: {Math.round(document.confianca_extracao * 100)}%)
                  </span>
                )}
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(document.dados_extraidos, null, 2)}
              </pre>
            </div>
          )}

          {/* Observations if available */}
          {document.observacoes && (
            <div className="text-sm">
              <div className="font-medium mb-1">Observacoes:</div>
              <p className="text-muted-foreground bg-muted p-2 rounded">
                {document.observacoes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {status === 'pendente' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onReject}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Rejeitar
                </Button>
                <Button
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Aprovar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
