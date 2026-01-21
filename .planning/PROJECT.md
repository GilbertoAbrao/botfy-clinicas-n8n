# Botfy ClinicOps - Console Administrativo

## What This Is

Console administrativo web para a equipe da clínica gerenciar o sistema Botfy ClinicOps. Permite visualizar agenda, pacientes, conversas WhatsApp e identificar problemas que precisam de intervenção humana através de um dashboard de alertas centralizado com priorização inteligente e analytics.

## Core Value

Dashboard de alertas que mostra "at glance" tudo que precisa de atenção: conversas travadas, pré check-ins pendentes, agendamentos não confirmados e handoffs para humanos (normais e causados por erros). A equipe precisa saber rapidamente onde intervir.

## Current State

**v1.2 Agenda List View + Pre-Checkin Management shipped: 2026-01-21**

- 16 phases, 59 plans, 143 requirements completed (v1.0 + v1.1 + v1.2)
- 36,339 lines of TypeScript across 370+ files
- Production-ready with HIPAA compliance
- Full agenda management, pre-checkin workflow, and document validation

**Tech Stack:**
- Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- Supabase Auth + PostgreSQL + Realtime + Storage
- Schedule-X calendar + TZDate for timezone handling
- Prisma ORM with RLS policies

## Requirements

### Validated (v1.0 + v1.1 + v1.2)

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

### Active

*No active requirements — run `/gsd:new-milestone` to define v1.3 or v2.0*

### Out of Scope

- Integração direta com N8N (workflows não são editados pelo console) — *exceção: v1.1 faz fix pontual no INSERT*
- Envio direto de mensagens WhatsApp pelo console (usa wa.me deep links)
- Sistema de pagamento/financeiro
- Gestão de múltiplas clínicas (single-tenant)
- Mobile native app (web-first with responsive design)
- Full EHR functionality
- ML-based predictions (using heuristics for MVP)

## Context

**Sistema v1.1:**
- Complete healthcare operations console with alert-first design
- Full CRUD for patients, appointments, services, users
- WhatsApp conversation monitoring with clear memory
- N8N webhook integration for appointment sync
- No-show risk management: workflow fix + config + history + analytics
- Risk analytics dashboard with recharts visualizations

**Deferred to v2.0+:**
- Two-Factor Authentication
- ML-based no-show predictions (currently heuristic)
- Batch interventions (resolve multiple alerts)
- Password Reset UI
- Drag-and-drop calendar rescheduling

**Tech Debt:**
- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6, 9, 10

## Constraints

- **Stack**: Next.js + shadcn/ui + Tailwind CSS + TypeScript
- **Database**: Supabase PostgreSQL (gkweofpjwzsvlvnvfbom.supabase.co)
- **Autenticação**: Supabase Auth com email/senha
- **Deploy**: EasyPanel
- **Design**: Botfy brand identity (#0048FF, #E8F0FF, #0A1628)
- **Compatibilidade**: N8N workflows unchanged, console is read/write to database only
- **HIPAA**: Audit logging, RLS policies, PHI encryption at rest

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

---
*Last updated: 2026-01-21 after v1.2 milestone shipped*
