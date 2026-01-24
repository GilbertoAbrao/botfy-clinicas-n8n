/**
 * Zod Schemas for Document Processing
 *
 * Defines validation schemas for GPT-4o Vision API structured outputs.
 * Used with zodResponseFormat() from openai/helpers/zod for type-safe extraction.
 *
 * Each schema defines:
 * - Required fields for the document type
 * - Optional fields that may or may not be visible
 * - Validation patterns (dates, numbers, etc.)
 * - Confidence level for extraction quality
 */

import { z } from 'zod'

// =============================================================================
// Common Schemas
// =============================================================================

/**
 * Confidence level for extracted data
 * - high: All required fields clearly visible and readable
 * - medium: Some fields unclear or partially visible
 * - low: Poor image quality or significant uncertainty
 */
const confidenceSchema = z.enum(['high', 'medium', 'low'])

/**
 * Date pattern: YYYY-MM-DD
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')

// =============================================================================
// Document Schemas
// =============================================================================

/**
 * RG (Registro Geral) - Brazilian National ID
 *
 * Required: numeroRG, nome, dataNascimento
 * Optional: nomePai, nomeMae, naturalidade, orgaoEmissor, dataEmissao
 */
export const RGSchema = z.object({
  documentType: z.literal('RG'),
  numeroRG: z
    .string()
    .min(8, 'RG must be at least 8 characters')
    .max(10, 'RG must be at most 10 characters'), // 8-9 digits + optional X
  nome: z.string().min(1, 'Nome is required'),
  dataNascimento: dateSchema,
  nomePai: z.string().optional(),
  nomeMae: z.string().optional(),
  naturalidade: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  dataEmissao: dateSchema.optional(),
  confidence: confidenceSchema,
})

/**
 * CPF (Cadastro de Pessoa Fisica) - Brazilian Tax ID
 *
 * Required: numeroCPF (11 digits), nome, dataNascimento
 */
export const CPFSchema = z.object({
  documentType: z.literal('CPF'),
  numeroCPF: z.string().regex(/^\d{11}$/, 'CPF must be 11 digits'),
  nome: z.string().min(1, 'Nome is required'),
  dataNascimento: dateSchema,
  confidence: confidenceSchema,
})

/**
 * CNS (Cartao Nacional de Saude) - National Health Card
 *
 * Required: numeroCNS (15 digits starting with 1, 2, or 7), nome
 *
 * CNS number rules:
 * - Starts with 1 or 2: Definitive card
 * - Starts with 7, 8, or 9: Provisional card
 */
export const CNSSchema = z.object({
  documentType: z.literal('CNS'),
  numeroCNS: z
    .string()
    .regex(/^[127]\d{14}$/, 'CNS must be 15 digits starting with 1, 2, or 7'),
  nome: z.string().min(1, 'Nome is required'),
  confidence: confidenceSchema,
})

/**
 * Carteirinha de Convenio - Health Insurance Card
 *
 * Required: numeroCarteirinha, nomeConvenio, nomeTitular
 * Optional: validadeAte
 */
export const InsuranceCardSchema = z.object({
  documentType: z.literal('CARTEIRINHA_CONVENIO'),
  numeroCarteirinha: z.string().min(1, 'Numero da carteirinha is required'),
  nomeConvenio: z.string().min(1, 'Nome do convenio is required'),
  nomeTitular: z.string().min(1, 'Nome do titular is required'),
  validadeAte: dateSchema.optional(),
  confidence: confidenceSchema,
})

/**
 * Unknown Document - When type cannot be determined
 *
 * Used when:
 * - Document type not recognized
 * - Image quality too poor
 * - Document not in supported list
 */
export const UnknownSchema = z.object({
  documentType: z.literal('UNKNOWN'),
  reason: z.string().min(1, 'Reason for unknown classification is required'),
  confidence: z.literal('low'), // Unknown is always low confidence
})

// =============================================================================
// Discriminated Union
// =============================================================================

/**
 * Combined schema for all Brazilian document types
 *
 * Uses discriminatedUnion for efficient parsing based on documentType field.
 * Compatible with zodResponseFormat() for GPT-4o Vision API.
 *
 * @example
 * ```typescript
 * import { zodResponseFormat } from 'openai/helpers/zod'
 *
 * const response = await openai.beta.chat.completions.parse({
 *   model: 'gpt-4o',
 *   messages: [...],
 *   response_format: zodResponseFormat(BrazilianDocumentSchema, 'document'),
 * })
 * ```
 */
export const BrazilianDocumentSchema = z.discriminatedUnion('documentType', [
  RGSchema,
  CPFSchema,
  CNSSchema,
  InsuranceCardSchema,
  UnknownSchema,
])

// =============================================================================
// Type Exports
// =============================================================================

/**
 * Inferred types from schemas for type-safe usage
 */
export type BrazilianDocument = z.infer<typeof BrazilianDocumentSchema>
export type RG = z.infer<typeof RGSchema>
export type CPF = z.infer<typeof CPFSchema>
export type CNS = z.infer<typeof CNSSchema>
export type InsuranceCard = z.infer<typeof InsuranceCardSchema>
export type Unknown = z.infer<typeof UnknownSchema>
