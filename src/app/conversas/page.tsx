import { Suspense } from 'react'
import Link from 'next/link'
import { fetchConversations, getActiveConversationCount, type ChatStatus, type ConversationFilters } from '@/lib/api/conversations'
import { ConversationList } from '@/components/conversations/conversation-list'
import { ConversationListRealtime } from '@/components/conversations/conversation-list-realtime'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

type FilterValues = Partial<ConversationFilters>

interface PageProps {
  searchParams: Promise<{
    status?: string
    patientId?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function ConversationsPage({ searchParams }: PageProps) {
  // Check authentication (RBAC - all authenticated users can view conversations)
  const user = await getCurrentUserWithRole()

  if (!user) {
    redirect('/auth/login')
  }

  // Await searchParams (Next.js 15+ async searchParams)
  const params = await searchParams

  // Parse filters from URL query params
  const filters: Partial<FilterValues> = {}

  if (params.status && isValidChatStatus(params.status)) {
    filters.status = params.status as ChatStatus
  }

  if (params.patientId) {
    const patientIdNum = parseInt(params.patientId, 10)
    if (!isNaN(patientIdNum)) {
      filters.patientId = patientIdNum
    }
  }

  if (params.dateFrom) {
    const date = new Date(params.dateFrom)
    if (!isNaN(date.getTime())) {
      filters.dateFrom = date
    }
  }

  if (params.dateTo) {
    const date = new Date(params.dateTo)
    if (!isNaN(date.getTime())) {
      filters.dateTo = date
    }
  }

  // Fetch conversations with filters
  const conversations = await fetchConversations(filters)

  // Get active conversation count for header badge
  const activeCount = await getActiveConversationCount()

  // Log page view (fire-and-forget)
  logAudit({
    userId: user.id,
    action: AuditAction.VIEW_CONVERSATION,
    resource: 'conversations',
    details: { page: 'list', filters },
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        {/* Page header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Conversas</h1>
            {activeCount > 0 && (
              <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
                {activeCount} {activeCount === 1 ? 'ativa' : 'ativas'}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Todas as conversas do WhatsApp com status e histórico
          </p>
        </div>

        {/* Filter section */}
        <div className="flex gap-2">
          <Link href="/conversas?status=IA">
            <Button variant={filters.status === 'IA' ? 'default' : 'outline'} size="sm">
              IA
            </Button>
          </Link>
          <Link href="/conversas?status=HUMANO">
            <Button variant={filters.status === 'HUMANO' ? 'default' : 'outline'} size="sm">
              Humano
            </Button>
          </Link>
          <Link href="/conversas?status=FINALIZADO">
            <Button variant={filters.status === 'FINALIZADO' ? 'default' : 'outline'} size="sm">
              Finalizado
            </Button>
          </Link>
          <Link href="/conversas">
            <Button variant={!filters.status ? 'default' : 'outline'} size="sm">
              Todas
            </Button>
          </Link>
        </div>

        {/* Conversation list with real-time updates */}
        <div>
          <Suspense fallback={<ConversationList conversations={[]} loading />}>
            <ConversationListRealtime initialConversations={conversations} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Validation helper
function isValidChatStatus(value: string): boolean {
  const validStatuses: ChatStatus[] = ['IA', 'HUMANO', 'FINALIZADO']
  return validStatuses.includes(value as ChatStatus)
}
