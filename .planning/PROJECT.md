# Botfy ClinicOps - Console Administrativo

## What This Is

Console administrativo web para a equipe da clínica gerenciar o sistema Botfy ClinicOps. Permite visualizar agenda, pacientes, conversas WhatsApp e identificar problemas que precisam de intervenção humana através de um dashboard de alertas centralizado com priorização inteligente e analytics.

## Core Value

Dashboard de alertas que mostra "at glance" tudo que precisa de atenção: conversas travadas, pré check-ins pendentes, agendamentos não confirmados e handoffs para humanos (normais e causados por erros). A equipe precisa saber rapidamente onde intervir.

## Current State

**v1.0 MVP shipped: 2026-01-17**

- 8 phases, 32 plans, 79 requirements completed
- 21,654 lines of TypeScript across 244 files
- Production-ready with HIPAA compliance

**Tech Stack:**
- Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- Supabase Auth + PostgreSQL + Realtime + Storage
- Schedule-X calendar + TZDate for timezone handling
- Prisma ORM with RLS policies

## Requirements

### Validated (v1.0)

- ✓ **Dashboard de Alertas** — Real-time alert queue with filtering, sorting, priority scoring, pattern detection
- ✓ **Gestão de Agenda** — Calendar views, appointment CRUD, waitlist auto-fill, N8N sync
- ✓ **Gestão de Pacientes** — Search, profiles, CRUD, document upload, no-show tracking
- ✓ **Monitoramento de Conversas** — WhatsApp thread viewer, AI/human indicators, clear memory
- ✓ **One-Click Interventions** — Reschedule, send message from alert detail view
- ✓ **Configurações do Sistema** — Services, users, business hours, notification preferences
- ✓ **Analytics & Smart Features** — Priority scoring, pattern detection, no-show risk prediction, CSV export
- ✓ **Autenticação e Segurança** — RBAC (Admin/Atendente), 6-year audit logging, session timeout

### Active

(Fresh requirements for v1.1+ to be defined)

### Out of Scope

- Integração direta com N8N (workflows não são editados pelo console)
- Envio direto de mensagens WhatsApp pelo console (usa wa.me deep links)
- Sistema de pagamento/financeiro
- Gestão de múltiplas clínicas (single-tenant)
- Mobile native app (web-first with responsive design)
- Full EHR functionality
- ML-based predictions (using heuristics for MVP)

## Context

**Sistema v1.0:**
- Complete healthcare operations console
- Alert-first design with smart prioritization
- Full CRUD for patients, appointments, services, users
- WhatsApp conversation monitoring with clear memory
- N8N webhook integration for appointment sync
- Analytics dashboard with KPIs and pattern detection

**Deferred to v1.1+:**
- Two-Factor Authentication
- ML-based no-show predictions (currently heuristic)
- Batch interventions (resolve multiple alerts)
- Password Reset UI
- Drag-and-drop calendar rescheduling

**Tech Debt:**
- formatPhone/formatCPF utilities duplicated in components
- Missing VERIFICATION.md for phases 4, 5, 6

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

---
*Last updated: 2026-01-17 after v1.0 milestone*
