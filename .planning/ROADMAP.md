# Roadmap: Botfy ClinicOps v2.1 N8N Agent HTTP Tools Migration

## Overview

Migrate 10 `toolWorkflow` nodes in the N8N AI Agent workflow to `toolHttpRequest` nodes that call Next.js Agent APIs directly. This eliminates sub-workflow overhead, leverages the type-safe APIs built in v2.0, and simplifies debugging. The migration is purely within N8N - no Next.js code changes required.

## Milestones

- v1.0 MVP - Phases 1-8 (shipped 2026-01-17)
- v1.1 Anti No-Show Intelligence - Phases 9-12 (shipped 2026-01-21)
- v1.2 Agenda List View + Pre-Checkin Management - Phases 13-16 (shipped 2026-01-21)
- v2.0 Agent API Migration - Phases 17-22 (shipped 2026-01-25)
- **v2.1 N8N HTTP Tools Migration** - Phases 23-26 (in progress)

## Phases

**Phase Numbering:**
- Continues from v2.0 (phases 17-22)
- v2.1 starts at phase 23

- [x] **Phase 23: Query Tools Migration** - Replace 5 read-only toolWorkflow nodes with toolHttpRequest ✓
- [ ] **Phase 24: Write Tools Migration** - Replace 4 create/update/delete toolWorkflow nodes with toolHttpRequest
- [ ] **Phase 25: Document Tool Migration** - Replace complex multipart document processing tool
- [ ] **Phase 26: Validation & Archive** - Test all migrated tools and archive replaced sub-workflows

## Phase Details

### Phase 23: Query Tools Migration
**Goal**: AI Agent can query data via HTTP requests instead of sub-workflows
**Depends on**: v2.0 Agent APIs (complete)
**Requirements**: HTTP-01, HTTP-02, HTTP-03, HTTP-04, HTTP-05
**Success Criteria** (what must be TRUE):
  1. AI Agent can fetch available appointment slots via toolHttpRequest
  2. AI Agent can search patient appointments by phone/date via toolHttpRequest
  3. AI Agent can lookup patient by phone or CPF via toolHttpRequest
  4. AI Agent can check pre-checkin status via toolHttpRequest
  5. AI Agent can retrieve service instructions via toolHttpRequest
**Plans**: 5 plans (Wave 1: 1 plan, Wave 2: 4 parallel plans)

Plans:
- [x] 23-01-PLAN.md — Setup credential + migrate buscar_slots_disponiveis (Wave 1) ✓
- [x] 23-02-PLAN.md — Migrate buscar_agendamentos (Wave 2) ✓
- [x] 23-03-PLAN.md — Migrate buscar_paciente (Wave 2) ✓
- [x] 23-04-PLAN.md — Migrate status_pre_checkin (Wave 2) ✓
- [x] 23-05-PLAN.md — Migrate buscar_instrucoes (Wave 2) ✓

### Phase 24: Write Tools Migration
**Goal**: AI Agent can create, update, and delete data via HTTP requests instead of sub-workflows
**Depends on**: Phase 23
**Requirements**: HTTP-06, HTTP-07, HTTP-08, HTTP-09
**Success Criteria** (what must be TRUE):
  1. AI Agent can create new appointments via toolHttpRequest
  2. AI Agent can reschedule existing appointments via toolHttpRequest
  3. AI Agent can cancel appointments with reason via toolHttpRequest
  4. AI Agent can update patient contact information via toolHttpRequest
**Plans**: TBD

Plans:
- [ ] 24-01: Migrate criar_agendamento tool
- [ ] 24-02: Migrate reagendar_agendamento tool
- [ ] 24-03: Migrate cancelar_agendamento tool
- [ ] 24-04: Migrate atualizar_dados_paciente tool

### Phase 25: Document Tool Migration
**Goal**: AI Agent can process documents via HTTP requests instead of sub-workflows
**Depends on**: Phase 24
**Requirements**: HTTP-10
**Success Criteria** (what must be TRUE):
  1. AI Agent can submit documents for processing via toolHttpRequest
  2. Document processing handles multipart/base64 correctly
  3. Processing results are returned in expected format
**Plans**: TBD

Plans:
- [ ] 25-01: Migrate processar_documento tool

### Phase 26: Validation & Archive
**Goal**: All migrated tools are tested and old sub-workflows are archived
**Depends on**: Phase 25
**Requirements**: VAL-01, VAL-02
**Success Criteria** (what must be TRUE):
  1. All 10 migrated tools respond correctly when invoked by AI Agent
  2. Error handling returns appropriate error messages and status codes
  3. Bearer token authentication validates correctly for all tools
  4. Old sub-workflows are exported to workflows-backup/ directory
  5. Old sub-workflows are deactivated but not deleted
**Plans**: TBD

Plans:
- [ ] 26-01: End-to-end testing of all migrated tools
- [ ] 26-02: Archive and deactivate replaced sub-workflows

## Progress

**Execution Order:**
Phases execute in numeric order: 23 -> 24 -> 25 -> 26

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 23. Query Tools Migration | v2.1 | 5/5 | Complete ✓ | 2026-01-25 |
| 24. Write Tools Migration | v2.1 | 0/4 | Not started | - |
| 25. Document Tool Migration | v2.1 | 0/1 | Not started | - |
| 26. Validation & Archive | v2.1 | 0/2 | Not started | - |

---

*Roadmap created: 2026-01-25*
*Last updated: 2026-01-25 — Phase 23 complete*
