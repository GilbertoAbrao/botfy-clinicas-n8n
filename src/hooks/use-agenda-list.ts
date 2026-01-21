'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppointmentListItem, AppointmentFilters } from '@/lib/validations/appointment'

export interface AgendaListPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseAgendaListReturn {
  appointments: AppointmentListItem[]
  pagination: AgendaListPagination
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAgendaList(filters: AppointmentFilters = {}): UseAgendaListReturn {
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([])
  const [pagination, setPagination] = useState<AgendaListPagination>({
    page: filters.page || 1,
    limit: filters.limit || 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query params from filters
      const params = new URLSearchParams()

      if (filters.dateStart) params.append('dateStart', filters.dateStart)
      if (filters.dateEnd) params.append('dateEnd', filters.dateEnd)
      if (filters.providerId) params.append('providerId', filters.providerId)
      if (filters.serviceType) params.append('serviceType', filters.serviceType)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/agendamentos/list?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar agendamentos')
      }

      const data = await response.json()

      setAppointments(data.appointments || [])
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
    } catch (err) {
      console.error('[useAgendaList] Error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar agendamentos')
      setAppointments([])
      setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [
    filters.dateStart,
    filters.dateEnd,
    filters.providerId,
    filters.serviceType,
    filters.status,
    filters.search,
    filters.page,
    filters.limit,
  ])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const refetch = useCallback(() => {
    fetchAppointments()
  }, [fetchAppointments])

  return {
    appointments,
    pagination,
    loading,
    error,
    refetch,
  }
}
