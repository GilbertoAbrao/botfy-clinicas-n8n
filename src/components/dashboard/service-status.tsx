'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'not_configured'

interface ServiceInfo {
  name: string
  status: ServiceStatus
  lastChecked: Date
  responseTime?: number
  error?: string
}

/**
 * Service Status Component
 *
 * Shows health status of external services:
 * - Evolution API: WhatsApp message gateway
 * - N8N: Workflow automation
 * - Supabase: Database and auth
 *
 * Refreshes every 2 minutes automatically.
 * Compact view by default, expandable for details.
 */
export function ServiceStatus() {
  const [services, setServices] = useState<ServiceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const checkServices = async () => {
    setLoading(true)

    const checks = await Promise.all([
      checkEvolutionAPI(),
      checkN8N(),
      checkSupabase(),
    ])

    setServices(checks)
    setLoading(false)
  }

  useEffect(() => {
    // Initial check
    checkServices()

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      checkServices()
    }, 2 * 60 * 1000) // 2 minutes

    return () => clearInterval(interval)
  }, [])

  const handleRetry = () => {
    checkServices()
  }

  // Get badge color for status
  const getStatusColor = (status: ServiceStatus): string => {
    switch (status) {
      case 'operational':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'degraded':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      case 'down':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'not_configured':
        return 'bg-gray-400 hover:bg-gray-500 text-white'
      default:
        return 'bg-gray-400 hover:bg-gray-500 text-white'
    }
  }

  const getStatusLabel = (status: ServiceStatus): string => {
    switch (status) {
      case 'operational':
        return 'Operacional'
      case 'degraded':
        return 'Degradado'
      case 'down':
        return 'Indisponível'
      case 'not_configured':
        return 'Não Configurado'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Status dos Serviços</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && services.length === 0 ? (
          // Initial loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="space-y-2">
                {/* Compact view */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {service.name}
                  </span>
                  <Badge className={getStatusColor(service.status)}>
                    {getStatusLabel(service.status)}
                  </Badge>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="pl-4 text-xs text-gray-500 space-y-1">
                    <p>
                      Última verificação:{' '}
                      {formatDistanceToNow(service.lastChecked, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    {service.responseTime && (
                      <p>Tempo de resposta: {service.responseTime}ms</p>
                    )}
                    {service.error && (
                      <p className="text-red-600">Erro: {service.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Check Evolution API health
 */
async function checkEvolutionAPI(): Promise<ServiceInfo> {
  const baseUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL

  if (!baseUrl) {
    return {
      name: 'Evolution API',
      status: 'not_configured',
      lastChecked: new Date(),
    }
  }

  const startTime = Date.now()

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        name: 'Evolution API',
        status: 'operational',
        lastChecked: new Date(),
        responseTime,
      }
    } else {
      return {
        name: 'Evolution API',
        status: 'degraded',
        lastChecked: new Date(),
        error: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      name: 'Evolution API',
      status: 'down',
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Check N8N health
 */
async function checkN8N(): Promise<ServiceInfo> {
  const baseUrl = process.env.NEXT_PUBLIC_N8N_URL

  if (!baseUrl) {
    return {
      name: 'N8N',
      status: 'not_configured',
      lastChecked: new Date(),
    }
  }

  const startTime = Date.now()

  try {
    const response = await fetch(`${baseUrl}/healthz`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        name: 'N8N',
        status: 'operational',
        lastChecked: new Date(),
        responseTime,
      }
    } else {
      return {
        name: 'N8N',
        status: 'degraded',
        lastChecked: new Date(),
        error: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      name: 'N8N',
      status: 'down',
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

/**
 * Check Supabase connection
 * Simple test query to verify database is reachable
 */
async function checkSupabase(): Promise<ServiceInfo> {
  const startTime = Date.now()

  try {
    // Simple health check: fetch from API route
    const response = await fetch('/api/health/supabase', {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        name: 'Supabase',
        status: 'operational',
        lastChecked: new Date(),
        responseTime,
      }
    } else {
      return {
        name: 'Supabase',
        status: 'degraded',
        lastChecked: new Date(),
        error: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      name: 'Supabase',
      status: 'down',
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
