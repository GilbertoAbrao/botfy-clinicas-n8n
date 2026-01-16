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
import { Search, X } from 'lucide-react';

type SearchType = 'nome' | 'telefone' | 'cpf';

export function PatientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL params
  const [searchType, setSearchType] = useState<SearchType>('nome');
  const [searchValue, setSearchValue] = useState('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load initial values from URL
  useEffect(() => {
    const q = searchParams.get('q');
    const telefone = searchParams.get('telefone');
    const cpf = searchParams.get('cpf');

    if (telefone) {
      setSearchType('telefone');
      setSearchValue(telefone);
    } else if (cpf) {
      setSearchType('cpf');
      setSearchValue(cpf);
    } else if (q) {
      setSearchType('nome');
      setSearchValue(q);
    }
  }, [searchParams]);

  // Update URL params
  const updateURL = useCallback((type: SearchType, value: string) => {
    const params = new URLSearchParams();

    if (value.trim()) {
      if (type === 'nome') {
        params.set('q', value.trim());
      } else if (type === 'telefone') {
        params.set('telefone', value.trim());
      } else if (type === 'cpf') {
        params.set('cpf', value.trim());
      }
    }

    // Reset to page 1 on new search
    params.set('page', '1');

    router.push(`/pacientes?${params.toString()}`);
  }, [router]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // For nome search: debounce 300ms
    // For telefone/cpf: search immediately (exact match)
    if (searchType === 'nome') {
      const timeout = setTimeout(() => {
        updateURL(searchType, value);
      }, 300);
      setDebounceTimeout(timeout);
    } else {
      // Immediate search for exact match fields
      updateURL(searchType, value);
    }
  };

  // Handle search type change
  const handleTypeChange = (newType: SearchType) => {
    setSearchType(newType);
    setSearchValue('');

    // Clear URL params
    router.push('/pacientes');
  };

  // Handle clear
  const handleClear = () => {
    setSearchValue('');
    router.push('/pacientes');
  };

  // Handle submit (for Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL(searchType, searchValue);
  };

  // Get placeholder and format hint based on search type
  const getPlaceholder = () => {
    switch (searchType) {
      case 'nome':
        return 'Digite o nome do paciente';
      case 'telefone':
        return '+5511987654321';
      case 'cpf':
        return '123.456.789-00';
    }
  };

  const getFormatHint = () => {
    switch (searchType) {
      case 'nome':
        return 'Busca por nome (parcial, não diferencia maiúsculas)';
      case 'telefone':
        return 'Busca exata por telefone';
      case 'cpf':
        return 'Busca exata por CPF';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search type selector */}
        <div className="space-y-2">
          <Label htmlFor="search-type">Buscar por</Label>
          <Select value={searchType} onValueChange={handleTypeChange}>
            <SelectTrigger id="search-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Nome</SelectItem>
              <SelectItem value="telefone">Telefone</SelectItem>
              <SelectItem value="cpf">CPF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search input */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="search-input">Buscar paciente</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search-input"
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={getPlaceholder()}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500">{getFormatHint()}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
          {searchValue && (
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
        </div>
      </div>
    </form>
  );
}
