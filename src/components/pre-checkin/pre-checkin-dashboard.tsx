'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { usePreCheckin, usePreCheckinAnalytics } from '@/hooks/use-pre-checkin'
import { PreCheckinAnalytics } from './pre-checkin-analytics'
import { PreCheckinFilters } from './pre-checkin-filters'
import { PreCheckinTable } from './pre-checkin-table'
import { PreCheckinCards } from './pre-checkin-cards'
import { PreCheckinPagination } from './pre-checkin-pagination'
import { PreCheckinDetailModal } from './pre-checkin-detail-modal'
import { SendReminderDialog } from './send-reminder-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { PreCheckin, PreCheckinStatus } from '@/lib/validations/pre-checkin'

/**
 * PreCheckinDashboard Component
 *
 * Main container that orchestrates all pre-checkin components:
 * - Analytics cards (top KPIs)
 * - Filters (status, date range, search)
 * - Table (desktop) / Cards (mobile)
 * - Pagination
 * - Detail modal
 * - Send reminder dialog
 *
 * State management:
 * - Filters are managed via URL search params for shareability
 * - Modal and dialog state managed locally
 * - Data fetched via usePreCheckin and usePreCheckinAnalytics hooks
 */
export function PreCheckinDashboard() {
  const searchParams = useSearchParams()

  // Extract filters from URL
  const filters = {
    status: (searchParams.get('status') as PreCheckinStatus) || undefined,
    dateStart: searchParams.get('dateStart') || undefined,
    dateEnd: searchParams.get('dateEnd') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
  }

  // Fetch data
  const { preCheckins, pagination, loading, error, refetch } = usePreCheckin(filters)
  const { analytics, loading: analyticsLoading } = usePreCheckinAnalytics(
    filters.dateStart,
    filters.dateEnd
  )

  // Modal state
  const [selectedPreCheckin, setSelectedPreCheckin] = useState<PreCheckin | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [reminderTarget, setReminderTarget] = useState<PreCheckin | null>(null)
  const [reminderLoading, setReminderLoading] = useState(false)

  // Handlers
  const handleRowClick = (preCheckin: PreCheckin) => {
    setSelectedPreCheckin(preCheckin)
    setDetailModalOpen(true)
  }

  const handleSendReminderClick = (preCheckin: PreCheckin) => {
    setReminderTarget(preCheckin)
    setReminderDialogOpen(true)
  }

  const handleSendReminder = async () => {
    if (!reminderTarget) return

    setReminderLoading(true)
    try {
      const res = await fetch(`/api/pre-checkin/${reminderTarget.id}/send-reminder`, {
        method: 'POST',
      })

      if (res.status === 429) {
        const data = await res.json()
        toast.error(data.error || 'Lembrete ja enviado recentemente')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar lembrete')
      }

      toast.success('Lembrete enviado!')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar lembrete')
    } finally {
      setReminderLoading(false)
      setReminderDialogOpen(false)
      setReminderTarget(null)
    }
  }

  const handleModalClose = () => {
    setDetailModalOpen(false)
    setSelectedPreCheckin(null)
  }

  const handleStatusChange = () => {
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <PreCheckinAnalytics
        completionRate={analytics?.completionRate || 0}
        pendingCount={analytics?.pendingCount || 0}
        overdueCount={analytics?.overdueCount || 0}
        loading={analyticsLoading}
      />

      {/* Filters */}
      <PreCheckinFilters />

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
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
          {/* Desktop table */}
          <PreCheckinTable
            data={preCheckins}
            onRowClick={handleRowClick}
            onSendReminder={handleSendReminderClick}
          />

          {/* Mobile cards */}
          <PreCheckinCards
            data={preCheckins}
            onRowClick={handleRowClick}
            onSendReminder={handleSendReminderClick}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <PreCheckinPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          )}

          {/* Item count */}
          <div className="text-sm text-gray-600 text-center">
            Mostrando {preCheckins.length} de {pagination.total} pre-checkins
          </div>
        </>
      )}

      {/* Detail Modal */}
      <PreCheckinDetailModal
        preCheckin={selectedPreCheckin}
        isOpen={detailModalOpen}
        onClose={handleModalClose}
        onStatusChange={handleStatusChange}
      />

      {/* Send Reminder Dialog */}
      <SendReminderDialog
        open={reminderDialogOpen}
        patientName={reminderTarget?.paciente?.nome || ''}
        loading={reminderLoading}
        onConfirm={handleSendReminder}
        onCancel={() => {
          setReminderDialogOpen(false)
          setReminderTarget(null)
        }}
      />
    </div>
  )
}
