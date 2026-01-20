import { z } from 'zod';

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
