'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createCalendar, createViewDay, createViewWeek, createViewMonthGrid } from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
import '@schedule-x/theme-default/dist/index.css'
import { useCalendarEvents } from '@/hooks/use-calendar-events'
import { startOfMonth, endOfMonth } from 'date-fns'
import { AppointmentModal } from './appointment-modal'
import { ResourceSelector } from './resource-selector'

type CalendarViewType = 'day' | 'week' | 'month-grid'

// Format Date to Schedule-X v2 string format 'YYYY-MM-DD HH:mm'
function formatToScheduleX(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function CalendarView() {
  const calendarRef = useRef<HTMLDivElement>(null)
  const calendarInstance = useRef<any>(null)
  const eventsServiceRef = useRef<any>(null)
  const calendarControlsRef = useRef<any>(null)
  const [currentDate] = useState(new Date())
  const [view, setView] = useState<CalendarViewType>('month-grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string | undefined>()
  const [initialModalData, setInitialModalData] = useState<any>()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  // Fetch events for current month (memoize to prevent infinite loops)
  const startDate = useMemo(() => startOfMonth(currentDate), [currentDate])
  const endDate = useMemo(() => endOfMonth(currentDate), [currentDate])
  const { events, loading, refetch } = useCalendarEvents(startDate, endDate)

  // Filter events based on selected provider and service
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedProvider && event.providerId !== selectedProvider) return false
      if (selectedService && event.serviceId !== selectedService) return false
      return true
    })
  }, [events, selectedProvider, selectedService])

  // Convert events to Schedule-X format
  const schedulexEvents = useMemo(() => {
    return filteredEvents.map(e => ({
      id: e.id,
      title: `[${e.providerName}] ${e.title}`,
      start: formatToScheduleX(e.start),
      end: formatToScheduleX(e.end),
      calendarId: e.providerId,
    }))
  }, [filteredEvents])

  // Build calendar categories for provider colors
  const calendars = useMemo(() => {
    return filteredEvents.reduce((acc, e) => {
      if (!acc[e.providerId]) {
        acc[e.providerId] = {
          colorName: e.providerId,
          lightColors: {
            main: e.providerColor,
            container: e.providerColor + '20',
            onContainer: e.providerColor,
          },
          darkColors: {
            main: e.providerColor,
            onContainer: '#fff',
            container: e.providerColor + '30',
          },
        }
      }
      return acc
    }, {} as Record<string, any>)
  }, [filteredEvents])

  // Handle event click - use ref to avoid stale closure
  const eventsRef = useRef(events)
  eventsRef.current = events

  const handleEventClick = useCallback((calendarEvent: any) => {
    // Schedule-X may convert IDs - ensure string comparison
    const clickedId = String(calendarEvent.id)
    const event = eventsRef.current.find(e => String(e.id) === clickedId)
    if (event) {
      setSelectedAppointment(event.id) // Use the original event ID
      setInitialModalData({
        pacienteId: event.patientId,
        servicoId: event.serviceId,
        dataHora: calendarEvent.start,
        status: event.status,
      })
      setModalOpen(true)
    }
  }, [])

  // Handle date/time click
  const handleDateTimeClick = useCallback((dateTime: string) => {
    setSelectedAppointment(undefined)
    setInitialModalData({
      pacienteId: '',
      servicoId: '',
      dataHora: dateTime,
    })
    setModalOpen(true)
  }, [])

  // Create calendar on mount and when events/calendars change
  useEffect(() => {
    if (!calendarRef.current || loading) return

    // Destroy existing calendar if any
    if (calendarInstance.current) {
      calendarInstance.current.destroy()
      calendarInstance.current = null
    }

    const eventsService = createEventsServicePlugin()
    eventsServiceRef.current = eventsService

    const calendarControls = createCalendarControlsPlugin()
    calendarControlsRef.current = calendarControls

    const calendar = createCalendar({
      selectedDate: formatDateOnly(currentDate),
      views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
      defaultView: view,
      events: schedulexEvents,
      calendars: calendars,
      plugins: [eventsService, calendarControls],
      locale: 'pt-BR',
      callbacks: {
        onEventClick: handleEventClick,
        onClickDateTime: handleDateTimeClick,
      },
    })

    calendar.render(calendarRef.current)
    calendarInstance.current = calendar

    return () => {
      if (calendarInstance.current) {
        calendarInstance.current.destroy()
        calendarInstance.current = null
      }
    }
  // Note: view is NOT in dependencies - we handle view changes separately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, schedulexEvents, calendars, currentDate, handleEventClick, handleDateTimeClick])

  // Handle view changes using Calendar Controls plugin
  useEffect(() => {
    if (calendarControlsRef.current) {
      calendarControlsRef.current.setView(view)
    }
  }, [view])

  // Change view
  const handleViewChange = useCallback((newView: CalendarViewType) => {
    setView(newView)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando agenda...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ResourceSelector
        selectedProvider={selectedProvider}
        selectedService={selectedService}
        onProviderChange={setSelectedProvider}
        onServiceChange={setSelectedService}
      />

      {/* View switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange('day')}
          className={`px-4 py-2 rounded ${view === 'day' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Dia
        </button>
        <button
          onClick={() => handleViewChange('week')}
          className={`px-4 py-2 rounded ${view === 'week' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Semana
        </button>
        <button
          onClick={() => handleViewChange('month-grid')}
          className={`px-4 py-2 rounded ${view === 'month-grid' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Mês
        </button>
      </div>

      {/* Calendar container */}
      <div ref={calendarRef} className="min-h-[600px] bg-white rounded-lg shadow" />

      {/* Appointment modal */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          setModalOpen(false)
          refetch()
        }}
        appointmentId={selectedAppointment}
        initialData={initialModalData}
      />
    </div>
  )
}
