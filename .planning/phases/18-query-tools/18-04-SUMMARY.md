---
phase: 18
plan: 04
status: complete
started: 2026-01-24T17:27:07Z
completed: 2026-01-24T17:28:57Z
duration: 2m
subsystem: agent-api
tags: [pre-checkin, api, agent, supabase, prisma]

# What this plan provides to future phases
provides:
  - GET /api/agent/pre-checkin/status endpoint
  - pre-checkin-service.ts with status aggregation
  - PreCheckinQuery and PreCheckinStatusResult types

# What this plan required from previous phases
requires:
  - phase-17: Agent authentication (withAgentAuth), error handling, validation schemas

# Tech stack changes
tech-stack:
  patterns:
    - Service layer pattern for business logic extraction
    - Supabase admin client for RLS table access
    - Prisma for appointment/patient lookups
    - Fire-and-forget audit logging

# Files tracking
key-files:
  created:
    - src/lib/services/pre-checkin-service.ts
    - src/app/api/agent/pre-checkin/status/route.ts
  modified: []
---

# Phase 18 Plan 04: Pre-Checkin Status API Summary

Pre-checkin status API with service layer for AI Agent to check patient document submission progress.

## What Was Built

This plan implemented the pre-checkin status query API, enabling the N8N AI Agent to tell patients about their pre-checkin progress and pending documents.

### Service Layer: pre-checkin-service.ts

Created the first service in `/src/lib/services/`, establishing the pattern for extracting business logic from route handlers:

```typescript
// Flexible query - at least one parameter required
interface PreCheckinQuery {
  agendamentoId?: number  // Direct lookup
  pacienteId?: number     // Find next appointment for patient
  telefone?: string       // Find patient by phone, then next appointment
}

// Result includes document completion status
interface PreCheckinStatusResult {
  exists: boolean
  status: 'pendente' | 'parcial' | 'completo' | 'rejeitado'
  agendamentoId?: number
  dadosConfirmados: boolean
  documentosEnviados: boolean
  instrucoesEnviadas: boolean
  pendencias: string[] | null
  mensagemEnviadaEm: string | null
  lembreteEnviadoEm: string | null
  appointment?: { dataHora, tipoConsulta, profissional }
}
```

**Key implementation decisions:**
- Uses Supabase admin client for `pre_checkin` table (bypasses RLS for agent access)
- Uses Prisma for appointment lookup (better types than Supabase client)
- Finds next upcoming appointment when searching by patient/phone
- Returns pending status when no pre-checkin record exists (PGRST116 error)

### API Route: GET /api/agent/pre-checkin/status

```bash
# Example request
curl -X GET "https://api.example.com/api/agent/pre-checkin/status?telefone=11999998888" \
  -H "Authorization: Bearer agent_api_key_here"

# Example response
{
  "success": true,
  "data": {
    "exists": true,
    "status": "parcial",
    "agendamentoId": 123,
    "dadosConfirmados": true,
    "documentosEnviados": false,
    "instrucoesEnviadas": true,
    "pendencias": ["RG", "Comprovante de residencia"],
    "mensagemEnviadaEm": "2026-01-24T10:00:00Z",
    "lembreteEnviadoEm": null,
    "appointment": {
      "dataHora": "2026-01-25T14:00:00Z",
      "tipoConsulta": "Consulta",
      "profissional": "Dr. Maria"
    }
  }
}
```

**Query parameters (at least one required):**
- `agendamentoId`: Direct appointment ID lookup
- `pacienteId`: Find next upcoming appointment for patient
- `telefone`: Find patient by phone, then next upcoming appointment

## Task Completion

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create pre-checkin-service.ts with status aggregation | 7a2197d | src/lib/services/pre-checkin-service.ts |
| 2 | Create GET /api/agent/pre-checkin/status route | 853f2d5 | src/app/api/agent/pre-checkin/status/route.ts |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Supabase admin client for pre_checkin | pre_checkin table has RLS policies; admin client bypasses RLS for agent access |
| Prisma for appointment/patient lookup | Better TypeScript types than Supabase client |
| Fire-and-forget audit logging | `.catch(console.error)` prevents audit failures from blocking response |
| No PHI in audit logs | searchType logged instead of telefone to protect patient privacy |
| Pending status on no record | Returns exists: false, status: 'pendente' when no pre_checkin row exists |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:

- [x] src/lib/services/pre-checkin-service.ts exists with getPreCheckinStatus()
- [x] src/app/api/agent/pre-checkin/status/route.ts exists with GET handler
- [x] Service uses Supabase admin client for pre_checkin (RLS table)
- [x] Service uses Prisma for appointment lookup
- [x] Service finds next upcoming appointment when searching by patient/phone
- [x] Route validates input with agentPreCheckinStatusSchema
- [x] Route logs audit with AGENT_VIEW_PRE_CHECKIN action
- [x] TypeScript compiles without errors

## Next Phase Readiness

This plan establishes the service layer pattern for Phase 18. Future plans should follow the same structure:

1. Create service file in `/src/lib/services/` with business logic
2. Create API route that calls service via `withAgentAuth()` HOF
3. Use appropriate data client (Prisma for Prisma tables, Supabase for RLS tables)
4. Fire-and-forget audit logging with no PHI exposure

The remaining Query Tools plans (18-01, 18-02, 18-03, 18-05) can now proceed with this established pattern.
