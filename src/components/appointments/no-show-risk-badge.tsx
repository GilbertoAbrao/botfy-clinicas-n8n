'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

type RiskLevel = 'high' | 'medium' | 'low'

interface RiskData {
  appointmentId: string
  riskLevel: RiskLevel
  riskScore: number
  factors: {
    historicalNoShowRate: number
    timeOfDayRisk: number
    dayOfWeekRisk: number
    leadTimeRisk: number
    confirmationRisk: number
  }
  recommendations: string[]
}

interface NoShowRiskBadgeProps {
  appointmentId: string
  className?: string
}

/**
 * No-Show Risk Badge Component
 *
 * Displays a color-coded badge showing the no-show risk level
 * for an appointment. Fetches the risk prediction from the analytics API
 * and shows recommendations in a tooltip on hover.
 *
 * Risk levels:
 * - high: Red badge with "Alto" text
 * - medium: Yellow badge with "Médio" text
 * - low: Green badge with "Baixo" text
 */
export function NoShowRiskBadge({ appointmentId, className }: NoShowRiskBadgeProps) {
  const [risk, setRisk] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true

    const fetchRisk = async () => {
      try {
        const response = await fetch(`/api/analytics/appointments/${appointmentId}/risk`)

        if (!response.ok) {
          throw new Error('Failed to fetch risk')
        }

        const data: RiskData = await response.json()

        if (isMounted) {
          setRisk(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('[NoShowRiskBadge] Error fetching risk:', err)
        if (isMounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchRisk()

    return () => {
      isMounted = false
    }
  }, [appointmentId])

  // Loading state: small skeleton pill
  if (loading) {
    return <Skeleton className={cn('h-5 w-14 rounded-full', className)} />
  }

  // Error state: don't show badge (don't block appointment display)
  if (error || !risk) {
    return null
  }

  // Risk level text in Portuguese
  const levelText: Record<RiskLevel, string> = {
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo',
  }

  // Color classes based on risk level
  const colorClasses: Record<RiskLevel, string> = {
    high: 'bg-red-100 text-red-800 hover:bg-red-200',
    medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    low: 'bg-green-100 text-green-800 hover:bg-green-200',
  }

  const colorClass = colorClasses[risk.riskLevel]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              'cursor-help text-xs px-2 py-0.5 flex items-center gap-1',
              colorClass,
              className
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {levelText[risk.riskLevel]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 text-white p-3">
          <div className="space-y-2">
            <p className="font-medium">Risco de não comparecimento</p>
            <p className="text-xs text-gray-300">
              Score: {risk.riskScore}/100
            </p>
            {risk.recommendations.length > 0 && (
              <ul className="text-xs list-disc pl-4 space-y-1">
                {risk.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
