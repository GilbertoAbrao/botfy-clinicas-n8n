'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAgendaList } from '@/hooks/use-agenda-list'
import { AgendaListFilters } from './agenda-list-filters'
import { AgendaListTable } from './agenda-list-table'
import { AgendaListCards } from './agenda-list-cards'
import { AgendaListPagination } from './agenda-list-pagination'
import { AppointmentModal } from '@/components/calendar/appointment-modal'
import { STATUS_APPOINTMENT, AppointmentStatus } from '@/lib/validations/appointment'

export function AgendaListView() {
  const searchParams = useSearchParams()

  // Extract filters from URL params
  const statusParam = searchParams.get('status')
  const filters = {
    dateStart: searchParams.get('dateStart') || undefined,
    dateEnd: searchParams.get('dateEnd') || undefined,
    providerId: searchParams.get('providerId') || undefined,
    serviceType: searchParams.get('serviceType') || undefined,
    status: (statusParam && STATUS_APPOINTMENT.includes(statusParam as AppointmentStatus))
      ? (statusParam as AppointmentStatus)
      : undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
  }

  // Fetch appointments using hook
  const { appointments, pagination, loading, error, refetch } = useAgendaList(filters)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string | undefined>()

  // Action handlers
  const handleEdit = (id: string) => {
    setSelectedAppointment(id)
    setModalOpen(true)
  }

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMADO' }),
      })
      if (!res.ok) throw new Error('Failed to confirm')
      toast.success('Agendamento confirmado')
      refetch()
    } catch (error) {
      console.error('[AgendaListView] Confirm error:', error)
      toast.error('Erro ao confirmar agendamento')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

    try {
      const res = await fetch(`/api/agendamentos/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to cancel')
      toast.success('Agendamento cancelado')
      refetch()
    } catch (error) {
      console.error('[AgendaListView] Cancel error:', error)
      toast.error('Erro ao cancelar agendamento')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <AgendaListFilters />

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 text-gray-600">
          Carregando agendamentos...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-red-600 text-center py-8 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Data display */}
      {!loading && !error && (
        <>
          {/* Desktop table (hidden on mobile) */}
          <div className="hidden md:block">
            <AgendaListTable
              data={appointments}
              onEdit={handleEdit}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onRowClick={handleEdit}
            />
          </div>

          {/* Mobile cards (hidden on desktop) */}
          <div className="md:hidden">
            <AgendaListCards
              data={appointments}
              onEdit={handleEdit}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onRowClick={handleEdit}
            />
          </div>

          {/* Pagination (show when more than one page) */}
          {pagination.totalPages > 1 && (
            <AgendaListPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          )}

          {/* Item count */}
          <div className="text-sm text-gray-600 text-center">
            Mostrando {appointments.length} de {pagination.total} agendamentos
          </div>
        </>
      )}

      {/* Appointment modal */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedAppointment(undefined)
        }}
        onSave={() => {
          setModalOpen(false)
          setSelectedAppointment(undefined)
          refetch()
        }}
        appointmentId={selectedAppointment}
      />
    </div>
  )
}
