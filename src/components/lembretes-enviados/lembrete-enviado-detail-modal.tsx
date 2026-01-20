'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  User,
  Phone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Package,
} from 'lucide-react';
import {
  LembreteEnviado,
  STATUS_RESPOSTA_LABELS,
  TIPO_LEMBRETE_LABELS,
  StatusResposta,
  TipoLembrete,
  getRiscoColor,
  getRiscoLabel,
} from '@/lib/validations/lembrete-enviado';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LembreteEnviadoDetailModalProps {
  lembrete: LembreteEnviado | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LembreteEnviadoDetailModal({
  lembrete,
  isOpen,
  onClose,
}: LembreteEnviadoDetailModalProps) {
  if (!lembrete) return null;

  const getStatusLabel = (status: string): string => {
    return STATUS_RESPOSTA_LABELS[status as StatusResposta] || status;
  };

  const getTipoLabel = (tipo: string): string => {
    return TIPO_LEMBRETE_LABELS[tipo as TipoLembrete] || tipo;
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
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
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      case 'pendente':
      default:
        return <Clock className="h-4 w-4" />;
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

  const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Detalhes do Lembrete
          </DialogTitle>
          <DialogDescription>
            Informacoes completas do lembrete enviado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Type badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getStatusVariant(lembrete.status_resposta)}>
              {getStatusIcon(lembrete.status_resposta)}
              <span className="ml-1">{getStatusLabel(lembrete.status_resposta)}</span>
            </Badge>
            <Badge variant="outline">
              {getTipoLabel(lembrete.tipo_lembrete)}
            </Badge>
            {lembrete.risco_noshow !== null && (
              <Badge variant="outline" className={getRiscoBadgeClass(lembrete.risco_noshow)}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Risco: {lembrete.risco_noshow}% - {getRiscoLabel(lembrete.risco_noshow)}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Patient info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Paciente</p>
                <p className="font-medium">{lembrete.paciente_nome || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium font-mono">{lembrete.telefone}</p>
              </div>
            </div>

            {lembrete.servico_nome && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Servico</p>
                  <p className="font-medium">{lembrete.servico_nome}</p>
                </div>
              </div>
            )}

            {lembrete.data_agendamento && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Data do Agendamento</p>
                  <p className="font-medium">{formatDateTime(lembrete.data_agendamento)}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Send className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Enviado em</p>
                <p className="font-medium">{formatDateTime(lembrete.enviado_em)}</p>
              </div>
            </div>

            {lembrete.respondido_em && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Respondido em</p>
                  <p className="font-medium">{formatDateTime(lembrete.respondido_em)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Message content */}
          {lembrete.mensagem_enviada && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Mensagem Enviada</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{lembrete.mensagem_enviada}</p>
                </div>
              </div>
            </>
          )}

          {/* IDs (for debug/reference) */}
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
            <div>
              <span className="font-medium">ID Lembrete:</span> {lembrete.id}
            </div>
            <div>
              <span className="font-medium">ID Agendamento:</span> {lembrete.agendamento_id}
            </div>
            {lembrete.evento_id && (
              <div className="col-span-2">
                <span className="font-medium">ID Evento:</span> {lembrete.evento_id}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
