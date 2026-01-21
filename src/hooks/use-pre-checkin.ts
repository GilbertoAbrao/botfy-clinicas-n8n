'use client'

import { useState, useEffect, useCallback } from 'react'
import { PreCheckin, PreCheckinFilters } from '@/lib/validations/pre-checkin'

// Pagination interface (same structure as AgendaListPagination)
export interface PreCheckinPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Analytics interface
export interface PreCheckinAnalytics {
  completionRate: number
  pendingCount: number
  overdueCount: number
  total: number
}

// Hook return types
export interface UsePreCheckinReturn {
  preCheckins: PreCheckin[]
  pagination: PreCheckinPagination
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface UsePreCheckinAnalyticsReturn {
  analytics: PreCheckinAnalytics | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook for fetching pre-checkin list with filters and pagination.
 */
export function usePreCheckin(filters: PreCheckinFilters = {}): UsePreCheckinReturn {
  const [preCheckins, setPreCheckins] = useState<PreCheckin[]>([])
  const [pagination, setPagination] = useState<PreCheckinPagination>({
    page: filters.page || 1,
    limit: filters.limit || 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreCheckins = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query params from filters
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.dateStart) params.append('dateStart', filters.dateStart)
      if (filters.dateEnd) params.append('dateEnd', filters.dateEnd)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/pre-checkin?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar pré check-in')
      }

      const data = await response.json()

      setPreCheckins(data.data || [])
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
    } catch (err) {
      console.error('[usePreCheckin] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar pré check-in')
      setPreCheckins([])
      setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [
    filters.status,
    filters.dateStart,
    filters.dateEnd,
    filters.search,
    filters.page,
    filters.limit,
  ])

  useEffect(() => {
    fetchPreCheckins()
  }, [fetchPreCheckins])

  const refetch = useCallback(() => {
    fetchPreCheckins()
  }, [fetchPreCheckins])

  return {
    preCheckins,
    pagination,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching pre-checkin analytics metrics.
 */
export function usePreCheckinAnalytics(
  dateStart?: string,
  dateEnd?: string
): UsePreCheckinAnalyticsReturn {
  const [analytics, setAnalytics] = useState<PreCheckinAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query params
      const params = new URLSearchParams()

      if (dateStart) params.append('dateStart', dateStart)
      if (dateEnd) params.append('dateEnd', dateEnd)

      const response = await fetch(`/api/pre-checkin/analytics?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar analytics')
      }

      const data = await response.json()

      setAnalytics({
        completionRate: data.completionRate ?? 0,
        pendingCount: data.pendingCount ?? 0,
        overdueCount: data.overdueCount ?? 0,
        total: data.total ?? 0,
      })
    } catch (err) {
      console.error('[usePreCheckinAnalytics] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar analytics')
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [dateStart, dateEnd])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const refetch = useCallback(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refetch,
  }
}
