'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarIcon,
  X,
  Filter,
  Search,
  ChevronDown,
  Clock,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATUS_RESPOSTA,
  STATUS_RESPOSTA_LABELS,
  TIPO_LEMBRETE,
  TIPO_LEMBRETE_LABELS,
  StatusResposta,
  TipoLembrete,
} from '@/lib/validations/lembrete-enviado';

interface Patient {
  id: number;
  nome: string;
  telefone?: string;
}

interface FilterValues {
  status?: string;
  tipo?: string;
  paciente_id?: string;
  data_inicio?: string;
  data_fim?: string;
  risco_min?: string;
}

interface LembreteEnviadoFiltersProps {
  onFilterChange?: (filters: FilterValues) => void;
}

// Quick filter preset type
type QuickFilter = 'hoje' | 'esta_semana' | 'pendentes' | 'alto_risco';

export function LembreteEnviadoFilters({ onFilterChange }: LembreteEnviadoFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state from URL
  const [filters, setFilters] = useState<FilterValues>({
    status: searchParams.get('status') || undefined,
    tipo: searchParams.get('tipo') || undefined,
    paciente_id: searchParams.get('paciente_id') || undefined,
    data_inicio: searchParams.get('data_inicio') || undefined,
    data_fim: searchParams.get('data_fim') || undefined,
    risco_min: searchParams.get('risco_min') || undefined,
  });

  // Date picker state
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.data_inicio ? new Date(filters.data_inicio) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.data_fim ? new Date(filters.data_fim) : undefined
  );

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const patientSearchRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile expand state
  const [isExpanded, setIsExpanded] = useState(false);

  // Close patient dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state with URL params when they change
  useEffect(() => {
    setFilters({
      status: searchParams.get('status') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      paciente_id: searchParams.get('paciente_id') || undefined,
      data_inicio: searchParams.get('data_inicio') || undefined,
      data_fim: searchParams.get('data_fim') || undefined,
      risco_min: searchParams.get('risco_min') || undefined,
    });

    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    setStartDate(dataInicio ? new Date(dataInicio) : undefined);
    setEndDate(dataFim ? new Date(dataFim) : undefined);
  }, [searchParams]);

  // Build URL with filters and navigate
  const updateURL = useCallback(
    (newFilters: FilterValues) => {
      const params = new URLSearchParams();

      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.tipo) params.set('tipo', newFilters.tipo);
      if (newFilters.paciente_id) params.set('paciente_id', newFilters.paciente_id);
      if (newFilters.data_inicio) params.set('data_inicio', newFilters.data_inicio);
      if (newFilters.data_fim) params.set('data_fim', newFilters.data_fim);
      if (newFilters.risco_min) params.set('risco_min', newFilters.risco_min);

      // Reset to page 1 when filters change
      params.set('page', '1');
      params.set('limit', '20');

      const queryString = params.toString();
      router.push(queryString ? `/admin/lembretes-enviados?${queryString}` : '/admin/lembretes-enviados');

      // Notify parent if callback provided
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    },
    [router, onFilterChange]
  );

  // Update a single filter
  const updateFilter = (key: keyof FilterValues, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Search patients with debounce (300ms)
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      setShowPatientDropdown(false);
      return;
    }

    setLoadingPatients(true);
    try {
      const res = await fetch(`/api/pacientes?q=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.patients || []);
      setShowPatientDropdown(true);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  // Handle patient search input change with debounce
  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    setSelectedPatientName('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchPatients(value);
    }, 300);
  };

  // Select a patient from dropdown
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientName(patient.nome);
    setPatientSearch(patient.nome);
    setShowPatientDropdown(false);
    setPatients([]);
    updateFilter('paciente_id', String(patient.id));
  };

  // Clear patient filter
  const clearPatientFilter = () => {
    setPatientSearch('');
    setSelectedPatientName('');
    setPatients([]);
    updateFilter('paciente_id', undefined);
  };

  // Handle start date selection
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      updateFilter('data_inicio', startOfDay(date).toISOString());
    } else {
      updateFilter('data_inicio', undefined);
    }
  };

  // Handle end date selection
  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      updateFilter('data_fim', endOfDay(date).toISOString());
    } else {
      updateFilter('data_fim', undefined);
    }
  };

  // Apply quick filter preset
  const applyQuickFilter = (preset: QuickFilter) => {
    const today = new Date();
    let newFilters: FilterValues = {};

    switch (preset) {
      case 'hoje':
        newFilters = {
          data_inicio: startOfDay(today).toISOString(),
          data_fim: endOfDay(today).toISOString(),
        };
        setStartDate(today);
        setEndDate(today);
        break;
      case 'esta_semana':
        const weekStart = startOfWeek(today, { locale: ptBR });
        const weekEnd = endOfWeek(today, { locale: ptBR });
        newFilters = {
          data_inicio: startOfDay(weekStart).toISOString(),
          data_fim: endOfDay(weekEnd).toISOString(),
        };
        setStartDate(weekStart);
        setEndDate(weekEnd);
        break;
      case 'pendentes':
        newFilters = {
          status: 'pendente',
        };
        break;
      case 'alto_risco':
        newFilters = {
          risco_min: '70',
        };
        break;
    }

    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    setPatientSearch('');
    setSelectedPatientName('');
    setPatients([]);
    router.push('/admin/lembretes-enviados');
  };

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.tipo,
    filters.paciente_id,
    filters.data_inicio,
    filters.data_fim,
    filters.risco_min,
  ].filter(Boolean).length;

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
            filters.data_inicio && filters.data_fim && !filters.status && !filters.risco_min
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : ''
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('esta_semana')}
          className="gap-1.5"
        >
          <Clock className="h-3.5 w-3.5" />
          Esta semana
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('pendentes')}
          className={cn(
            'gap-1.5',
            filters.status === 'pendente' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : ''
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Pendentes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyQuickFilter('alto_risco')}
          className={cn(
            'gap-1.5',
            filters.risco_min === '70' ? 'border-red-500 bg-red-50 text-red-700' : ''
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Alto risco
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
          {/* Status filter (HIST-04) */}
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
                {STATUS_RESPOSTA.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_RESPOSTA_LABELS[status as StatusResposta]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <Select
              value={filters.tipo || 'all'}
              onValueChange={(value) => updateFilter('tipo', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPO_LEMBRETE.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_LEMBRETE_LABELS[tipo as TipoLembrete]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range (HIST-02) */}
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
                        e.stopPropagation();
                        handleStartDateSelect(undefined);
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
                />
              </PopoverContent>
            </Popover>
          </div>

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
                        e.stopPropagation();
                        handleEndDateSelect(undefined);
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
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Patient search (HIST-03) - separate row for better UX */}
        <div className="space-y-2" ref={patientSearchRef}>
          <label className="text-sm font-medium text-gray-700">Paciente</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar paciente por nome..."
              className="pl-10 pr-10 h-10"
              value={patientSearch}
              onChange={(e) => handlePatientSearchChange(e.target.value)}
              onFocus={() => {
                if (patients.length > 0) setShowPatientDropdown(true);
              }}
            />
            {(patientSearch || filters.paciente_id) && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={clearPatientFilter}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* Patient dropdown results */}
            {showPatientDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {loadingPatients ? (
                  <div className="px-4 py-3 text-center text-gray-500">Buscando...</div>
                ) : patients.length > 0 ? (
                  patients.map((patient) => (
                    <button
                      key={patient.id}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex flex-col"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <span className="font-medium">{patient.nome}</span>
                      {patient.telefone && (
                        <span className="text-xs text-gray-500">{patient.telefone}</span>
                      )}
                    </button>
                  ))
                ) : patientSearch.length >= 2 ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    Nenhum paciente encontrado
                  </div>
                ) : null}
              </div>
            )}
          </div>
          {selectedPatientName && (
            <p className="text-xs text-green-600">Filtrado por: {selectedPatientName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
