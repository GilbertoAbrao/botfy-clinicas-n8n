---
phase: 20-complex-tools
plan: 02
subsystem: document-processing
tags: [openai, gpt-4o-vision, supabase-storage, structured-outputs, brazilian-documents]

# Dependency graph
requires:
  - phase: 20-complex-tools
    plan: 01
    provides: Document type definitions and Zod schemas for Vision API
provides:
  - GPT-4o Vision extractor with structured outputs
  - Supabase Storage upload/download service for patient documents
  - Signed URL generation for secure document viewing
affects:
  - 20-03: Document processing API uses these services

# Tech tracking
tech-stack:
  added: []  # Dependencies were added in 20-01
  patterns:
    - Structured outputs with zodResponseFormat for type-safe AI extraction
    - Supabase admin client for server-side storage (RLS bypass)
    - PHI-safe error logging (no patient IDs)

key-files:
  created:
    - src/lib/document/vision-extractor.ts
    - src/lib/document/storage-service.ts
  modified: []

key-decisions:
  - "High detail mode for Vision API: better document text recognition"
  - "Single API call for extraction + classification: no separate detection step"
  - "Storage path format: {patientId}/{documentType}/{timestamp}-{uuid}.{ext}"
  - "1-hour signed URL expiry: balance between usability and security"

patterns-established:
  - "Vision extraction: always use extractDocumentFields() with validated image"
  - "Storage operations: use admin client, auth at route level"
  - "Error handling: wrap OpenAI errors with user-friendly messages"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 20 Plan 02: Vision API Service Summary

**GPT-4o Vision extractor with structured outputs for Brazilian document field extraction and Supabase Storage service for secure patient document handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-24T19:00:42Z
- **Completed:** 2026-01-24T19:02:16Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created GPT-4o Vision extractor with zodResponseFormat for type-safe structured outputs
- Implemented comprehensive system prompt covering all 4 Brazilian document types
- Built Supabase Storage service with upload, signed URL, and delete operations
- Added PHI-safe error handling throughout both services

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Vision extractor service** - `18c8fd4` (feat)
2. **Task 2: Create Supabase Storage service** - `c2c9972` (feat)

## Files Created/Modified

- `src/lib/document/vision-extractor.ts` - GPT-4o Vision wrapper with structured outputs
- `src/lib/document/storage-service.ts` - Supabase Storage operations for patient documents

## Decisions Made

1. **High detail mode for Vision API**: Using `detail: 'high'` parameter ensures better text recognition for document images, critical for accurate field extraction.

2. **Single API call for extraction + classification**: Document type detection happens in the same call as field extraction, reducing latency and API costs.

3. **Storage path format**: Using `{patientId}/{documentType}/{timestamp}-{uuid}.{ext}` provides organization by patient and document type while ensuring uniqueness.

4. **1-hour signed URL expiry**: Balances usability (long enough to view) with security (short enough to limit exposure).

5. **PHI-safe error logging**: Error logs include only error messages and document types, never patient IDs or storage paths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added deleteDocument() function**
- **Found during:** Task 2 (Storage service implementation)
- **Issue:** Plan only specified upload and signed URL, but document deletion is needed for GDPR/LGPD compliance
- **Fix:** Added deleteDocument() function using Supabase remove()
- **Files modified:** src/lib/document/storage-service.ts
- **Verification:** Function exported and compiles
- **Committed in:** c2c9972 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Added necessary functionality for data retention compliance. No scope creep.

## Issues Encountered

None - all tasks completed successfully on first attempt.

## User Setup Required

**Supabase Storage bucket must be created manually:**

1. Go to Supabase Dashboard > Storage
2. Create bucket named `patient-documents`
3. Set bucket to private (not public)
4. Add appropriate RLS policies (or use admin client as implemented)

**Environment variable required:**
- `OPENAI_API_KEY` - Already configured in previous phases

## Next Phase Readiness

Ready for Plan 03 (Document Processing API):
- Vision extractor available: `extractDocumentFields(imageBase64, mimeType)`
- Storage service available: `uploadPatientDocument()`, `getDocumentSignedUrl()`
- File validator from Plan 01: `validateDocumentUpload()`
- Types from Plan 01: `ProcessDocumentResult`, `ExtractedDocument`

API route can now orchestrate: validate -> upload -> extract -> return result

---
*Phase: 20-complex-tools*
*Completed: 2026-01-24*
