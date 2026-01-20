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
import { Send, Eye, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { LembreteEnviadoPagination } from './lembrete-enviado-pagination';
import {
  LembreteEnviado,
  STATUS_RESPOSTA_LABELS,
  TIPO_LEMBRETE_LABELS,
  StatusResposta,
  TipoLembrete,
  getRiscoColor,
  getRiscoLabel,
  maskTelefone,
} from '@/lib/validations/lembrete-enviado';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchParams {
  status?: string;
  tipo?: string;
}

interface LembreteEnviadoTableProps {
  lembretes: LembreteEnviado[];
  pagination: Pagination;
  searchParams: SearchParams;
  onViewClick: (lembrete: LembreteEnviado) => void;
}

export function LembreteEnviadoTable({
  lembretes,
  pagination,
  searchParams,
  onViewClick,
}: LembreteEnviadoTableProps) {
  const getStatusLabel = (status: string): string => {
    return STATUS_RESPOSTA_LABELS[status as StatusResposta] || status;
  };

  const getTipoLabel = (tipo: string): string => {
    return TIPO_LEMBRETE_LABELS[tipo as TipoLembrete] || tipo;
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmado':
        return 'default';
      case 'cancelado':
        return 'destructive';
      case 'pendente':
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'cancelado':
        return <XCircle className="h-3 w-3 mr-1" />;
      case 'pendente':
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getRiscoBadgeClass = (risco: number | null): string => {
    const color = getRiscoColor(risco);
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatDateShort = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd/MM HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (lembretes.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-gray-100 p-6">
            <Send className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum lembrete encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {searchParams.status || searchParams.tipo
                ? 'Tente ajustar os filtros de busca ou limpe a pesquisa.'
                : 'Ainda nao ha lembretes enviados registrados no sistema.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risco No-show</TableHead>
              <TableHead>Enviado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lembretes.map((lembrete) => (
              <TableRow
                key={lembrete.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onViewClick(lembrete)}
              >
                <TableCell className="font-medium">
                  {lembrete.paciente_nome || 'N/A'}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {maskTelefone(lembrete.telefone)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getTipoLabel(lembrete.tipo_lembrete)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(lembrete.status_resposta)}>
                    {getStatusIcon(lembrete.status_resposta)}
                    {getStatusLabel(lembrete.status_resposta)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getRiscoBadgeClass(lembrete.risco_noshow)}
                  >
                    {lembrete.risco_noshow !== null && (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {lembrete.risco_noshow !== null
                      ? `${lembrete.risco_noshow}% - ${getRiscoLabel(lembrete.risco_noshow)}`
                      : 'N/A'
                    }
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(lembrete.enviado_em)}</TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewClick(lembrete)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {lembretes.map((lembrete) => (
          <div
            key={lembrete.id}
            className="bg-white rounded-lg border p-4 space-y-3"
            onClick={() => onViewClick(lembrete)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {lembrete.paciente_nome || 'N/A'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusVariant(lembrete.status_resposta)}>
                    {getStatusIcon(lembrete.status_resposta)}
                    {getStatusLabel(lembrete.status_resposta)}
                  </Badge>
                  <Badge variant="outline">
                    {getTipoLabel(lembrete.tipo_lembrete)}
                  </Badge>
                </div>
              </div>
              <Badge
                variant="outline"
                className={getRiscoBadgeClass(lembrete.risco_noshow)}
              >
                {lembrete.risco_noshow !== null
                  ? `${lembrete.risco_noshow}%`
                  : 'N/A'
                }
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Telefone:</span>
                <span className="text-gray-900 font-mono">
                  {maskTelefone(lembrete.telefone)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Enviado em:</span>
                <span className="text-gray-900">{formatDate(lembrete.enviado_em)}</span>
              </div>
              {lembrete.respondido_em && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Respondido em:</span>
                  <span className="text-gray-900">
                    {formatDateShort(lembrete.respondido_em)}
                  </span>
                </div>
              )}
              {lembrete.servico_nome && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Servico:</span>
                  <span className="text-gray-900">{lembrete.servico_nome}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onViewClick(lembrete);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <LembreteEnviadoPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          currentLimit={pagination.limit}
          searchParams={searchParams}
        />
      )}

      <div className="text-sm text-gray-600 text-center">
        Mostrando {lembretes.length} de {pagination.total} lembretes enviados
        {pagination.totalPages > 1 && ` (Pagina ${pagination.page} de ${pagination.totalPages})`}
      </div>
    </div>
  );
}
