'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  X,
  Filter,
  Search,
  ChevronDown,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from './status-badge'

interface FilterValues {
  status?: string
  dateStart?: string
  dateEnd?: string
  search?: string
}

// Quick filter preset type
type QuickFilter = 'hoje' | 'amanha' | 'esta_semana' | 'este_mes' | 'personalizado'

/**
 * PreCheckinFilters Component
 *
 * Filter controls for pre-checkin list.
 * Manages state via URL search params for shareable/bookmarkable URLs.
 *
 * Features:
 * - Quick date presets (Hoje, Amanha, Esta Semana, Este Mes)
 * - Status filter dropdown
 * - Date range pickers (De / Ate)
 * - Patient name search with 300ms debounce
 * - Clear all filters button
 * - Mobile: collapsible advanced filters section
 */
export function PreCheckinFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Filter state from URL
  const [filters, setFilters] = useState<FilterValues>({
    status: searchParams.get('status') || undefined,
    dateStart: searchParams.get('dateStart') || undefined,
    dateEnd: searchParams.get('dateEnd') || undefined,
    search: searchParams.get('search') || undefined,
  })

  // Date picker state
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.dateStart ? new Date(filters.dateStart) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.dateEnd ? new Date(filters.dateEnd) : undefined
  )
  const [activePreset, setActivePreset] = useState<QuickFilter | null>(null)

  // Search state with debounce
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Mobile expand state
  const [isExpanded, setIsExpanded] = useState(false)

  // Sync state with URL params when they change
  useEffect(() => {
    setFilters({
      status: searchParams.get('status') || undefined,
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined,
      search: searchParams.get('search') || undefined,
    })

    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    setStartDate(dateStart ? new Date(dateStart) : undefined)
    setEndDate(dateEnd ? new Date(dateEnd) : undefined)
    setSearchInput(searchParams.get('search') || '')
  }, [searchParams])

  // Build URL with filters and navigate
  const updateURL = useCallback(
    (newFilters: FilterValues) => {
      const params = new URLSearchParams()

      if (newFilters.status) params.set('status', newFilters.status)
      if (newFilters.dateStart) params.set('dateStart', newFilters.dateStart)
      if (newFilters.dateEnd) params.set('dateEnd', newFilters.dateEnd)
      if (newFilters.search) params.set('search', newFilters.search)

      // Reset to page 1 when filters change
      params.set('page', '1')
      params.set('limit', searchParams.get('limit') || '50')

      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams]
  )

  // Update a single filter
  const updateFilter = (key: keyof FilterValues, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  // Handle start date selection
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    setActivePreset('personalizado')
    if (date) {
      updateFilter('dateStart', startOfDay(date).toISOString())
    } else {
      updateFilter('dateStart', undefined)
    }
  }

  // Handle end date selection
  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
    setActivePreset('personalizado')
    if (date) {
      updateFilter('dateEnd', endOfDay(date).toISOString())
    } else {
      updateFilter('dateEnd', undefined)
    }
  }

  // Apply quick filter preset
  const applyQuickFilter = (preset: QuickFilter) => {
    const today = new Date()
    const newFilters: FilterValues = { ...filters }

    setActivePreset(preset)

    switch (preset) {
      case 'hoje':
        newFilters.dateStart = startOfDay(today).toISOString()
        newFilters.dateEnd = endOfDay(today).toISOString()
        setStartDate(today)
        setEndDate(today)
        break
      case 'amanha':
        const tomorrow = addDays(today, 1)
        newFilters.dateStart = startOfDay(tomorrow).toISOString()
        newFilters.dateEnd = endOfDay(tomorrow).toISOString()
        setStartDate(tomorrow)
        setEndDate(tomorrow)
        break
      case 'esta_semana':
        const weekStart = startOfWeek(today, { locale: ptBR })
        const weekEnd = endOfWeek(today, { locale: ptBR })
        newFilters.dateStart = startOfDay(weekStart).toISOString()
        newFilters.dateEnd = endOfDay(weekEnd).toISOString()
        setStartDate(weekStart)
        setEndDate(weekEnd)
        break
      case 'este_mes':
        const monthStart = startOfMonth(today)
        const monthEnd = endOfMonth(today)
        newFilters.dateStart = startOfDay(monthStart).toISOString()
        newFilters.dateEnd = endOfDay(monthEnd).toISOString()
        setStartDate(monthStart)
        setEndDate(monthEnd)
        break
      case 'personalizado':
        // User will select custom dates
        return
    }

    setFilters(newFilters)
    updateURL(newFilters)
  }

  // Handle search input with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value)

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    const timer = setTimeout(() => {
      updateFilter('search', value || undefined)
    }, 300)

    setSearchDebounceTimer(timer)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({})
    setStartDate(undefined)
    setEndDate(undefined)
    setSearchInput('')
    setActivePreset(null)

    router.push(pathname)
  }

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.dateStart,
    filters.dateEnd,
    filters.search,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Quick Filter Presets */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('hoje')}
          className={cn(
            'gap-1.5',
            activePreset === 'hoje' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('amanha')}
          className={cn(
            'gap-1.5',
            activePreset === 'amanha' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Amanha
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('esta_semana')}
          className={cn(
            'gap-1.5',
            activePreset === 'esta_semana' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Esta semana
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('este_mes')}
          className={cn(
            'gap-1.5',
            activePreset === 'este_mes' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Este mes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActivePreset('personalizado')
          }}
          className={cn(
            'gap-1.5',
            activePreset === 'personalizado' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Personalizado
        </Button>
      </div>

      {/* Mobile: Collapsible filter button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          className="w-full justify-between h-11"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros avancados
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
        </Button>
      </div>

      {/* Filter Panel */}
      <div
        className={cn(
          'bg-white rounded-lg border p-4 space-y-4',
          'md:block',
          !isExpanded && 'hidden md:block'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                {activeFilterCount} ativos
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Limpar todos
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range - Start date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data Inicio</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !startDate && 'text-gray-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  {startDate && (
                    <X
                      className="ml-auto h-4 w-4 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartDateSelect(undefined)
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date range - End date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data Fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !endDate && 'text-gray-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                  {endDate && (
                    <X
                      className="ml-auto h-4 w-4 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEndDateSelect(undefined)
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  disabled={(date) => (startDate ? date < startDate : false)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Empty cell for layout alignment */}
          <div className="hidden lg:block" />
        </div>

        {/* Patient search - separate row for better UX */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Buscar Paciente</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome do paciente..."
              className="pl-10 pr-10 h-10"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => {
                  setSearchInput('')
                  updateFilter('search', undefined)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
