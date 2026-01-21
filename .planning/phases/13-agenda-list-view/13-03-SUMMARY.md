---
phase: 13-agenda-list-view
plan: 03
type: execute
completed: 2026-01-21
duration: "3 minutes"

subsystem: frontend-ui
tags: [filters, pagination, ui-components, agenda, react]

dependencies:
  requires:
    - phase: 13
      plan: 01
      provides: AppointmentFilters type, STATUS_APPOINTMENT constants, /api/agendamentos/list endpoint
  provides:
    - AgendaListFilters component with date/provider/service/status/search filters
    - AgendaListPagination component with page navigation
  affects:
    - phase: 13
      plan: 02
      reason: List view UI will consume these filter and pagination components

tech-stack:
  added: []
  patterns:
    - URL state management via useSearchParams and router.push
    - Provider multi-select with Popover + Checkbox pattern
    - Debounced search input (300ms)
    - Quick date presets with ptBR locale
    - Filter state sync with URL params

key-files:
  created:
    - path: src/components/agenda/agenda-list-filters.tsx
      purpose: Filter controls for date range, provider, service, status, search
      exports: [AgendaListFilters]
      lines: 624
    - path: src/components/agenda/agenda-list-pagination.tsx
      purpose: Pagination controls with page navigation and items per page
      exports: [AgendaListPagination]
      lines: 145

  modified: []

decisions:
  - decision: Use Popover with Checkbox list for provider multi-select
    rationale: shadcn/ui doesn't have native multi-select component, Popover + Checkbox is the recommended pattern
    alternatives: [Custom dropdown, react-select library]
    impact: Consistent with shadcn/ui patterns, accessible, mobile-friendly

  - decision: 300ms debounce for search input
    rationale: Balance between responsiveness and reducing unnecessary API calls
    alternatives: [No debounce, 500ms debounce]
    impact: Good UX, reduces backend load

  - decision: Quick date presets (hoje, amanha, esta semana, este mes)
    rationale: Common use cases for viewing appointments in specific time ranges
    alternatives: [Date picker only, calendar view]
    impact: Faster filtering for common scenarios

  - decision: Preserve all filter params when paginating
    rationale: Users expect filters to remain active when navigating pages
    alternatives: [Reset filters on page change]
    impact: Better UX, maintains filter context

  - decision: Reset to page 1 when changing filters or items per page
    rationale: New filter criteria or page size means current page may not exist
    alternatives: [Keep current page if possible]
    impact: Predictable behavior, prevents empty pages
---

# Phase 13 Plan 03: Agenda List Filters & Pagination Summary

**One-liner:** Filter controls (date/provider/service/status/search) and pagination for agenda list view with URL state management.

## What Was Built

### AgendaListFilters Component

Comprehensive filter controls for the agenda list view:

**Quick Date Presets:**
- Hoje (today)
- Amanha (tomorrow)
- Esta semana (this week, using ptBR Sunday start)
- Este mes (this month)
- Personalizado (custom date range)
- Visual highlighting of active preset with blue border/background

**Custom Date Range:**
- Start date picker with Calendar component
- End date picker with Calendar component
- End date disabled before start date
- X button to clear each date
- ISO string format for URL params

**Provider Multi-Select:**
- Fetches active providers from Supabase on mount
- Popover with checkbox list (shadcn/ui pattern)
- Shows "X profissionais" or "Todos os profissionais"
- Updates comma-separated providerId in URL

**Service Type Filter:**
- Fetches distinct service types from appointments table
- Standard Select component
- "Todos os servicos" option clears filter

**Status Filter:**
- Standard Select component
- Options: Todos, Agendada, Confirmado, Cancelada, Realizada, Faltou
- Uses STATUS_APPOINTMENT and STATUS_APPOINTMENT_LABELS from validations

**Patient Search:**
- Input with Search icon
- Debounced 300ms before updating URL
- Placeholder: "Buscar paciente ou telefone..."
- X button to clear search

**Clear All Filters:**
- Shows when any filter is active
- Badge showing count of active filters
- Clears all URL params except 'view'

**Mobile Responsive:**
- Collapsible filter section for mobile
- "Filtros avancados" button with filter count badge
- Expand/collapse toggle
- Desktop shows filters expanded by default

### AgendaListPagination Component

Pagination controls with navigation and page size selection:

**Navigation Buttons:**
- First page (ChevronsLeft icon)
- Previous page (ChevronLeft icon)
- Next page (ChevronRight icon)
- Last page (ChevronsRight icon)
- All disabled at appropriate boundaries

**Page Information:**
- "Pagina X de Y • Mostrando Z agendamentos"
- Shows current page, total pages, and total items

**Items Per Page:**
- Select with options: 20, 50, 100
- Default: 50 (per ALIST-11 requirement)
- Changing resets to page 1

**Filter Preservation:**
- Preserves all filter params when navigating
- Preserves: view, dateStart, dateEnd, providerId, serviceType, status, search
- Only updates page and limit params

**Responsive Layout:**
- Stacks vertically on mobile
- Horizontal on desktop with flex justify-between

## Requirements Completed

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| ALIST-03 | ✅ Complete | Quick date presets + custom date range with Calendar |
| ALIST-04 | ✅ Complete | Provider multi-select with Popover + Checkbox list |
| ALIST-05 | ✅ Complete | Service type filter with distinct values from appointments |
| ALIST-06 | ✅ Complete | Status filter with all appointment statuses |
| ALIST-08 | ✅ Complete | Patient search with 300ms debounce |
| ALIST-11 | ✅ Complete | Pagination with 50 default, 20/50/100 options |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### URL State Management Pattern

Both components use Next.js App Router's `useSearchParams` and `useRouter` for URL state:

```typescript
const router = useRouter()
const searchParams = useSearchParams()

const updateURL = (newFilters: FilterValues) => {
  const params = new URLSearchParams()

  // Preserve view param
  const view = searchParams.get('view')
  if (view) params.set('view', view)

  // Add filter params
  if (newFilters.dateStart) params.set('dateStart', newFilters.dateStart)
  // ... other filters

  // Reset to page 1
  params.set('page', '1')
  params.set('limit', searchParams.get('limit') || '50')

  router.push(`/admin/agenda?${params.toString()}`)
}
```

### Provider Multi-Select Implementation

Used shadcn/ui Popover + Checkbox pattern (no native multi-select):

```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {getProviderDisplayText()}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    {providers.map((provider) => (
      <div key={provider.id}>
        <Checkbox
          checked={selectedProviderIds.includes(provider.id)}
          onCheckedChange={() => handleProviderToggle(provider.id)}
        />
        <label>{provider.nome}</label>
      </div>
    ))}
  </PopoverContent>
</Popover>
```

### Debounced Search

Prevents excessive API calls while maintaining responsiveness:

```typescript
const handleSearchChange = (value: string) => {
  setSearchInput(value)

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  const timer = setTimeout(() => {
    updateFilter('search', value || undefined)
  }, 300)

  setSearchDebounceTimer(timer)
}
```

### Date Range with ptBR Locale

Properly handles Brazilian week start (Sunday):

```typescript
import { ptBR } from 'date-fns/locale'

const weekStart = startOfWeek(today, { locale: ptBR })
const weekEnd = endOfWeek(today, { locale: ptBR })
```

## Testing Notes

**Manual testing required:**
1. Quick date presets update URL correctly
2. Custom date picker updates dateStart/dateEnd params
3. Provider multi-select shows checkboxes and updates providerId as comma-separated
4. Service and status selects update respective URL params
5. Search input debounces and updates search param
6. Clear all button removes all filter params
7. Pagination preserves filter params when navigating
8. Items per page change resets to page 1
9. Mobile filter collapse works

**TypeScript compilation:**
```bash
npx tsc --noEmit --skipLibCheck
# No errors in src/components/agenda/
```

## Next Phase Readiness

**Blockers:** None

**Ready for phase 13 plan 02:** Yes - List view UI can now consume these filter and pagination components.

**Integration points:**
- 13-02 (List View UI) will import AgendaListFilters and AgendaListPagination
- 13-02 will read filter params from URL and pass to /api/agendamentos/list
- 13-02 will pass pagination props (currentPage, totalPages, totalItems, itemsPerPage) to AgendaListPagination

## Metrics

**Files created:** 2
**Lines added:** 769 (624 + 145)
**Components created:** 2 (AgendaListFilters, AgendaListPagination)
**Requirements completed:** 6 (ALIST-03, ALIST-04, ALIST-05, ALIST-06, ALIST-08, ALIST-11)
**Duration:** 3 minutes

## Commits

1. **d03fb15** - `feat(13-03): create AgendaListFilters component`
   - Date range filter with quick presets
   - Provider multi-select with checkbox list
   - Service type and status filters
   - Patient search with debounce
   - Clear all filters button
   - Mobile collapsible section

2. **35faa62** - `feat(13-03): create AgendaListPagination component`
   - Page navigation buttons
   - Items per page selector
   - Filter preservation when navigating
   - Responsive layout
