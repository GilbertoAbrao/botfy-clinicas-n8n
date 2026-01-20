import { redirect } from 'next/navigation'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default async function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/login')
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
