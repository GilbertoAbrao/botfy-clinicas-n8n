'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
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

export function useCalendarEvents(startDate: Date, endDate: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    console.log('[useCalendarEvents] Fetching events...', { startDate: startDate.toISOString(), endDate: endDate.toISOString() })

    try {
      const supabase = createBrowserClient()

      // Fetch appointments from appointments table with patient and provider joins
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          service_type,
          scheduled_at,
          duration,
          status,
          patient:patients!patient_id (
            id,
            nome
          ),
          provider:providers!provider_id (
            id,
            nome,
            cor_calendario
          )
        `)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true })

      console.log('[useCalendarEvents] Query result:', { data, fetchError })

      if (fetchError) throw fetchError

      // Transform to calendar events
      const calendarEvents: CalendarEvent[] = (data || []).map(apt => {
        const start = dbTimestampToTZDate(apt.scheduled_at)
        const end = new Date(start.getTime() + (apt.duration || 60) * 60000)

        // Handle patient and provider data (can be null)
        const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient
        const provider = Array.isArray(apt.provider) ? apt.provider[0] : apt.provider

        return {
          id: apt.id,
          title: `${patient?.nome || 'Sem paciente'} - ${apt.service_type}`,
          start,
          end,
          patientId: patient?.id || '',
          serviceId: apt.service_type,
          providerId: provider?.id || '',
          providerName: provider?.nome || 'Sem profissional',
          providerColor: provider?.cor_calendario || '#8B5CF6',
          status: apt.status,
        }
      })

      setEvents(calendarEvents)
    } catch (err) {
      console.error('[useCalendarEvents] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
      console.log('[useCalendarEvents] Fetch complete')
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const refetch = useCallback(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch }
}
