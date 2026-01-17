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

interface PriorityData {
  score: number
  explanation: string
  factors: {
    typeWeight: number
    ageWeight: number
    patientHistoryWeight: number
    appointmentProximityWeight: number
  }
}

interface AlertPriorityBadgeProps {
  alertId: string
  className?: string
}

/**
 * Alert Priority Badge Component
 *
 * Displays a color-coded badge showing the calculated priority score (1-100)
 * for an alert. Fetches the priority from the analytics API and shows
 * a tooltip with the explanation on hover.
 *
 * Color coding:
 * - 80-100: Red (urgent)
 * - 50-79: Yellow (high attention)
 * - 0-49: Green (low priority)
 */
export function AlertPriorityBadge({ alertId, className }: AlertPriorityBadgeProps) {
  const [priority, setPriority] = useState<PriorityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true

    const fetchPriority = async () => {
      try {
        const response = await fetch(`/api/analytics/alerts/${alertId}/priority`)

        if (!response.ok) {
          throw new Error('Failed to fetch priority')
        }

        const data: PriorityData = await response.json()

        if (isMounted) {
          setPriority(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('[AlertPriorityBadge] Error fetching priority:', err)
        if (isMounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchPriority()

    return () => {
      isMounted = false
    }
  }, [alertId])

  // Loading state: small skeleton pill
  if (loading) {
    return <Skeleton className={cn('h-5 w-8 rounded-full', className)} />
  }

  // Error state: don't show badge
  if (error || !priority) {
    return null
  }

  // Determine color based on score
  const getColorClass = (score: number): string => {
    if (score >= 80) {
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    }
    if (score >= 50) {
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    }
    return 'bg-green-100 text-green-800 hover:bg-green-200'
  }

  const colorClass = getColorClass(priority.score)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              'cursor-help font-mono text-xs px-2 py-0.5',
              colorClass,
              className
            )}
          >
            {priority.score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 text-white">
          <p className="text-sm">{priority.explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
