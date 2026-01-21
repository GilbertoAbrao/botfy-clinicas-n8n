'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  value: number
  /** Optional additional className */
  className?: string
}

/**
 * ProgressBar Component
 *
 * Visual progress indicator for pre-checkin completion.
 * Color coding based on progress level:
 * - Blue: < 50% (just started)
 * - Yellow: 50-99% (in progress)
 * - Green: 100% (complete)
 *
 * Designed to work with calculateProgress() which returns 0, 33, 66, or 100.
 */
export function ProgressBar({ value, className }: ProgressBarProps) {
  // Ensure value is within valid range
  const normalizedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden min-w-[60px]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            normalizedValue === 100 && 'bg-green-500',
            normalizedValue >= 50 && normalizedValue < 100 && 'bg-yellow-500',
            normalizedValue < 50 && 'bg-blue-500'
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium min-w-[3ch] text-right">
        {normalizedValue}%
      </span>
    </div>
  )
}
