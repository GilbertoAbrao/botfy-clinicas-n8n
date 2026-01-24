---
phase: 22-mcp-server
plan: 02
subsystem: mcp
tags: [mcp, modelcontextprotocol, zod, agent-api, claude-desktop]

# Dependency graph
requires:
  - phase: 22-01
    provides: MCP Server foundation with HTTP client and logging
provides:
  - 5 MCP tool handlers for read-only agent APIs (slots, appointments, patient, pre-checkin, instructions)
  - registerQueryTools function for MCP server integration
affects: [22-03, 22-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MCP tool handler pattern with Zod input schemas"
    - "Error handling with isError flag for MCP protocol compliance"
    - "Structured content + summary text response format"

key-files:
  created:
    - src/mcp/tools/buscar-slots.ts
    - src/mcp/tools/buscar-agendamentos.ts
    - src/mcp/tools/buscar-paciente.ts
    - src/mcp/tools/status-precheckin.ts
    - src/mcp/tools/buscar-instrucoes.ts
    - src/mcp/tools/query.ts
  modified: []

key-decisions:
  - "Tool names match N8N tool names exactly for consistency"
  - "Input validation done at tool level (at least one parameter required)"
  - "All query tools use GET requests via callAgentApi"

patterns-established:
  - "MCP tool structure: name, title, description, inputSchema, handler"
  - "Handler returns { content: [], structuredContent: data } on success"
  - "Handler returns { content: [], isError: true } on error"
  - "Registration via single registerQueryTools() function"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 22 Plan 02: Query Tools Summary

**5 MCP tool handlers for read-only agent APIs (slots, appointments, patient, pre-checkin, instructions) with Zod validation and structured responses**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-24T23:28:14Z
- **Completed:** 2026-01-24T23:30:38Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Created 5 query tool handlers matching existing N8N tool names
- Implemented Zod input schemas matching API route validation
- Added MCP-compliant error handling with isError flag
- Created registerQueryTools function for server integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create slot and appointment query tools** - `0fdd5d8` (feat)
2. **Task 2: Create patient, pre-checkin, and instructions query tools** - `3301b38` (feat)
3. **Task 3: Create query tools index with McpServer registration** - `1f8da3d` (feat)

## Files Created/Modified
- `src/mcp/tools/buscar-slots.ts` - Searches available appointment slots by date
- `src/mcp/tools/buscar-agendamentos.ts` - Searches appointments with filters and pagination
- `src/mcp/tools/buscar-paciente.ts` - Searches patient by phone/CPF/name with upcoming appointments
- `src/mcp/tools/status-precheckin.ts` - Queries pre-checkin status with document tracking
- `src/mcp/tools/buscar-instrucoes.ts` - Searches procedure instructions by service/type
- `src/mcp/tools/query.ts` - Registers all 5 query tools with MCP server

## Decisions Made
- **Tool naming:** Used exact N8N tool names (buscar_slots_disponiveis, buscar_agendamentos, etc.) for consistency between N8N and MCP implementations
- **Input validation:** At-least-one-parameter validation done at tool handler level for buscar_paciente and status_pre_checkin (improves error messages before HTTP call)
- **Response format:** All tools return both summary text (for display) and structuredContent (for programmatic access)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Query tools complete and ready for MCP server integration
- Write tools (22-03) can follow same pattern
- All query tools tested to verify callAgentApi integration and error handling

---
*Phase: 22-mcp-server*
*Completed: 2026-01-24*
