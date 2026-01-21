import { z } from 'zod';

/**
 * Instruction type constants
 * Maps to CHECK constraint in instrucoes_procedimentos table
 */
export const INSTRUCTION_TYPES = [
  'preparo',
  'jejum',
  'medicamentos',
  'vestuario',
  'acompanhante',
  'documentos',
  'geral',
] as const;

/**
 * TypeScript type for instruction types
 */
export type InstructionType = (typeof INSTRUCTION_TYPES)[number];

/**
 * Human-readable labels for instruction types (Portuguese)
 */
export const INSTRUCTION_TYPE_LABELS: Record<InstructionType, string> = {
  preparo: 'Preparo',
  jejum: 'Jejum',
  medicamentos: 'Medicamentos',
  vestuario: 'Vestuario',
  acompanhante: 'Acompanhante',
  documentos: 'Documentos',
  geral: 'Geral',
};

/**
 * Instruction form validation schema
 * Enforces required fields, format validation, and business rules
 */
export const instructionSchema = z.object({
  // Optional service link (null for general instructions)
  servicoId: z.number().int().positive().nullable(),

  // Instruction type (constrained to 7 values)
  tipoInstrucao: z.enum(INSTRUCTION_TYPES, {
    message: 'Tipo de instrucao invalido',
  }),

  // Title (3-200 characters)
  titulo: z
    .string()
    .min(3, 'Titulo deve ter pelo menos 3 caracteres')
    .max(200, 'Titulo muito longo'),

  // Content (minimum 10 characters for meaningful instructions)
  conteudo: z
    .string()
    .min(10, 'Conteudo deve ter pelo menos 10 caracteres'),

  // Display priority (0-100)
  prioridade: z
    .number()
    .int()
    .min(0, 'Prioridade deve ser no minimo 0')
    .max(100, 'Prioridade deve ser no maximo 100')
    .default(0),

  // Active status
  ativo: z.boolean().default(true),
});

/**
 * TypeScript type for instruction form input
 */
export type InstructionInput = z.infer<typeof instructionSchema>;

/**
 * Full instruction record from database
 * Includes auto-generated fields (id, timestamps)
 */
export type Instruction = InstructionInput & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};
