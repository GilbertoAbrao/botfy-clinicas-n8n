'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { UserFormModal } from './user-form-modal';

interface UserFiltersProps {
  role?: string;
  ativo?: string;
  onUserCreated: () => void;
}

export function UserFilters({ role, ativo, onUserCreated }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Reset to page 1 when filters change
    params.delete('page');

    const queryString = params.toString();
    router.push(`/admin/usuarios${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Role Filter */}
        <Select
          value={role || 'all'}
          onValueChange={(value) => updateFilters('role', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por funcao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funcoes</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="ATENDENTE">Atendente</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={ativo || 'all'}
          onValueChange={(value) => updateFilters('ativo', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Create Button */}
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      {/* Create Modal */}
      <UserFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        mode="create"
        onSuccess={onUserCreated}
      />
    </>
  );
}
