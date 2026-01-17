'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Package } from 'lucide-react';
import { ServicePagination } from './service-pagination';
import { ServiceActions } from './service-actions';
import { formatDuration, formatPrice } from '@/lib/validations/service';

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

interface ServiceTableClientProps {
  services: Service[];
  pagination: Pagination;
  searchParams: {
    q?: string;
    ativo?: string;
  };
  onCreateClick: () => void;
  onEditClick: (service: Service) => void;
  onRefresh: () => void;
}

export function ServiceTableClient({
  services,
  pagination,
  searchParams,
  onCreateClick,
  onEditClick,
  onRefresh,
}: ServiceTableClientProps) {
  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum servico encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {searchParams.q || searchParams.ativo
                ? 'Tente ajustar os filtros de busca ou limpe a pesquisa.'
                : 'Comece cadastrando seu primeiro servico.'}
            </p>
            <Button onClick={onCreateClick}>
              <Package className="mr-2 h-4 w-4" />
              Criar Servico
            </Button>
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
              <TableHead>Nome</TableHead>
              <TableHead>Duracao</TableHead>
              <TableHead>Preco</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.nome}</TableCell>
                <TableCell>{formatDuration(service.duracao)}</TableCell>
                <TableCell>{formatPrice(service.preco)}</TableCell>
                <TableCell>
                  <Badge variant={service.ativo ? 'default' : 'secondary'}>
                    {service.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(service)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <ServiceActions
                      service={service}
                      onRefresh={onRefresh}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{service.nome}</h3>
                <Badge
                  variant={service.ativo ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {service.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <ServiceActions service={service} onRefresh={onRefresh} />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Duracao:</span>
                <span className="text-gray-900">{formatDuration(service.duracao)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Preco:</span>
                <span className="text-gray-900 font-medium">{formatPrice(service.preco)}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onEditClick(service)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <ServicePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          currentLimit={pagination.limit}
          searchParams={searchParams}
        />
      )}

      {/* Pagination info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {services.length} de {pagination.total} servicos
        {pagination.totalPages > 1 && ` (Pagina ${pagination.page} de ${pagination.totalPages})`}
      </div>
    </div>
  );
}
