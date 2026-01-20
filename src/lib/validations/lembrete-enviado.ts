import { z } from 'zod';

// Status enum for type safety
export const STATUS_RESPOSTA = ['pendente', 'confirmado', 'cancelado'] as const;
export type StatusResposta = typeof STATUS_RESPOSTA[number];

// Tipo lembrete enum
export const TIPO_LEMBRETE = ['48h', '24h', '2h'] as const;
export type TipoLembrete = typeof TIPO_LEMBRETE[number];

// Labels for display
export const STATUS_RESPOSTA_LABELS: Record<StatusResposta, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
};

export const TIPO_LEMBRETE_LABELS: Record<TipoLembrete, string> = {
  '48h': '48 horas antes',
  '24h': '24 horas antes',
  '2h': '2 horas antes',
};

// Type for database record
export interface LembreteEnviado {
  id: number;
  agendamento_id: number;
  telefone: string;
  tipo_lembrete: TipoLembrete;
  status_resposta: StatusResposta;
  evento_id: string | null;
  enviado_em: string;
  respondido_em: string | null;
  risco_noshow: number | null;
  mensagem_enviada: string | null;
  // Joined fields (optional)
  paciente_nome?: string;
  servico_nome?: string;
  data_agendamento?: string;
}

// Query params validation
export const lembreteEnviadoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(STATUS_RESPOSTA).optional(),
  tipo: z.enum(TIPO_LEMBRETE).optional(),
  paciente_id: z.coerce.number().int().positive().optional(),
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  risco_min: z.coerce.number().int().min(0).max(100).optional(),
});

export type LembreteEnviadoQuery = z.infer<typeof lembreteEnviadoQuerySchema>;

// Helper to format risk score as badge color
export function getRiscoColor(risco: number | null): string {
  if (risco === null) return 'gray';
  if (risco >= 70) return 'red';
  if (risco >= 40) return 'yellow';
  return 'green';
}

// Helper to format risk score label
export function getRiscoLabel(risco: number | null): string {
  if (risco === null) return 'N/A';
  if (risco >= 70) return 'Alto';
  if (risco >= 40) return 'Medio';
  return 'Baixo';
}

// Helper to mask phone number for privacy (show last 4 digits)
export function maskTelefone(telefone: string): string {
  if (!telefone || telefone.length < 4) return '****';
  const masked = telefone.slice(-4);
  return `****${masked}`;
}
