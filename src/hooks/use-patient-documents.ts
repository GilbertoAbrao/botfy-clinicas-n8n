'use client'

import { useState, useEffect, useCallback } from 'react'
import { PatientDocument, PatientDocumentFilters } from '@/lib/validations/patient-document'

// Pagination interface (same structure as PreCheckinPagination)
export interface PatientDocumentPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Status counts for filter badges
export interface PatientDocumentCounts {
  pendente: number
  aprovado: number
  rejeitado: number
  total: number
}

// Hook return types
export interface UsePatientDocumentsReturn {
  documents: PatientDocument[]
  pagination: PatientDocumentPagination
  counts: PatientDocumentCounts | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook for fetching patient documents with filters and pagination.
 * Returns documents, pagination info, status counts for badges, loading state, and error.
 */
export function usePatientDocuments(
  filters: PatientDocumentFilters = {}
): UsePatientDocumentsReturn {
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [pagination, setPagination] = useState<PatientDocumentPagination>({
    page: filters.page || 1,
    limit: filters.limit || 50,
    total: 0,
    totalPages: 0,
  })
  const [counts, setCounts] = useState<PatientDocumentCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query params from filters
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.tipo) params.append('tipo', filters.tipo)
      if (filters.dateStart) params.append('dateStart', filters.dateStart)
      if (filters.dateEnd) params.append('dateEnd', filters.dateEnd)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/patient-documents?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar documentos')
      }

      const data = await response.json()

      setDocuments(data.data || [])
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
      setCounts(data.counts || null)
    } catch (err) {
      console.error('[usePatientDocuments] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar documentos')
      setDocuments([])
      setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 })
      setCounts(null)
    } finally {
      setLoading(false)
    }
  }, [
    filters.status,
    filters.tipo,
    filters.dateStart,
    filters.dateEnd,
    filters.search,
    filters.page,
    filters.limit,
  ])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const refetch = useCallback(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    pagination,
    counts,
    loading,
    error,
    refetch,
  }
}
