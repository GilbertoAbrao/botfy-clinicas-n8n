'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  User,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Types of patterns that can be detected
 */
export type PatternType =
  | 'time_slot_noshow'
  | 'provider_failure'
  | 'alert_type_spike'
  | 'day_of_week'

/**
 * Severity levels for detected patterns
 */
export type PatternSeverity = 'info' | 'warning' | 'critical'

/**
 * A detected pattern in the data
 */
export interface Pattern {
  type: PatternType
  description: string
  count: number
  severity: PatternSeverity
  metadata: Record<string, unknown>
}

/**
 * Props for InsightsPanel component
 */
export interface InsightsPanelProps {
  patterns: Pattern[]
  loading?: boolean
}

/**
 * Get icon component for pattern type
 */
function getPatternIcon(type: PatternType) {
  switch (type) {
    case 'time_slot_noshow':
      return Clock
    case 'provider_failure':
      return User
    case 'alert_type_spike':
      return AlertTriangle
    case 'day_of_week':
      return Calendar
    default:
      return Lightbulb
  }
}

/**
 * Get severity badge variant and colors
 */
function getSeverityStyles(severity: PatternSeverity): {
  badgeClass: string
  iconClass: string
  label: string
} {
  switch (severity) {
    case 'critical':
      return {
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        iconClass: 'text-red-500',
        label: 'Critico',
      }
    case 'warning':
      return {
        badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        iconClass: 'text-yellow-500',
        label: 'Atencao',
      }
    case 'info':
    default:
      return {
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        iconClass: 'text-blue-500',
        label: 'Info',
      }
  }
}

/**
 * Loading skeleton for InsightsPanel
 */
function InsightsPanelSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Insights</CardTitle>
        <Lightbulb className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Individual pattern item component
 */
function PatternItem({ pattern }: { pattern: Pattern }) {
  const Icon = getPatternIcon(pattern.type)
  const styles = getSeverityStyles(pattern.severity)

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={cn('mt-0.5', styles.iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-tight">{pattern.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge className={cn('text-xs', styles.badgeClass)}>{styles.label}</Badge>
          <span className="text-xs text-gray-500">
            {pattern.count} {pattern.count === 1 ? 'ocorrencia' : 'ocorrencias'}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * InsightsPanel Component
 *
 * Displays detected patterns from the pattern-detector algorithm.
 * Shows patterns with severity badges, icons, and expandable list.
 *
 * Features:
 * - Severity color coding (critical=red, warning=yellow, info=blue)
 * - Icons per pattern type
 * - Expandable list (shows 5 by default)
 * - Loading skeleton state
 * - Empty state
 */
export function InsightsPanel({ patterns, loading = false }: InsightsPanelProps) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return <InsightsPanelSkeleton />
  }

  const visiblePatterns = expanded ? patterns : patterns.slice(0, 5)
  const hasMore = patterns.length > 5

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Insights</CardTitle>
        <Lightbulb className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <div className="text-center py-6">
            <Lightbulb className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum padrao detectado</p>
            <p className="text-xs text-gray-400 mt-1">
              Os padroes serao exibidos quando houver dados suficientes
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {visiblePatterns.map((pattern, index) => (
              <PatternItem key={`${pattern.type}-${index}`} pattern={pattern} />
            ))}

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 text-gray-600 hover:text-gray-900"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver mais ({patterns.length - 5})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
