/**
 * URL-based Image Fetcher
 *
 * Secure image fetching from URLs for document processing.
 * Implements SSRF protection and size limits.
 *
 * Security features:
 * - HTTPS-only URLs
 * - Private network IP blocking
 * - Size limit enforcement (reuses MAX_FILE_SIZE)
 * - Request timeout (10 seconds)
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { MAX_FILE_SIZE } from './document-validator'

// =============================================================================
// Constants
// =============================================================================

/**
 * Timeout for URL fetches (10 seconds)
 */
const FETCH_TIMEOUT_MS = 10000

/**
 * Private IP ranges to block (SSRF protection)
 */
const PRIVATE_IP_RANGES = [
  /^127\./,           // 127.0.0.0/8 (loopback)
  /^10\./,            // 10.0.0.0/8 (private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (private)
  /^192\.168\./,      // 192.168.0.0/16 (private)
  /^169\.254\./,      // 169.254.0.0/16 (link-local)
  /^::1$/,            // ::1 (IPv6 loopback)
  /^fc00:/,           // fc00::/7 (IPv6 private)
  /^fe80:/,           // fe80::/10 (IPv6 link-local)
]

/**
 * Private/internal hostnames to block
 */
const PRIVATE_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
  'metadata.google.internal',  // GCP metadata
  '169.254.169.254',            // AWS/Azure metadata
]

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates that a URL is safe to fetch (SSRF protection)
 *
 * @param url - URL string to validate
 * @returns Parsed URL object if valid
 * @throws Error if URL is unsafe
 *
 * @example
 * ```typescript
 * const url = validateImageUrl('https://example.com/image.png') // OK
 * validateImageUrl('http://localhost/image.png')  // throws
 * validateImageUrl('https://127.0.0.1/image.png') // throws
 * ```
 */
export function validateImageUrl(url: string): URL {
  // 1. Parse URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error('Invalid URL format')
  }

  // 2. Only allow HTTPS protocol
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed')
  }

  // 3. Block private/internal hostnames
  const hostname = parsedUrl.hostname.toLowerCase()
  if (PRIVATE_HOSTNAMES.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
    throw new Error('Private network URLs are not allowed')
  }

  // 4. Block .local domains
  if (hostname.endsWith('.local')) {
    throw new Error('Private network URLs are not allowed')
  }

  // 5. Block private IP ranges
  // Check if hostname is an IP address (IPv4 or IPv6)
  const isIpAddress = /^[\d.:]+$/.test(hostname)
  if (isIpAddress) {
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        throw new Error('Private network URLs are not allowed')
      }
    }
  }

  return parsedUrl
}

// =============================================================================
// Fetching
// =============================================================================

/**
 * Result of successful URL fetch
 */
export interface FetchedImage {
  buffer: Buffer
  filename: string
  contentType: string
}

/**
 * Fetches an image from a URL with security controls
 *
 * @param url - HTTPS URL to fetch image from
 * @returns Image buffer, filename, and content type
 * @throws Error if fetch fails, times out, or exceeds size limit
 *
 * @example
 * ```typescript
 * const { buffer, filename, contentType } = await fetchImageFromUrl(
 *   'https://example.com/documents/rg-123.jpg'
 * )
 * // buffer: <Buffer ...>, filename: 'rg-123.jpg', contentType: 'image/jpeg'
 * ```
 */
export async function fetchImageFromUrl(url: string): Promise<FetchedImage> {
  // 1. Validate URL first
  const parsedUrl = validateImageUrl(url)

  // 2. Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    // 3. Fetch with timeout
    const response = await fetch(parsedUrl.href, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,application/pdf',
        'User-Agent': 'Botfy-ClinicOps/1.0',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // 4. Check Content-Length header before downloading
    const contentLength = response.headers.get('Content-Length')
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      throw new Error(`Remote file size (${contentLength} bytes) exceeds 5MB limit`)
    }

    // 5. Read response body
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 6. Verify actual size after download (in case Content-Length was missing)
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Downloaded file size (${buffer.length} bytes) exceeds 5MB limit`)
    }

    // 7. Extract filename from URL path
    const pathname = parsedUrl.pathname
    const pathParts = pathname.split('/').filter(Boolean)
    const filename = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'document'

    // 8. Get Content-Type
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

    return {
      buffer,
      filename,
      contentType,
    }
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: URL fetch exceeded ${FETCH_TIMEOUT_MS / 1000} seconds`)
    }

    // Re-throw validation errors and other errors
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
