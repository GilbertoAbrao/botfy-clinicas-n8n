---
phase: 20-complex-tools
plan: 03
subsystem: document-processing
tags: [gpt-4o-vision, supabase-storage, multipart-form, idempotency, brazilian-documents]

# Dependency graph
requires:
  - phase: 20-complex-tools
    plan: 01
    provides: Document type definitions, Zod schemas, file validator
  - phase: 20-complex-tools
    plan: 02
    provides: Vision extractor, storage service
provides:
  - POST /api/agent/documentos/processar endpoint
  - Document processing service orchestrating validation, extraction, storage
  - Error handler mappings for document-specific errors
affects:
  - 20-04: Document management API uses storage path from processing
  - 21: N8N integration will use this endpoint

# Tech tracking
tech-stack:
  added: []  # All dependencies added in 20-01
  patterns:
    - Multipart form data handling with native Next.js req.formData()
    - File metadata hash for idempotency (not content, for performance)
    - PHI-safe logging (document type, confidence, duration only)

key-files:
  created:
    - src/lib/services/document-service.ts
    - src/app/api/agent/documentos/processar/route.ts
  modified:
    - src/lib/agent/error-handler.ts

key-decisions:
  - "File metadata hash for idempotency (patientId + filename + size, not file content)"
  - "Native req.formData() for multipart (no formidable/multer dependency)"
  - "PHI-safe logging: only document type, duration, confidence level"

patterns-established:
  - "Service layer orchestration: processDocument() coordinates validate -> extract -> store"
  - "Multipart form data with idempotency: metadata hash avoids reading file twice"

# Metrics
duration: 12min
completed: 2026-01-24
---

# Phase 20 Plan 03: Document Processing API Summary

**POST /api/agent/documentos/processar endpoint with full pipeline: file validation, GPT-4o Vision extraction, Supabase storage, and idempotency support**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-24T14:00:00Z
- **Completed:** 2026-01-24T14:12:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Document processing API endpoint accepting multipart form data with Bearer auth
- processDocument service orchestrating validation, Vision extraction, and storage
- Error handler updated with 10 document-specific error mappings (400, 413, 415, 422, 500)
- Idempotency support using file metadata hash for duplicate prevention
- PHI-safe audit logging (document type, confidence, file size - no patient data)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update error handler with document-specific errors** - `5ea7b00` (feat)
2. **Task 2: Create document processing service** - `4ab18e8` (feat)
3. **Task 3: Create document processing API route** - `e3cb2e1` (feat)

## Files Created/Modified

- `src/lib/agent/error-handler.ts` - Added 10 document-specific error mappings
- `src/lib/services/document-service.ts` - processDocument() orchestrating full pipeline
- `src/app/api/agent/documentos/processar/route.ts` - POST handler with multipart, idempotency, audit logging

## Decisions Made

1. **File metadata hash for idempotency** - Using patientId + filename + file size instead of content hash avoids reading the file twice (once for hash, once for validation), improving performance for large files.

2. **Native req.formData()** - Using Next.js built-in multipart parsing instead of formidable or multer reduces dependencies and complexity.

3. **PHI-safe logging** - Only logging document type, processing duration, and confidence level - no patient IDs, names, or document content in logs.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Supabase Storage bucket must exist** (from Plan 02):
1. Go to Supabase Dashboard > Storage
2. Create bucket named `patient-documents`
3. Set bucket to private (not public)

**Environment variable required:**
- `OPENAI_API_KEY` - For GPT-4o Vision API access

## Next Phase Readiness

Ready for Phase 20 completion:
- All CMPLX-01 and CMPLX-02 requirements satisfied
- Document processing API fully functional
- Pipeline: validation -> Vision extraction -> Supabase storage -> audit log

Integration points ready:
- `POST /api/agent/documentos/processar` accepts multipart/form-data
- Returns ProcessDocumentResult with extracted fields and storage path
- Supports idempotency key for retry safety

---
*Phase: 20-complex-tools*
*Completed: 2026-01-24*
