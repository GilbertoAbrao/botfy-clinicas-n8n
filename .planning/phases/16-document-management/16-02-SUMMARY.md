---
phase: 16-document-management
plan: 02
subsystem: api
tags: [api-routes, supabase, audit, documents, rbac]

# Dependency graph
requires:
  - phase: 16-01
    provides: Zod schemas, PatientDocument types, audit actions
provides:
  - GET /api/patient-documents endpoint with filters and pagination
  - POST /api/patient-documents/[id]/approve endpoint
  - POST /api/patient-documents/[id]/reject endpoint
  - GET /api/patient-documents/[id]/preview endpoint for signed URLs
  - POST /api/patient-documents/bulk endpoint for batch operations
affects: [16-03, 16-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase query with patient join on documentos_paciente table"
    - "Status counts returned for filter badges"
    - "Signed URL generation for document preview"
    - "Bulk operations with single audit log entry"

key-files:
  created:
    - src/app/api/patient-documents/route.ts
    - src/app/api/patient-documents/[id]/approve/route.ts
    - src/app/api/patient-documents/[id]/reject/route.ts
    - src/app/api/patient-documents/[id]/preview/route.ts
    - src/app/api/patient-documents/bulk/route.ts
  modified: []

key-decisions:
  - "Status counts included in GET response for filter badges"
  - "Client-side search filtering (Supabase can't filter on joined fields)"
  - "1-hour expiry for signed URLs (same as existing pattern)"
  - "Bulk reject requires observacoes (reason)"

patterns-established:
  - "documentos_paciente API routes following pre-checkin pattern"
  - "Bulk operations with array of document IDs"

# Metrics
duration: 1min 51sec
completed: 2026-01-21
---

# Phase 16 Plan 02: API Routes Summary

**API routes for document management: GET list with filters/pagination, approve/reject actions, preview signed URL, and bulk operations**

## Performance

- **Duration:** 1 min 51 sec
- **Started:** 2026-01-21T23:24:08Z
- **Completed:** 2026-01-21T23:25:59Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments

- Created GET /api/patient-documents with paginated list, patient join, and status counts
- Implemented filters for status (validado boolean mapping), type, date range, search
- Created POST /api/patient-documents/[id]/approve to set validado=true
- Created POST /api/patient-documents/[id]/reject to set validado=false with required reason
- Created GET /api/patient-documents/[id]/preview for signed URL generation (1-hour expiry)
- Created POST /api/patient-documents/bulk for batch approve/reject operations
- All endpoints include RBAC (ADMIN/ATENDENTE) and audit logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GET /api/patient-documents endpoint** - `1380e94` (feat)
2. **Task 2: Add approve, reject, and preview endpoints** - `c44223c` (feat)
3. **Task 3: Add bulk approve/reject endpoint** - `4049efc` (feat)

## Files Created

- `src/app/api/patient-documents/route.ts` - GET endpoint for document list with filters and pagination
- `src/app/api/patient-documents/[id]/approve/route.ts` - POST endpoint for approving single document
- `src/app/api/patient-documents/[id]/reject/route.ts` - POST endpoint for rejecting single document
- `src/app/api/patient-documents/[id]/preview/route.ts` - GET endpoint for signed URL
- `src/app/api/patient-documents/bulk/route.ts` - POST endpoint for bulk actions

## API Response Structure

**GET /api/patient-documents:**
```json
{
  "data": [{ ...PatientDocument with paciente join }],
  "pagination": { "page": 1, "limit": 50, "total": 100, "totalPages": 2 },
  "counts": { "pendente": 10, "aprovado": 50, "rejeitado": 40, "total": 100 }
}
```

**POST /api/patient-documents/[id]/approve:**
```json
{ ...updated document }
```

**POST /api/patient-documents/[id]/reject:**
```json
{ ...updated document }
```

**GET /api/patient-documents/[id]/preview:**
```json
{ "url": "https://...", "tipo": "rg" }
```

**POST /api/patient-documents/bulk:**
```json
{ "success": true, "count": 5 }
```

## Decisions Made

- **Status counts in GET response:** Included for filter badge counts (pendente/aprovado/rejeitado/total)
- **Client-side search filtering:** Supabase can't filter on joined fields, acceptable for 50 items/page
- **Signed URL expiry:** 1 hour, consistent with existing patient documents endpoint
- **Bulk reject requires reason:** Validation enforced server-side

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all verifications passed on first attempt.

## User Setup Required

None - all endpoints use existing Supabase configuration.

## Next Phase Readiness

- API endpoints ready for UI components (16-03, 16-04)
- All CRUD operations available for document management dashboard
- Audit logging in place for HIPAA compliance

---
*Phase: 16-document-management*
*Completed: 2026-01-21*
