---
phase: 16-document-management
plan: 03
subsystem: ui
tags: [react, tanstack-table, shadcn-ui, documents, modal, filters]

# Dependency graph
requires:
  - phase: 16-document-management
    provides: PatientDocument types, Zod schemas, getDocumentStatus helper
  - phase: 14-pre-checkin-dashboard
    provides: StatusBadge, PreCheckinFilters, PreCheckinPagination patterns
provides:
  - DocumentStatusBadge component (yellow/green/red status indicators)
  - DocumentTypeBadge component (document type labels)
  - DocumentsTable with TanStack row selection
  - DocumentsFilters with URL-based state management
  - DocumentsPagination with preserved filters
  - DocumentPreviewModal for image/PDF preview
  - DocumentRejectModal with required reason validation
  - DocumentsBulkActions floating action bar
affects: [16-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack table with controlled row selection state"
    - "stopPropagation pattern for action buttons in clickable rows"
    - "Signed URL preview fetch pattern"
    - "Required reason validation in rejection modals"
    - "Floating bulk actions bar pattern"

key-files:
  created:
    - src/components/documents/document-status-badge.tsx
    - src/components/documents/document-type-badge.tsx
    - src/components/documents/documents-pagination.tsx
    - src/components/documents/documents-table.tsx
    - src/components/documents/documents-filters.tsx
    - src/components/documents/document-preview-modal.tsx
    - src/components/documents/document-reject-modal.tsx
    - src/components/documents/documents-bulk-actions.tsx
  modified: []

key-decisions:
  - "Use TanStack table with controlled rowSelection state for bulk operations"
  - "Filters use usePathname for route-agnostic component reuse"
  - "Preview modal fetches signed URL via /api/patient-documents/:id/preview"
  - "Reject modal clears form state on close for clean re-open"
  - "Bulk actions bar uses fixed positioning for visibility"

patterns-established:
  - "Row selection with checkbox column using stopPropagation"
  - "Status badge color mapping from DOCUMENT_STATUS_COLORS"
  - "Document type filter dropdown following status filter pattern"
  - "Required reason validation (min 5 chars) for rejections"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 16 Plan 03: Document Management UI Components Summary

**TanStack table with row selection, status/type badges, URL-based filters, preview modal for images/PDFs, and bulk actions bar**

## Performance

- **Duration:** 3 min 15 sec
- **Started:** 2026-01-21T23:24:18Z
- **Completed:** 2026-01-21T23:27:33Z
- **Tasks:** 3
- **Files created:** 8

## Accomplishments

- Created 8 document management UI components following pre-checkin patterns
- Implemented TanStack table with controlled row selection for bulk operations
- Built filter controls with status, type, date range, and search with 300ms debounce
- Added preview modal that fetches signed URLs and displays images/PDFs
- Created reject modal with required reason validation (min 5 chars)
- Built floating bulk actions bar for approve/reject/clear operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create status badge, type badge, and pagination** - `1baca99` (feat)
2. **Task 2: Create documents table with row selection** - `d747d6d` (feat)
3. **Task 3: Create filters, preview modal, reject modal, and bulk actions** - `a360367` (feat)

## Files Created

- `src/components/documents/document-status-badge.tsx` - Colored badge with icon for document status (62 lines)
- `src/components/documents/document-type-badge.tsx` - Badge showing document type label (39 lines)
- `src/components/documents/documents-pagination.tsx` - URL-based pagination with filter preservation (159 lines)
- `src/components/documents/documents-table.tsx` - TanStack table with checkbox selection (324 lines)
- `src/components/documents/documents-filters.tsx` - Status/type/date/search filters with URL sync (545 lines)
- `src/components/documents/document-preview-modal.tsx` - Image/PDF preview with signed URL fetch (236 lines)
- `src/components/documents/document-reject-modal.tsx` - Rejection dialog with required reason (149 lines)
- `src/components/documents/documents-bulk-actions.tsx` - Floating action bar for bulk operations (91 lines)

## Decisions Made

- **Controlled row selection:** Table passes rowSelection state via props for parent component control over bulk actions
- **Route-agnostic filters:** Using usePathname() instead of hardcoded paths allows component reuse
- **Preview URL fetch:** Modal fetches signed URL on open via API, displays image/PDF based on file extension
- **Form cleanup on close:** Reject modal clears reason and error state when closed for clean re-opens
- **Fixed positioning for bulk actions:** Uses fixed bottom-center positioning for visibility regardless of scroll

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all verifications passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All UI components ready for integration in page component (16-04)
- Components follow established patterns from pre-checkin dashboard
- Table exposes controlled row selection state for bulk action coordination
- Preview modal expects /api/patient-documents/:id/preview endpoint (16-02)
- TypeScript compilation verified, all components type-safe

---
*Phase: 16-document-management*
*Completed: 2026-01-21*
