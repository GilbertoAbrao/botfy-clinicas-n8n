import { z } from 'zod';

/**
 * Service form validation schema
 * Enforces required fields, format validation, and business rules
 */
export const serviceSchema = z.object({
  // Required fields
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres'),

  duracao: z
    .number()
    .min(5, 'Duração mínima é de 5 minutos')
    .max(480, 'Duração máxima é de 8 horas (480 minutos)'),

  preco: z
    .number()
    .min(0, 'Preço não pode ser negativo')
    .max(99999.99, 'Preço máximo é R$ 99.999,99'),

  // Optional fields
  ativo: z.boolean().optional().default(true),
});

/**
 * TypeScript type inferred from the Zod schema
 * Use this for type-safe form handling
 */
export type ServiceInput = z.infer<typeof serviceSchema>;

/**
 * Format duration in minutes to readable string (e.g., "1h 30min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Format price in BRL currency (e.g., "R$ 150,00")
 */
export function formatPrice(price: number | string): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericPrice);
}
