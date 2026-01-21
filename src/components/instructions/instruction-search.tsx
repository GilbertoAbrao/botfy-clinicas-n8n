'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, X, Plus } from 'lucide-react';
import { INSTRUCTION_TYPES, INSTRUCTION_TYPE_LABELS, InstructionType } from '@/lib/validations/instruction';

type ActiveFilter = 'all' | 'true' | 'false';
type TypeFilter = 'all' | InstructionType;

interface InstructionSearchProps {
  onCreateClick: () => void;
}

export function InstructionSearch({ onCreateClick }: InstructionSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load initial values from URL
  useEffect(() => {
    const q = searchParams.get('q');
    const tipo = searchParams.get('tipo');
    const ativo = searchParams.get('ativo');

    if (q) {
      setSearchValue(q);
    }
    if (tipo && INSTRUCTION_TYPES.includes(tipo as InstructionType)) {
      setTypeFilter(tipo as InstructionType);
    } else {
      setTypeFilter('all');
    }
    if (ativo === 'true' || ativo === 'false') {
      setActiveFilter(ativo as ActiveFilter);
    } else {
      setActiveFilter('all');
    }
  }, [searchParams]);

  // Update URL params
  const updateURL = useCallback((value: string, tipo: TypeFilter, ativo: ActiveFilter) => {
    const params = new URLSearchParams();

    if (value.trim()) {
      params.set('q', value.trim());
    }

    if (tipo !== 'all') {
      params.set('tipo', tipo);
    }

    if (ativo !== 'all') {
      params.set('ativo', ativo);
    }

    // Reset to page 1 on new search
    params.set('page', '1');

    router.push(`/admin/pre-checkin/instrucoes?${params.toString()}`);
  }, [router]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Debounce 300ms
    const timeout = setTimeout(() => {
      updateURL(value, typeFilter, activeFilter);
    }, 300);
    setDebounceTimeout(timeout);
  };

  // Handle type filter change
  const handleTypeFilterChange = (newFilter: TypeFilter) => {
    setTypeFilter(newFilter);
    updateURL(searchValue, newFilter, activeFilter);
  };

  // Handle active filter change
  const handleActiveFilterChange = (newFilter: ActiveFilter) => {
    setActiveFilter(newFilter);
    updateURL(searchValue, typeFilter, newFilter);
  };

  // Handle clear
  const handleClear = () => {
    setSearchValue('');
    setTypeFilter('all');
    setActiveFilter('all');
    router.push('/admin/pre-checkin/instrucoes');
  };

  // Handle submit (for Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL(searchValue, typeFilter, activeFilter);
  };

  const hasFilters = searchValue || typeFilter !== 'all' || activeFilter !== 'all';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search input */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="search-input">Buscar instrucao</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search-input"
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Digite o titulo da instrucao"
              className="pl-10"
            />
          </div>
        </div>

        {/* Type filter */}
        <div className="space-y-2">
          <Label htmlFor="type-filter">Tipo</Label>
          <Select value={typeFilter} onValueChange={(value) => handleTypeFilterChange(value as TypeFilter)}>
            <SelectTrigger id="type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {INSTRUCTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {INSTRUCTION_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={activeFilter} onValueChange={(value) => handleActiveFilterChange(value as ActiveFilter)}>
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Ativos</SelectItem>
              <SelectItem value="false">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex items-end gap-2">
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
          <Button type="button" onClick={onCreateClick} className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Nova Instrucao
          </Button>
        </div>
      </div>
    </form>
  );
}
