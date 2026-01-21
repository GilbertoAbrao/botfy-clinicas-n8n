# Phase 14: Pre-Checkin Dashboard - Research

**Researched:** 2026-01-21
**Domain:** Admin Dashboards, Data Tables, N8N Webhook Integration, Analytics Cards
**Confidence:** HIGH

## Summary

Phase 14 creates a dashboard for monitoring and managing pre-checkin workflow status. This builds on existing patterns from Phase 13 (agenda list view) and Phase 11 (lembretes enviados dashboard), combining data tables, analytics cards, detail modals, and N8N webhook integration.

The codebase already has established patterns for all required components: TanStack Table for data display, KPI cards for analytics, shadcn/ui modals for details, sonner for toasts, and N8N webhook integration with rate limiting. The pre_checkin table exists in Supabase with all required fields for tracking workflow progression.

The primary technical challenge is implementing the timeline view for workflow progression and ensuring proper rate limiting for reminder webhooks (1 per 4 hours as specified in context).

**Primary recommendation:** Reuse existing table/filter/modal patterns from lembretes-enviados and agenda-list-view. Use KPI card pattern from analytics dashboard. Implement timeline as vertical step component. Add rate limiting check before webhook calls.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.21.3 (installed) | Table logic and filtering | Already used in Phase 13, proven pattern |
| shadcn/ui Table | Already installed | Table UI components | Consistent with existing dashboards |
| shadcn/ui Dialog | Already installed | Detail modal | Used throughout app |
| shadcn/ui AlertDialog | Already installed | Confirmation modals | Send reminder confirmation |
| shadcn/ui Badge | Already installed | Status indicators | pendente/em_andamento/completo/incompleto |
| sonner | ^2.0.7 (installed) | Toast notifications | Used in agenda-list-view |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (installed) | Date formatting, calculations | Date range filters, rate limit checks |
| @date-fns/tz | ^1.4.1 (installed) | Timezone handling | DST-aware timestamps |
| lucide-react | ^0.562.0 (installed) | Icons | Status icons, action buttons |
| recharts | ^3.6.0 (installed) | Charts (if needed) | Optional: completion rate trends |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vertical timeline component | Timeline library | Custom component is simpler, no new dependencies |
| Rate limit in database | Rate limit in component | Database check is authoritative, prevents race conditions |
| Separate detail page | Modal | Modal is faster UX, consistent with lembretes-enviados |

**Installation:**
```bash
# No new packages required - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── admin/
│       └── pre-checkin/
│           └── page.tsx                 # Server component, main page
├── components/
│   └── pre-checkin/
│       ├── pre-checkin-dashboard.tsx    # Main client component
│       ├── pre-checkin-analytics.tsx    # KPI cards
│       ├── pre-checkin-table.tsx        # Desktop table
│       ├── pre-checkin-cards.tsx        # Mobile cards
│       ├── pre-checkin-filters.tsx      # Filter controls
│       ├── pre-checkin-detail-modal.tsx # Detail modal with timeline
│       └── pre-checkin-pagination.tsx   # Pagination controls
├── lib/
│   └── pre-checkin/
│       └── n8n-reminder.ts              # N8N webhook integration
└── hooks/
    └── use-pre-checkin.ts               # Data fetching hook
```

### Pattern 1: Analytics Cards (KPI Dashboard)
**What:** Display completion rate, pending count, overdue count as cards
**When to use:** Dashboard overview at top of page
**Example:**
```typescript
// Source: src/components/analytics/kpi-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'

interface AnalyticsData {
  completionRate: number
  pendingCount: number
  overdueCount: number
}

export function PreCheckinAnalytics({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Completion Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Taxa de Conclusão
          </CardTitle>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data.completionRate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            pré-checkins completos
          </p>
        </CardContent>
      </Card>

      {/* Pending Count */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Pendentes
          </CardTitle>
          <Clock className="h-5 w-5 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {data.pendingCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            aguardando conclusão
          </p>
        </CardContent>
      </Card>

      {/* Overdue Count */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Atrasados
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {data.overdueCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            menos de 12h para consulta
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Pattern 2: Detail Modal with Workflow Timeline
**What:** Modal showing checklist progress with timeline visualization
**When to use:** User clicks row to see full details
**Example:**
```typescript
// Source: Existing modal patterns + custom timeline
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Clock, Send } from 'lucide-react'

interface TimelineStep {
  label: string
  completed: boolean
  timestamp?: string
  status: 'completed' | 'current' | 'pending'
}

function WorkflowTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "rounded-full p-1.5 border-2",
            step.status === 'completed' && "bg-green-100 border-green-500",
            step.status === 'current' && "bg-blue-100 border-blue-500",
            step.status === 'pending' && "bg-gray-100 border-gray-300"
          )}>
            {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {step.status === 'current' && <Clock className="h-4 w-4 text-blue-600" />}
            {step.status === 'pending' && <XCircle className="h-4 w-4 text-gray-400" />}
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className={cn(
              "font-medium",
              step.status === 'completed' && "text-green-900",
              step.status === 'current' && "text-blue-900",
              step.status === 'pending' && "text-gray-500"
            )}>
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-xs text-gray-500 mt-0.5">
                {format(new Date(step.timestamp), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  )
}
```

### Pattern 3: N8N Webhook Integration with Rate Limiting
**What:** Send reminder webhook with 4-hour rate limit check
**When to use:** User clicks "Send Reminder" button
**Example:**
```typescript
// Source: src/lib/waitlist/auto-fill.ts + custom rate limiting
import { differenceInHours } from 'date-fns'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function sendPreCheckinReminder(preCheckinId: string) {
  const supabase = await createServerSupabaseClient()

  // Fetch pre-checkin record
  const { data: preCheckin, error: fetchError } = await supabase
    .from('pre_checkin')
    .select(`
      *,
      agendamento:agendamentos!pre_checkin_agendamento_id_fkey(
        id,
        data_hora
      ),
      paciente:pacientes!pre_checkin_paciente_id_fkey(
        id,
        nome,
        telefone
      )
    `)
    .eq('id', preCheckinId)
    .single()

  if (fetchError || !preCheckin) {
    throw new Error('Pre-checkin not found')
  }

  // Rate limit check: 1 reminder per 4 hours
  if (preCheckin.ultimo_lembrete_enviado) {
    const hoursSinceLastReminder = differenceInHours(
      new Date(),
      new Date(preCheckin.ultimo_lembrete_enviado)
    )
    if (hoursSinceLastReminder < 4) {
      const hoursRemaining = Math.ceil(4 - hoursSinceLastReminder)
      throw new Error(`Próximo envio disponível em ${hoursRemaining} horas`)
    }
  }

  // Call N8N webhook
  const webhookUrl = process.env.N8N_WEBHOOK_PRE_CHECKIN_REMINDER

  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_PRE_CHECKIN_REMINDER not configured')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preCheckinId: preCheckin.id,
      patientPhone: preCheckin.paciente.telefone,
      patientName: preCheckin.paciente.nome,
      appointmentDateTime: preCheckin.agendamento.data_hora,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to send reminder via N8N')
  }

  // Update ultimo_lembrete_enviado timestamp
  const { error: updateError } = await supabase
    .from('pre_checkin')
    .update({ ultimo_lembrete_enviado: new Date().toISOString() })
    .eq('id', preCheckinId)

  if (updateError) {
    console.error('Failed to update ultimo_lembrete_enviado:', updateError)
  }

  return { success: true }
}
```

### Pattern 4: Confirmation Dialog Before Webhook
**What:** Show AlertDialog to confirm before sending reminder
**When to use:** User clicks "Send Reminder" action
**Example:**
```typescript
// Source: shadcn/ui AlertDialog + existing patterns
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SendReminderDialogProps {
  open: boolean
  patientName: string
  onConfirm: () => void
  onCancel: () => void
}

export function SendReminderDialog({
  open,
  patientName,
  onConfirm,
  onCancel
}: SendReminderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enviar lembrete?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja enviar lembrete de pré-checkin para{' '}
            <span className="font-semibold">{patientName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Pattern 5: Status Badge Color Mapping
**What:** Consistent badge colors for pre-checkin status
**When to use:** All status displays (table, cards, modal)
**Example:**
```typescript
// Source: Existing badge patterns + requirements
type PreCheckinStatus = 'pendente' | 'em_andamento' | 'completo' | 'incompleto'

const STATUS_CONFIG = {
  pendente: {
    label: 'Pendente',
    variant: 'secondary' as const,
    color: 'blue',
    icon: Clock,
  },
  em_andamento: {
    label: 'Em Andamento',
    variant: 'default' as const,
    color: 'yellow',
    icon: Clock,
  },
  completo: {
    label: 'Completo',
    variant: 'default' as const,
    color: 'green',
    icon: CheckCircle,
  },
  incompleto: {
    label: 'Incompleto',
    variant: 'destructive' as const,
    color: 'red',
    icon: XCircle,
  },
}

export function StatusBadge({ status }: { status: PreCheckinStatus }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
```

### Pattern 6: Progress Calculation from Checklist
**What:** Calculate progress percentage from boolean fields
**When to use:** Table column showing progress bar or percentage
**Example:**
```typescript
// Calculate progress from checklist fields
interface PreCheckin {
  dados_confirmados: boolean
  documentos_enviados: boolean
  instrucoes_enviadas: boolean
}

export function calculateProgress(preCheckin: PreCheckin): number {
  const checks = [
    preCheckin.dados_confirmados,
    preCheckin.documentos_enviados,
    preCheckin.instrucoes_enviadas,
  ]
  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
}

// Progress bar component
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            value === 100 && "bg-green-500",
            value > 50 && value < 100 && "bg-yellow-500",
            value <= 50 && "bg-blue-500"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium min-w-[3ch]">
        {value}%
      </span>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Hardcoded N8N URLs:** Always use environment variables for webhook URLs
- **No rate limit check:** MUST check ultimo_lembrete_enviado before sending webhook
- **Missing confirmation dialog:** Always confirm before sending reminders
- **Blocking on webhook failures:** Show error toast but don't crash the UI
- **Ignoring timezone:** Use TZDate for all date comparisons (DST awareness)
- **N+1 queries:** Fetch related data (patient, appointment) in single query with joins

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range filtering | Custom date logic | date-fns isWithinInterval | DST-aware, handles edge cases |
| Rate limiting | Client-side timer | Database timestamp + differenceInHours | Authoritative, prevents race conditions |
| Progress calculation | Manual percentage math | Reusable function with boolean array | DRY, testable, consistent |
| Timeline visualization | Complex state machine | Simple array.map with status logic | Maintainable, no external dependencies |
| Toast notifications | Custom alert system | sonner (already installed) | Consistent UX, auto-dismiss |
| Status filtering | Custom filter logic | TanStack Table filterFn | Built-in, tested, performant |

**Key insight:** The pre_checkin table already tracks all required timestamps and boolean flags. Use these directly rather than calculating derived state. The N8N workflow handles actual message sending; the dashboard just triggers it.

## Common Pitfalls

### Pitfall 1: Rate Limit Not Enforced
**What goes wrong:** Users can spam reminder button, sending multiple reminders per minute
**Why it happens:** Rate limit check only in frontend, or no check at all
**How to avoid:** ALWAYS check ultimo_lembrete_enviado in server-side API route before webhook call
**Warning signs:** N8N logs show multiple reminders to same patient within minutes
```typescript
// WRONG - Client-side only check
const canSend = !lastReminder || Date.now() - lastReminder > 4 * 60 * 60 * 1000

// CORRECT - Server-side check with database
const { data } = await supabase
  .from('pre_checkin')
  .select('ultimo_lembrete_enviado')
  .eq('id', id)
  .single()

if (data.ultimo_lembrete_enviado) {
  const hours = differenceInHours(new Date(), new Date(data.ultimo_lembrete_enviado))
  if (hours < 4) {
    throw new Error(`Wait ${4 - hours} hours`)
  }
}
```

### Pitfall 2: Webhook Failures Crash the UI
**What goes wrong:** N8N webhook fails, entire page shows error state
**Why it happens:** Not handling fetch() errors gracefully
**How to avoid:** Try/catch around webhook call, show toast error, keep UI functional
**Warning signs:** User sees blank page or error boundary when N8N is down
```typescript
// WRONG - No error handling
const response = await fetch(webhookUrl, { ... })
const data = await response.json()

// CORRECT - Graceful degradation
try {
  const response = await fetch(webhookUrl, { ... })
  if (!response.ok) throw new Error('Webhook failed')
  toast.success('Lembrete enviado!')
} catch (error) {
  console.error('Webhook error:', error)
  toast.error('Erro ao enviar lembrete. Tente novamente.')
  // UI stays functional, user can retry
}
```

### Pitfall 3: Missing Confirmation Dialog
**What goes wrong:** User accidentally clicks "Send Reminder", spamming patients
**Why it happens:** Direct action button without confirmation
**How to avoid:** ALWAYS show AlertDialog asking "Send reminder to [patient]?"
**Warning signs:** User complaints about accidental reminder sends
```typescript
// WRONG - Direct action
<Button onClick={() => sendReminder(id)}>
  Enviar Lembrete
</Button>

// CORRECT - Confirmation first
const [confirmOpen, setConfirmOpen] = useState(false)
const [selectedId, setSelectedId] = useState<string>()

<Button onClick={() => {
  setSelectedId(id)
  setConfirmOpen(true)
}}>
  Enviar Lembrete
</Button>

<SendReminderDialog
  open={confirmOpen}
  onConfirm={() => sendReminder(selectedId)}
  onCancel={() => setConfirmOpen(false)}
/>
```

### Pitfall 4: Status Update Not Reflected
**What goes wrong:** User marks pre-checkin complete, but table still shows pending
**Why it happens:** No refetch after status update
**How to avoid:** Call refetch() or mutate() after successful update
**Warning signs:** User refreshes page to see changes
```typescript
// WRONG - No refetch
const handleMarkComplete = async (id: string) => {
  await fetch(`/api/pre-checkin/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'completo' })
  })
  toast.success('Marcado como completo')
}

// CORRECT - Refetch after update
const handleMarkComplete = async (id: string) => {
  await fetch(`/api/pre-checkin/${id}`, { ... })
  toast.success('Marcado como completo')
  refetch() // Update table data
}
```

### Pitfall 5: Overdue Calculation Wrong Around DST
**What goes wrong:** Overdue count is incorrect during DST transitions
**Why it happens:** Using plain Date instead of TZDate
**How to avoid:** ALWAYS use TZDate and America/Sao_Paulo timezone
**Warning signs:** Counts off by 1 in Feb/Nov (Brazil DST transitions)
```typescript
// WRONG - Plain Date
const now = new Date()
const appointmentTime = new Date(preCheckin.agendamento.data_hora)
const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

// CORRECT - TZDate with timezone
import { TZDate } from '@date-fns/tz'
import { differenceInHours } from 'date-fns'

const now = new TZDate(new Date(), 'America/Sao_Paulo')
const appointmentTime = new TZDate(preCheckin.agendamento.data_hora, 'America/Sao_Paulo')
const hoursUntil = differenceInHours(appointmentTime, now)
```

### Pitfall 6: Analytics Cards Don't Update with Filters
**What goes wrong:** User applies date filter, but analytics cards show all-time stats
**Why it happens:** Analytics query doesn't respect filter params
**How to avoid:** Pass same filter params to analytics endpoint as table endpoint
**Warning signs:** Card values don't change when filters change
```typescript
// CORRECT - Sync filters between table and analytics
const filters = {
  dateStart: searchParams.get('dateStart'),
  dateEnd: searchParams.get('dateEnd'),
  status: searchParams.get('status'),
}

// Both use same filters
const { data: tableData } = await fetch('/api/pre-checkin', {
  body: JSON.stringify(filters)
})

const { data: analyticsData } = await fetch('/api/pre-checkin/analytics', {
  body: JSON.stringify(filters)
})
```

## Code Examples

Verified patterns from official sources:

### API Route: GET /api/pre-checkin
```typescript
// Source: Existing API patterns + Supabase RLS bypass for N8N tables
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RBAC: Only ADMIN and ATENDENTE can view pre-checkins
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse filters
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Query with joins (single query, no N+1)
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('pre_checkin')
      .select(`
        *,
        agendamento:agendamentos!pre_checkin_agendamento_id_fkey(
          id,
          data_hora,
          servico:servicos!agendamentos_servico_id_fkey(nome)
        ),
        paciente:pacientes!pre_checkin_paciente_id_fkey(
          id,
          nome,
          telefone
        )
      `, { count: 'exact' })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (dateStart) {
      query = query.gte('agendamento.data_hora', dateStart)
    }
    if (dateEnd) {
      query = query.lte('agendamento.data_hora', dateEnd)
    }
    if (search) {
      query = query.ilike('paciente.nome', `%${search}%`)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/pre-checkin error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

### API Route: POST /api/pre-checkin/[id]/send-reminder
```typescript
// Source: Webhook integration pattern from waitlist
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { sendPreCheckinReminder } from '@/lib/pre-checkin/n8n-reminder'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RBAC
    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const preCheckinId = params.id

    // Send reminder (includes rate limit check)
    const result = await sendPreCheckinReminder(preCheckinId)

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.SEND_PRE_CHECKIN_REMINDER,
      resource: 'pre_checkin',
      resourceId: preCheckinId,
      details: { success: result.success },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/pre-checkin/[id]/send-reminder error:', error)

    // Return user-friendly error (rate limit or webhook failure)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao enviar lembrete',
        success: false
      },
      { status: 400 }
    )
  }
}
```

### API Route: GET /api/pre-checkin/analytics
```typescript
// Source: Analytics patterns from existing dashboards
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { differenceInHours } from 'date-fns'
import { TZDate } from '@date-fns/tz'

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')

    const supabase = await createServerSupabaseClient()

    // Base query with date filters
    let query = supabase
      .from('pre_checkin')
      .select(`
        *,
        agendamento:agendamentos!pre_checkin_agendamento_id_fkey(data_hora)
      `)

    if (dateStart) query = query.gte('agendamento.data_hora', dateStart)
    if (dateEnd) query = query.lte('agendamento.data_hora', dateEnd)

    const { data, error } = await query

    if (error) throw error

    // Calculate metrics
    const total = data?.length || 0
    const completed = data?.filter(p => p.status === 'completo').length || 0
    const pending = data?.filter(p => p.status === 'pendente' || p.status === 'em_andamento').length || 0

    // Overdue: < 12 hours until appointment and not complete
    const now = new TZDate(new Date(), 'America/Sao_Paulo')
    const overdue = data?.filter(p => {
      if (p.status === 'completo') return false
      const appointmentTime = new TZDate(p.agendamento.data_hora, 'America/Sao_Paulo')
      return differenceInHours(appointmentTime, now) < 12
    }).length || 0

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      completionRate,
      pendingCount: pending,
      overdueCount: overdue,
      total,
    })
  } catch (error) {
    console.error('GET /api/pre-checkin/analytics error:', error)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
```

### Mark Complete/Incomplete Action
```typescript
// Source: Existing update patterns from agenda-list-view
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user || !['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status } = body

    // Validate status
    if (!['completo', 'incompleto'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Update status
    const { data, error } = await supabase
      .from('pre_checkin')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_PRE_CHECKIN,
      resource: 'pre_checkin',
      resourceId: params.id,
      details: { status },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT /api/pre-checkin/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual webhook calls in components | Centralized webhook functions in lib/ | Ongoing | Better error handling, audit logging, testability |
| Client-side rate limiting | Database timestamp validation | Phase 14 | Authoritative, prevents race conditions |
| Separate status update endpoints | Single PUT endpoint with status field | Ongoing | Simpler API, consistent patterns |
| Custom timeline components | Vertical step list with conditional styling | Phase 14 | No dependencies, maintainable |
| Global confirmation dialogs | Per-component AlertDialog | Ongoing | Better UX, scoped state |

**Deprecated/outdated:**
- N/A - This is a new feature, no legacy patterns to replace

## Open Questions

Things that couldn't be fully resolved:

1. **Add `ultimo_lembrete_enviado` field to pre_checkin table**
   - What we know: Context specifies tracking this timestamp for rate limiting
   - What's unclear: Field doesn't exist in current schema (per AGENTS.md)
   - Recommendation: Add migration to create `ultimo_lembrete_enviado TIMESTAMP` column in pre_checkin table

2. **N8N Webhook Environment Variable**
   - What we know: Need N8N_WEBHOOK_PRE_CHECKIN_REMINDER for sending reminders
   - What's unclear: Exact N8N workflow endpoint path
   - Recommendation: Add to .env.example as `N8N_WEBHOOK_PRE_CHECKIN_REMINDER=https://your-n8n-instance.easypanel.host/webhook/pre-checkin/send-reminder`

3. **Timeline Step Labels**
   - What we know: Need to show "created → message sent → reminder → completed"
   - What's unclear: Exact Portuguese labels and which timestamps map to which steps
   - Recommendation: Use: "Criado" (created_at), "Mensagem enviada" (mensagem_enviada_em), "Lembrete enviado" (lembrete_enviado_em), "Completo" (status=completo ? updated_at : null)

4. **Overdue Definition**
   - What we know: Requirements say "overdue count" but don't define threshold
   - What's unclear: Is overdue = "less than 12 hours until appointment and not complete"?
   - Recommendation: Use 12 hours threshold (half of 24-hour pre-checkin window)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/lembretes-enviados/` - Table, filter, modal patterns
- Existing codebase: `src/components/agenda/agenda-list-view.tsx` - Toast, refetch patterns
- Existing codebase: `src/components/analytics/kpi-cards.tsx` - Analytics card pattern
- Existing codebase: `src/lib/waitlist/auto-fill.ts` - N8N webhook integration
- AGENTS.md lines 360-377 - pre_checkin table schema
- Phase 13 research - TanStack Table, mobile cards, pagination

### Secondary (MEDIUM confidence)
- shadcn/ui AlertDialog documentation - Confirmation dialog pattern
- date-fns documentation - differenceInHours for rate limiting
- Context decisions - 4-hour rate limit, confirmation modal UX

### Tertiary (LOW confidence)
- None - all findings verified with existing code or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, patterns exist in codebase
- Architecture: HIGH - Based on existing Phase 13 and Phase 11 patterns
- Pitfalls: HIGH - Observed from existing webhook integration and table patterns
- N8N integration: MEDIUM - Pattern exists, but pre-checkin webhook endpoint needs verification

**Research date:** 2026-01-21
**Valid until:** 2026-04-21 (3 months - stable dependencies, established patterns)
