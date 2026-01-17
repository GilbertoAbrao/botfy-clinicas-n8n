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
  status: string
}

export function useCalendarEvents(startDate: Date, endDate: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      // Fetch appointments from view with patient and service data
      const { data, error: fetchError } = await supabase
        .from('agendamentos_completos')
        .select('*')
        .gte('data_hora', startDate.toISOString())
        .lte('data_hora', endDate.toISOString())
        .order('data_hora', { ascending: true })

      if (fetchError) throw fetchError

      // Transform to calendar events
      const calendarEvents: CalendarEvent[] = (data || []).map(apt => {
        const start = dbTimestampToTZDate(apt.data_hora)
        const end = new Date(start.getTime() + (apt.servico_duracao_minutos || 60) * 60000)

        return {
          id: apt.id,
          title: `${apt.paciente_nome} - ${apt.servico_nome}`,
          start,
          end,
          patientId: apt.paciente_id,
          serviceId: apt.servico_id,
          status: apt.status,
        }
      })

      setEvents(calendarEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
    } finally {
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
