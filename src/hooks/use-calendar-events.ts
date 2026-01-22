'use client'

import { useState, useEffect, useCallback } from 'react'
import { dbTimestampToTZDate } from '@/lib/calendar/time-zone-utils'

export interface CalendarEvent {
  id: string
  title: string  // Patient name + service
  start: Date
  end: Date
  patientId: string
  serviceId: string
  providerId: string
  providerName: string
  providerColor: string
  status: string
}

// Type for API response item
interface AppointmentListItem {
  id: string
  scheduledAt: string
  patientId: string
  patientName: string
  patientPhone: string | null
  serviceType: string
  providerId: string
  providerName: string
  providerColor: string
  status: string
  duration: number
}

export function useCalendarEvents(startDate: Date, endDate: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    console.log('[useCalendarEvents] Fetching events...', { startDate: startDate.toISOString(), endDate: endDate.toISOString() })

    try {
      // Use the API route which handles auth on the server side
      const params = new URLSearchParams({
        dateStart: startDate.toISOString(),
        dateEnd: endDate.toISOString(),
        limit: '500', // Get all events for the month
      })

      const response = await fetch(`/api/agendamentos/list?${params}`, {
        signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar agendamentos')
      }

      const data = await response.json()
      console.log('[useCalendarEvents] API result:', data)

      // Transform to calendar events
      const calendarEvents: CalendarEvent[] = (data.appointments || []).map((apt: AppointmentListItem) => {
        const start = dbTimestampToTZDate(apt.scheduledAt)
        const end = new Date(start.getTime() + (apt.duration || 60) * 60000)

        return {
          id: apt.id,
          title: `${apt.patientName} - ${apt.serviceType}`,
          start,
          end,
          patientId: apt.patientId,
          serviceId: apt.serviceType,
          providerId: apt.providerId,
          providerName: apt.providerName,
          providerColor: apt.providerColor,
          status: apt.status,
        }
      })

      setEvents(calendarEvents)
    } catch (err: any) {
      // Ignore AbortError - happens when component unmounts during fetch (normal in React StrictMode)
      // Check multiple ways since different environments may report it differently
      if (
        err?.name === 'AbortError' ||
        err?.code === 'ABORT_ERR' ||
        err?.message?.includes('abort') ||
        err?.message?.includes('cancelled') ||
        signal?.aborted
      ) {
        return
      }
      console.error('[useCalendarEvents] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      // Only update loading state if not aborted
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [startDate, endDate])

  useEffect(() => {
    const abortController = new AbortController()
    fetchEvents(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [fetchEvents])

  const refetch = useCallback(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch }
}
