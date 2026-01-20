'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  STATUS_RESPOSTA,
  STATUS_RESPOSTA_LABELS,
  TIPO_LEMBRETE,
  TIPO_LEMBRETE_LABELS,
  StatusResposta,
  TipoLembrete,
} from '@/lib/validations/lembrete-enviado';

interface LembreteEnviadoSearchProps {
  status?: string;
  tipo?: string;
}

export function LembreteEnviadoSearch({
  status,
  tipo,
}: LembreteEnviadoSearchProps) {
  const router = useRouter();

  const buildURL = (newStatus?: string, newTipo?: string) => {
    const params = new URLSearchParams();

    if (newStatus) params.set('status', newStatus);
    if (newTipo) params.set('tipo', newTipo);

    params.set('page', '1');
    params.set('limit', '20');

    const queryString = params.toString();
    return queryString ? `/admin/lembretes-enviados?${queryString}` : '/admin/lembretes-enviados';
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value === 'all' ? undefined : value;
    router.push(buildURL(newStatus, tipo));
  };

  const handleTipoChange = (value: string) => {
    const newTipo = value === 'all' ? undefined : value;
    router.push(buildURL(status, newTipo));
  };

  const handleClearFilters = () => {
    router.push('/admin/lembretes-enviados');
  };

  const hasFilters = status || tipo;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Status filter */}
          <div className="w-full sm:w-48">
            <Select
              value={status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_RESPOSTA.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_RESPOSTA_LABELS[s as StatusResposta]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo filter */}
          <div className="w-full sm:w-48">
            <Select
              value={tipo || 'all'}
              onValueChange={handleTipoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPO_LEMBRETE.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_LEMBRETE_LABELS[t as TipoLembrete]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear filters button */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="self-center sm:self-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
