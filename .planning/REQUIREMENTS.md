# Requirements: Botfy ClinicOps v2.0 Agent API Migration

**Defined:** 2026-01-24
**Core Value:** Dashboard de alertas que mostra "at glance" tudo que precisa de atenção

## v2.0 Requirements

Requirements for migrating N8N AI Agent tools to Next.js APIs + MCP Server.

### API Foundation

- [x] **FOUND-01**: Agent authentication via API key (Bearer token) in middleware
- [x] **FOUND-02**: Shared error handling utility returning `{success, error, details}` format
- [x] **FOUND-03**: Agent audit logging with `agentId` and correlation ID for HIPAA compliance
- [ ] **FOUND-04**: Service layer extraction for business logic reuse across tools (deferred to Phase 18+)
- [x] **FOUND-05**: Flexible input validation with Zod accepting multiple date formats

### Query Tools (Read Operations)

- [x] **QUERY-01**: `GET /api/agent/slots` — Returns available appointment slots for date/period
- [x] **QUERY-02**: `GET /api/agent/agendamentos` — Returns patient appointments with filters
- [x] **QUERY-03**: `GET /api/agent/paciente` — Searches patient by phone or CPF
- [x] **QUERY-04**: `GET /api/agent/pre-checkin/status` — Returns pre-checkin document status
- [x] **QUERY-05**: `GET /api/agent/instrucoes` — Returns procedure instructions by service/type

### Write Tools (Create/Update Operations)

- [x] **WRITE-01**: `POST /api/agent/agendamentos` — Creates appointment with conflict detection and idempotency
- [x] **WRITE-02**: `PATCH /api/agent/agendamentos/:id` — Reschedules appointment with validation
- [x] **WRITE-03**: `DELETE /api/agent/agendamentos/:id` — Cancels appointment with reason
- [x] **WRITE-04**: `PATCH /api/agent/paciente/:id` — Updates patient data with partial update support
- [x] **WRITE-05**: `POST /api/agent/agendamentos/:id/confirmar` — Confirms appointment attendance

### Complex Tools (Specialized Operations)

- [x] **CMPLX-01**: `POST /api/agent/documentos/processar` — Processes uploaded document with validation
- [x] **CMPLX-02**: Document type detection and field extraction from images

### N8N Integration

- [ ] **N8N-01**: HTTP Request node configured with Bearer token credentials
- [ ] **N8N-02**: N8N credential created and encrypted for API key storage
- [ ] **N8N-03**: Gradual rollout mechanism (10% → 50% → 100%)
- [ ] **N8N-04**: Sub-workflows archived (not deleted) after successful migration
- [ ] **N8N-05**: Rollback procedure documented and tested

### MCP Server (Optional)

- [ ] **MCP-01**: MCP Server wrapper with stdio transport exposing all 11 tools
- [ ] **MCP-02**: Claude Desktop configuration file for local testing
- [ ] **MCP-03**: Error handling and heartbeat logging for reliability

## Future Requirements (v2.1+)

### API Enhancements

- **FUTURE-01**: Per-tool API keys with granular permissions
- **FUTURE-02**: Rate limiting for external API access
- **FUTURE-03**: OpenAPI/Swagger documentation generation
- **FUTURE-04**: API versioning (`/v1/`, `/v2/` prefix)

### MCP Enhancements

- **FUTURE-05**: HTTP/SSE transport for remote MCP access
- **FUTURE-06**: MCP resources for read-only data access
- **FUTURE-07**: MCP prompts for guided workflows

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time WebSocket APIs | N8N uses request/response pattern, no streaming needed |
| GraphQL layer | REST is simpler for N8N HTTP Request node |
| Multi-tenant API keys | Single clinic deployment, not SaaS |
| Third-party API access | APIs are internal only, called by N8N |
| Webhook callbacks from APIs | N8N handles async via polling/Execute Workflow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 17 | Complete |
| FOUND-02 | Phase 17 | Complete |
| FOUND-03 | Phase 17 | Complete |
| FOUND-04 | Phase 18+ | Deferred |
| FOUND-05 | Phase 17 | Complete |
| QUERY-01 | Phase 18 | Complete |
| QUERY-02 | Phase 18 | Complete |
| QUERY-03 | Phase 18 | Complete |
| QUERY-04 | Phase 18 | Complete |
| QUERY-05 | Phase 18 | Complete |
| WRITE-01 | Phase 19 | Complete |
| WRITE-02 | Phase 19 | Complete |
| WRITE-03 | Phase 19 | Complete |
| WRITE-04 | Phase 19 | Complete |
| WRITE-05 | Phase 19 | Complete |
| CMPLX-01 | Phase 20 | Complete |
| CMPLX-02 | Phase 20 | Complete |
| N8N-01 | Phase 21 | Pending |
| N8N-02 | Phase 21 | Pending |
| N8N-03 | Phase 21 | Pending |
| N8N-04 | Phase 21 | Pending |
| N8N-05 | Phase 21 | Pending |
| MCP-01 | Phase 22 | Pending |
| MCP-02 | Phase 22 | Pending |
| MCP-03 | Phase 22 | Pending |

**Coverage:**
- v2.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 — Phase 19 Write Tools complete (WRITE-01 to WRITE-05)*
