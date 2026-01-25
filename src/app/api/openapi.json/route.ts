import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/openapi/spec'

/**
 * GET /api/openapi.json - Raw OpenAPI Specification
 * Returns the OpenAPI 3.0 spec as JSON for importing into Postman, Insomnia, etc.
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
