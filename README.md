# Botfy ClinicOps - Console Administrativo

Console administrativo web para gerenciar o sistema Botfy ClinicOps. Permite visualizar agenda, pacientes, conversas WhatsApp e identificar problemas que precisam de intervenção humana através de um dashboard de alertas centralizado.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │────>│ Evolution API│────>│ N8N Workflow│────>│  Supabase   │
│  (Paciente) │     │  (Gateway)   │     │  (Backend)  │     │ (PostgreSQL)│
└─────────────┘     └──────────────┘     └──────┬──────┘     └──────┬──────┘
                                                │                    │
                                                │                    │
                                                ▼                    ▼
                                          ┌──────────────────────────────┐
                                          │   Console Administrativo     │
                                          │   (Next.js Frontend)         │
                                          │   - Dashboard de Alertas     │
                                          │   - Gestão de Pacientes      │
                                          │   - Calendário/Agenda        │
                                          │   - Conversas WhatsApp       │
                                          └──────────────────────────────┘
```

## Stack Tecnológico

### Frontend (Console Administrativo)
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Autenticação**: Supabase Auth (email/senha, RBAC)
- **Calendário**: Schedule-X (day/week/month views, multi-provider)
- **Timezone**: @date-fns/tz (DST-aware, Brazil timezones)
- **Deploy**: EasyPanel

### Backend (Automação)
- **Workflows**: N8N
- **WhatsApp**: Evolution API
- **IA**: OpenAI GPT-4o-mini (Agente Marília)
- **Database**: Supabase PostgreSQL
- **Deploy**: EasyPanel

## Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase (já configurada)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd botfy-clinicas-n8n.worktree

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase
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

- **Dashboard**: http://localhost:3051/dashboard
- **Pacientes**: http://localhost:3051/pacientes
- **Agenda**: http://localhost:3051/agenda
- **Conversas**: http://localhost:3051/conversas
- **Configurações**: http://localhost:3051/configuracoes

## Estrutura do Projeto

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # Dashboard de alertas
│   │   ├── pacientes/          # Gestão de pacientes
│   │   ├── agenda/             # Calendário de agendamentos
│   │   ├── conversas/          # Monitoramento WhatsApp
│   │   ├── configuracoes/      # Configurações do sistema
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── calendar/           # Componentes de calendário
│   │   └── layout/             # Layouts e navegação
│   ├── lib/                    # Utilitários e helpers
│   │   ├── supabase/           # Cliente Supabase
│   │   ├── auth/               # Autenticação e RBAC
│   │   ├── calendar/           # Timezone, conflitos, waitlist
│   │   └── validations/        # Schemas Zod
│   └── hooks/                  # React Hooks customizados
├── prisma/                     # Prisma schema e migrations
├── .planning/                  # GSD framework (planejamento)
├── workflows-backup/           # Backup dos workflows N8N
├── AGENTS.md                   # Documentação N8N workflows
└── CLAUDE.md                   # Documentação para Claude AI
```

## Funcionalidades

### Phase 1: Secure Foundation ✅
- Autenticação com Supabase Auth (email/senha)
- RBAC (ADMIN, ATENDENTE)
- RLS policies no Supabase
- Audit logging (HIPAA compliant)
- Rate limiting (100 req/min por usuário)

### Phase 2: Alert Dashboard ✅
- Dashboard de alertas centralizado
- Conversas travadas (IA não conseguiu resolver)
- Pré check-ins pendentes
- Agendamentos não confirmados
- Handoffs humanos (normais e por erro)

### Phase 3: Patient Management ✅
- Lista e busca de pacientes (nome, telefone, CPF)
- Perfil do paciente (contato, histórico, conversas)
- Cadastro e edição de pacientes
- Upload de documentos (Supabase Storage)
- Métricas de no-show e presença

### Phase 4: Calendar & Scheduling ✅
- Calendário Schedule-X (day/week/month views)
- Multi-provider (resource lanes com cores)
- CRUD de agendamentos (criar, editar, cancelar)
- Conflict detection (O(n log n), 15min buffer)
- Waitlist com priority queue (URGENT first)
- Filters por provider e service
- DST-aware (Brazil timezone)

### Phase 5-8: Roadmap
- Conversation Monitoring (histórico detalhado)
- One-Click Interventions (transferir para humano, limpar memória)
- System Configuration (horários, serviços, templates)
- Analytics & Smart Features

## Integração N8N

O console se integra com os workflows N8N via webhooks. O N8N é responsável por toda a automação de atendimento via WhatsApp.

### Workflows Ativos

| Workflow | Função | Trigger |
|----------|--------|---------|
| **Botfy - Agendamento** | AI Agent principal (Marília) - agenda, remarca, cancela | Webhook WhatsApp |
| **Botfy - Anti No-Show** | Lembretes automáticos 48h/24h/2h antes da consulta | Schedule (15min) |
| **Botfy - Pre Check-In** | Envia formulário de pré check-in 24h antes | Schedule (1h) |
| **Botfy - Pre Check-In Lembrete** | Reenvia pré check-in pendente 12h antes | Schedule (2h) |
| **Botfy - Verificar Pendências** | Notifica clínica sobre pré check-ins pendentes | Schedule (2h) |
| **Botfy - Waitlist Notify** | Notifica paciente quando horário fica disponível | Webhook do Console |
| **Botfy WX - ChatAgent v2** | Gateway HTTP para integração direta com AI | HTTP Request |
| **Botfy WX - Message Processor** | Processador de mensagens do Chat Agent | Execute Workflow |

### Tools do AI Agent

O AI Agent utiliza sub-workflows (tools) para executar ações:

- `buscar_slots_disponiveis` - Busca horários livres por data/período
- `criar_agendamento` - Cria paciente (se necessário) e agendamento
- `reagendar_agendamento` - Remarca consulta para nova data/hora
- `cancelar_agendamento` - Cancela consulta
- `buscar_agendamentos` - Lista agendamentos do paciente
- `buscar_paciente` - Busca dados e histórico do paciente
- `atualizar_dados_paciente` - Atualiza cadastro do paciente
- `buscar_instrucoes` - Busca instruções por embedding (RAG)
- `processar_documento` - Processa documentos enviados
- `consultar_status_pre_checkin` - Verifica status do pré check-in

### Webhooks do Calendário

| Evento | Webhook | Payload |
|--------|---------|---------|
| Appointment Created | `/webhook/calendar/appointment-created` | `{appointmentId, patientId, serviceId, providerId, dataHora, status}` |
| Appointment Updated | `/webhook/calendar/appointment-updated` | `{appointmentId, changes: {dataHora?, status?}}` |
| Appointment Cancelled | `/webhook/calendar/appointment-cancelled` | `{appointmentId, patientId, serviceId, dataHora}` |
| Waitlist Notification | `/webhook/calendar/waitlist-notify` | `{patientPhone, patientName, availableSlot, serviceName, waitlistId}` |

**Configuração**: Defina URLs dos webhooks em `.env.local`:

```bash
N8N_WEBHOOK_APPOINTMENT_CREATED=https://seu-n8n.com/webhook/calendar/appointment-created
N8N_WEBHOOK_APPOINTMENT_UPDATED=https://seu-n8n.com/webhook/calendar/appointment-updated
N8N_WEBHOOK_APPOINTMENT_CANCELLED=https://seu-n8n.com/webhook/calendar/appointment-cancelled
N8N_WEBHOOK_WAITLIST_NOTIFY=https://seu-n8n.com/webhook/calendar/waitlist-notify
```

Consulte `AGENTS.md` para detalhes completos dos workflows N8N, troubleshooting e histórico de correções.

## Banco de Dados

### Principais Tabelas

- `pacientes` - Cadastro de pacientes
- `agendamentos` - Consultas agendadas
- `servicos` - Procedimentos oferecidos
- `providers` - Profissionais da clínica
- `waitlist` - Lista de espera com prioridades
- `chats` - Sessões de conversa WhatsApp
- `n8n_chat_histories` - Memória do AI Agent
- `pre_checkin` - Status de pré check-in
- `lembretes_enviados` - Tracking anti no-show

Consulte `AGENTS.md` para schema completo e relacionamentos.

## Scripts Úteis

```bash
# Desenvolvimento
./start-dev.sh              # Inicia dev server (porta 3051)
npm run dev                 # Next.js dev server (padrão 3000)

# Build
npm run build               # Build de produção
npm run start               # Servidor de produção

# Database
npx prisma generate         # Gera Prisma client
npx prisma migrate dev      # Aplica migrations
npx prisma studio           # Interface visual do DB

# Testes (N8N workflows)
./test-workflows.sh         # Testa todos os webhooks N8N
```

## Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gkweofpjwzsvlvnvfbom.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# N8N Webhooks (Calendário)
N8N_WEBHOOK_APPOINTMENT_CREATED=https://botfy-ai-agency-n8n.tb0oe2.easypanel.host/webhook/calendar/appointment-created
N8N_WEBHOOK_APPOINTMENT_UPDATED=https://botfy-ai-agency-n8n.tb0oe2.easypanel.host/webhook/calendar/appointment-updated
N8N_WEBHOOK_APPOINTMENT_CANCELLED=https://botfy-ai-agency-n8n.tb0oe2.easypanel.host/webhook/calendar/appointment-cancelled
N8N_WEBHOOK_WAITLIST_NOTIFY=https://botfy-ai-agency-n8n.tb0oe2.easypanel.host/webhook/calendar/waitlist-notify

# Evolution API (se necessário)
EVOLUTION_API_URL=https://botfy-ai-agency-evolution-api.tb0oe2.easypanel.host
EVOLUTION_INSTANCE=Botfy AI - Brazil
EVOLUTION_API_KEY=<api_key>
```

## Deploy

### EasyPanel (Recomendado)

1. Conecte repositório Git
2. Configure variáveis de ambiente
3. Build command: `npm run build`
4. Start command: `npm run start`
5. Port: 3000 (ou configure PORT env var)

### Vercel

```bash
vercel deploy
```

## Documentação Adicional

- **AGENTS.md** - Workflows N8N, tabelas, troubleshooting
- **CLAUDE.md** - Guia para Claude AI trabalhar no projeto
- **.planning/** - GSD framework, roadmap, requirements

## Suporte

Para dúvidas sobre:
- **Console Administrativo**: Veja este README
- **Workflows N8N**: Consulte `AGENTS.md`
- **AI Development**: Consulte `CLAUDE.md`

## Licença

Proprietário - Botfy AI
