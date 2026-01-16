import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Supabase Health Check API Route
 *
 * Simple endpoint to verify database connectivity.
 * Used by service status component to check Supabase health.
 */
export async function GET() {
  try {
    // Simple query to test database connection
    // Use raw SQL for minimal overhead
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Health Check] Supabase connection failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
