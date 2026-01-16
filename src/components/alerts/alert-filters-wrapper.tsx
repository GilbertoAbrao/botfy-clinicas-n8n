'use client'

import { AlertFilters, FilterValues } from './alert-filters'

interface AlertFiltersWrapperProps {
  initialFilters: Partial<FilterValues>
}

export function AlertFiltersWrapper({ initialFilters }: AlertFiltersWrapperProps) {
  const handleFilterChange = (filters: FilterValues) => {
    // Build query params from filters
    const params = new URLSearchParams()

    if (filters.type) {
      params.set('type', filters.type)
    }

    if (filters.status) {
      params.set('status', filters.status)
    }

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom.toISOString())
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo.toISOString())
    }

    params.set('sortBy', filters.sortBy)
    params.set('sortOrder', filters.sortOrder)

    // Update URL (triggers page refresh with new filters)
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState({}, '', newUrl)
    window.location.reload()
  }

  return <AlertFilters onFilterChange={handleFilterChange} initialFilters={initialFilters} />
}
