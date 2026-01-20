import { z } from 'zod';

/**
 * Template types for reminder configurations
 */
export const TEMPLATE_TIPOS = ['lembrete', 'confirmacao', 'reagendamento'] as const;
export type TemplateTipo = (typeof TEMPLATE_TIPOS)[number];

/**
 * Display labels for template types (Portuguese)
 */
export const TEMPLATE_TIPO_LABELS: Record<TemplateTipo, string> = {
  lembrete: 'Lembrete',
  confirmacao: 'Confirmacao',
  reagendamento: 'Reagendamento',
};

/**
 * Common preset values for hours before
 */
export const HORAS_ANTES_PRESETS = [
  { value: 2, label: '2 horas antes' },
  { value: 24, label: '24 horas (1 dia) antes' },
  { value: 48, label: '48 horas (2 dias) antes' },
  { value: 72, label: '72 horas (3 dias) antes' },
];

/**
 * Config Lembrete validation schema
 * Validates reminder configuration data for the config_lembretes table
 */
export const configLembreteSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome nao pode ter mais de 50 caracteres'),
  horas_antes: z
    .number()
    .int('Horas deve ser um numero inteiro')
    .min(1, 'Minimo 1 hora')
    .max(168, 'Maximo 168 horas (7 dias)'),
  ativo: z.boolean(),
  template_tipo: z
    .string()
    .min(1, 'Tipo de template obrigatorio'),
  prioridade: z
    .number()
    .int('Prioridade deve ser um numero inteiro')
    .min(1, 'Prioridade minima e 1')
    .max(100, 'Prioridade maxima e 100')
    .optional()
    .default(1),
});

/**
 * TypeScript type inferred from the Zod schema
 * Use this for type-safe form handling
 */
export type ConfigLembreteInput = z.infer<typeof configLembreteSchema>;

/**
 * Full ConfigLembrete type (includes database fields)
 */
export interface ConfigLembrete {
  id: string;
  nome: string;
  horas_antes: number;
  template_tipo: string;
  prioridade: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Format hours to a readable string (e.g., "48h", "2 dias")
 */
export function formatHorasAntes(horas: number): string {
  if (horas < 24) {
    return `${horas}h`;
  }

  const dias = Math.floor(horas / 24);
  const horasRestantes = horas % 24;

  if (horasRestantes === 0) {
    return dias === 1 ? '1 dia' : `${dias} dias`;
  }

  return `${dias}d ${horasRestantes}h`;
}
