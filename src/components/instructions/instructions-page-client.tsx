'use client';

import { useState, useEffect, useCallback } from 'react';
import { InstructionSearch } from './instruction-search';
import { InstructionTable } from './instruction-table';
import { InstructionFormModal } from './instruction-form-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Instruction } from '@/lib/validations/instruction';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InstructionsPageClientProps {
  q?: string;
  tipo?: string;
  ativo?: string;
  page: number;
  limit: number;
}

type InstructionWithService = Instruction & { servico?: { nome: string } | null };

export function InstructionsPageClient({
  q,
  tipo,
  ativo,
  page,
  limit,
}: InstructionsPageClientProps) {
  const [instructions, setInstructions] = useState<InstructionWithService[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<InstructionWithService | null>(null);

  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (tipo) params.set('tipo', tipo);
      if (ativo) params.set('ativo', ativo);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`/api/procedures/instructions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar instrucoes');
      }

      const data = await response.json();
      setInstructions(data.instructions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching instructions:', error);
    } finally {
      setLoading(false);
    }
  }, [q, tipo, ativo, page, limit]);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  const handleCreateClick = () => {
    setEditingInstruction(null);
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (instruction: Instruction) => {
    setEditingInstruction(instruction as InstructionWithService);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingInstruction(null);
  };

  const handleSuccess = () => {
    fetchInstructions();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search skeleton */}
        <div className="bg-white rounded-lg border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Skeleton className="h-10 md:col-span-2" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
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
      <InstructionSearch onCreateClick={handleCreateClick} />

      {/* Instruction table */}
      <InstructionTable
        instructions={instructions}
        pagination={pagination}
        searchParams={{ q, tipo, ativo }}
        onEditClick={handleEditClick}
        onRefresh={handleSuccess}
      />

      {/* Create/Edit modal */}
      <InstructionFormModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        instruction={editingInstruction}
      />
    </>
  );
}
