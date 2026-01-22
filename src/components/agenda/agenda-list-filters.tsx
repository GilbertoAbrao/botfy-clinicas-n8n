'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  STATUS_APPOINTMENT,
  STATUS_APPOINTMENT_LABELS,
  AppointmentStatus,
} from '@/lib/validations/appointment'
import { createBrowserClient } from '@/lib/supabase/client'

interface Provider {
  id: string
  nome: string
  ativo: boolean
}

interface FilterValues {
  dateStart?: string
  dateEnd?: string
  providerId?: string // comma-separated
  serviceType?: string
  status?: string
  search?: string
}

// Quick filter preset type
type QuickFilter = 'hoje' | 'amanha' | 'esta_semana' | 'este_mes' | 'personalizado'

export function AgendaListFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter state from URL
  const [filters, setFilters] = useState<FilterValues>({
    dateStart: searchParams.get('dateStart') || undefined,
    dateEnd: searchParams.get('dateEnd') || undefined,
    providerId: searchParams.get('providerId') || undefined,
    serviceType: searchParams.get('serviceType') || undefined,
    status: searchParams.get('status') || undefined,
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

  // Provider multi-select state
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>(
    filters.providerId ? filters.providerId.split(',') : []
  )
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false)

  // Service types state
  const [serviceTypes, setServiceTypes] = useState<string[]>([])

  // Search state with debounce
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Mobile expand state
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch providers and service types on mount
  useEffect(() => {
    const fetchFilterData = async () => {
      const supabase = createBrowserClient()

      try {
        // Fetch active providers
        const { data: providersData } = await supabase
          .from('providers')
          .select('id, nome, ativo')
          .eq('ativo', true)
          .order('nome')

        if (providersData) {
          setProviders(providersData)
        }

        // Fetch distinct service types from appointments
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('service_type')

        if (appointmentsData) {
          const uniqueServices = [
            ...new Set(appointmentsData.map((apt: { service_type: string | null }) => apt.service_type).filter(Boolean)),
          ]
          setServiceTypes(uniqueServices as string[])
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }

    fetchFilterData()
  }, [])

  // Sync state with URL params when they change
  useEffect(() => {
    setFilters({
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined,
      providerId: searchParams.get('providerId') || undefined,
      serviceType: searchParams.get('serviceType') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    })

    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    setStartDate(dateStart ? new Date(dateStart) : undefined)
    setEndDate(dateEnd ? new Date(dateEnd) : undefined)

    const providerIdParam = searchParams.get('providerId')
    setSelectedProviderIds(providerIdParam ? providerIdParam.split(',') : [])

    setSearchInput(searchParams.get('search') || '')
  }, [searchParams])

  // Build URL with filters and navigate
  const updateURL = useCallback(
    (newFilters: FilterValues) => {
      const params = new URLSearchParams()

      // Preserve view param if exists
      const view = searchParams.get('view')
      if (view) params.set('view', view)

      if (newFilters.dateStart) params.set('dateStart', newFilters.dateStart)
      if (newFilters.dateEnd) params.set('dateEnd', newFilters.dateEnd)
      if (newFilters.providerId) params.set('providerId', newFilters.providerId)
      if (newFilters.serviceType) params.set('serviceType', newFilters.serviceType)
      if (newFilters.status) params.set('status', newFilters.status)
      if (newFilters.search) params.set('search', newFilters.search)

      // Reset to page 1 when filters change
      params.set('page', '1')
      params.set('limit', searchParams.get('limit') || '50')

      const queryString = params.toString()
      router.push(queryString ? `/admin/agenda?${queryString}` : '/admin/agenda')
    },
    [router, searchParams]
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
    let newFilters: FilterValues = { ...filters }

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

  // Handle provider checkbox toggle
  const handleProviderToggle = (providerId: string) => {
    const newSelectedIds = selectedProviderIds.includes(providerId)
      ? selectedProviderIds.filter((id) => id !== providerId)
      : [...selectedProviderIds, providerId]

    setSelectedProviderIds(newSelectedIds)
    updateFilter('providerId', newSelectedIds.length > 0 ? newSelectedIds.join(',') : undefined)
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
    setSelectedProviderIds([])
    setSearchInput('')
    setActivePreset(null)

    const view = searchParams.get('view')
    router.push(view ? `/admin/agenda?view=${view}` : '/admin/agenda')
  }

  // Count active filters
  const activeFilterCount = [
    filters.dateStart,
    filters.dateEnd,
    filters.providerId,
    filters.serviceType,
    filters.status,
    filters.search,
  ].filter(Boolean).length

  // Get provider display text
  const getProviderDisplayText = () => {
    if (selectedProviderIds.length === 0) return 'Todos os profissionais'
    if (selectedProviderIds.length === providers.length) return 'Todos os profissionais'
    return `${selectedProviderIds.length} profissionais`
  }

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

          {/* Provider multi-select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Profissionais</label>
            <Popover open={providerDropdownOpen} onOpenChange={setProviderDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-left font-normal h-10"
                >
                  <span className="truncate">{getProviderDisplayText()}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                  {providers.map((provider) => (
                    <div key={provider.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`provider-${provider.id}`}
                        checked={selectedProviderIds.includes(provider.id)}
                        onCheckedChange={() => handleProviderToggle(provider.id)}
                      />
                      <label
                        htmlFor={`provider-${provider.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {provider.nome}
                      </label>
                    </div>
                  ))}
                  {providers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Nenhum profissional disponivel
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Service type filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Servico</label>
            <Select
              value={filters.serviceType || 'all'}
              onValueChange={(value) => updateFilter('serviceType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos os servicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os servicos</SelectItem>
                {serviceTypes.map((serviceType) => (
                  <SelectItem key={serviceType} value={serviceType}>
                    {serviceType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {STATUS_APPOINTMENT.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_APPOINTMENT_LABELS[status as AppointmentStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Patient search - separate row for better UX */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Buscar Paciente</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar paciente ou telefone..."
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
