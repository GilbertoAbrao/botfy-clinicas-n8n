'use client';

import { useState, useEffect, useCallback } from 'react';
import { LembreteEnviadoSearch } from './lembrete-enviado-search';
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
  page: number;
  limit: number;
}

export function LembretesEnviadosPageClient({
  status,
  tipo,
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
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`/api/lembretes-enviados?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar lembretes enviados');
      }

      const data = await response.json();
      setLembretes(data.lembretes);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching lembretes:', error);
    } finally {
      setLoading(false);
    }
  }, [status, tipo, page, limit]);

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
        {/* Search skeleton */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="h-10 w-full sm:w-48" />
          </div>
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
      <LembreteEnviadoSearch status={status} tipo={tipo} />

      {/* Lembretes table */}
      <LembreteEnviadoTable
        lembretes={lembretes}
        pagination={pagination}
        searchParams={{ status, tipo }}
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
