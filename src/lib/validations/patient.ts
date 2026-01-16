import { z } from 'zod';

/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 * Implements the official CPF checksum algorithm with two verification digits
 */
function isValidCPF(cpf: string): boolean {
  // Remove formatting (dots and dash)
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Must be exactly 11 digits
  if (cleanCPF.length !== 11) return false;

  // Reject CPFs with all digits the same (000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;

  // Verify first digit
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;

  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;

  // Verify second digit
  return parseInt(cleanCPF.charAt(10)) === secondDigit;
}

/**
 * Patient form validation schema
 * Enforces required fields, format validation, and business rules
 */
export const patientSchema = z.object({
  // Required fields
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome não pode ter mais de 255 caracteres'),

  telefone: z
    .string()
    .regex(
      /^\+55\d{10,11}$/,
      'Telefone inválido (formato: +5511987654321)'
    ),

  // Optional fields - use .optional().or(z.literal('')) to allow empty strings from forms
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email não pode ter mais de 255 caracteres')
    .optional()
    .or(z.literal('')),

  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 123.456.789-00)')
    .refine(isValidCPF, 'CPF inválido (verificação de dígitos falhou)')
    .optional()
    .or(z.literal('')),

  dataNascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: AAAA-MM-DD)')
    .refine((date) => {
      if (!date) return true; // Optional field
      const birthDate = new Date(date);
      const today = new Date();
      // Must be in the past
      return birthDate < today;
    }, 'Data de nascimento deve ser no passado')
    .optional()
    .or(z.literal('')),

  endereco: z
    .string()
    .max(500, 'Endereço não pode ter mais de 500 caracteres')
    .optional()
    .or(z.literal('')),

  convenio: z
    .string()
    .max(100, 'Convênio não pode ter mais de 100 caracteres')
    .optional()
    .or(z.literal('')),

  numeroCarteirinha: z
    .string()
    .max(50, 'Número da carteirinha não pode ter mais de 50 caracteres')
    .optional()
    .or(z.literal('')),
});

/**
 * TypeScript type inferred from the Zod schema
 * Use this for type-safe form handling
 */
export type PatientFormData = z.infer<typeof patientSchema>;

/**
 * Format CPF for display (123.456.789-00)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Format phone for display (+55 11 98765-4321)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Extract country code, area code, and number
  const match = cleaned.match(/^\+55(\d{2})(\d{4,5})(\d{4})$/);
  if (!match) return phone;

  const [, areaCode, firstPart, secondPart] = match;
  return `+55 ${areaCode} ${firstPart}-${secondPart}`;
}

/**
 * Auto-format CPF as user types (adds dots and dash)
 */
export function autoFormatCPF(input: string): string {
  // Remove all non-digits
  let cleaned = input.replace(/[^\d]/g, '');

  // Limit to 11 digits
  cleaned = cleaned.slice(0, 11);

  // Apply formatting progressively as user types
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d+)/, '$1.$2');
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
}

/**
 * Auto-format phone as user types (adds +55 prefix and formatting)
 */
export function autoFormatPhone(input: string): string {
  // Remove all non-digits except +
  let cleaned = input.replace(/[^\d+]/g, '');

  // Ensure +55 prefix
  if (!cleaned.startsWith('+55')) {
    cleaned = '+55' + cleaned.replace(/^\+?55?/, '');
  }

  // Extract digits after +55
  const digits = cleaned.slice(3);

  // Limit to 11 digits (area code + phone)
  const limited = digits.slice(0, 11);

  if (limited.length === 0) return '+55';
  if (limited.length <= 2) return `+55${limited}`;
  if (limited.length <= 6) return `+55 ${limited.slice(0, 2)} ${limited.slice(2)}`;
  if (limited.length <= 10) {
    return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  // 11 digits (mobile with extra digit)
  return `+55 ${limited.slice(0, 2)} ${limited.slice(2, 7)}-${limited.slice(7)}`;
}
