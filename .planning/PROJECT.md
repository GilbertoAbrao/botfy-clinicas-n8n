# Botfy ClinicOps - Console Administrativo

## What This Is

Console administrativo web para a equipe da clínica gerenciar o sistema Botfy ClinicOps. Permite visualizar agenda, pacientes, conversas WhatsApp e principalmente identificar problemas que precisam de intervenção humana através de um dashboard de alertas centralizado.

## Core Value

Dashboard de alertas que mostra "at glance" tudo que precisa de atenção: conversas travadas, pré check-ins pendentes, agendamentos não confirmados e handoffs para humanos (normais e causados por erros). A equipe precisa saber rapidamente onde intervir.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Dashboard de Alertas e Visão Geral**
  - Métricas principais at glance (agendamentos hoje, taxa de confirmação, conversas ativas)
  - Alertas de conversas travadas (IA não conseguiu resolver)
  - Alertas de pré check-ins pendentes
  - Alertas de agendamentos não confirmados (próximos de acontecer)
  - Alertas de handoffs humanos normais (transferência deliberada)
  - Alertas de handoffs por erro (problemas técnicos no fluxo)
  - Status geral do sistema (Evolution API, N8N, Supabase)

- [ ] **Gestão de Agenda**
  - Visualizar agendamentos em calendário (dia/semana/mês)
  - Criar novos agendamentos manualmente
  - Editar/reagendar/cancelar agendamentos
  - Ver status de confirmações de presença
  - Visualizar horários livres e ocupados
  - Filtros por profissional, serviço, status

- [ ] **Gestão de Pacientes**
  - Lista e busca de pacientes (nome, telefone, CPF)
  - Cadastro de novos pacientes
  - Editar dados cadastrais completos
  - Histórico de atendimentos do paciente
  - Documentos e informações de convênio
  - Ver conversas WhatsApp do paciente

- [ ] **Monitoramento de Conversas WhatsApp**
  - Histórico de conversas com IA Marília
  - Ver contexto completo de cada atendimento (n8n_chat_histories)
  - Identificar onde IA travou ou não entendeu
  - Ver status do chat (I.A, Humano, Finalizado)
  - Opção de intervir/transferir para atendente humano
  - Limpar memória de chat quando necessário (resolver loops)

- [ ] **Configurações do Sistema**
  - Horários de funcionamento (entrada, saída, dias da semana)
  - Horário de almoço
  - Serviços disponíveis (nome, duração, preço, ativo/inativo)
  - Antecedência mínima para agendamento
  - Templates de mensagens automáticas
  - Regras de negócio (intervalo entre consultas, etc)

- [ ] **Autenticação e Usuários**
  - Login com email/senha
  - Cadastro de usuários da equipe
  - Níveis de permissão (admin, atendente)
  - Logout e segurança de sessão

### Out of Scope

- Integração direta com N8N (workflows não são editados pelo console) — configuração permanece no N8N
- Envio direto de mensagens WhatsApp pelo console — apenas via IA existente ou manualmente pelo WhatsApp
- Sistema de pagamento/financeiro — fora do escopo MVP
- Relatórios analíticos avançados — MVP focado em operação, não analytics
- Modificação da persona IA ou prompts — feito no N8N
- Gestão de múltiplas clínicas — sistema é single-tenant por enquanto

## Context

**Sistema Existente:**
- Botfy ClinicOps está em produção atendendo clínicas de estética via WhatsApp
- IA "Marília" (OpenAI GPT-4o-mini) agenda consultas e envia lembretes automaticamente
- Stack atual: N8N (workflows) + Evolution API (WhatsApp gateway) + Supabase (PostgreSQL) + EasyPanel (hosting)
- 5 workflows principais: Agendamento (principal), Anti No-Show, Pré Check-In, Lembrete Check-In, Verificar Pendências
- 7 tools do AI Agent: buscar slots disponíveis, criar/reagendar/cancelar agendamento, buscar agendamentos, buscar paciente, atualizar dados

**Necessidade:**
- Equipe da clínica atualmente NÃO tem interface administrativa
- Gerenciam tudo direto no Supabase (quando gerenciam algo)
- Precisam visualizar o que está acontecendo no sistema em tempo real
- Precisam identificar rapidamente quando IA precisa de ajuda humana
- Precisam gerenciar pacientes e agenda manualmente quando necessário
- Precisam configurar horários e serviços sem mexer diretamente no N8N
- Precisam rastrear handoffs e erros para melhorar o sistema

**Banco de Dados:**
- Todas as tabelas já existem no Supabase
- Tabelas: `pacientes`, `servicos`, `agendamentos`, `chats`, `lembretes_enviados`, `pre_checkin`, `n8n_chat_histories`
- View útil: `agendamentos_completos` (join de agendamentos + pacientes + servicos)
- Schema está documentado em `frontend/AGENTS.md` e `frontend/CLAUDE.md`

**Marca e Design:**
- Design deve seguir identidade visual de https://botfy.ai
- Extrair paleta de cores e logomarca do site
- Usar frontend-design skill do Claude Code para criar interface profissional

## Constraints

- **Stack**: Next.js + shadcn/ui + Tailwind CSS + TypeScript (obrigatório)
- **Database**: Supabase PostgreSQL existente em https://gkweofpjwzsvlvnvfbom.supabase.co
- **Autenticação**: Supabase Auth com email/senha
- **Deploy**: EasyPanel (mesma infraestrutura do N8N e Evolution API)
- **Design**: Seguir identidade visual de https://botfy.ai usando frontend-design skill
- **Compatibilidade**: Não quebrar workflows N8N existentes (apenas leitura/escrita no database)
- **Dados**: Conectar em banco existente, respeitar schema atual sem alterações destrutivas
- **Tech Stack**: N8N gerencia workflows e IA, console é apenas interface administrativa

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js como framework full-stack | Framework moderno, API routes integradas, deploy simples, SSR para performance | — Pending |
| shadcn/ui para componentes | Componentes prontos e acessíveis, customizáveis com Tailwind, alta qualidade visual | — Pending |
| Supabase Auth para autenticação | Integração nativa com database existente, menos código custom, segurança out-of-the-box | — Pending |
| frontend-design skill | Design profissional consistente com marca Botfy, evita visual genérico de IA | — Pending |
| Foco principal em alertas/problemas | Core value é visibilidade de problemas que precisam intervenção, não apenas CRUD | — Pending |
| Console não integra com N8N | Workflows continuam no N8N, console apenas gerencia dados no Supabase (separação de responsabilidades) | — Pending |

---
*Last updated: 2026-01-15 after initialization*
