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

interface ConfigLembretePaginationProps {
  currentPage: number;
  totalPages: number;
  currentLimit: number;
  searchParams: {
    q?: string;
    ativo?: string;
  };
}

export function ConfigLembretePagination({
  currentPage,
  totalPages,
  currentLimit,
  searchParams,
}: ConfigLembretePaginationProps) {
  const router = useRouter();

  const buildURL = (page: number, limit?: number) => {
    const params = new URLSearchParams();

    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.ativo) params.set('ativo', searchParams.ativo);

    params.set('page', page.toString());
    params.set('limit', (limit || currentLimit).toString());

    return `/admin/config-lembretes?${params.toString()}`;
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildURL(newPage));
  };

  const handleLimitChange = (newLimit: string) => {
    router.push(buildURL(1, parseInt(newLimit)));
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600 order-1 sm:order-1">
          Pagina {currentPage} de {totalPages}
        </div>

        <div className="flex items-center gap-1 order-3 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primeira pagina</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Pagina anterior</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Proxima pagina</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Ultima pagina</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 order-2 sm:order-3">
          <span className="text-sm text-gray-600">Itens por pagina:</span>
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
