import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Result of checking an idempotency key.
 */
export interface IdempotencyCheckResult {
  /** True if this is a new request, false if cached */
  isNew: boolean
  /** Stored response if not new */
  storedResponse?: unknown
}

/**
 * Check if an idempotency key exists and matches the request hash.
 *
 * @param key - Client-provided UUID idempotency key
 * @param requestHash - SHA-256 hash of the request body
 * @returns Result indicating if request is new or cached
 * @throws Error if key exists but hash doesn't match (key reuse with different body)
 */
export async function checkIdempotencyKey(
  key: string,
  requestHash: string
): Promise<IdempotencyCheckResult> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key },
  })

  // New request - no existing key
  if (!existing) {
    return { isNew: true }
  }

  // Check if expired (should be cleaned up, but handle gracefully)
  if (existing.expiresAt < new Date()) {
    // Delete expired key and treat as new
    await prisma.idempotencyKey.delete({ where: { key } })
    return { isNew: true }
  }

  // Key exists - verify hash matches
  if (existing.requestHash !== requestHash) {
    throw new Error('Idempotency key reused with different request body')
  }

  // Hash matches - return cached response
  return {
    isNew: false,
    storedResponse: existing.response,
  }
}

/**
 * Store the result of a successful request for future idempotency checks.
 *
 * @param key - Client-provided UUID idempotency key
 * @param requestHash - SHA-256 hash of the request body
 * @param response - The successful response to cache
 */
export async function storeIdempotencyResult(
  key: string,
  requestHash: string,
  response: unknown
): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.idempotencyKey.create({
    data: {
      key,
      requestHash,
      response: response as object,
      expiresAt,
    },
  })
}

/**
 * Create a SHA-256 hash of a request body for idempotency comparison.
 *
 * @param body - Request body to hash
 * @returns SHA-256 hex digest
 */
export function hashRequestBody(body: unknown): string {
  const json = JSON.stringify(body)
  return createHash('sha256').update(json).digest('hex')
}

/**
 * Delete expired idempotency keys.
 * Called periodically by a cron job to prevent table growth.
 *
 * @returns Number of keys deleted
 */
export async function cleanupExpiredKeys(): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  return result.count
}
