import { Suspense } from 'react'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CalendarView } from '@/components/calendar/calendar-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default async function AgendaPage() {
  // Check authentication
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          </div>
          <p className="text-gray-600">
            Visualize e gerencie todos os agendamentos da clínica
          </p>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendário de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Carregando agenda...</div>}>
              <CalendarView />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
