'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pencil,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Instruction } from '@/lib/validations/instruction';
import { InstructionTypeBadge } from './instruction-type-badge';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InstructionTableProps {
  instructions: (Instruction & { servico?: { nome: string } | null })[];
  pagination: Pagination;
  searchParams: {
    q?: string;
    tipo?: string;
    ativo?: string;
  };
  onEditClick: (instruction: Instruction) => void;
  onRefresh: () => void;
}

export function InstructionTable({
  instructions,
  pagination,
  searchParams,
  onEditClick,
  onRefresh,
}: InstructionTableProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const buildURL = (page: number, limit?: number) => {
    const params = new URLSearchParams();

    // Preserve search params
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.tipo) params.set('tipo', searchParams.tipo);
    if (searchParams.ativo) params.set('ativo', searchParams.ativo);

    // Set pagination params
    params.set('page', page.toString());
    params.set('limit', (limit || pagination.limit).toString());

    return `/admin/pre-checkin/instrucoes?${params.toString()}`;
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildURL(newPage));
  };

  const handleLimitChange = (newLimit: string) => {
    // Reset to page 1 when changing page size
    router.push(buildURL(1, parseInt(newLimit)));
  };

  const handleToggleStatus = async (instruction: Instruction & { servico?: { nome: string } | null }) => {
    setTogglingId(instruction.id);

    try {
      const newStatus = !instruction.ativo;
      const response = await fetch(`/api/procedures/instructions/${instruction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao alterar status');
      }

      toast.success(
        newStatus
          ? `Instrucao "${instruction.titulo}" ativada`
          : `Instrucao "${instruction.titulo}" desativada`
      );
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao alterar status';
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  // Empty state
  if (instructions.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhuma instrucao encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              {searchParams.q || searchParams.tipo || searchParams.ativo
                ? 'Tente ajustar os filtros de busca ou limpe a pesquisa.'
                : 'Comece cadastrando sua primeira instrucao.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Servico</TableHead>
              <TableHead className="text-center">Prioridade</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructions.map((instruction) => (
              <TableRow key={instruction.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {instruction.titulo}
                </TableCell>
                <TableCell>
                  <InstructionTypeBadge type={instruction.tipoInstrucao} />
                </TableCell>
                <TableCell className="text-gray-600">
                  {instruction.servico?.nome || (
                    <span className="text-gray-400 italic">Geral</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {instruction.prioridade}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={instruction.ativo}
                    onCheckedChange={() => handleToggleStatus(instruction)}
                    disabled={togglingId === instruction.id}
                    aria-label={instruction.ativo ? 'Desativar instrucao' : 'Ativar instrucao'}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClick(instruction)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {instructions.map((instruction) => (
          <div
            key={instruction.id}
            className="bg-white rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900">{instruction.titulo}</h3>
                <InstructionTypeBadge type={instruction.tipoInstrucao} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {instruction.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <Switch
                  checked={instruction.ativo}
                  onCheckedChange={() => handleToggleStatus(instruction)}
                  disabled={togglingId === instruction.id}
                  aria-label={instruction.ativo ? 'Desativar instrucao' : 'Ativar instrucao'}
                />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Servico:</span>
                <span className="text-gray-900">
                  {instruction.servico?.nome || 'Geral'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prioridade:</span>
                <span className="text-gray-900">{instruction.prioridade}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onEditClick(instruction)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page indicator */}
            <div className="text-sm text-gray-600 order-1 sm:order-1">
              Pagina {pagination.page} de {pagination.totalPages}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 order-3 sm:order-2">
              {/* First page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">Primeira pagina</span>
              </Button>

              {/* Previous page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Pagina anterior</span>
              </Button>

              {/* Next page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Proxima pagina</span>
              </Button>

              {/* Last page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Ultima pagina</span>
              </Button>
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-2 order-2 sm:order-3">
              <span className="text-sm text-gray-600">Itens por pagina:</span>
              <Select value={pagination.limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Pagination info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {instructions.length} de {pagination.total} instrucoes
        {pagination.totalPages > 1 && ` (Pagina ${pagination.page} de ${pagination.totalPages})`}
      </div>
    </div>
  );
}
