# Phase 13: Agenda List View - Research

**Researched:** 2026-01-21
**Domain:** React Data Tables, TanStack Table, Mobile Responsive Tables
**Confidence:** HIGH

## Summary

Phase 13 adds a list view as an alternative to the calendar view on the agenda page. The implementation will use TanStack Table (formerly React Table) v8 integrated with shadcn/ui's Table component. This is the standard approach for building advanced data tables in the React/Next.js ecosystem.

The codebase already has established patterns for table-based views (lembretes-enviados), filtering, pagination, and mobile card layouts. The phase will extend the existing `useCalendarEvents` hook and reuse the `AppointmentModal` and `NoShowRiskBadge` components.

**Primary recommendation:** Install `@tanstack/react-table` and follow shadcn/ui's Data Table pattern. Reuse existing filter components and mobile card layout patterns from `lembretes-enviados`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.x | Headless table logic | Official TanStack library, TypeScript-first, supports sorting/filtering/pagination |
| shadcn/ui Table | Already installed | Table UI components | Already in codebase, composable with TanStack Table |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (installed) | Date formatting, ranges | Date filters, display formatting |
| @date-fns/tz | ^1.4.1 (installed) | Timezone handling | DST-aware date operations |
| lucide-react | ^0.562.0 (installed) | Icons | Sort indicators, action buttons |
| sonner | ^2.0.7 (installed) | Toast notifications | Action feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-table | ag-grid | ag-grid is overkill for this use case, heavier bundle |
| @tanstack/react-table | Custom table | Would miss sorting, filtering, pagination features |
| URL state for filters | zustand/jotai | URL state is simpler, enables shareable links, already used in codebase |

**Installation:**
```bash
npm install @tanstack/react-table
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── agenda/
│       └── page.tsx              # Server component, adds view toggle logic
├── components/
│   └── agenda/
│       ├── agenda-list-view.tsx  # Main list view component
│       ├── agenda-list-filters.tsx  # Filter controls
│       ├── agenda-list-columns.tsx  # Column definitions
│       └── agenda-list-pagination.tsx  # Pagination controls
└── hooks/
    └── use-calendar-events.ts    # Existing hook - may need minor extension
```

### Pattern 1: TanStack Table with shadcn/ui
**What:** Use TanStack Table's headless logic with shadcn/ui's Table component for rendering
**When to use:** All data table implementations
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/data-table
'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Pattern 2: Column Definitions with Sorting
**What:** Define columns with accessors, headers, and cell renderers
**When to use:** Any table column definition
**Example:**
```typescript
// Source: https://tanstack.com/table/v8/docs/guide/sorting
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

export const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'scheduledAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Data/Hora
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.getValue('scheduledAt')), 'dd/MM/yyyy HH:mm'),
  },
  {
    accessorKey: 'patientName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Paciente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  // ... more columns
]
```

### Pattern 3: URL-based Filter State
**What:** Store filter state in URL query parameters
**When to use:** When filters should persist across page refreshes and be shareable
**Example:**
```typescript
// Source: Existing codebase pattern from lembretes-enviados
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function useFilterState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilters = (newFilters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/agenda?${params.toString()}`)
  }

  return {
    filters: Object.fromEntries(searchParams.entries()),
    updateFilters,
  }
}
```

### Pattern 4: Mobile Card Layout with TailwindCSS
**What:** Show table on desktop, cards on mobile using responsive classes
**When to use:** All table-based views that need mobile support
**Example:**
```typescript
// Source: Existing codebase pattern from lembrete-enviado-table.tsx
return (
  <div className="space-y-4">
    {/* Desktop table */}
    <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
      <Table>{/* ... table content */}</Table>
    </div>

    {/* Mobile card view */}
    <div className="md:hidden space-y-3">
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{item.patientName}</h3>
              <Badge>{item.status}</Badge>
            </div>
            <NoShowRiskBadge appointmentId={item.id} />
          </div>
          {/* Card content */}
        </div>
      ))}
    </div>
  </div>
)
```

### Pattern 5: View Toggle with URL State
**What:** Toggle between calendar and list view using URL query param
**When to use:** Any page with multiple view modes
**Example:**
```typescript
// agenda/page.tsx
export default async function AgendaPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view || 'calendar'

  return (
    <div>
      <ViewToggle currentView={view} />
      {view === 'list' ? <AgendaListView /> : <CalendarView />}
    </div>
  )
}

// ViewToggle component
function ViewToggle({ currentView }: { currentView: string }) {
  return (
    <div className="flex gap-2">
      <Link href="/agenda?view=calendar">
        <Button variant={currentView === 'calendar' ? 'default' : 'outline'}>
          <Calendar className="h-4 w-4 mr-2" />
          Calendario
        </Button>
      </Link>
      <Link href="/agenda?view=list">
        <Button variant={currentView === 'list' ? 'default' : 'outline'}>
          <List className="h-4 w-4 mr-2" />
          Lista
        </Button>
      </Link>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Direct DOM manipulation:** TanStack Table is headless; never manipulate table DOM directly
- **Storing table state in component state only:** Use URL params for filters to enable sharing/bookmarking
- **Creating custom sorting/filtering logic:** Use TanStack Table's built-in row models
- **Inline column definitions:** Keep columns in a separate file for maintainability
- **Ignoring stable references:** Always memoize data and columns to prevent infinite re-renders

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table sorting | Custom sort function | TanStack `getSortedRowModel()` | Handles multi-column, direction, custom comparators |
| Table filtering | Custom filter loops | TanStack `getFilteredRowModel()` | Supports column + global filters, fuzzy matching |
| Pagination | Custom page logic | TanStack `getPaginationRowModel()` | Handles page state, row slicing, page count |
| Global search | Custom search implementation | TanStack global filter | Searches all columns, debounce-friendly |
| Date range filter | Custom date comparison | date-fns `isWithinInterval` | DST-aware, handles edge cases |
| Mobile responsive table | CSS media queries only | Conditional rendering (hidden/md:block) | Completely different UX needed |

**Key insight:** TanStack Table provides all the table logic as composable "row models". The UI is completely separate, making it perfect for integration with shadcn/ui.

## Common Pitfalls

### Pitfall 1: Infinite Re-renders from Unstable References
**What goes wrong:** Table re-renders infinitely because data or columns change reference on every render
**Why it happens:** Data/columns created inline without memoization
**How to avoid:** Always use `useMemo` for data and columns
**Warning signs:** Console shows repeated renders, browser becomes unresponsive
```typescript
// WRONG
const columns = [{ accessorKey: 'name' }] // New array every render

// CORRECT
const columns = useMemo(() => [{ accessorKey: 'name' }], [])
```

### Pitfall 2: Filter State Not Persisting Across View Toggle
**What goes wrong:** User applies filters in list view, toggles to calendar, filters reset
**Why it happens:** Filter state stored in component state instead of URL
**How to avoid:** Store all filter state in URL search params
**Warning signs:** Filters disappear on navigation or view change

### Pitfall 3: Mobile Card View Missing Quick Actions
**What goes wrong:** Users can't perform actions on mobile, have to switch to desktop
**Why it happens:** Quick actions only rendered in table rows, not in card view
**How to avoid:** Duplicate action buttons in both table and card components
**Warning signs:** Mobile users complain about inability to confirm/cancel

### Pitfall 4: No-Show Risk Badge N+1 Problem
**What goes wrong:** Each row fetches risk independently, causing N API calls
**Why it happens:** NoShowRiskBadge component fetches on mount for each appointment
**How to avoid:** Consider batching risk fetch for visible appointments, or accept lazy loading with skeletons
**Warning signs:** Many simultaneous API calls, slow page load

### Pitfall 5: TZDate vs Date Mismatch
**What goes wrong:** Appointments show wrong time, especially around DST transitions
**Why it happens:** Mixing TZDate from existing hooks with plain Date in new code
**How to avoid:** Always use `dbTimestampToTZDate` for dates from database, `createClinicDate` for new dates
**Warning signs:** Times off by 1 hour during DST periods (Brazil: Feb/Nov)

### Pitfall 6: Pagination with Client-Side Filtering
**What goes wrong:** "Page 3 of 10" shown but only 2 items visible after filtering
**Why it happens:** Pagination counts don't update after filtering
**How to avoid:** Use TanStack's `getFilteredRowModel` before `getPaginationRowModel` in chain
**Warning signs:** Empty pages, incorrect page counts

## Code Examples

Verified patterns from official sources:

### Global Filter (Search by Patient Name/Phone)
```typescript
// Source: https://tanstack.com/table/v8/docs/guide/global-filtering
import { getFilteredRowModel } from '@tanstack/react-table'

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    globalFilter: searchValue,
  },
  onGlobalFilterChange: setSearchValue,
  globalFilterFn: 'includesString', // Built-in fuzzy filter
})

// Search input
<Input
  placeholder="Buscar paciente ou telefone..."
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
/>
```

### Column Filter (Status Dropdown)
```typescript
// Source: https://tanstack.com/table/v8/docs/guide/column-filtering
const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    filterFn: 'equals', // Exact match for status filter
  },
]

// Filter control
<Select
  value={table.getColumn('status')?.getFilterValue() as string ?? 'all'}
  onValueChange={(value) =>
    table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
  }
>
  <SelectItem value="all">Todos os status</SelectItem>
  <SelectItem value="agendada">Agendada</SelectItem>
  <SelectItem value="confirmado">Confirmado</SelectItem>
  {/* ... */}
</Select>
```

### Pagination Controls
```typescript
// Source: https://tanstack.com/table/v8/docs/guide/pagination
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    pagination: {
      pageSize: 50, // ALIST-11: 50 rows per page
    },
  },
})

// Pagination UI
<div className="flex items-center justify-between">
  <span>
    Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} agendamentos
  </span>
  <div className="flex gap-2">
    <Button
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
    >
      Anterior
    </Button>
    <Button
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
    >
      Proximo
    </Button>
  </div>
</div>
```

### Quick Action Buttons (Edit, Confirm, Cancel)
```typescript
// Actions column definition
{
  id: 'actions',
  header: 'Acoes',
  cell: ({ row }) => {
    const appointment = row.original
    const isEditable = !['cancelada', 'realizada', 'faltou'].includes(appointment.status)

    return (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(appointment.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {isEditable && appointment.status === 'agendada' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfirm(appointment.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        {isEditable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(appointment.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  },
}
```

### Date Range Filter with Quick Presets
```typescript
// Source: Existing pattern from lembrete-enviado-filters.tsx
type DatePreset = 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'custom'

const datePresets = {
  today: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }),
  tomorrow: () => ({ start: startOfDay(addDays(new Date(), 1)), end: endOfDay(addDays(new Date(), 1)) }),
  this_week: () => ({ start: startOfWeek(new Date(), { locale: ptBR }), end: endOfWeek(new Date(), { locale: ptBR }) }),
  this_month: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
}

// Quick filter buttons
<div className="flex flex-wrap gap-2">
  {Object.entries({ today: 'Hoje', tomorrow: 'Amanha', this_week: 'Esta semana', this_month: 'Este mes' }).map(([key, label]) => (
    <Button
      key={key}
      variant="outline"
      size="sm"
      onClick={() => applyDatePreset(key as DatePreset)}
      className={cn(activePreset === key && 'border-blue-500 bg-blue-50')}
    >
      {label}
    </Button>
  ))}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-table v7 (plugin system) | TanStack Table v8 (row models) | 2022 | Simpler API, better TypeScript, framework-agnostic |
| CSS table hiding on mobile | Conditional rendering | Ongoing | Better UX, true card layout on mobile |
| Component state for filters | URL search params | Ongoing | Shareable links, persists across navigation |
| Individual column sorting | Multi-column sorting | TanStack v8 | More powerful user control |

**Deprecated/outdated:**
- `react-table` v7: Replaced by `@tanstack/react-table` v8, different API
- `@types/react-table`: Types now included in `@tanstack/react-table`
- Plugin system: v8 uses composable row models instead

## Open Questions

Things that couldn't be fully resolved:

1. **Risk Badge Batch Loading**
   - What we know: Current NoShowRiskBadge fetches per appointment, works but may cause many requests
   - What's unclear: Whether to batch risk calculation or accept lazy loading
   - Recommendation: Keep current lazy loading pattern with skeletons; optimize later if needed

2. **Multi-Select Provider Filter**
   - What we know: ALIST-04 requires multi-select for providers
   - What's unclear: shadcn/ui Select doesn't support multi-select natively
   - Recommendation: Use Popover with Checkbox list pattern (existing in codebase) or install cmdk for combobox

3. **Filter State Sync Between Views**
   - What we know: URL params should persist across calendar/list toggle
   - What's unclear: Which filters apply to both views vs only list view
   - Recommendation: Date range applies to both; status/provider/service/search are list-only

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - Complete implementation guide
- [TanStack Table v8 Overview](https://tanstack.com/table/v8/docs/overview) - Official documentation
- [TanStack Table Sorting Guide](https://tanstack.com/table/latest/docs/guide/sorting) - Sorting implementation
- [TanStack Table Pagination Guide](https://tanstack.com/table/v8/docs/guide/pagination) - Pagination implementation
- [TanStack Table Column Filtering](https://tanstack.com/table/v8/docs/guide/column-filtering) - Filter implementation
- [TanStack Table Global Filtering](https://tanstack.com/table/v8/docs/guide/global-filtering) - Search implementation

### Secondary (MEDIUM confidence)
- Existing codebase patterns: `lembretes-enviados-page-client.tsx`, `lembrete-enviado-table.tsx`, `lembrete-enviado-filters.tsx`
- Existing codebase patterns: `no-show-risk-badge.tsx`, `appointment-modal.tsx`

### Tertiary (LOW confidence)
- None - all findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official TanStack docs + shadcn/ui guide
- Architecture: HIGH - Based on existing codebase patterns + official examples
- Pitfalls: HIGH - Documented in official TanStack docs + observed in similar implementations

**Research date:** 2026-01-21
**Valid until:** 2026-04-21 (TanStack Table is stable, 3-month validity)
