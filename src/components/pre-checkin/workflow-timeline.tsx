'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Timeline step interface for workflow progression
 */
export interface TimelineStep {
  label: string
  status: 'completed' | 'current' | 'pending'
  timestamp?: string | null
}

interface WorkflowTimelineProps {
  steps: TimelineStep[]
}

/**
 * WorkflowTimeline Component
 *
 * Displays a vertical timeline showing workflow progression with:
 * - Completed steps (green check)
 * - Current step (blue clock)
 * - Pending steps (gray X)
 * - Timestamps when available
 */
export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <div className="space-y-4 relative">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3 relative">
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)] bg-gray-200" />
          )}

          {/* Icon */}
          <div
            className={cn(
              'rounded-full p-1.5 border-2 z-10 bg-white',
              step.status === 'completed' && 'bg-green-100 border-green-500',
              step.status === 'current' && 'bg-blue-100 border-blue-500',
              step.status === 'pending' && 'bg-gray-100 border-gray-300'
            )}
          >
            {step.status === 'completed' && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {step.status === 'current' && (
              <Clock className="h-4 w-4 text-blue-600" />
            )}
            {step.status === 'pending' && (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <p
              className={cn(
                'font-medium text-sm',
                step.status === 'completed' && 'text-green-900',
                step.status === 'current' && 'text-blue-900',
                step.status === 'pending' && 'text-gray-500'
              )}
            >
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-xs text-gray-500 mt-0.5">
                {format(new Date(step.timestamp), "dd/MM/yyyy 'as' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
