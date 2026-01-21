'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { RowSelectionState } from '@tanstack/react-table'
import { toast } from 'sonner'

import { usePatientDocuments } from '@/hooks/use-patient-documents'
import {
  PatientDocument,
  PatientDocumentFilters,
  DocumentStatus,
  DocumentType,
} from '@/lib/validations/patient-document'

import { DocumentsTable } from './documents-table'
import { DocumentsFilters } from './documents-filters'
import { DocumentsPagination } from './documents-pagination'
import { DocumentPreviewModal } from './document-preview-modal'
import { DocumentRejectModal } from './document-reject-modal'
import { DocumentsBulkActions } from './documents-bulk-actions'

/**
 * DocumentsDashboard Component
 *
 * Main orchestrating component for the document management feature.
 * Integrates all document UI components with state management and API calls.
 *
 * Features:
 * - Parses filters from URL search params
 * - Fetches documents via usePatientDocuments hook
 * - Manages row selection state
 * - Handles preview, approve, reject actions (single and bulk)
 * - Provides toast feedback for all actions
 */
export function DocumentsDashboard() {
  const searchParams = useSearchParams()

  // Parse filters from URL
  const filters: PatientDocumentFilters = {
    status: (searchParams.get('status') as DocumentStatus) || undefined,
    tipo: (searchParams.get('tipo') as DocumentType) || undefined,
    dateStart: searchParams.get('dateStart') || undefined,
    dateEnd: searchParams.get('dateEnd') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
  }

  // Fetch data
  const { documents, pagination, counts, loading, error, refetch } = usePatientDocuments(filters)

  // Local state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [previewDocument, setPreviewDocument] = useState<PatientDocument | null>(null)
  const [rejectDocument, setRejectDocument] = useState<PatientDocument | null>(null)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Selected document IDs (for bulk actions)
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const selectedCount = selectedIds.length

  // Handlers
  const handlePreview = useCallback((doc: PatientDocument) => {
    setPreviewDocument(doc)
  }, [])

  const handleDownload = useCallback(async (doc: PatientDocument) => {
    try {
      const res = await fetch(`/api/patient-documents/${doc.id}/preview`)
      if (!res.ok) throw new Error('Erro ao obter URL')
      const data = await res.json()

      // Open in new tab for download
      window.open(data.url, '_blank')
    } catch {
      toast.error('Erro ao baixar documento')
    }
  }, [])

  const handleApprove = useCallback(async (doc: PatientDocument) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/patient-documents/${doc.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao aprovar')
      }

      toast.success('Documento aprovado')
      setPreviewDocument(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar')
    } finally {
      setActionLoading(false)
    }
  }, [refetch])

  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!rejectDocument) return

    const res = await fetch(`/api/patient-documents/${rejectDocument.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes: reason }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Erro ao rejeitar')
    }

    toast.success('Documento rejeitado')
    setRejectDocument(null)
    setPreviewDocument(null)
    refetch()
  }, [rejectDocument, refetch])

  const handleBulkApprove = useCallback(async () => {
    if (selectedCount === 0) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/patient-documents/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          documentIds: selectedIds,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao aprovar')
      }

      const data = await res.json()
      toast.success(`${data.count} documento(s) aprovado(s)`)
      setRowSelection({})
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar')
    } finally {
      setActionLoading(false)
    }
  }, [selectedIds, selectedCount, refetch])

  const handleBulkRejectConfirm = useCallback(async (reason: string) => {
    const res = await fetch('/api/patient-documents/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        documentIds: selectedIds,
        observacoes: reason,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Erro ao rejeitar')
    }

    const data = await res.json()
    toast.success(`${data.count} documento(s) rejeitado(s)`)
    setRowSelection({})
    setBulkRejectOpen(false)
    refetch()
  }, [selectedIds, refetch])

  const handleClearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar documentos: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <DocumentsFilters counts={counts ?? undefined} />

      {/* Table */}
      <DocumentsTable
        documents={documents}
        loading={loading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onApprove={(doc) => handleApprove(doc)}
        onReject={(doc) => setRejectDocument(doc)}
      />

      {/* Pagination */}
      <DocumentsPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDownload={() => previewDocument && handleDownload(previewDocument)}
        onApprove={() => previewDocument && handleApprove(previewDocument)}
        onReject={() => {
          if (previewDocument) {
            setRejectDocument(previewDocument)
          }
        }}
      />

      {/* Reject Modal (single) */}
      <DocumentRejectModal
        isOpen={!!rejectDocument}
        onClose={() => setRejectDocument(null)}
        onConfirm={handleRejectConfirm}
      />

      {/* Bulk Reject Modal */}
      <DocumentRejectModal
        isOpen={bulkRejectOpen}
        onClose={() => setBulkRejectOpen(false)}
        onConfirm={handleBulkRejectConfirm}
        isBulk
        count={selectedCount}
      />

      {/* Bulk Actions Bar */}
      <DocumentsBulkActions
        selectedCount={selectedCount}
        onApprove={handleBulkApprove}
        onReject={() => setBulkRejectOpen(true)}
        onClear={handleClearSelection}
        loading={actionLoading}
      />
    </div>
  )
}
