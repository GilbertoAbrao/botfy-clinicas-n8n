'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  currentLimit: number;
  searchParams: {
    q?: string;
    telefone?: string;
    cpf?: string;
  };
}

export function PaginationControls({
  currentPage,
  totalPages,
  currentLimit,
  searchParams,
}: PaginationControlsProps) {
  const router = useRouter();

  const buildURL = (page: number, limit?: number) => {
    const params = new URLSearchParams();

    // Preserve search params
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.telefone) params.set('telefone', searchParams.telefone);
    if (searchParams.cpf) params.set('cpf', searchParams.cpf);

    // Set pagination params
    params.set('page', page.toString());
    params.set('limit', (limit || currentLimit).toString());

    return `/pacientes?${params.toString()}`;
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildURL(newPage));
  };

  const handleLimitChange = (newLimit: string) => {
    // Reset to page 1 when changing page size
    router.push(buildURL(1, parseInt(newLimit)));
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Page indicator */}
        <div className="text-sm text-gray-600 order-1 sm:order-1">
          Página {currentPage} de {totalPages}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1 order-3 sm:order-2">
          {/* First page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primeira página</span>
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Próxima página</span>
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <span className="text-sm text-gray-600">Itens por página:</span>
          <Select value={currentLimit.toString()} onValueChange={handleLimitChange}>
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
  );
}
