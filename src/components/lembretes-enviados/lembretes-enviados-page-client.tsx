'use client';

import { useState, useEffect, useCallback } from 'react';
import { LembreteEnviadoFilters } from './lembrete-enviado-filters';
import { LembreteEnviadoTable } from './lembrete-enviado-table';
import { LembreteEnviadoDetailModal } from './lembrete-enviado-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { LembreteEnviado } from '@/lib/validations/lembrete-enviado';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LembretesEnviadosPageClientProps {
  status?: string;
  tipo?: string;
  paciente_id?: string;
  data_inicio?: string;
  data_fim?: string;
  risco_min?: string;
  page: number;
  limit: number;
}

export function LembretesEnviadosPageClient({
  status,
  tipo,
  paciente_id,
  data_inicio,
  data_fim,
  risco_min,
  page,
  limit,
}: LembretesEnviadosPageClientProps) {
  const [lembretes, setLembretes] = useState<LembreteEnviado[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLembrete, setSelectedLembrete] = useState<LembreteEnviado | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchLembretes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (tipo) params.set('tipo', tipo);
      if (paciente_id) params.set('paciente_id', paciente_id);
      if (data_inicio) params.set('data_inicio', data_inicio);
      if (data_fim) params.set('data_fim', data_fim);
      if (risco_min) params.set('risco_min', risco_min);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`/api/lembretes-enviados?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', response.status, data);
        throw new Error(data.details || data.error || 'Erro ao buscar lembretes enviados');
      }
      setLembretes(data.lembretes);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching lembretes:', error);
    } finally {
      setLoading(false);
    }
  }, [status, tipo, paciente_id, data_inicio, data_fim, risco_min, page, limit]);

  useEffect(() => {
    fetchLembretes();
  }, [fetchLembretes]);

  const handleViewClick = (lembrete: LembreteEnviado) => {
    setSelectedLembrete(lembrete);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedLembrete(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Quick filters skeleton */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        {/* Filters skeleton */}
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
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
      {/* Filters */}
      <LembreteEnviadoFilters />

      {/* Lembretes table */}
      <LembreteEnviadoTable
        lembretes={lembretes}
        pagination={pagination}
        searchParams={{ status, tipo, paciente_id, data_inicio, data_fim, risco_min }}
        onViewClick={handleViewClick}
      />

      {/* Detail modal */}
      <LembreteEnviadoDetailModal
        lembrete={selectedLembrete}
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
      />
    </>
  );
}
