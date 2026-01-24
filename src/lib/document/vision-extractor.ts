/**
 * GPT-4o Vision Document Extractor
 *
 * Uses OpenAI's GPT-4o Vision API with structured outputs to extract
 * data from Brazilian identity documents.
 *
 * Supports:
 * - RG (Registro Geral) - National ID
 * - CPF (Cadastro de Pessoa Fisica) - Tax ID
 * - CNS (Cartao Nacional de Saude) - Health Card
 * - Carteirinha de Convenio - Insurance Card
 */

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { BrazilianDocumentSchema } from '@/lib/validations/document-schemas'
import type { ExtractedDocument } from './document-types'

// =============================================================================
// OpenAI Client
// =============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// =============================================================================
// System Prompt
// =============================================================================

const SYSTEM_PROMPT = `You are a document processing assistant for a Brazilian medical clinic.

Extract structured data from Brazilian identity documents:
- RG (Registro Geral - National ID)
- CPF (Cadastro de Pessoas Físicas - Tax ID)
- CNS (Cartão Nacional de Saúde - Health Card)
- Carteirinha do Convênio (Insurance Card)

IMPORTANT RULES:
1. Extract ONLY what is visible in the image. Do NOT guess or infer missing data.
2. For dates, use YYYY-MM-DD format (e.g., 1985-03-15).
3. For document numbers, extract digits only (remove dots, dashes, slashes).
4. For RG numbers that end in 'X', keep the X (it's a valid check digit).
5. For CNS numbers, they MUST be 15 digits starting with 1, 2, or 7.
6. If you cannot determine the document type, return documentType: "UNKNOWN" with reason.

CONFIDENCE LEVELS:
- high: All required fields clearly visible and readable
- medium: Some fields unclear or low image quality
- low: Poor image quality or missing required fields

NEVER include patient PHI (names, IDs) in your reasoning. Only return the structured data.`

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extract structured fields from a document image using GPT-4o Vision
 *
 * @param imageBase64 - Base64-encoded image data (no data URL prefix)
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @returns Extracted document fields matching BrazilianDocumentSchema
 * @throws Error if extraction fails or is refused
 *
 * @example
 * ```typescript
 * const buffer = fs.readFileSync('document.jpg')
 * const base64 = buffer.toString('base64')
 * const result = await extractDocumentFields(base64, 'image/jpeg')
 * if (result.documentType === 'RG') {
 *   console.log(result.numeroRG)
 * }
 * ```
 */
export async function extractDocumentFields(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedDocument> {
  // Validate API key is present
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. Configure it in .env.local'
    )
  }

  try {
    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o-2024-08-06', // Required for structured outputs
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all fields from this Brazilian identity document:',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high', // Use high detail for document text
              },
            },
          ],
        },
      ],
      response_format: zodResponseFormat(
        BrazilianDocumentSchema,
        'document_extraction'
      ),
      max_tokens: 1000, // Sufficient for document fields
    })

    const message = completion.choices[0]?.message

    // Check for refusal (safety filter)
    if (message?.refusal) {
      throw new Error(`Document extraction refused: ${message.refusal}`)
    }

    // Get parsed result
    const extracted = message?.parsed
    if (!extracted) {
      throw new Error('Failed to extract document fields - no parsed response')
    }

    return extracted as ExtractedDocument
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error(
          'Invalid OpenAI API key. Check OPENAI_API_KEY in .env.local'
        )
      }
      if (error.status === 429) {
        throw new Error(
          'OpenAI rate limit exceeded. Please try again in a few moments.'
        )
      }
      if (error.status === 400) {
        throw new Error(
          `OpenAI request error: ${error.message}. Image may be too large or invalid.`
        )
      }
      throw new Error(`OpenAI API error: ${error.message}`)
    }

    // Re-throw other errors
    throw error
  }
}
