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
import { Search, X, Bell } from 'lucide-react';

type ActiveFilter = 'all' | 'true' | 'false';

interface ConfigLembreteSearchProps {
  onCreateClick: () => void;
}

export function ConfigLembreteSearch({ onCreateClick }: ConfigLembreteSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    const ativo = searchParams.get('ativo');

    if (q) {
      setSearchValue(q);
    }
    if (ativo === 'true' || ativo === 'false') {
      setActiveFilter(ativo as ActiveFilter);
    } else {
      setActiveFilter('all');
    }
  }, [searchParams]);

  const updateURL = useCallback((value: string, ativo: ActiveFilter) => {
    const params = new URLSearchParams();

    if (value.trim()) {
      params.set('q', value.trim());
    }

    if (ativo !== 'all') {
      params.set('ativo', ativo);
    }

    params.set('page', '1');

    router.push(`/admin/config-lembretes?${params.toString()}`);
  }, [router]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      updateURL(value, activeFilter);
    }, 300);
    setDebounceTimeout(timeout);
  };

  const handleActiveFilterChange = (newFilter: ActiveFilter) => {
    setActiveFilter(newFilter);
    updateURL(searchValue, newFilter);
  };

  const handleClear = () => {
    setSearchValue('');
    setActiveFilter('all');
    router.push('/admin/config-lembretes');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL(searchValue, activeFilter);
  };

  const hasFilters = searchValue || activeFilter !== 'all';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="search-input">Buscar configuracao</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search-input"
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Digite o nome da configuracao"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={activeFilter} onValueChange={handleActiveFilterChange}>
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
            <Bell className="mr-2 h-4 w-4" />
            Novo Lembrete
          </Button>
        </div>
      </div>
    </form>
  );
}
