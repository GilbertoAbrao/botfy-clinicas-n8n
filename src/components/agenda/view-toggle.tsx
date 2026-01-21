'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CalendarDays, List } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'calendar' | 'list'
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const searchParams = useSearchParams()

  // Build URL that preserves all existing search params except view
  const buildURL = (view: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    return `/agenda?${params.toString()}`
  }

  return (
    <div className="flex gap-2">
      <Link href={buildURL('calendar')}>
        <Button
          variant={currentView === 'calendar' ? 'default' : 'outline'}
          size="sm"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Calendário
        </Button>
      </Link>
      <Link href={buildURL('list')}>
        <Button
          variant={currentView === 'list' ? 'default' : 'outline'}
          size="sm"
        >
          <List className="h-4 w-4 mr-2" />
          Lista
        </Button>
      </Link>
    </div>
  )
}
