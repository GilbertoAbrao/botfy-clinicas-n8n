import { z } from 'zod'
import { config } from '../config.js'
import { mcpLog } from '../logger.js'
import { recordRequest } from '../heartbeat.js'

// Input schema - accepts base64 file content
const inputSchema = z.object({
  pacienteId: z.number().describe('ID do paciente'),
  arquivo: z.string().describe('Conteúdo do arquivo em base64'),
  nomeArquivo: z.string().describe('Nome do arquivo com extensão (ex: documento.jpg)'),
  mimeType: z.string().optional().describe('MIME type do arquivo (ex: image/jpeg). Auto-detectado se não informado.'),
})

interface ProcessedDocument {
  documentType: string
  confidence: number
  extractedFields: Record<string, string | null>
  storageUrl: string
}

export const processarDocumentoTool = {
  name: 'processar_documento',
  title: 'Processar Documento',
  description: 'Processa documento enviado pelo paciente (RG, CPF, CNS, carteirinha). Extrai dados automaticamente usando visão computacional.',
  inputSchema,
  handler: async (input: z.infer<typeof inputSchema>) => {
    try {
      // Convert base64 to blob for multipart form data
      const base64Data = input.arquivo.replace(/^data:[^;]+;base64,/, '')
      const binaryData = Buffer.from(base64Data, 'base64')

      // Detect MIME type if not provided
      const mimeType = input.mimeType || detectMimeType(input.nomeArquivo)

      // Create FormData
      const formData = new FormData()
      formData.append('patientId', String(input.pacienteId))
      formData.append('file', new Blob([binaryData], { type: mimeType }), input.nomeArquivo)

      // Make request with multipart form data (no JSON Content-Type)
      const url = `${config.baseUrl}/api/agent/documentos/processar`

      mcpLog.debug(`HTTP POST ${url} (multipart)`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          // Note: Do NOT set Content-Type for FormData - browser/node sets it with boundary
        },
        body: formData,
      })

      const json = await response.json()

      if (!response.ok || !json.success) {
        recordRequest(false)
        throw new Error(json.error || `HTTP ${response.status}`)
      }

      recordRequest(true)
      const result = json.data as ProcessedDocument

      const summary = `Documento processado: ${result.documentType} (confiança: ${(result.confidence * 100).toFixed(0)}%)`
      const details = JSON.stringify(result, null, 2)

      return {
        content: [
          { type: 'text' as const, text: summary },
          { type: 'text' as const, text: `\n\nDetalhes:\n${details}` }
        ],
      }
    } catch (error) {
      recordRequest(false)
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'

      mcpLog.error(`Document processing error: ${errorMsg}`)

      return {
        content: [{
          type: 'text' as const,
          text: `Erro ao processar documento: ${errorMsg}`,
        }],
        isError: true,
      }
    }
  },
}

// Helper to detect MIME type from filename
function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
