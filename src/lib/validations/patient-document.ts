import { z } from 'zod'

// Document type enum (from database documentos_paciente table)
export const DOCUMENT_TYPES = ['rg', 'cnh', 'carteirinha_convenio', 'guia_autorizacao', 'comprovante_residencia', 'outros'] as const
export type DocumentType = typeof DOCUMENT_TYPES[number]

// Document type labels in Portuguese
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  rg: 'RG',
  cnh: 'CNH',
  carteirinha_convenio: 'Carteirinha Convênio',
  guia_autorizacao: 'Guia de Autorização',
  comprovante_residencia: 'Comprovante de Residência',
  outros: 'Outros',
}

// Document status (derived from validado boolean: null=pendente, true=aprovado, false=rejeitado)
export const DOCUMENT_STATUS = ['pendente', 'aprovado', 'rejeitado'] as const
export type DocumentStatus = typeof DOCUMENT_STATUS[number]

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  pendente: 'yellow',
  aprovado: 'green',
  rejeitado: 'red',
}

/**
 * Compute document status from validado boolean field.
 * Database stores: null = pending, true = approved, false = rejected
 */
export function getDocumentStatus(validado: boolean | null): DocumentStatus {
  if (validado === null) return 'pendente'
  return validado ? 'aprovado' : 'rejeitado'
}

// PatientDocument interface (matching Supabase documentos_paciente table + joins)
export interface PatientDocument {
  id: string
  pre_checkin_id: number | null
  paciente_id: number
  tipo: DocumentType
  arquivo_url: string | null
  arquivo_path: string
  dados_extraidos: Record<string, unknown> | null
  confianca_extracao: number | null
  validado: boolean | null
  validado_por: string | null
  observacoes: string | null
  created_at: string
  // Joined data
  paciente: {
    id: number
    nome: string
    telefone: string
  } | null
}

// Filters for patient document list queries
export interface PatientDocumentFilters {
  status?: DocumentStatus
  tipo?: DocumentType
  dateStart?: string // ISO date string
  dateEnd?: string   // ISO date string
  search?: string    // patient name
  page?: number
  limit?: number
}

// Query params validation schema
export const patientDocumentFiltersSchema = z.object({
  status: z.enum(DOCUMENT_STATUS).optional(),
  tipo: z.enum(DOCUMENT_TYPES).optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export type PatientDocumentFiltersQuery = z.infer<typeof patientDocumentFiltersSchema>

// Schema for approve document action
export const approveDocumentSchema = z.object({
  observacoes: z.string().optional(),
})

export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>

// Schema for reject document action (observacoes required)
export const rejectDocumentSchema = z.object({
  observacoes: z.string().min(5, 'Motivo da rejeição é obrigatório (min 5 caracteres)'),
})

export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>

// Schema for bulk document actions
export const bulkDocumentActionSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um documento'),
  observacoes: z.string().optional(),
})

export type BulkDocumentActionInput = z.infer<typeof bulkDocumentActionSchema>
