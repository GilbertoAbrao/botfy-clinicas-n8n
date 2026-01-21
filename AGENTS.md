# Botfy Clinicas - Sistema de Automação para Clínicas

Sistema de automação de atendimento para clínicas via WhatsApp usando N8N, Evolution API e Supabase.

## Arquitetura

```
[WhatsApp] <--> [Evolution API] <--> [N8N Workflows] <--> [Supabase]
                                           |
                                      [OpenAI GPT]
```

## Fluxograma do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FLUXO DE ATENDIMENTO                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────────┐         ┌─────────────────┐
    │   WhatsApp   │ ──────> │  Evolution API   │ ──────> │    Webhook      │
    │  (Paciente)  │         │  (Gateway)       │         │ /webhook/marilia│
    └──────────────┘         └──────────────────┘         └────────┬────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW: Botfy - Agendamento (PRINCIPAL)                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Buffer    │───>│  Verifica   │───>│  AI Agent   │───>│   Envia     │       │
│  │  (15 seg)   │    │  Chat/Dup   │    │  (Marília)  │    │  Resposta   │       │
│  └─────────────┘    └─────────────┘    └──────┬──────┘    └─────────────┘       │
│                                               │                                  │
│                     ┌─────────────────────────┼─────────────────────────┐        │
│                     │                         │                         │        │
│                     ▼                         ▼                         ▼        │
│            ┌────────────────┐       ┌────────────────┐       ┌────────────────┐  │
│            │ buscar_slots   │       │ criar_agend.   │       │ buscar_paciente│  │
│            │ _disponiveis   │       │ reagendar      │       │ confirmar_pres.│  │
│            └────────────────┘       │ cancelar       │       └────────────────┘  │
│                                     └────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │   Supabase    │
                                    │  (PostgreSQL) │
                                    └───────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOWS AUTOMATIZADOS (CRON)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────┐     ┌──────────────────┐  │
│  │  Anti No-Show       │      │  Pre Check-In       │     │  Pre Check-In    │  │
│  │  (cada 15 min)      │      │  (cada 1 hora)      │     │  Lembrete (2h)   │  │
│  │                     │      │                     │     │                  │  │
│  │  - Lembrete 48h     │      │  - Envia 24h antes  │     │  - Reenvia se    │  │
│  │  - Lembrete 24h     │      │  - Confirma dados   │     │    pendente      │  │
│  │  - Lembrete 2h      │      │  - Cria registro    │     │  - 12h antes     │  │
│  └─────────────────────┘      └─────────────────────┘     └──────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Integração Principal

- **Evolution API**: Gateway WhatsApp (instância: `Botfy AI - Brazil`)
- **Webhook**: `/webhook/marilia` - Ponto de entrada único para mensagens
- **Supabase**: Banco de dados PostgreSQL
- **OpenAI**: GPT-4o-mini para AI Agent

## Workflows - Tabela Resumida

### Workflows Ativos (Produção)

| ID | Nome | Nodes | Trigger | Função |
|----|------|-------|---------|--------|
| `bPJamJhBcrVCKgBg` | Botfy - Agendamento | 83 | Webhook `/webhook/marilia` | **PRINCIPAL** - AI Agent de atendimento |
| `HTR3ITfFDrK6eP2R` | Botfy - Anti No-Show | 61 | Schedule (15min) | Lembretes automáticos 48h/24h/2h |
| `BWDsb4A0GVs2NQnM` | Botfy - Pre Check-In | 15 | Schedule (1h) | Envia pré check-in 24h antes |
| `3ryiGnLNLuPWEfmL` | Botfy - Pre Check-In Lembrete | 10 | Schedule (2h) | Lembrete de pré check-in |
| `SMjeAMnZ6XkFPptn` | Botfy - Verificar Pendências | 10 | Schedule (2h) | Notifica clínica sobre pendências |
| `WCCLua7qhvRUlNSr` | Botfy - Waitlist Notify | 9 | Webhook `/webhook/calendar/waitlist-notify` | Notifica paciente de horário disponível |
| `El3mdyoWtotOGkvZ` | Botfy WX - ChatAgent v2 | 5 | HTTP Request | Gateway HTTP para AI Agent |
| `gzVC2BUZ376to3yz` | Botfy WX - Message Processor | 6 | Workflow Execute | Processador de mensagens do Chat Agent |

### Tools (Sub-workflows)

| ID | Nome | Nodes | Função |
|----|------|-------|--------|
| `8Bke6sYr7r51aeEq` | Tool: Buscar Slots Disponíveis | 9 | Busca horários livres por data/período |
| `eEx2enJk3YpreNUm` | Tool: Criar Agendamento | 15 | Cria paciente (se novo) + agendamento |
| `21EHe24mkMmfBhK6` | Tool: Reagendar Agendamento | 4 | Atualiza data_hora do agendamento |
| `gE2rpbLVUlnA5yMk` | Tool: Cancelar Agendamento | 4 | Marca status = 'cancelada' |
| `8Ug0F3KuLov6EeCQ` | Tool: Buscar Agendamentos | 4 | Lista agendamentos por período |
| `igG6sZsStxiDzNRY` | Tool: Buscar Paciente | 5 | Busca paciente + agendamentos |
| `4DNyXp5fPPfsFOnR` | Tool: Atualizar Dados Paciente | 9 | Atualiza campos do paciente |
| `NUZv1Gt15LKyiiKz` | Tool: Buscar Instruções | 6 | Busca instruções por embedding |
| `Pc0PyATrZaGefiSJ` | Tool: Processar Documento | 13 | Processa e armazena documentos |
| `holwGQuksZPsSb19` | Tool: Consultar Status Pre Check-In | 8 | Verifica status do pré check-in |

---

## Workflows N8N

### Workflows Ativos (Produção)

#### 1. Botfy - Agendamento (bPJamJhBcrVCKgBg) - PRINCIPAL
**Status**: Ativo | **Nodes**: 82 | **Webhook**: `/webhook/marilia`

Agente central de atendimento. Recebe TODAS as mensagens do WhatsApp e:
- Agenda, remarca e cancela consultas
- Confirma presença de pacientes (anti-no-show)
- Busca horários disponíveis
- Buffer de mensagens (15s) para acumular mensagens rápidas

**Tools do AI Agent**:
- `buscar_slots_disponiveis` - Busca horários LIVRES (schema com data + período)
- `buscar_agendamentos` - Consulta agendamentos existentes
- `criar_agendamento` - Cria novo agendamento
- `reagendar_agendamento` - Remarca consulta
- `cancelar_agendamento` - Cancela consulta
- `confirmar_presenca` - Confirma presença do paciente
- `buscar_paciente` - Busca dados do paciente

**Persona**: Marília, atendente virtual da Dra. Paula (esteticista)

---

#### 2. Botfy - Anti No-Show (HTR3ITfFDrK6eP2R)
**Status**: Ativo | **Nodes**: 52 | **Trigger**: Schedule (cada 15min)

Sistema de lembretes automáticos para reduzir faltas:
- Envia lembretes 48h, 24h e 2h antes da consulta
- Registra lembretes enviados em `lembretes_enviados`
- Calcula risco de no-show por paciente
- Escala para humano se paciente não responde

---

#### 3. Botfy - Pre Check-In (BWDsb4A0GVs2NQnM)
**Status**: Ativo | **Nodes**: 9 | **Trigger**: Schedule (1h)

Envia mensagem de pré check-in 24h antes da consulta:
- Confirma dados cadastrais do paciente
- Solicita documentos pendentes
- Cria registro em `pre_checkin`

---

#### 4. Botfy - Pre Check-In Lembrete (3ryiGnLNLuPWEfmL)
**Status**: Ativo | **Nodes**: 6 | **Trigger**: Schedule (2h)

Envia lembrete para pacientes com pré check-in pendente:
- Busca pré check-ins não completados
- Envia lembrete ~12h antes da consulta

---

#### 5. Botfy - Verificar Pendências Pre Check-In (SMjeAMnZ6XkFPptn)
**Status**: Ativo | **Nodes**: 10 | **Trigger**: Schedule

Monitora pré check-ins pendentes e notifica a clínica:
- Classifica urgência das pendências
- Agrega relatório
- Envia notificação para clínica

---

#### 6. Botfy - Waitlist Notify (Console) (WCCLua7qhvRUlNSr)
**Status**: Ativo | **Nodes**: 9 | **Trigger**: Webhook `/webhook/calendar/waitlist-notify`

Notifica pacientes da lista de espera quando um horário fica disponível:
- Recebe webhook do Console Administrativo quando há cancelamento
- Busca pacientes na waitlist com prioridade (URGENT primeiro)
- Envia mensagem WhatsApp via Evolution API
- Registra na memória do AI Agent para continuidade da conversa

**Fluxo**:
```
[Webhook] → [Parse Payload] → [Envia WhatsApp] → [Registra Memória] → [Atualiza Waitlist]
```

**Payload esperado**:
```json
{
  "patientPhone": "5511999999999",
  "patientName": "Maria Silva",
  "availableSlot": "2026-01-20T10:00:00-03:00",
  "serviceName": "Consulta Geral",
  "waitlistId": "uuid"
}
```

---

#### 7. Botfy WX - ChatAgent v2 (HTTP Direct) (El3mdyoWtotOGkvZ)
**Status**: Ativo | **Nodes**: 5 | **Trigger**: HTTP Request

Gateway HTTP para integração direta com o AI Agent:
- Recebe requisições HTTP de sistemas externos
- Encaminha para o Message Processor
- Retorna resposta do AI Agent

**Uso**: Integração com outros sistemas que precisam consultar o AI Agent diretamente via HTTP.

**Endpoint**: HTTP Request (não webhook, para chamadas diretas)

---

#### 8. Botfy WX - ChatAgent - Message Processor (gzVC2BUZ376to3yz)
**Status**: Ativo | **Nodes**: 6 | **Trigger**: Execute Workflow

Processador de mensagens para o AI Agent:
- Chamado pelo ChatAgent v2 via Execute Workflow
- Processa mensagem e contexto do paciente
- Chama tools conforme necessário
- Retorna resposta formatada

**Fluxo**:
```
[Execute Trigger] → [Processa Contexto] → [AI Agent] → [Formata Resposta] → [Retorna]
```

---

### Workflows Auxiliares (Tools)

Estes workflows são chamados como sub-workflows pelo Agente principal:

| ID | Nome | Função |
|----|------|--------|
| eEx2enJk3YpreNUm | Tool: Criar Agendamento | Cria paciente (se necessário) e agendamento |
| 21EHe24mkMmfBhK6 | Tool: Reagendar Agendamento | Atualiza data/hora do agendamento |
| gE2rpbLVUlnA5yMk | Tool: Cancelar Agendamento | Marca agendamento como cancelado |
| 8Ug0F3KuLov6EeCQ | Tool: Buscar Agendamentos | Busca agendamentos por data/paciente |
| igG6sZsStxiDzNRY | Tool: Buscar Paciente | Busca dados e agendamentos do paciente |

---

### Workflows Inativos/Legado

| ID | Nome | Status | Motivo |
|----|------|--------|--------|
| 3BtsyJCCLRo5wA3v | Agente IA Central | Desativado | Consolidado no Agendamento |
| p2YTCXaZCvRBB6oY | Router WhatsApp | Desativado | Substituído por webhook único |
| E7T0VyKgGPBUcdPn | Agendamento - API Oficial | Desativado | Versão antiga |

---

## Dicionário de Dados - Supabase

### Tabela: `pacientes`
Cadastro de pacientes da clínica.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `nome` | VARCHAR(255) | Sim | Nome completo do paciente |
| `telefone` | VARCHAR(20) | Sim | Telefone com DDI (ex: 5511999999999) |
| `email` | VARCHAR(255) | Não | Email do paciente |
| `data_nascimento` | DATE | Não | Data de nascimento |
| `cpf` | VARCHAR(14) | Não | CPF (apenas números ou formatado) |
| `endereco` | TEXT | Não | Endereço completo |
| `convenio` | VARCHAR(100) | Não | Nome do convênio |
| `numero_carteirinha` | VARCHAR(50) | Não | Número da carteirinha do convênio |
| `created_at` | TIMESTAMP | Auto | Data de criação |
| `updated_at` | TIMESTAMP | Auto | Data de atualização |

---

### Tabela: `servicos`
Procedimentos oferecidos pela clínica.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `nome` | VARCHAR(100) | Sim | Nome do procedimento |
| `duracao_minutos` | INTEGER | Sim | Duração em minutos |
| `ativo` | BOOLEAN | Sim | Se o serviço está disponível |
| `preco` | DECIMAL(10,2) | Não | Preço do procedimento |

**Serviços Cadastrados:**
- Avaliação Facial (30 min)
- Limpeza de Pele (60 min)
- Peeling (45 min)
- Botox (30 min)
- Preenchimento (45 min)

---

### Tabela: `agendamentos`
Consultas agendadas.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `paciente_id` | INTEGER | FK | Referência para pacientes.id |
| `servico_id` | INTEGER | FK | Referência para servicos.id |
| `data_hora` | TIMESTAMP | Sim | Data e hora do agendamento |
| `tipo_consulta` | VARCHAR(100) | Não | Nome do procedimento (redundante) |
| `profissional` | VARCHAR(100) | Sim | Nome do profissional (default: Dra. Paula) |
| `duracao_minutos` | INTEGER | Não | Duração em minutos |
| `status` | VARCHAR(20) | Sim | Status: `agendada`, `confirmado`, `cancelada`, `realizada`, `faltou` |
| `observacoes` | TEXT | Não | Observações do agendamento |
| `created_at` | TIMESTAMP | Auto | Data de criação |
| `updated_at` | TIMESTAMP | Auto | Data de atualização |

**Status possíveis:**
```
agendada    -> Agendamento criado, aguardando confirmação
confirmado  -> Paciente confirmou presença
cancelada   -> Agendamento cancelado
realizada   -> Consulta realizada
faltou      -> Paciente não compareceu (no-show)
```

---

### Tabela: `chats`
Sessões de conversa WhatsApp.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `remotejID` | VARCHAR(50) | Sim | ID do WhatsApp (ex: 5511999999999@s.whatsapp.net) |
| `status` | VARCHAR(20) | Sim | Status: `I.A`, `Humano`, `Finalizado` |
| `created_at` | TIMESTAMP | Auto | Data de criação |
| `updated_at` | TIMESTAMP | Auto | Data de atualização |

**Status possíveis:**
```
I.A       -> Atendimento automático pela Marília
Humano    -> Transferido para atendente humano
Finalizado -> Conversa encerrada
```

---

### Tabela: `lembretes_enviados`
Tracking de lembretes anti no-show.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `agendamento_id` | INTEGER | FK | Referência para agendamentos.id |
| `telefone` | VARCHAR(20) | Sim | Telefone do paciente |
| `tipo_lembrete` | VARCHAR(20) | Sim | Tipo: `lembrete_48h`, `lembrete_24h`, `lembrete_2h` |
| `status_resposta` | VARCHAR(20) | Sim | Status: `pendente`, `confirmado`, `cancelado`, `reagenda` |
| `evento_id` | VARCHAR(100) | Não | ID do evento externo |
| `data_envio` | TIMESTAMP | Auto | Data/hora do envio |
| `data_resposta` | TIMESTAMP | Não | Data/hora da resposta |
| `mensagem_enviada` | TEXT | Não | Conteúdo da mensagem enviada |
| `risco_noshow` | INTEGER | Não | Score de risco de no-show (0-100) |
| `escalado_humano` | BOOLEAN | Não | Se foi escalado para atendente humano |
| `data_escalacao` | TIMESTAMP | Não | Data/hora da escalação |

---

### Tabela: `pre_checkin`
Status de pré check-in por agendamento.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `agendamento_id` | INTEGER | FK | Referência para agendamentos.id |
| `paciente_id` | INTEGER | FK | Referência para pacientes.id |
| `status` | VARCHAR(20) | Sim | Status: `pendente`, `em_andamento`, `completo`, `incompleto` |
| `dados_confirmados` | BOOLEAN | Não | Se os dados foram confirmados |
| `documentos_enviados` | BOOLEAN | Não | Se os documentos foram enviados |
| `instrucoes_enviadas` | BOOLEAN | Não | Se as instruções foram enviadas |
| `pendencias` | JSONB | Não | Lista de pendências |
| `mensagem_enviada_em` | TIMESTAMP | Não | Data/hora da mensagem inicial |
| `lembrete_enviado_em` | TIMESTAMP | Não | Data/hora do lembrete |
| `created_at` | TIMESTAMP | Auto | Data de criação |
| `updated_at` | TIMESTAMP | Auto | Data de atualização |

---

### Tabela: `n8n_chat_histories`
Memória do AI Agent (histórico de conversas).

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador único |
| `session_id` | VARCHAR(100) | Sim | ID da sessão (ex: 5511999999999@s.whatsapp.net-calendar) |
| `message` | JSONB | Sim | Mensagem no formato {role, content} |
| `created_at` | TIMESTAMP | Auto | Data de criação |

**Para limpar memória de um paciente:**
```sql
DELETE FROM n8n_chat_histories
WHERE session_id LIKE '5511999999999%';
```

---

### View: `agendamentos_completos`
View que junta agendamentos + pacientes + servicos.

| Coluna | Origem |
|--------|--------|
| `id` | agendamentos.id |
| `data_hora` | agendamentos.data_hora |
| `status` | agendamentos.status |
| `paciente_nome` | pacientes.nome |
| `paciente_telefone` | pacientes.telefone |
| `servico_nome` | servicos.nome |
| `servico_duracao` | servicos.duracao_minutos |

---

### Diagrama de Relacionamentos

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│  pacientes  │───┐   │   agendamentos  │   ┌───│  servicos   │
└─────────────┘   │   └─────────────────┘   │   └─────────────┘
                  │           │             │
                  └───────────┴─────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────────┐ ┌───────────┐ ┌──────────────┐
     │lembretes_enviad│ │pre_checkin│ │n8n_chat_hist.│
     └────────────────┘ └───────────┘ └──────────────┘
```

---

## Variáveis de Ambiente N8N

```
EVOLUTION_API_URL=https://botfy-ai-agency-evolution-api.tb0oe2.easypanel.host
EVOLUTION_INSTANCE=Botfy AI - Brazil
EVOLUTION_API_KEY=6AD9F1ACABE9-4EF0-A554-B059D1A29264
SUPABASE_URL=https://gkweofpjwzsvlvnvfbom.supabase.co
SUPABASE_KEY=<anon_key>
```

---

## Configurações da Clínica

- **Horário**: 08:00 às 20:00 (seg-sex)
- **Almoço**: 12:00 às 13:00
- **Antecedência mínima**: 2 horas
- **Profissional**: Dra. Paula

### Serviços Disponíveis
- Avaliação Facial (30 min)
- Limpeza de Pele (60 min)
- Peeling (45 min)
- Botox (30 min)
- Preenchimento (45 min)

---

## Backup de Workflows

Workflows salvos em `workflows-backup/`:
- `bPJamJhBcrVCKgBg-agendamento.json`
- `HTR3ITfFDrK6eP2R-anti-no-show.json`
- Demais workflows com formato `{id}-{nome}.json`

---

## IMPORTANTE: Consultar Documentação com Context7

**SEMPRE use o MCP context7 quando tiver dúvidas sobre configuração.**

```bash
# 1. Resolver ID da biblioteca
mcp__context7__resolve-library-id (query: "n8n", libraryName: "n8n")

# 2. Consultar documentação
mcp__context7__query-docs (libraryId: "/n8n/n8n-docs", query: "Code Tool input schema")
```

**NÃO perca tempo adivinhando. Consulte a documentação primeiro.**

---

## Webhooks de Teste

Todos os workflows automatizados possuem webhooks de teste para facilitar desenvolvimento e debugging.

### Endpoints Disponíveis

| Workflow | Path | Payload | Descrição |
|----------|------|---------|-----------|
| Anti No-Show | `/webhook/test/anti-no-show` | `{"agendamento_id": 123}` | Testa lembretes (opcional: agendamento específico) |
| Pre Check-In | `/webhook/test/pre-checkin` | `{"agendamento_id": 123, "bypass_timing": true}` | Testa pré check-in (opcional: agendamento específico) |
| Pre Check-In Lembrete | `/webhook/test/pre-checkin-lembrete` | `{"pre_checkin_id": 123}` | Testa lembrete (opcional: pré check-in específico) |
| Verificar Pendências | `/webhook/test/verificar-pendencias` | `{}` | Testa verificação de pendências |

### Script Automatizado

Execute todos os testes de uma vez:

```bash
./test-workflows.sh
```

O script:
- Testa todos os webhooks sequencialmente
- Exibe resultados coloridos no terminal
- Mostra exemplos de uso manual
- Requer variável `N8N_URL` no `.env`

### Exemplos de Uso Manual

**Anti No-Show - Teste Geral:**
```bash
curl -X POST "$N8N_URL/webhook/test/anti-no-show" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Pre Check-In - Agendamento Específico:**
```bash
curl -X POST "$N8N_URL/webhook/test/pre-checkin" \
  -H "Content-Type: application/json" \
  -d '{"agendamento_id": 123, "bypass_timing": true}'
```

**Pre Check-In Lembrete - Pre Check-In Específico:**
```bash
curl -X POST "$N8N_URL/webhook/test/pre-checkin-lembrete" \
  -H "Content-Type: application/json" \
  -d '{"pre_checkin_id": 123}'
```

**Verificar Pendências:**
```bash
curl -X POST "$N8N_URL/webhook/test/verificar-pendencias" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Comportamento dos Webhooks

1. **Teste Geral (payload vazio)**: Executa workflow com critérios normais (data/hora)
2. **Teste Específico (com ID)**: Força execução em um registro específico
3. **bypass_timing**: Ignora restrições de timing (ex: executar fora da janela de 24h)

### Debugging

- **Logs**: Acesse N8N → Executions para ver detalhes
- **Status 200**: Sucesso (mesmo que retorne array vazio)
- **Array vazio**: Normal quando não há dados no período
- **Erro 404**: Webhook path incorreto ou workflow inativo

---

## Webhooks do Calendário (Console Administrativo)

O console administrativo envia webhooks para o N8N quando agendamentos são criados, atualizados ou cancelados manualmente. Isso permite que os workflows de lembretes funcionem também para agendamentos criados fora do WhatsApp.

### Webhooks Configurados

| Evento | Path | Descrição |
|--------|------|-----------|
| Appointment Created | `/webhook/calendar/appointment-created` | Agendamento criado via calendário |
| Appointment Updated | `/webhook/calendar/appointment-updated` | Agendamento atualizado (hora, status) |
| Appointment Cancelled | `/webhook/calendar/appointment-cancelled` | Agendamento cancelado |
| Waitlist Notify | `/webhook/calendar/waitlist-notify` | Notificar paciente da lista de espera |

### Payloads

**Appointment Created / Cancelled:**
```json
{
  "appointmentId": "uuid",
  "patientId": "uuid",
  "serviceId": "uuid",
  "providerId": "uuid",
  "dataHora": "2026-01-20T10:00:00-03:00",
  "status": "AGENDADO",
  "patientName": "Maria Silva",
  "patientPhone": "5511999999999",
  "serviceName": "Consulta Geral",
  "providerName": "Dr. João"
}
```

**Appointment Updated:**
```json
{
  "appointmentId": "uuid",
  "changes": {
    "dataHora": "2026-01-21T14:00:00-03:00",
    "status": "CONFIRMADO"
  }
}
```

**Waitlist Notify:**
```json
{
  "patientPhone": "5511999999999",
  "patientName": "Carlos Santos",
  "availableSlot": "2026-01-20T10:00:00-03:00",
  "serviceName": "Consulta Geral",
  "waitlistId": "uuid"
}
```

### Criar Workflows no N8N

Para cada webhook, crie um workflow no N8N:

**1. Appointment Created Webhook**
1. Crie novo workflow → Add Webhook node
2. Configure:
   - HTTP Method: POST
   - Path: `calendar/appointment-created`
   - Response Mode: `Immediately`
3. Conecte ao workflow Anti No-Show para agendar lembretes
4. Ative o workflow

**2. Appointment Updated Webhook**
1. Crie novo workflow → Add Webhook node
2. Configure Path: `calendar/appointment-updated`
3. Lógica:
   - Cancela lembretes antigos
   - Agenda novos lembretes com horário atualizado
4. Ative o workflow

**3. Appointment Cancelled Webhook**
1. Crie novo workflow → Add Webhook node
2. Configure Path: `calendar/appointment-cancelled`
3. Lógica:
   - Cancela todos os lembretes pendentes
   - Opcionalmente: notifica paciente do cancelamento
4. Ative o workflow

**4. Waitlist Notify Webhook**
1. Crie novo workflow → Add Webhook node
2. Configure Path: `calendar/waitlist-notify`
3. Conecte ao Evolution API para enviar WhatsApp:
   ```
   [Webhook] → [HTTP Request - Evolution API]
   ```
4. Mensagem sugerida:
   ```
   Olá {{patientName}}! Surgiu um horário disponível para {{serviceName}} em {{availableSlot}}. Gostaria de agendar? Responda SIM ou NÃO.
   ```
5. Ative o workflow

### Testar Webhooks

```bash
# URL base
N8N_URL=https://botfy-ai-agency-n8n.tb0oe2.easypanel.host

# Testar appointment created
curl -X POST "$N8N_URL/webhook/calendar/appointment-created" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"test-123","patientName":"Teste","patientPhone":"5511999999999","dataHora":"2026-01-20T10:00:00-03:00","serviceName":"Consulta"}'

# Testar appointment cancelled
curl -X POST "$N8N_URL/webhook/calendar/appointment-cancelled" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"test-123","patientName":"Teste"}'

# Testar waitlist notify
curl -X POST "$N8N_URL/webhook/calendar/waitlist-notify" \
  -H "Content-Type: application/json" \
  -d '{"patientPhone":"5511999999999","patientName":"Carlos","availableSlot":"2026-01-20T10:00:00-03:00","serviceName":"Consulta"}'
```

---

## Troubleshooting

### AI Agent não chama tools
- Verificar se tool tem `toolSchema` JSON definido
- Verificar descrição da tool no prompt
- Checar execução: node deve aparecer com `itemsInput > 0`

### Code Tool com itemsInput=0
- **CAUSA**: Falta `specifyInputSchema: true` no node
- **SOLUÇÃO**: Adicionar ao node:
  ```json
  {
    "specifyInputSchema": true,
    "schemaType": "manual",
    "inputSchema": "{ JSON Schema aqui }"
  }
  ```

### Erro "Wrong output type returned"
- **CAUSA**: Code Tool retornando objeto JSON
- **SOLUÇÃO**: Retornar STRING, não objeto
  ```javascript
  return `Resultado: ${valor}`;  // CORRETO
  return { valor: valor };        // ERRADO
  ```

### Erro "No prompt specified"
- Usar referência de node: `$('nodeName').first().json.campo`
- Não usar `$json` diretamente após nodes que sobrescrevem input

### AI inventa horários
- Fortalecer prompt com instruções OBRIGATÓRIAS
- Verificar se `buscar_slots_disponiveis` tem schema correto
- Adicionar tabela de referência de datas no prompt

### AI repete perguntas ou fica confusa
- **CAUSA**: Memória do chat com histórico de erros
- **SOLUÇÃO**: Limpar memória do paciente
  ```sql
  DELETE FROM n8n_chat_histories
  WHERE session_id = 'TELEFONE@s.whatsapp.net-calendar';
  ```

### Erro "Got unexpected type: undefined" no Postgres Chat Memory
- **CAUSA 1**: Sub-nodes (como memory nodes) não têm acesso ao `$json` do fluxo principal
- **SOLUÇÃO 1**: Usar referência explícita de node
  ```javascript
  // ERRADO - $json não funciona em sub-nodes
  {{ $json.telefone }}-calendar

  // CORRETO - Referência explícita ao node
  {{ $('Propaga Telefone').item.json.telefone }}-calendar
  ```

- **CAUSA 2**: Dados corrompidos na tabela `n8n_chat_histories` (double-encoded JSON)
- **SOLUÇÃO 2**: Converter string JSON para JSONB
  ```sql
  -- Verificar dados corrompidos
  SELECT id, message FROM n8n_chat_histories
  WHERE message::text LIKE '"{%';

  -- Corrigir dados corrompidos
  UPDATE n8n_chat_histories
  SET message = (message #>> '{}')::jsonb
  WHERE message::text LIKE '"{%';
  ```

### JSONB Double-Encoding ao inserir na tabela
- **CAUSA**: Usar `JSON.stringify()` ao inserir em coluna JSONB
- **SOLUÇÃO**: Passar objeto diretamente, não string
  ```javascript
  // ERRADO - causa double-encoding
  ={{ JSON.stringify({ type: 'ai', content: $json.message }) }}

  // CORRETO - passa objeto diretamente
  ={{ ({ type: 'ai', content: $json.message }) }}
  ```
- **Afetado**: Workflows que inserem na tabela `n8n_chat_histories`

### CRÍTICO: $fromAI() em Tools - Parâmetros undefined

**Sintoma**: Tool é chamada mas parâmetros chegam como `undefined` no sub-workflow.

**Causa**: O `$fromAI()` no node Edit Fields/Set não está configurado corretamente.

**Solução**:
```javascript
// ERRADO - $fromAI sem configuração completa
{
  "data": "$fromAI",
  "periodo": "{{ $json.periodo }}"
}

// CORRETO - $fromAI() com nome, descrição e tipo
{
  "data": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}",
  "periodo": "={{ $fromAI('periodo', 'Período: manha, tarde ou qualquer', 'string') }}"
}
```

**Estrutura**: `$fromAI(nome, descricao, tipo)`
- `nome`: identificador do parâmetro
- `descricao`: texto para o AI entender quando usar
- `tipo`: 'string', 'number', 'boolean', 'json'

**IMPORTANTE**:
- Use em nodes **Edit Fields/Set** que preparam dados para sub-workflows
- NÃO use em Code Tools (lá você usa a variável `query`)
- Sempre verifique na execução se os valores estão chegando

---

## Histórico de Correções

### Janeiro 2026 - Correções de Produção

#### 1. Webhook responseMode: "No item to return was found"

**Sintoma**: Webhooks de teste retornavam HTTP 500 com erro "No item to return was found"

**Causa**: Webhook configurado com `responseMode: "lastNode"` mas último node não retornava dados em alguns casos

**Solução**: Alterar `responseMode` para `"onReceived"`

```json
// ANTES (causava erro)
{
  "path": "/test/anti-no-show",
  "method": "POST",
  "responseMode": "lastNode"  // ❌ Erro se último node vazio
}

// DEPOIS (funciona sempre)
{
  "path": "/test/anti-no-show",
  "method": "POST",
  "responseMode": "onReceived"  // ✅ Responde imediatamente
}
```

**Workflows corrigidos**:
- HTR3ITfFDrK6eP2R (Anti No-Show)
- BWDsb4A0GVs2NQnM (Pre Check-In)
- 3ryiGnLNLuPWEfmL (Pre Check-In Lembrete)
- SMjeAMnZ6XkFPptn (Verificar Pendências)

---

#### 2. Nodes Supabase → Postgres

**Sintoma**: Nodes Supabase deprecated, causando avisos e possíveis erros futuros

**Causa**: N8N descontinuou nodes Supabase em favor de nodes Postgres nativos

**Solução**: Converter para nodes Postgres com `executeQuery`

```json
// ANTES - Node Supabase
{
  "type": "n8n-nodes-base.supabase",
  "operation": "getAll",
  "tableId": "pre_checkin",
  "returnAll": true,
  "filters": {
    "conditions": [
      {
        "keyName": "status",
        "condition": "eq",
        "keyValue": "pendente"
      }
    ]
  }
}

// DEPOIS - Node Postgres
{
  "type": "n8n-nodes-base.postgres",
  "operation": "executeQuery",
  "query": "SELECT * FROM pre_checkin WHERE status = 'pendente'",
  "options": {
    "typeValidation": "loose"  // Importante para flexibilidade
  }
}
```

**Workflows convertidos**:
- BWDsb4A0GVs2NQnM (Pre Check-In): 3 nodes Supabase → Postgres
- 3ryiGnLNLuPWEfmL (Pre Check-In Lembrete): 2 nodes Supabase → Postgres
- SMjeAMnZ6XkFPptn (Verificar Pendências): 2 nodes Supabase → Postgres

**Workflow NÃO convertido**:
- HTR3ITfFDrK6eP2R (Anti No-Show): Mantido com Supabase (ainda funcional, complexo demais para converter)

---

#### 3. Type Validation em Nodes Postgres

**Sintoma**: Erros de validação de tipos em queries SQL com JSONB ou tipos dinâmicos

**Causa**: Type validation stricta do Postgres node incompatível com tipos dinâmicos do Supabase

**Solução**: Adicionar `typeValidation: "loose"` nas opções do node

```json
{
  "type": "n8n-nodes-base.postgres",
  "operation": "executeQuery",
  "query": "SELECT * FROM agendamentos WHERE id = $1",
  "options": {
    "typeValidation": "loose"  // ✅ Permite tipos dinâmicos
  }
}
```

**Por que "loose"?**:
- Supabase usa tipos PostgreSQL estendidos (JSONB, arrays, etc)
- N8N type validation stricta pode rejeitar esses tipos
- "loose" permite flexibilidade mantendo funcionalidade

---

#### 4. Parsing de .env no test-workflows.sh

**Sintoma**: Script falhava ao carregar variáveis com espaços ou hífens (ex: `EVOLUTION_INSTANCE=Botfy AI - Brazil`)

**Causa**: Parser simples `export $(cat .env | grep -v '^#' | xargs)` não lida com:
- Valores com espaços
- Valores com hífens
- Linhas vazias
- Comentários inline

**Solução**: Parser robusto linha por linha

```bash
# ANTES (falhava com espaços)
export $(cat .env | grep -v '^#' | xargs)

# DEPOIS (funciona com qualquer valor)
while IFS='=' read -r key value; do
    # Ignora linhas vazias e comentários
    if [[ -z "$key" ]] || [[ "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    # Remove espaços em branco ao redor
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    # Exporta variável
    export "$key=$value"
done < <(grep -v '^#' .env | grep -v '^$')
```

---

#### 5. Backups de Workflows

**Implementação**: Sistema de backup automatizado via N8N MCP

**Estrutura**:
```
workflows-backup/
├── {workflow_id}-{nome-kebab}.json
├── bPJamJhBcrVCKgBg-agendamento.json
├── HTR3ITfFDrK6eP2R-anti-no-show.json
├── BWDsb4A0GVs2NQnM-pre-checkin.json
├── 3ryiGnLNLuPWEfmL-pre-checkin-lembrete.json
└── SMjeAMnZ6XkFPptn-verificar-pendencias.json
```

**Formato**: JSON completo do workflow (nodes, connections, settings)

**Quando fazer backup**:
- Antes de mudanças significativas
- Após correções importantes
- Periodicamente (ex: semanal)

**Como restaurar**:
1. Importar JSON no N8N
2. Verificar credenciais
3. Ativar workflow
4. Testar webhooks

---

### Status Atual (2026-01-19)

**Workflows de Produção (8 ativos)**:
- ✅ Botfy - Agendamento (bPJamJhBcrVCKgBg) - AI Agent principal
- ✅ Botfy - Anti No-Show (HTR3ITfFDrK6eP2R) - Lembretes automáticos
- ✅ Botfy - Pre Check-In (BWDsb4A0GVs2NQnM) - Pré check-in 24h
- ✅ Botfy - Pre Check-In Lembrete (3ryiGnLNLuPWEfmL) - Lembrete pré check-in
- ✅ Botfy - Verificar Pendências (SMjeAMnZ6XkFPptn) - Monitora pendências
- ✅ Botfy - Waitlist Notify (WCCLua7qhvRUlNSr) - Notifica lista de espera
- ✅ Botfy WX - ChatAgent v2 (El3mdyoWtotOGkvZ) - Gateway HTTP
- ✅ Botfy WX - Message Processor (gzVC2BUZ376to3yz) - Processador de mensagens

**Tools (10 sub-workflows)**:
- Buscar Slots Disponíveis, Criar Agendamento, Reagendar, Cancelar
- Buscar Agendamentos, Buscar Paciente, Atualizar Dados Paciente
- Buscar Instruções, Processar Documento, Consultar Status Pre Check-In

**Todos os testes passando** (4/4):
- `/test/anti-no-show` → HTTP 200
- `/test/pre-checkin` → HTTP 200
- `/test/pre-checkin-lembrete` → HTTP 200
- `/test/verificar-pendencias` → HTTP 200

**Correções recentes (2026-01-19)**:
- Corrigido sessionKey no Postgres Chat Memory (usar `$('NodeName').item.json.field` em sub-nodes)
- Corrigido double-encoding de JSONB no Waitlist Notify (não usar JSON.stringify em campos JSONB)

**Próximos passos recomendados**:
1. Converter Anti No-Show para Postgres (quando possível)
2. Adicionar mais testes automatizados
3. Implementar monitoramento de erros
4. Documentar casos de uso complexos
