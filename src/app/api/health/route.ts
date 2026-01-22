import { NextResponse } from 'next/server'

/**
 * Simple health check endpoint for Docker/EasyPanel monitoring.
 * Returns 200 OK if the application is running.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.2.0',
    },
    { status: 200 }
  )
}
