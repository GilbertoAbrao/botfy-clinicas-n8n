/**
 * Document Processing Type Definitions
 *
 * Type definitions for Brazilian document extraction and processing.
 * Used with GPT-4o Vision API for structured data extraction.
 */

// =============================================================================
// Document Types
// =============================================================================

/**
 * Discriminator for document types supported by the system
 */
export type DocumentType = 'RG' | 'CPF' | 'CNS' | 'CARTEIRINHA_CONVENIO' | 'UNKNOWN'

/**
 * Confidence level for extracted data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Base interface for all extracted documents
 */
export interface BaseDocument {
  documentType: DocumentType
  confidence: ConfidenceLevel
  rawText?: string // Optional: raw OCR text for debugging
}

// =============================================================================
// Brazilian Document Interfaces
// =============================================================================

/**
 * RG (Registro Geral) - Brazilian National ID
 */
export interface RGDocument extends BaseDocument {
  documentType: 'RG'
  numeroRG: string // 8-9 digits, may end in X
  nome: string // Full name
  dataNascimento: string // YYYY-MM-DD
  nomePai?: string // Father's name (optional)
  nomeMae?: string // Mother's name (optional)
  naturalidade?: string // Place of birth
  orgaoEmissor?: string // Issuing authority (e.g., SSP-SP)
  dataEmissao?: string // Issue date YYYY-MM-DD
}

/**
 * CPF (Cadastro de Pessoa Fisica) - Brazilian Tax ID
 */
export interface CPFDocument extends BaseDocument {
  documentType: 'CPF'
  numeroCPF: string // 11 digits (no formatting)
  nome: string
  dataNascimento: string // YYYY-MM-DD
}

/**
 * CNS (Cartao Nacional de Saude) - National Health Card
 */
export interface CNSDocument extends BaseDocument {
  documentType: 'CNS'
  numeroCNS: string // 15 digits starting with 1, 2, or 7
  nome: string
}

/**
 * Carteirinha de Convenio - Health Insurance Card
 */
export interface InsuranceCardDocument extends BaseDocument {
  documentType: 'CARTEIRINHA_CONVENIO'
  numeroCarteirinha: string
  nomeConvenio: string // Insurance company name
  nomeTitular: string // Cardholder name
  validadeAte?: string // Expiration date YYYY-MM-DD
}

/**
 * Unknown Document - When type cannot be determined
 */
export interface UnknownDocument extends BaseDocument {
  documentType: 'UNKNOWN'
  reason: string // Why detection failed
}

// =============================================================================
// Union Types
// =============================================================================

/**
 * Discriminated union of all document types
 */
export type ExtractedDocument =
  | RGDocument
  | CPFDocument
  | CNSDocument
  | InsuranceCardDocument
  | UnknownDocument

// =============================================================================
// Processing Result
// =============================================================================

/**
 * Full result of document processing operation
 */
export interface ProcessDocumentResult {
  extracted: ExtractedDocument
  storagePath: string // Supabase Storage path
  originalFilename: string
  mimeType: string
  fileSize: number
  processedAt: string // ISO 8601
}
