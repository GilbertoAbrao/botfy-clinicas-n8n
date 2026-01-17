'use client';

import { useState, useEffect, useCallback } from 'react';
import { ServiceSearch } from './service-search';
import { ServiceTableClient } from './service-table-client';
import { ServiceFormModal } from './service-form-modal';
import { Skeleton } from '@/components/ui/skeleton';

interface Service {
  id: string;
  nome: string;
  duracao: number;
  preco: string | number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ServicesPageClientProps {
  q?: string;
  ativo?: string;
  page: number;
  limit: number;
}

export function ServicesPageClient({
  q,
  ativo,
  page,
  limit,
}: ServicesPageClientProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (ativo) params.set('ativo', ativo);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`/api/servicos?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar servicos');
      }

      const data = await response.json();
      setServices(data.services);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, [q, ativo, page, limit]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCreateClick = () => {
    setEditingService(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingService(null);
  };

  const handleSuccess = () => {
    fetchServices();
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
      <ServiceSearch onCreateClick={handleCreateClick} />

      {/* Service table */}
      <ServiceTableClient
        services={services}
        pagination={pagination}
        searchParams={{ q, ativo }}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onRefresh={handleSuccess}
      />

      {/* Create/Edit modal */}
      <ServiceFormModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        service={editingService}
      />
    </>
  );
}
