'use client'

import { useRouter } from 'next/navigation'
import { AlertDetail } from '@/components/alerts/alert-detail'
import { AlertWithRelations } from '@/lib/api/alerts'

interface AlertDetailClientProps {
  alert: AlertWithRelations
}

export function AlertDetailClient({ alert }: AlertDetailClientProps) {
  const router = useRouter()

  const handleStatusChange = () => {
    // Refresh the server component data after status change
    router.refresh()
  }

  return <AlertDetail alert={alert} onStatusChange={handleStatusChange} />
}
