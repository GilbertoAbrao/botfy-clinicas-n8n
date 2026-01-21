# Phase 16: Document Management - Research

**Researched:** 2026-01-21
**Domain:** Document Management, File Preview/Download, Bulk Actions, Supabase Storage
**Confidence:** HIGH

## Summary

Phase 16 creates an interface for viewing and validating patient documents submitted during pre-checkin. This builds directly on established patterns from Phase 14 (pre-checkin dashboard with filters, table, pagination) and Phase 15 (CRUD with form modals).

The `documentos_paciente` table already exists with the required schema including status fields. Documents are stored in Supabase Storage bucket `patient-documents` with existing signed URL generation patterns. The main new capability is bulk row selection for approve/reject operations using TanStack Table's row selection feature.

**Primary recommendation:** Reuse Phase 14 table/filter/pagination patterns. Use existing Supabase Storage signed URL patterns. Implement TanStack Table row selection with checkbox column for bulk actions. Add new audit actions for document approval/rejection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.21.3 (installed) | Table with row selection | Already used in Phase 13, has built-in selection APIs |
| shadcn/ui Dialog | Already installed | Preview modal | Used throughout app |
| shadcn/ui Checkbox | Already installed | Row selection checkboxes | Works with TanStack Table |
| shadcn/ui Table | Already installed | Table UI | Consistent with existing dashboards |
| sonner | ^2.0.7 (installed) | Toast notifications | Used in agenda-list-view, pre-checkin |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (installed) | Date formatting | Upload date display |
| @date-fns/tz | ^1.4.1 (installed) | Timezone handling | DST-aware timestamps |
| lucide-react | ^0.562.0 (installed) | Icons | Document type icons, action buttons |
| @supabase/ssr | ^0.8.0 (installed) | Supabase client | Signed URL generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native img/iframe for preview | react-pdf library | Native is simpler, no bundle size increase; react-pdf only needed for advanced PDF features |
| TanStack Table row selection | Custom checkbox state | TanStack has tested, optimized selection APIs built-in |
| Single reject modal | Inline reject reason | Modal is cleaner UX, matches approve pattern |

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
│           └── documentos/
│               └── page.tsx                 # Server component, main page
├── components/
│   └── documents/
│       ├── documents-dashboard.tsx          # Main client component
│       ├── documents-table.tsx              # Table with row selection
│       ├── documents-filters.tsx            # Filter controls
│       ├── document-preview-modal.tsx       # Preview dialog
│       ├── document-reject-modal.tsx        # Reject with reason dialog
│       ├── documents-bulk-actions.tsx       # Bottom action bar
│       └── document-status-badge.tsx        # Status indicator
├── lib/
│   └── validations/
│       └── document.ts                      # Existing validation + new schemas
└── hooks/
    └── use-patient-documents.ts             # Data fetching hook
```

### Pattern 1: TanStack Table Row Selection with Checkbox Column
**What:** Checkbox column for multi-row selection with select-all header
**When to use:** Tables requiring bulk actions
**Example:**
```typescript
// Source: https://tanstack.com/table/v8/docs/guide/row-selection
import { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'

const columns: ColumnDef<Document>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelectedHandler()(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()} // Prevent row click
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // ... other columns
]

// In component:
const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  onRowSelectionChange: setRowSelection,
  state: {
    rowSelection,
  },
})

// Get selected row IDs
const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
```

### Pattern 2: Supabase Storage Signed URLs for Preview/Download
**What:** Generate time-limited signed URLs for secure file access
**When to use:** Preview and download document files
**Example:**
```typescript
// Source: src/app/api/pacientes/[id]/documents/[docId]/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Generate signed URL (1 hour expiry)
const supabase = await createServerSupabaseClient()
const { data, error } = await supabase.storage
  .from('patient-documents')
  .createSignedUrl(document.storagePath, 3600) // 3600 seconds = 1 hour

if (error || !data) {
  throw new Error('Erro ao gerar URL de preview')
}

const signedUrl = data.signedUrl
```

### Pattern 3: Document Preview Modal (Image + PDF)
**What:** Modal showing document preview with appropriate renderer
**When to use:** User clicks preview action
**Example:**
```typescript
// Native preview without external libraries
interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    filename: string
    fileType: string
    previewUrl: string | null
  } | null
}

export function DocumentPreviewModal({ isOpen, onClose, document }: DocumentPreviewModalProps) {
  if (!document || !document.previewUrl) return null

  const isImage = document.fileType.startsWith('image/')
  const isPdf = document.fileType === 'application/pdf'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{document.filename}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[400px]">
          {isImage && (
            <img
              src={document.previewUrl}
              alt={document.filename}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}
          {isPdf && (
            <iframe
              src={document.previewUrl}
              title={document.filename}
              className="w-full h-[70vh] border-0"
            />
          )}
          {!isImage && !isPdf && (
            <div className="text-center text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Preview nao disponivel para este tipo de arquivo.</p>
              <Button onClick={() => window.open(document.previewUrl!, '_blank')} className="mt-4">
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 4: Bulk Actions Bar
**What:** Fixed action bar appearing when rows are selected
**When to use:** Bulk approve/reject operations
**Example:**
```typescript
interface BulkActionsBarProps {
  selectedCount: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
  loading: boolean
}

export function BulkActionsBar({
  selectedCount,
  onApprove,
  onReject,
  onClear,
  loading
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} documento(s) selecionado(s)</span>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpar selecao
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar selecionados
          </Button>
          <Button
            onClick={onApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar selecionados
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Pattern 5: Reject with Reason Modal
**What:** Modal requiring reason text before rejection
**When to use:** Single or bulk reject actions
**Example:**
```typescript
interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
  documentCount: number
}

export function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  documentCount
}: RejectModalProps) {
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      toast.error('Motivo deve ter pelo menos 10 caracteres')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar documento(s)</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeicao para {documentCount} documento(s).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo da rejeicao *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da rejeicao..."
                rows={3}
                required
                minLength={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || reason.trim().length < 10}
                variant="destructive"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Rejeitar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Anti-Patterns to Avoid
- **Loading all documents into TanStack Table state:** Use server-side pagination, don't load 1000+ documents
- **Fetching signed URLs on page load:** Generate URLs only when preview/download is requested
- **Missing stopPropagation on checkbox:** Will trigger row click when clicking checkbox
- **Clearing selection after every action:** Batch operations should preserve selection until user clears
- **Inline rejection without confirmation:** Always require explicit confirmation with reason

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Row selection state | Custom useState with IDs | TanStack Table rowSelection | Built-in, handles edge cases (pagination, filtering) |
| Signed URL generation | Manual Supabase REST calls | supabase.storage.createSignedUrl | Handles auth, expiry, error cases |
| Document type icons | Manual icon mapping | File type detection + lucide-react icons | Already have icon library |
| Date range filtering | Custom date math | Existing PreCheckinFilters pattern | Reuse Phase 14 filter implementation |
| Status filter | Custom filter logic | Existing filter patterns | Reuse Phase 14/15 patterns |
| Audit logging | Custom logging | Existing logAudit function | HIPAA compliant, consistent |

**Key insight:** The `documentos_paciente` table exists but needs `status` field clarification. The current schema has `validado` boolean but requirements specify pendente/aprovado/rejeitado status. May need schema adjustment or use validado + observacoes for rejection tracking.

## Common Pitfalls

### Pitfall 1: Document Status Field Mismatch
**What goes wrong:** Requirements specify status (pendente/aprovado/rejeitado) but table has `validado` boolean
**Why it happens:** Schema was designed for simpler validation workflow
**How to avoid:** Either add `status` column OR use `validado` (null=pendente, true=aprovado, false=rejeitado) with `observacoes` for rejection reason
**Warning signs:** Filter by status returns wrong results
**Recommendation:**
```typescript
// Option A: Add status column (cleaner)
ALTER TABLE documentos_paciente ADD COLUMN status VARCHAR(20) DEFAULT 'pendente';

// Option B: Use existing fields (no migration)
// pendente = validado IS NULL
// aprovado = validado = true
// rejeitado = validado = false AND observacoes IS NOT NULL
```

### Pitfall 2: Bulk Action Race Conditions
**What goes wrong:** User clicks "Approve All" but some documents fail, unclear which succeeded
**Why it happens:** Individual requests without transaction or proper error aggregation
**How to avoid:** Use Promise.allSettled and report partial failures
**Warning signs:** User confused about which documents were actually updated
```typescript
// WRONG - Stops on first error
await Promise.all(ids.map(id => approveDocument(id)))

// CORRECT - Reports partial failures
const results = await Promise.allSettled(ids.map(id => approveDocument(id)))
const failed = results.filter(r => r.status === 'rejected')
if (failed.length > 0) {
  toast.warning(`${ids.length - failed.length} aprovados, ${failed.length} falharam`)
} else {
  toast.success(`${ids.length} documentos aprovados`)
}
```

### Pitfall 3: Preview URL Expiry During Session
**What goes wrong:** User keeps modal open, URL expires, preview breaks
**Why it happens:** Signed URLs have 1-hour expiry
**How to avoid:** Generate new URL when opening modal each time (don't cache)
**Warning signs:** "Image broken" errors after long sessions
```typescript
// Generate fresh URL when opening preview
const handlePreview = async (doc: Document) => {
  setPreviewLoading(true)
  try {
    const res = await fetch(`/api/patient-documents/${doc.id}/preview`)
    const { url } = await res.json()
    setPreviewDoc({ ...doc, previewUrl: url })
    setPreviewOpen(true)
  } finally {
    setPreviewLoading(false)
  }
}
```

### Pitfall 4: Row Selection Lost on Filter Change
**What goes wrong:** User selects 5 documents, changes filter, selection cleared
**Why it happens:** TanStack Table selection state tied to current page data
**How to avoid:** Clear selection when filters change (intentional UX)
**Warning signs:** User expects to select across filtered views
```typescript
// Clear selection when filters change
useEffect(() => {
  table.resetRowSelection()
}, [filters.status, filters.tipo, filters.dateStart, filters.dateEnd])
```

### Pitfall 5: Missing Audit Log for Bulk Actions
**What goes wrong:** Compliance audit finds documents approved without individual logs
**Why it happens:** Single audit entry for bulk action, not per-document
**How to avoid:** Log each document approval/rejection individually
**Warning signs:** Audit log shows "approved 10 documents" without specifics
```typescript
// WRONG - Single log for bulk
await logAudit({
  action: 'BULK_APPROVE_DOCUMENTS',
  details: { documentIds: ids }
})

// CORRECT - Log each document
await Promise.all(ids.map(id =>
  logAudit({
    action: AuditAction.APPROVE_DOCUMENT,
    resource: 'documentos_paciente',
    resourceId: id.toString(),
    details: { notes }
  })
))
```

### Pitfall 6: Patient Name Search with Nested Field
**What goes wrong:** Search by patient name doesn't work or is slow
**Why it happens:** Supabase nested field filtering limitations (per v1.2 decisions)
**How to avoid:** Use client-side filtering for patient name search (same as Phase 14)
**Warning signs:** Query errors or inconsistent results
```typescript
// Per 14-01 decision: client-side filtering for nested fields
const filteredData = useMemo(() => {
  if (!search) return documents
  return documents.filter(doc =>
    doc.paciente?.nome?.toLowerCase().includes(search.toLowerCase())
  )
}, [documents, search])
```

## Code Examples

Verified patterns from official sources:

### API Route: GET /api/patient-documents
```typescript
// Source: Existing Phase 14 patterns
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') // pendente, aprovado, rejeitado
    const tipo = searchParams.get('tipo') // rg, cnh, carteirinha_convenio, etc.
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('documentos_paciente')
      .select(`
        *,
        paciente:pacientes!documentos_paciente_paciente_id_fkey(
          id,
          nome,
          telefone
        ),
        pre_checkin:pre_checkin!documentos_paciente_pre_checkin_id_fkey(
          id,
          agendamento:agendamentos!pre_checkin_agendamento_id_fkey(
            id,
            data_hora
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    // Status filter based on validado field
    if (status === 'pendente') {
      query = query.is('validado', null)
    } else if (status === 'aprovado') {
      query = query.eq('validado', true)
    } else if (status === 'rejeitado') {
      query = query.eq('validado', false)
    }

    // Date range filter on created_at
    if (dateStart) {
      query = query.gte('created_at', dateStart)
    }
    if (dateEnd) {
      query = query.lte('created_at', dateEnd)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_DOCUMENTS,
      resource: 'documentos_paciente',
      details: { count: data?.length || 0, filters: { status, tipo, dateStart, dateEnd } },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      documents: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/patient-documents error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
```

### API Route: POST /api/patient-documents/[id]/approve
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { notes } = body as { notes?: string }

    const supabase = await createServerSupabaseClient()

    // Update document status
    const { data, error } = await supabase
      .from('documentos_paciente')
      .update({
        validado: true,
        validado_por: user.email,
        observacoes: notes || null,
      })
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.APPROVE_DOCUMENT,
      resource: 'documentos_paciente',
      resourceId: id,
      details: { notes },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('POST /api/patient-documents/[id]/approve error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao aprovar documento' },
      { status: 500 }
    )
  }
}
```

### API Route: POST /api/patient-documents/[id]/reject
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Validate reason is provided
    const result = rejectSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { reason } = result.data

    const supabase = await createServerSupabaseClient()

    // Update document status
    const { data, error } = await supabase
      .from('documentos_paciente')
      .update({
        validado: false,
        validado_por: user.email,
        observacoes: reason,
      })
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.REJECT_DOCUMENT,
      resource: 'documentos_paciente',
      resourceId: id,
      details: { reason },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('POST /api/patient-documents/[id]/reject error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao rejeitar documento' },
      { status: 500 }
    )
  }
}
```

### API Route: GET /api/patient-documents/[id]/preview
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/session'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { logAudit, AuditAction } from '@/lib/audit/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    if (!['ADMIN', 'ATENDENTE'].includes(user.role)) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }

    const { id } = await params

    const supabase = await createServerSupabaseClient()

    // Fetch document to get storage path
    const { data: document, error: docError } = await supabase
      .from('documentos_paciente')
      .select('id, arquivo_path, tipo')
      .eq('id', parseInt(id))
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 })
    }

    // Generate signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(document.arquivo_path, 3600) // 1 hour

    if (signError || !signedData) {
      return NextResponse.json({ error: 'Erro ao gerar URL de preview' }, { status: 500 })
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: AuditAction.VIEW_DOCUMENT,
      resource: 'documentos_paciente',
      resourceId: id,
      details: { tipo: document.tipo },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    })

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (error) {
    console.error('GET /api/patient-documents/[id]/preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar preview' },
      { status: 500 }
    )
  }
}
```

### TanStack Table Column Definitions with Selection
```typescript
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DocumentStatusBadge } from './document-status-badge'
import { FileText, Image, CreditCard, FileCheck } from 'lucide-react'

const TIPO_CONFIG = {
  rg: { label: 'RG', icon: CreditCard },
  cnh: { label: 'CNH', icon: CreditCard },
  carteirinha_convenio: { label: 'Carteirinha Convenio', icon: FileCheck },
  guia_autorizacao: { label: 'Guia Autorizacao', icon: FileText },
  comprovante_residencia: { label: 'Comp. Residencia', icon: FileText },
  outros: { label: 'Outros', icon: FileText },
}

export function getDocumentColumns(callbacks: {
  onPreview: (id: number) => void
  onDownload: (id: number) => void
}): ColumnDef<Document>[] {
  return [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Patient column
    {
      accessorKey: 'paciente.nome',
      header: 'Paciente',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.paciente?.nome || '-'}</p>
        </div>
      ),
    },
    // Type column
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.getValue('tipo') as keyof typeof TIPO_CONFIG
        const config = TIPO_CONFIG[tipo] || TIPO_CONFIG.outros
        const Icon = config.icon
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <span>{config.label}</span>
          </div>
        )
      },
    },
    // Upload date column
    {
      accessorKey: 'created_at',
      header: 'Data Upload',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string
        return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      },
    },
    // Status column
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const validado = row.original.validado
        const status = validado === true ? 'aprovado' : validado === false ? 'rejeitado' : 'pendente'
        return <DocumentStatusBadge status={status} />
      },
    },
    // Actions column
    {
      id: 'actions',
      header: 'Acoes',
      cell: ({ row }) => {
        const docId = row.original.id
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => callbacks.onPreview(docId)}
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => callbacks.onDownload(docId)}
              title="Baixar"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual checkbox state | TanStack Table rowSelection | Already using in Phase 13 | Simpler state management |
| Direct storage URLs | Signed URLs with expiry | Security best practice | Time-limited access, HIPAA compliant |
| Alert for rejection | Modal with required reason | Phase 16 | Better audit trail |
| Refresh page after action | Refetch data in hook | Ongoing | Better UX |

**Deprecated/outdated:**
- N/A - This is a new feature, no legacy patterns to replace

## Open Questions

Things that couldn't be fully resolved:

1. **Status Field Schema Decision**
   - What we know: `documentos_paciente` has `validado` boolean, requirements want status enum
   - What's unclear: Should we add a `status` column or use validado mapping?
   - Recommendation: Use existing `validado` field mapping (null=pendente, true=aprovado, false=rejeitado) to avoid migration

2. **Storage Bucket for Pre-Checkin Documents**
   - What we know: Existing patient documents use `patient-documents` bucket
   - What's unclear: Are pre-checkin documents stored in same bucket or separate?
   - Recommendation: Use same `patient-documents` bucket with path prefix (e.g., `precheckin/{pre_checkin_id}/{filename}`)

3. **Audit Actions for Approve/Reject**
   - What we know: Need new AuditAction enum values
   - What's unclear: Exact action names
   - Recommendation: Add `APPROVE_DOCUMENT` and `REJECT_DOCUMENT` to AuditAction enum in `src/lib/audit/logger.ts`

4. **Bulk Action Limit**
   - What we know: Need to support bulk approve/reject
   - What's unclear: Should there be a limit (e.g., max 50 at once)?
   - Recommendation: Limit to current page selection (up to 100 per page limit)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/app/api/pacientes/[id]/documents/` - Storage signed URL patterns
- Existing codebase: `src/components/pre-checkin/` - Filter, table, pagination patterns
- Existing codebase: `src/components/agenda/agenda-list-table.tsx` - TanStack Table patterns
- Database schema: `database/001_pre_checkin_tables.sql` - documentos_paciente table
- TanStack Table docs: Row Selection Guide - https://tanstack.com/table/v8/docs/guide/row-selection

### Secondary (MEDIUM confidence)
- Existing codebase: `src/lib/audit/logger.ts` - Audit action patterns
- Existing codebase: `package.json` - @tanstack/react-table ^8.21.3 confirmed
- Prior decisions (v1.2-SUMMARY.md): Client-side filtering for nested fields

### Tertiary (LOW confidence)
- None - all findings verified with existing code or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, patterns exist in codebase
- Architecture: HIGH - Based on existing Phase 14 and storage patterns
- Pitfalls: HIGH - Observed from existing document upload and table patterns
- Bulk actions: MEDIUM - TanStack Table row selection documented, but bulk API needs implementation

**Research date:** 2026-01-21
**Valid until:** 2026-04-21 (3 months - stable dependencies, established patterns)
