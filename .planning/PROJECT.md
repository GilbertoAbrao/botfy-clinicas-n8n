# Botfy ClinicOps - Console Administrativo

## What This Is

Console administrativo web para a equipe da clínica gerenciar o sistema Botfy ClinicOps. Permite visualizar agenda, pacientes, conversas WhatsApp e identificar problemas que precisam de intervenção humana através de um dashboard de alertas centralizado com priorização inteligente e analytics. Inclui APIs para o AI Agent do N8N consumir diretamente via HTTP.

## Core Value

Dashboard de alertas que mostra "at glance" tudo que precisa de atenção: conversas travadas, pré check-ins pendentes, agendamentos não confirmados e handoffs para humanos (normais e causados por erros). A equipe precisa saber rapidamente onde intervir.

## Current Milestone: v2.1 N8N Agent HTTP Tools Migration

**Goal:** Migrate N8N AI Agent workflow from `toolWorkflow` sub-workflows to `toolHttpRequest` nodes that call Next.js Agent APIs directly.

**Target features:**
- Replace 10 `toolWorkflow` nodes with `toolHttpRequest` nodes
- Configure Bearer token authentication in HTTP Request nodes
- Validate all 10 tools work correctly with Agent APIs
- Archive sub-workflows after successful migration

---

## Current State

**v2.0 Agent API Migration shipped: 2026-01-25**

- 22 phases, 87 plans completed (v1.0 + v1.1 + v1.2 + v2.0)
- 42,505 lines of TypeScript across 420+ files
- Production-ready with HIPAA compliance
- 11 Agent APIs for N8N AI Agent consumption
- MCP Server for Claude Desktop integration

**Tech Stack:**
- Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- Supabase Auth + PostgreSQL + Realtime + Storage
- Schedule-X calendar + TZDate for timezone handling
- Prisma ORM with RLS policies
- OpenAI GPT-4o Vision for document processing
- MCP SDK for Claude Desktop integration

## Requirements

### Validated (v1.0 + v1.1 + v1.2 + v2.0)

- ✓ **Dashboard de Alertas** — Real-time alert queue with filtering, sorting, priority scoring, pattern detection — v1.0
- ✓ **Gestão de Agenda** — Calendar views, appointment CRUD, waitlist auto-fill, N8N sync — v1.0
- ✓ **Gestão de Pacientes** — Search, profiles, CRUD, document upload, no-show tracking — v1.0
- ✓ **Monitoramento de Conversas** — WhatsApp thread viewer, AI/human indicators, clear memory — v1.0
- ✓ **One-Click Interventions** — Reschedule, send message from alert detail view — v1.0
- ✓ **Configurações do Sistema** — Services, users, business hours, notification preferences — v1.0
- ✓ **Analytics & Smart Features** — Priority scoring, pattern detection, no-show risk prediction, CSV export — v1.0
- ✓ **Autenticação e Segurança** — RBAC (Admin/Atendente), 6-year audit logging, session timeout — v1.0
- ✓ **N8N Anti No-Show Fix** — Workflow saves `risco_noshow` and `mensagem_enviada` to database — v1.1
- ✓ **CRUD config_lembretes** — Admin UI for reminder configurations (48h/24h/2h) with validation — v1.1
- ✓ **Painel lembretes_enviados** — Read-only history with filters by date, patient, status, risk score — v1.1
- ✓ **Analytics de Risco No-Show** — Dashboard with distribution, predicted vs actual, patterns by day/time/service — v1.1
- ✓ **Agenda List View** — Toggle calendário/lista, tabela com filtros avançados, ações rápidas, mobile cards — v1.2
- ✓ **Pre-Checkin Dashboard** — Status tracking, analytics, timeline, N8N webhook reminders — v1.2
- ✓ **CRUD Instruções de Procedimentos** — 7 instruction types, WhatsApp preview, soft delete — v1.2
- ✓ **Gestão de Documentos Paciente** — Preview, approve/reject, bulk actions, Supabase Storage — v1.2
- ✓ **Agent API Foundation** — Bearer token auth, bcrypt API keys, HIPAA audit logging, flexible date validation — v2.0
- ✓ **Query Tools (5 APIs)** — slots, agendamentos, paciente, pre-checkin status, instrucoes — v2.0
- ✓ **Write Tools (5 APIs)** — criar/reagendar/cancelar agendamento, atualizar paciente, confirmar presença — v2.0
- ✓ **Document Processing** — GPT-4o Vision for RG, CPF, CNS, insurance card extraction — v2.0
- ✓ **N8N Integration Docs** — Migration checklist, gradual rollout, rollback <5min — v2.0
- ✓ **MCP Server** — 11 tools wrapper for Claude Desktop via stdio transport — v2.0

### Active (v2.1)

- **HTTP-01**: Replace `buscar_slots_disponiveis` toolWorkflow with toolHttpRequest calling GET /api/agent/slots
- **HTTP-02**: Replace `buscar_agendamentos` toolWorkflow with toolHttpRequest calling GET /api/agent/agendamentos
- **HTTP-03**: Replace `buscar_paciente` toolWorkflow with toolHttpRequest calling GET /api/agent/paciente
- **HTTP-04**: Replace `status_pre_checkin` toolWorkflow with toolHttpRequest calling GET /api/agent/pre-checkin/status
- **HTTP-05**: Replace `buscar_instrucoes` toolWorkflow with toolHttpRequest calling GET /api/agent/instrucoes
- **HTTP-06**: Replace `criar_agendamento` toolWorkflow with toolHttpRequest calling POST /api/agent/agendamentos
- **HTTP-07**: Replace `reagendar_agendamento` toolWorkflow with toolHttpRequest calling PATCH /api/agent/agendamentos/:id
- **HTTP-08**: Replace `cancelar_agendamento` toolWorkflow with toolHttpRequest calling DELETE /api/agent/agendamentos/:id
- **HTTP-09**: Replace `atualizar_dados_paciente` toolWorkflow with toolHttpRequest calling PATCH /api/agent/paciente/:id
- **HTTP-10**: Replace `processar_documento` toolWorkflow with toolHttpRequest calling POST /api/agent/documentos/processar

### Out of Scope

- Integração direta com N8N (workflows não são editados pelo console) — *exceção: v1.1 faz fix pontual no INSERT*
- Envio direto de mensagens WhatsApp pelo console (usa wa.me deep links)
- Sistema de pagamento/financeiro
- Gestão de múltiplas clínicas (single-tenant)
- Mobile native app (web-first with responsive design)
- Full EHR functionality
- ML-based predictions (using heuristics for MVP)

## Context

**Sistema v2.0:**
- Complete healthcare operations console with alert-first design
- Full CRUD for patients, appointments, services, users
- WhatsApp conversation monitoring with clear memory
- N8N webhook integration for appointment sync
- No-show risk management: workflow fix + config + history + analytics
- 11 Agent APIs for N8N AI Agent direct consumption
- MCP Server for Claude Desktop integration
- GPT-4o Vision document processing

**Deferred to v2.1+:**
- Two-Factor Authentication
- ML-based no-show predictions (currently heuristic)
- Batch interventions (resolve multiple alerts)
- Password Reset UI
- Drag-and-drop calendar rescheduling
- Service layer consolidation (FOUND-04)
- Per-tool API keys with granular permissions
- Rate limiting for external API access
- OpenAPI/Swagger documentation generation
- HTTP/SSE transport for remote MCP access

**Tech Debt:**
- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10, 15
- FOUND-04 deferred: Service layer extraction (agent services created fresh instead of extracted)
- console.error() used for logging (should add DataDog/Sentry in production)
- 9 screenshot placeholders in N8N credential-setup.md
- 3 N8N sub-workflows not yet exported to workflows-backup/

## Constraints

- **Stack**: Next.js + shadcn/ui + Tailwind CSS + TypeScript
- **Database**: Supabase PostgreSQL (gkweofpjwzsvlvnvfbom.supabase.co)
- **Autenticação**: Supabase Auth com email/senha + Agent API keys
- **Deploy**: EasyPanel
- **Design**: Botfy brand identity (#0048FF, #E8F0FF, #0A1628)
- **Compatibilidade**: N8N workflows consume console APIs, console is read/write to database
- **HIPAA**: Audit logging with agentId, RLS policies, PHI encryption at rest

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 full-stack | Modern framework with API routes and SSR | ✓ Good |
| shadcn/ui components | Accessible, customizable, Tailwind-based | ✓ Good |
| Supabase Auth | Native integration with existing database | ✓ Good |
| Schedule-X calendar | Better TypeScript support than react-big-calendar | ✓ Good |
| TZDate for timezone | DST-aware date handling for Brazil | ✓ Good |
| Heuristics over ML | No training data needed for MVP | ✓ Good |
| WhatsApp deep links | Respects constraint of no direct messaging | ✓ Good |
| Fire-and-forget audit | Logging doesn't block operations | ✓ Good |
| Defense-in-depth auth | Middleware + route checks + RLS | ✓ Good |
| Supabase admin client for N8N tables | Bypass RLS for tables owned by N8N workflow | ✓ Good |
| recharts for analytics | Modern charting library with good React integration | ✓ Good |
| Risk level thresholds | baixo (<40), medio (40-69), alto (≥70) matches UI patterns | ✓ Good |
| bcrypt for API Key Hashing | 12 salt rounds, secure credential storage | ✓ Good |
| Bearer token auth for Agent | Standard HTTP auth, easy N8N integration | ✓ Good |
| Service layer pattern | Business logic in services, HTTP in routes | ✓ Good |
| Header Auth vs Bearer Auth in N8N | Header Auth more reliable due to N8N issues | ✓ Good |
| Gradual rollout (10%→50%→100%) | Safe migration with rollback capability | ✓ Good |
| GPT-4o Vision for documents | High accuracy Brazilian document extraction | ✓ Good |
| MCP stdio transport | Native Claude Desktop integration | ✓ Good |
| Create services fresh vs extract | Faster implementation, different use cases | ⚡ Tech debt |

---
*Last updated: 2026-01-25 — v2.1 milestone started*
