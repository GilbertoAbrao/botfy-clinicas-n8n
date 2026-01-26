# Botfy ClinicOps - Console Administrativo

Console administrativo web para gerenciar o sistema Botfy ClinicOps. Permite visualizar agenda, pacientes, conversas WhatsApp e identificar problemas que precisam de intervenção humana através de um dashboard de alertas centralizado.

**Versão atual:** v2.0 (Shipped 2026-01-25)

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────>│ Evolution API│────>│ N8N Workflow│────>│  Supabase   │
│  (Paciente) │     │  (Gateway)   │     │  (AI Agent) │     │ (PostgreSQL)│
└─────────────┘     └──────────────┘     └──────┬──────┘     └──────┬──────┘
                                                │                    │
                                                │ HTTP Request       │
                                                ▼                    │
                                         ┌──────────────┐            │
                                         │ Agent APIs   │────────────┤
                                         │ /api/agent/* │            │
                                         │ (11 tools)   │            │
                                         └──────┬───────┘            │
                                                │                    │
                                                ▼                    ▼
                                         ┌──────────────────────────────┐
                                         │   Console Administrativo     │
                                         │   (Next.js Full-Stack)       │
                                         │   - Dashboard de Alertas     │
                                         │   - Gestão de Pacientes      │
                                         │   - Calendário/Agenda        │
                                         │   - Conversas WhatsApp       │
                                         │   - Pre-Checkin Management   │
                                         │   - Document Validation      │
                                         │   - Agent API Routes         │
                                         └──────────────────────────────┘
                                                │
                                                │ (optional)
                                                ▼
                                         ┌──────────────┐
                                         │  MCP Server  │
                                         │ (11 tools)   │
                                         │ Claude Desktop│
                                         └──────────────┘
```

## Stack Tecnológico

### Frontend (Console Administrativo)
- **Framework**: Next.js 16 (App Router, Standalone Output)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Tabelas**: TanStack Table v8
- **Autenticação**: Supabase Auth (email/senha, RBAC)
- **Calendário**: Schedule-X (day/week/month views, multi-provider)
- **Timezone**: @date-fns/tz (DST-aware, Brazil timezones)
- **Charts**: Recharts
- **Deploy**: EasyPanel (Docker)

### Backend (Automação)
- **Workflows**: N8N
- **WhatsApp**: Evolution API
- **IA**: OpenAI GPT-4o-mini (Agente Marília)
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Deploy**: EasyPanel

## Início Rápido

### Pré-requisitos

- Node.js 22+
- npm
- Conta Supabase (já configurada)
- Docker (para deploy)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd botfy-clinicas-n8n

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### Desenvolvimento

**Opção 1: Script automatizado (recomendado)**

```bash
./start-dev.sh
```

Inicia Next.js dev server na porta **3051** com:
- Verificação de dependências
- Limpeza de processos antigos
- Logs em `/tmp/botfy-clinicops-dev.log`
- Ctrl+C para encerrar graciosamente

**Opção 2: Manual**

```bash
PORT=3051 npm run dev
```

Acesse: http://localhost:3051

### Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Dashboard de alertas |
| `/agenda` | Calendário e lista de agendamentos |
| `/pacientes` | Gestão de pacientes |
| `/conversas` | Monitoramento WhatsApp |
| `/admin/pre-checkin` | Dashboard de pré-checkins |
| `/admin/pre-checkin/instrucoes` | CRUD de instruções |
| `/admin/pre-checkin/documentos` | Validação de documentos |
| `/admin/servicos` | Configuração de serviços |
| `/admin/usuarios` | Gestão de usuários |
| `/admin/lembretes` | Configuração de lembretes |
| `/admin/analytics/risco` | Analytics de no-show |

## Funcionalidades

### v1.0 MVP ✅
- **Secure Foundation**: Auth, RBAC, RLS, Audit logging (HIPAA)
- **Alert Dashboard**: Alertas centralizados, priorização, padrões
- **Patient Management**: CRUD, busca, documentos, no-show tracking
- **Calendar & Scheduling**: Schedule-X, conflict detection, waitlist
- **Conversation Monitoring**: WhatsApp threads, clear memory
- **One-Click Interventions**: Reschedule, send message
- **System Configuration**: Services, users, business hours
- **Analytics**: Priority scoring, pattern detection, CSV export

### v1.1 Anti No-Show Intelligence ✅
- **N8N Workflow Fix**: Salva `risco_noshow` e `mensagem_enviada`
- **Config Lembretes**: CRUD de configurações (48h/24h/2h)
- **Painel Lembretes**: Histórico com filtros
- **Analytics de Risco**: Dashboard com distribuição e padrões

### v1.2 Agenda List View + Pre-Checkin Management ✅
- **Agenda List View**: Toggle calendário/lista, filtros avançados, TanStack Table
- **Pre-Checkin Dashboard**: Analytics, timeline, N8N webhook reminders
- **Procedure Instructions**: CRUD com preview WhatsApp, 7 tipos
- **Document Management**: Preview, approve/reject, bulk actions

### v2.0 Agent API Migration ✅
- **Agent API Foundation**: Bearer token auth, error handling, HIPAA audit logging
- **Query Tools (5 APIs)**: slots, agendamentos, paciente, pre-checkin, instrucoes
- **Write Tools (5 APIs)**: criar/reagendar/cancelar agendamento, atualizar paciente, confirmar presença
- **Complex Tools (1 API)**: Processamento de documentos com GPT-4o Vision
- **MCP Server**: Wrapper opcional para Claude Desktop (11 tools)

## Agent API (v2.0)

O console expõe 11 APIs para o AI Agent do N8N consumir via HTTP Request (substituindo sub-workflows).

### Autenticação

Todas as rotas `/api/agent/*` requerem Bearer token:

```bash
curl -H "Authorization: Bearer <API_KEY>" \
  https://seu-dominio/api/agent/slots?data=2026-01-25
```

### Gerando API Key

Para gerar uma nova API Key para o AI Agent:

```bash
npx ts-node scripts/generate-agent-key.ts
```

O script gera:
1. **API Key** (64 caracteres hex) - Armazene nas credenciais do N8N
2. **API Key Hash** (bcrypt) - Armazene na tabela `agents`

**Configuração no N8N:**
1. Vá em Credentials → Add Credential → Header Auth
2. Name: `Botfy API Key`
3. Header Name: `Authorization`
4. Header Value: `Bearer <sua-api-key>`

**Configuração no Banco:**
```sql
INSERT INTO agents (id, name, description, api_key_hash, user_id, active)
VALUES (
  gen_random_uuid(),
  'Marilia - WhatsApp Agent',
  'N8N AI Agent for WhatsApp patient interactions',
  '<hash-gerado>',
  '<user-id>',
  true
);
```

> ⚠️ **Importante**: A API Key plain só é exibida UMA vez. Guarde-a em local seguro antes de fechar o terminal.

### APIs Disponíveis

| Tool | Método | Endpoint | Descrição |
|------|--------|----------|-----------|
| `buscar_slots_disponiveis` | GET | `/api/agent/slots` | Slots disponíveis por data/provider/service |
| `buscar_agendamentos` | GET | `/api/agent/agendamentos` | Busca agendamentos com filtros |
| `buscar_paciente` | GET | `/api/agent/paciente` | Busca paciente por telefone/CPF |
| `status_pre_checkin` | GET | `/api/agent/pre-checkin/status` | Status de pré-checkin |
| `buscar_instrucoes` | GET | `/api/agent/instrucoes` | Instruções de procedimento |
| `criar_agendamento` | POST | `/api/agent/agendamentos` | Cria agendamento (idempotente) |
| `reagendar_agendamento` | PATCH | `/api/agent/agendamentos/:id` | Reagenda consulta |
| `cancelar_agendamento` | DELETE | `/api/agent/agendamentos/:id` | Cancela com motivo |
| `atualizar_dados_paciente` | PATCH | `/api/agent/paciente/:id` | Atualiza dados parciais |
| `confirmar_presenca` | POST | `/api/agent/agendamentos/:id/confirmar` | Confirma/marca presente |
| `processar_documento` | POST | `/api/agent/documentos/processar` | Processa documento com Vision AI |

### Documentação Completa

Veja `docs/n8n/` para:
- `api-endpoints.md` - Referência completa das 11 APIs
- `credential-setup.md` - Configuração de credenciais N8N
- `migration-checklist.md` - Checklist de migração por tool
- `gradual-rollout.md` - Guia de rollout gradual (10%→50%→100%)
- `rollback-runbook.md` - Procedimento de rollback (<5 min)

### MCP Server (Opcional)

Para uso com Claude Desktop, o MCP Server expõe os mesmos 11 tools:

```bash
# Iniciar servidor MCP
npm run mcp

# Configurar Claude Desktop
cp claude_desktop_config.example.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
# Edite o arquivo com o caminho correto e API_KEY
```

O servidor usa stdio transport e aparece no Claude Desktop como "botfy-clinicops".

## Deploy EasyPanel (Docker)

### Arquivos de Deploy

O projeto inclui configuração Docker otimizada:

```
├── Dockerfile          # Multi-stage build (Node 22 Alpine)
├── .dockerignore       # Exclui arquivos de dev
└── next.config.ts      # Standalone output habilitado
```

### Passo a Passo

#### 1. Push para o repositório

```bash
git push origin main
```

#### 2. Criar serviço no EasyPanel

1. Acesse seu EasyPanel
2. Clique em **+ Service** → **App**
3. Selecione **GitHub** e escolha o repositório
4. EasyPanel detecta o `Dockerfile` automaticamente

#### 3. Configurar variáveis de ambiente

No EasyPanel, adicione estas variáveis em **Environment**:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres

# N8N Webhooks (obrigatório para integração)
NEXT_PUBLIC_N8N_URL=https://seu-n8n.easypanel.host
N8N_WEBHOOK_APPOINTMENT_CREATED=https://seu-n8n.easypanel.host/webhook/calendar/appointment-created
N8N_WEBHOOK_APPOINTMENT_UPDATED=https://seu-n8n.easypanel.host/webhook/calendar/appointment-updated
N8N_WEBHOOK_APPOINTMENT_CANCELLED=https://seu-n8n.easypanel.host/webhook/calendar/appointment-cancelled
N8N_WEBHOOK_WAITLIST_NOTIFY=https://seu-n8n.easypanel.host/webhook/calendar/waitlist-notify
N8N_WEBHOOK_PRE_CHECKIN_REMINDER=https://seu-n8n.easypanel.host/webhook/pre-checkin/reminder

# Evolution API (opcional - para WhatsApp links)
EVOLUTION_API_URL=https://sua-evolution-api.easypanel.host
EVOLUTION_INSTANCE=SuaInstancia
```

#### 4. Configurar porta e domínio

- **Port**: `3000`
- **Domain**: Configure seu domínio personalizado ou use o subdomínio EasyPanel

#### 5. Deploy

Clique em **Deploy** e aguarde o build (~3-5 minutos).

### Health Check

O endpoint `/api/health` é usado para monitoramento:

```bash
curl https://seu-dominio/api/health
```

Resposta:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T19:00:00.000Z",
  "version": "1.2.0"
}
```

### Verificação pós-deploy

1. Acesse `https://seu-dominio/login`
2. Faça login com suas credenciais
3. Verifique se o dashboard carrega corretamente
4. Teste a conexão com Supabase em `/api/health/supabase`

### Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | Verifique se todas as env vars estão configuradas |
| 500 no login | Verifique `NEXT_PUBLIC_SUPABASE_URL` e `ANON_KEY` |
| Dados não carregam | Verifique `DATABASE_URL` e `SERVICE_ROLE_KEY` |
| Webhooks não funcionam | Verifique URLs dos webhooks N8N |

## Estrutura do Projeto

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # Dashboard de alertas
│   │   ├── pacientes/          # Gestão de pacientes
│   │   ├── agenda/             # Calendário de agendamentos
│   │   ├── conversas/          # Monitoramento WhatsApp
│   │   ├── admin/              # Área administrativa
│   │   │   ├── pre-checkin/    # Dashboard pre-checkin
│   │   │   ├── servicos/       # Configuração de serviços
│   │   │   ├── usuarios/       # Gestão de usuários
│   │   │   └── analytics/      # Analytics e relatórios
│   │   └── api/
│   │       ├── agent/          # Agent APIs (v2.0) - 11 tools
│   │       │   ├── slots/      # buscar_slots_disponiveis
│   │       │   ├── agendamentos/# CRUD agendamentos
│   │       │   ├── paciente/   # buscar/atualizar paciente
│   │       │   ├── pre-checkin/# status_pre_checkin
│   │       │   ├── instrucoes/ # buscar_instrucoes
│   │       │   └── documentos/ # processar_documento
│   │       └── ...             # Outras API routes
│   ├── components/             # Componentes React
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── calendar/           # Componentes de calendário
│   │   ├── agenda/             # Lista de agendamentos
│   │   ├── pre-checkin/        # Dashboard pre-checkin
│   │   ├── instructions/       # CRUD instruções
│   │   ├── documents/          # Gestão documentos
│   │   └── layout/             # Layouts e navegação
│   ├── lib/
│   │   ├── supabase/           # Cliente Supabase
│   │   ├── auth/               # Autenticação e RBAC
│   │   ├── agent/              # Agent auth, types, errors (v2.0)
│   │   ├── services/           # Business logic services (v2.0)
│   │   ├── document/           # Vision API, storage (v2.0)
│   │   ├── calendar/           # Timezone, conflitos, waitlist
│   │   ├── audit/              # Audit logging (HIPAA)
│   │   ├── pre-checkin/        # N8N reminder integration
│   │   └── validations/        # Schemas Zod
│   ├── mcp/                    # MCP Server (v2.0)
│   │   ├── config.ts           # Environment config
│   │   ├── http-client.ts      # API client with auth
│   │   ├── heartbeat.ts        # Health monitoring
│   │   ├── server.ts           # Stdio MCP server
│   │   └── tools/              # 11 tool handlers
│   └── hooks/                  # React Hooks customizados
├── docs/
│   └── n8n/                    # N8N integration docs (v2.0)
│       ├── api-endpoints.md    # API reference
│       ├── credential-setup.md # Auth configuration
│       ├── migration-checklist.md
│       ├── gradual-rollout.md
│       └── rollback-runbook.md
├── workflows-backup/           # N8N sub-workflow backups (v2.0)
├── prisma/                     # Prisma schema e migrations
├── public/                     # Assets estáticos
├── .planning/                  # GSD framework (planejamento)
├── Dockerfile                  # Build Docker para EasyPanel
├── claude_desktop_config.example.json # MCP config template (v2.0)
├── AGENTS.md                   # Documentação N8N workflows
└── CLAUDE.md                   # Documentação para Claude AI
```

## Integração N8N

O console se integra com os workflows N8N de duas formas:

1. **Console → N8N (Webhooks)**: Console notifica N8N sobre eventos (agendamentos, cancelamentos, etc.)
2. **N8N → Console (Agent APIs v2.0)**: AI Agent consome APIs do console via HTTP Request

O N8N é responsável por toda a automação de atendimento via WhatsApp. A partir da v2.0, as 11 ferramentas do AI Agent usam APIs do console ao invés de sub-workflows N8N.

### Workflows Ativos

| Workflow | Função | Trigger |
|----------|--------|---------|
| **Botfy - Agendamento** | AI Agent principal (Marília) | Webhook WhatsApp |
| **Botfy - Anti No-Show** | Lembretes 48h/24h/2h | Schedule (15min) |
| **Botfy - Pre Check-In** | Formulário 24h antes | Schedule (1h) |
| **Botfy - Pre Check-In Lembrete** | Reenvia pendente 12h antes | Schedule (2h) |
| **Botfy - Verificar Pendências** | Notifica clínica | Schedule (2h) |
| **Botfy - Waitlist Notify** | Notifica paciente | Webhook Console |

### Webhooks do Console → N8N

| Evento | Webhook | Payload |
|--------|---------|---------|
| Appointment Created | `/webhook/calendar/appointment-created` | `{appointmentId, patientId, ...}` |
| Appointment Updated | `/webhook/calendar/appointment-updated` | `{appointmentId, changes}` |
| Appointment Cancelled | `/webhook/calendar/appointment-cancelled` | `{appointmentId, ...}` |
| Waitlist Notification | `/webhook/calendar/waitlist-notify` | `{patientPhone, availableSlot, ...}` |
| Pre-Checkin Reminder | `/webhook/pre-checkin/reminder` | `{preCheckinId, patientPhone, ...}` |

Consulte `AGENTS.md` para detalhes completos dos workflows N8N.

## Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `pacientes` | Cadastro de pacientes |
| `agendamentos` | Consultas agendadas |
| `servicos` | Procedimentos oferecidos |
| `providers` | Profissionais da clínica |
| `waitlist` | Lista de espera |
| `chats` | Sessões WhatsApp |
| `n8n_chat_histories` | Memória do AI Agent |
| `pre_checkin` | Status de pré check-in |
| `lembretes_enviados` | Tracking anti no-show |
| `config_lembretes` | Configurações de lembretes |
| `instrucoes_procedimentos` | Instruções para pacientes |
| `documentos_paciente` | Documentos enviados |
| `audit_logs` | Logs de auditoria (HIPAA) |

Consulte `AGENTS.md` para schema completo e relacionamentos.

## Scripts Úteis

```bash
# Desenvolvimento
./start-dev.sh              # Inicia dev server (porta 3051)
npm run dev                 # Next.js dev server (padrão 3000)

# Build
npm run build               # Build de produção (standalone)
npm run start               # Servidor de produção

# MCP Server (v2.0)
npm run mcp                 # Inicia MCP Server para Claude Desktop

# Database
npx prisma generate         # Gera Prisma client
npx prisma migrate dev      # Aplica migrations
npx prisma studio           # Interface visual do DB

# Docker (local)
docker build -t botfy-clinicops .
docker run -p 3000:3000 --env-file .env.local botfy-clinicops

# Testes (N8N workflows)
./test-workflows.sh         # Testa todos os webhooks N8N
```

## Variáveis de Ambiente

Veja `.env.example` para lista completa. Principais:

```bash
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# N8N Webhooks (Console → N8N)
NEXT_PUBLIC_N8N_URL=
N8N_WEBHOOK_APPOINTMENT_CREATED=
N8N_WEBHOOK_APPOINTMENT_UPDATED=
N8N_WEBHOOK_APPOINTMENT_CANCELLED=
N8N_WEBHOOK_WAITLIST_NOTIFY=
N8N_WEBHOOK_PRE_CHECKIN_REMINDER=

# Agent API (N8N → Console) - v2.0
AGENT_API_KEY=                    # Bearer token para /api/agent/*
OPENAI_API_KEY=                   # GPT-4o Vision para processar_documento

# MCP Server (opcional) - v2.0
MCP_API_URL=http://localhost:3051 # URL base para MCP Server
MCP_API_KEY=                      # Mesmo que AGENT_API_KEY

# Evolution API (opcional)
EVOLUTION_API_URL=
EVOLUTION_INSTANCE=
```

## Milestones

| Versão | Nome | Status | Data |
|--------|------|--------|------|
| v1.0 | MVP | ✅ Shipped | 2026-01-17 |
| v1.1 | Anti No-Show Intelligence | ✅ Shipped | 2026-01-21 |
| v1.2 | Agenda List View + Pre-Checkin | ✅ Shipped | 2026-01-21 |
| v2.0 | Agent API Migration | ✅ Shipped | 2026-01-25 |

**Stats totais:**
- 22 phases, 87 plans
- ~42,000 lines of TypeScript
- 420+ files

Veja `.planning/MILESTONES.md` para detalhes completos.

## Documentação Adicional

- **AGENTS.md** - Workflows N8N, tabelas, troubleshooting
- **CLAUDE.md** - Guia para Claude AI trabalhar no projeto
- **docs/n8n/** - Documentação Agent API (v2.0): endpoints, migração, rollout, rollback
- **.planning/** - GSD framework, roadmap, requirements

## Suporte

Para dúvidas sobre:
- **Console Administrativo**: Veja este README
- **Workflows N8N**: Consulte `AGENTS.md`
- **AI Development**: Consulte `CLAUDE.md`

## Licença

Proprietário - Botfy AI
