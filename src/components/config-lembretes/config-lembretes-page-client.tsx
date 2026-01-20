'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConfigLembreteSearch } from './config-lembrete-search';
import { ConfigLembreteTable } from './config-lembrete-table';
import { ConfigLembreteFormModal } from './config-lembrete-form-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfigLembrete } from '@/lib/validations/config-lembrete';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ConfigLembretesPageClientProps {
  q?: string;
  ativo?: string;
  page: number;
  limit: number;
}

export function ConfigLembretesPageClient({
  q,
  ativo,
  page,
  limit,
}: ConfigLembretesPageClientProps) {
  const [configs, setConfigs] = useState<ConfigLembrete[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigLembrete | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (ativo) params.set('ativo', ativo);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`/api/config-lembretes?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar configuracoes de lembretes');
      }

      const data = await response.json();
      setConfigs(data.configs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  }, [q, ativo, page, limit]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleCreateClick = () => {
    setEditingConfig(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (config: ConfigLembrete) => {
    setEditingConfig(config);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingConfig(null);
  };

  const handleSuccess = () => {
    fetchConfigs();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search skeleton */}
        <div className="bg-white rounded-lg border p-4">
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Table skeleton */}
        <div className="rounded-md border">
          <div className="p-4">
            <Skeleton className="h-8 w-full" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t p-4">
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search and filters */}
      <ConfigLembreteSearch onCreateClick={handleCreateClick} />

      {/* Config table */}
      <ConfigLembreteTable
        configs={configs}
        pagination={pagination}
        searchParams={{ q, ativo }}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onRefresh={handleSuccess}
      />

      {/* Create/Edit modal */}
      <ConfigLembreteFormModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        config={editingConfig}
      />
    </>
  );
}
