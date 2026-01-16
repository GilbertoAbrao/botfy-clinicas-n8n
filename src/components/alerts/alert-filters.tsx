'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertType, AlertStatus } from '@prisma/client'
import { AlertSortBy } from '@/lib/api/alerts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ArrowUpDown, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterValues {
  type?: AlertType
  status?: AlertStatus
  dateFrom?: Date
  dateTo?: Date
  sortBy: AlertSortBy
  sortOrder: 'asc' | 'desc'
}

interface AlertFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  initialFilters?: Partial<FilterValues>
}

// Alert type options
const alertTypeOptions: { value: AlertType; label: string }[] = [
  { value: 'conversas_travadas', label: 'Conversa Travada' },
  { value: 'pre_checkins_pendentes', label: 'Pré-Checkin Pendente' },
  { value: 'agendamentos_nao_confirmados', label: 'Agendamento Não Confirmado' },
  { value: 'handoff_normal', label: 'Handoff Normal' },
  { value: 'handoff_erro', label: 'Handoff com Erro' },
]

// Status options
const statusOptions: { value: AlertStatus; label: string }[] = [
  { value: 'new', label: 'Novo' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'dismissed', label: 'Dispensado' },
]

// Sort options
const sortOptions: { value: AlertSortBy; label: string }[] = [
  { value: 'priority', label: 'Prioridade' },
  { value: 'date', label: 'Data' },
  { value: 'patient', label: 'Paciente' },
  { value: 'status', label: 'Status' },
]

export function AlertFilters({ onFilterChange, initialFilters }: AlertFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    sortBy: initialFilters?.sortBy || 'priority',
    sortOrder: initialFilters?.sortOrder || 'asc',
    type: initialFilters?.type,
    status: initialFilters?.status,
    dateFrom: initialFilters?.dateFrom,
    dateTo: initialFilters?.dateTo,
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Debounced filter change (500ms)
  const debouncedFilterChange = useCallback(
    (newFilters: FilterValues) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const timer = setTimeout(() => {
        onFilterChange(newFilters)
      }, 500)

      setDebounceTimer(timer)
    },
    [debounceTimer, onFilterChange]
  )

  // Update filters and trigger debounced change
  const updateFilters = (updates: Partial<FilterValues>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    debouncedFilterChange(newFilters)
  }

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters: FilterValues = {
      sortBy: 'priority',
      sortOrder: 'asc',
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  // Count active filters (excluding sort which is always present)
  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length

  // Toggle sort order
  const toggleSortOrder = () => {
    updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Collapsible filter button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          className="w-full justify-between h-11"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ArrowUpDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
        </Button>
      </div>

      {/* Filter panel */}
      <div className={cn(
        'space-y-4',
        'md:block', // Always visible on desktop
        !isExpanded && 'hidden md:block' // Hidden on mobile when collapsed
      )}>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Type filter */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                updateFilters({ type: value === 'all' ? undefined : (value as AlertType) })
              }
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {alertTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                updateFilters({ status: value === 'all' ? undefined : (value as AlertStatus) })
              }
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date from filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Data Início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
                    !filters.dateFrom && 'text-gray-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    'Selecionar'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilters({ dateFrom: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date to filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Data Fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
                    !filters.dateTo && 'text-gray-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? (
                    format(filters.dateTo, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    'Selecionar'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilters({ dateTo: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium mb-2 block">Ordenar por</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilters({ sortBy: value as AlertSortBy })}
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Sort order toggle */}
            <Button
              variant="outline"
              onClick={toggleSortOrder}
              className="flex-1 md:flex-none h-11"
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </Button>

            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 md:flex-none h-11"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
