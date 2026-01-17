'use client'

import { useEffect, useRef, useState } from 'react'
import { createCalendar } from '@schedule-x/calendar'
import { createEventsServicePlugin } from "@schedule-x/events-service"
import '@schedule-x/theme-default/dist/index.css'
import { useCalendarEvents } from '@/hooks/use-calendar-events'
import { startOfMonth, endOfMonth } from 'date-fns'
import { AppointmentModal } from './appointment-modal'

type CalendarView = 'day' | 'week' | 'month'

export function CalendarView() {
  const calendarRef = useRef<HTMLDivElement>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('week')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string | undefined>()
  const [initialModalData, setInitialModalData] = useState<any>()

  // Fetch events for current month (expand range as needed)
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)
  const { events, loading, refetch } = useCalendarEvents(startDate, endDate)

  useEffect(() => {
    if (!calendarRef.current) return

    // Create calendar instance
    const eventsService = createEventsServicePlugin()

    const calendar = createCalendar({
      selectedDate: currentDate.toISOString().split('T')[0],
      views: [
        { name: 'day', label: 'Dia' },
        { name: 'week', label: 'Semana' },
        { name: 'month', label: 'Mês' }
      ],
      defaultView: view,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      })),
      plugins: [eventsService],
      locale: 'pt-BR',
      callbacks: {
        onEventClick(calendarEvent) {
          // Open modal in edit mode
          const event = events.find(e => e.id === calendarEvent.id)
          if (event) {
            setSelectedAppointment(calendarEvent.id)
            setInitialModalData({
              pacienteId: event.patientId,
              servicoId: event.serviceId,
              dataHora: calendarEvent.start,
              status: event.status,
            })
            setModalOpen(true)
          }
        },
        onClickDateTime(dateTime) {
          // Open modal in create mode
          setSelectedAppointment(undefined)
          setInitialModalData({
            pacienteId: '',
            servicoId: '',
            dataHora: dateTime,
          })
          setModalOpen(true)
        },
      },
    })

    calendar.render(calendarRef.current)

    return () => {
      // Cleanup on unmount
      if (calendarRef.current) {
        calendarRef.current.innerHTML = ''
      }
    }
  }, [currentDate, view, events])

  if (loading) {
    return <div className="flex items-center justify-center h-96">Carregando agenda...</div>
  }

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('day')}
          className={`px-4 py-2 rounded ${view === 'day' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Dia
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-4 py-2 rounded ${view === 'week' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Semana
        </button>
        <button
          onClick={() => setView('month')}
          className={`px-4 py-2 rounded ${view === 'month' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
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
