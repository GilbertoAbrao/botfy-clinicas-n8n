---
phase: 20-complex-tools
plan: 01
subsystem: document-processing
tags: [openai, gpt-4o-vision, file-type, magic-bytes, zod, brazilian-documents]

# Dependency graph
requires:
  - phase: 17-api-foundation
    provides: Type patterns and validation conventions
provides:
  - Document type definitions (RG, CPF, CNS, InsuranceCard, Unknown)
  - Magic byte file validation with OWASP-compliant security
  - Zod schemas for GPT-4o Vision structured outputs
affects:
  - 20-02: Vision API service uses types and schemas
  - 20-03: Document processing API uses validator and types

# Tech tracking
tech-stack:
  added:
    - openai@6.16.0 (structured outputs with zodResponseFormat)
    - file-type@21.3.0 (magic byte detection)
  patterns:
    - Magic byte validation over MIME type checking
    - Discriminated union for document type narrowing
    - Zod schemas for Vision API structured extraction

key-files:
  created:
    - src/lib/document/document-types.ts
    - src/lib/document/document-validator.ts
    - src/lib/validations/document-schemas.ts
  modified:
    - package.json

key-decisions:
  - "Magic bytes via file-type library for OWASP-compliant file validation"
  - "Discriminated unions for type-safe document narrowing"
  - "Zod schemas compatible with OpenAI zodResponseFormat"
  - "5MB file size limit (sufficient for document photos)"
  - "HEIC support without sharp dependency (native iOS format)"

patterns-established:
  - "Document type validation: always use validateDocumentUpload() before processing"
  - "Confidence levels: high/medium/low for extraction quality indication"
  - "Date format: YYYY-MM-DD for all date fields in extracted documents"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 20 Plan 01: Document Types and Validation Summary

**OWASP-compliant file validator with magic byte detection and Zod schemas for GPT-4o Vision structured document extraction**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-24T18:55:45Z
- **Completed:** 2026-01-24T18:57:49Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Installed openai@6.16.0 and file-type@21.3.0 dependencies
- Created comprehensive type definitions for 4 Brazilian document types + Unknown
- Built secure file validator with magic byte verification and MIME spoofing protection
- Defined Zod schemas for GPT-4o Vision API structured outputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Install npm dependencies** - `2ea9b45` (chore)
2. **Task 2: Create document type definitions** - `e6836e8` (feat)
3. **Task 3: Create file validator with magic byte verification** - `ad9f7ef` (feat)
4. **Task 4: Create Zod schemas for Vision API structured outputs** - `c6dfcd8` (feat)

## Files Created/Modified

- `package.json` - Added openai and file-type dependencies
- `src/lib/document/document-types.ts` - Type definitions for document processing
- `src/lib/document/document-validator.ts` - OWASP-compliant file validation
- `src/lib/validations/document-schemas.ts` - Zod schemas for Vision API

## Decisions Made

1. **Magic byte validation over MIME type**: Using file-type library to detect actual file content prevents file extension spoofing attacks (OWASP recommendation)
2. **Discriminated union pattern**: Using `documentType` as discriminator enables TypeScript narrowing and efficient Zod parsing
3. **5MB file limit**: Sufficient for document photos while preventing abuse; can be adjusted later
4. **HEIC support without sharp**: Native iOS format supported; HEIC-to-JPEG conversion can be added later if needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully on first attempt.

## User Setup Required

None - no external service configuration required. OpenAI API key configuration will be handled in Plan 02.

## Next Phase Readiness

Ready for Plan 02 (Vision API Service):
- Type definitions available for Vision API response typing
- Zod schemas ready for zodResponseFormat() usage
- File validator ready for upload processing

Exports available:
- `DocumentType`, `ExtractedDocument`, `ProcessDocumentResult` from document-types.ts
- `validateDocumentUpload`, `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE` from document-validator.ts
- `BrazilianDocumentSchema`, individual schemas from document-schemas.ts

---
*Phase: 20-complex-tools*
*Completed: 2026-01-24*
