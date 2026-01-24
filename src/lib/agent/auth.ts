import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import type { AgentContext } from './types'

/**
 * Validates an API key against stored bcrypt hashes in the agents table.
 * Returns AgentContext on success, null on failure.
 *
 * Performance note: bcrypt comparison is intentionally slow (~100ms per comparison).
 * With few agents (<10), iterating through all is acceptable.
 * For many agents, consider adding a key prefix for lookup.
 *
 * @param apiKey - The plain API key from Authorization header
 * @returns AgentContext if valid, null if invalid
 */
export async function validateApiKey(
  apiKey: string
): Promise<AgentContext | null> {
  try {
    // Fetch all active agents
    const agents = await prisma.agent.findMany({
      where: { active: true },
      include: {
        user: {
          select: { id: true, role: true },
        },
      },
    })

    // Compare API key against each agent's hash
    for (const agent of agents) {
      const isValid = await bcrypt.compare(apiKey, agent.apiKeyHash)

      if (isValid) {
        // Generate correlation ID for this request
        const correlationId = crypto.randomUUID()

        return {
          agentId: agent.id,
          userId: agent.user.id,
          role: agent.user.role,
          correlationId,
        }
      }
    }

    // No matching agent found
    return null
  } catch (error) {
    // Log error but don't expose details (security)
    console.error('[API Key Validation Error]', error instanceof Error ? error.message : 'Unknown')
    return null
  }
}

/**
 * Extracts Bearer token from Authorization header.
 *
 * @param authHeader - The Authorization header value
 * @returns The token if valid Bearer format, null otherwise
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  if (!authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7).trim()
  return token.length > 0 ? token : null
}
