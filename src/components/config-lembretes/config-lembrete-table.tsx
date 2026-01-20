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
import { Pencil, Bell } from 'lucide-react';
import { ConfigLembretePagination } from './config-lembrete-pagination';
import { ConfigLembreteActions } from './config-lembrete-actions';
import {
  ConfigLembrete,
  formatHorasAntes,
  TEMPLATE_TIPO_LABELS,
  TemplateTipo,
} from '@/lib/validations/config-lembrete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ConfigLembreteTableProps {
  configs: ConfigLembrete[];
  pagination: Pagination;
  searchParams: {
    q?: string;
    ativo?: string;
  };
  onCreateClick: () => void;
  onEditClick: (config: ConfigLembrete) => void;
  onRefresh: () => void;
}

export function ConfigLembreteTable({
  configs,
  pagination,
  searchParams,
  onCreateClick,
  onEditClick,
  onRefresh,
}: ConfigLembreteTableProps) {
  const getTemplateTipoLabel = (tipo: string): string => {
    return TEMPLATE_TIPO_LABELS[tipo as TemplateTipo] || tipo;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (configs.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <Bell className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhuma configuracao encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              {searchParams.q || searchParams.ativo
                ? 'Tente ajustar os filtros de busca ou limpe a pesquisa.'
                : 'Comece cadastrando sua primeira configuracao de lembrete.'}
            </p>
            <Button onClick={onCreateClick}>
              <Bell className="mr-2 h-4 w-4" />
              Novo Lembrete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Horas Antes</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow
                key={config.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onEditClick(config)}
              >
                <TableCell className="font-medium">{config.nome}</TableCell>
                <TableCell>{formatHorasAntes(config.horas_antes)}</TableCell>
                <TableCell>{getTemplateTipoLabel(config.template_tipo)}</TableCell>
                <TableCell>
                  <Badge variant={config.ativo ? 'default' : 'secondary'}>
                    {config.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>{config.prioridade}</TableCell>
                <TableCell>{formatDate(config.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(config)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <ConfigLembreteActions
                      config={config}
                      onRefresh={onRefresh}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {configs.map((config) => (
          <div
            key={config.id}
            className="bg-white rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{config.nome}</h3>
                <Badge
                  variant={config.ativo ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {config.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <ConfigLembreteActions config={config} onRefresh={onRefresh} />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Horas Antes:</span>
                <span className="text-gray-900">{formatHorasAntes(config.horas_antes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Template:</span>
                <span className="text-gray-900">{getTemplateTipoLabel(config.template_tipo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prioridade:</span>
                <span className="text-gray-900">{config.prioridade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Criado em:</span>
                <span className="text-gray-900">{formatDate(config.created_at)}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onEditClick(config)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <ConfigLembretePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          currentLimit={pagination.limit}
          searchParams={searchParams}
        />
      )}

      <div className="text-sm text-gray-600 text-center">
        Mostrando {configs.length} de {pagination.total} configuracoes
        {pagination.totalPages > 1 && ` (Pagina ${pagination.page} de ${pagination.totalPages})`}
      </div>
    </div>
  );
}
