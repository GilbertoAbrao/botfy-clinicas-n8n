<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Botfy Clinicas - Sistema de Automacao para Clinicas

Sistema de automacao de atendimento para clinicas via WhatsApp usando N8N, Evolution API e Supabase.

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
│  │  (15 seg)   │    │  Chat/Dup   │    │  (Marilia)  │    │  Resposta   │       │
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

## Integracao Principal

- **Evolution API**: Gateway WhatsApp (instancia: `Botfy AI - Brazil`)
- **Webhook**: `/webhook/marilia` - Ponto de entrada unico para mensagens
- **Supabase**: Banco de dados PostgreSQL
- **OpenAI**: GPT-4o-mini para AI Agent

## Workflows - Tabela Resumida

### Workflows Ativos (Producao)

| ID | Nome | Nodes | Trigger | Funcao |
|----|------|-------|---------|--------|
| `bPJamJhBcrVCKgBg` | Botfy - Agendamento | 82 | Webhook `/webhook/marilia` | **PRINCIPAL** - AI Agent de atendimento |
| `HTR3ITfFDrK6eP2R` | Botfy - Anti No-Show | 52 | Schedule (15min) | Lembretes automaticos 48h/24h/2h |
| `BWDsb4A0GVs2NQnM` | Botfy - Pre Check-In | 9 | Schedule (1h) | Envia pre check-in 24h antes |
| `3ryiGnLNLuPWEfmL` | Botfy - Pre Check-In Lembrete | 6 | Schedule (2h) | Lembrete de pre check-in |
| `SMjeAMnZ6XkFPptn` | Botfy - Verificar Pendencias | 9 | Schedule (2h) | Notifica clinica sobre pendencias |

### Tools (Sub-workflows)

| ID | Nome | Funcao |
|----|------|--------|
| `8Bke6sYr7r51aeEq` | Tool: Buscar Slots Disponiveis | Busca horarios livres por data/periodo |
| `eEx2enJk3YpreNUm` | Tool: Criar Agendamento | Cria paciente (se novo) + agendamento |
| `21EHe24mkMmfBhK6` | Tool: Reagendar Agendamento | Atualiza data_hora do agendamento |
| `gE2rpbLVUlnA5yMk` | Tool: Cancelar Agendamento | Marca status = 'cancelada' |
| `8Ug0F3KuLov6EeCQ` | Tool: Buscar Agendamentos | Lista agendamentos por periodo |
| `igG6sZsStxiDzNRY` | Tool: Buscar Paciente | Busca paciente + agendamentos |
| `4DNyXp5fPPfsFOnR` | Tool: Atualizar Dados Paciente | Atualiza campos do paciente |

---

## Workflows N8N

### Workflows Ativos (Producao)

#### 1. Botfy - Agendamento (bPJamJhBcrVCKgBg) - PRINCIPAL
**Status**: Ativo | **Nodes**: 82 | **Webhook**: `/webhook/marilia`

Agente central de atendimento. Recebe TODAS as mensagens do WhatsApp e:
- Agenda, remarca e cancela consultas
- Confirma presenca de pacientes (anti-no-show)
- Busca horarios disponiveis
- Buffer de mensagens (15s) para acumular mensagens rapidas

**Tools do AI Agent**:
- `buscar_slots_disponiveis` - Busca horarios LIVRES (schema com data + periodo)
- `buscar_agendamentos` - Consulta agendamentos existentes
- `criar_agendamento` - Cria novo agendamento
- `reagendar_agendamento` - Remarca consulta
- `cancelar_agendamento` - Cancela consulta
- `confirmar_presenca` - Confirma presenca do paciente
- `buscar_paciente` - Busca dados do paciente

**Persona**: Marilia, atendente virtual da Dra. Paula (esteticista)

---

#### 2. Botfy - Anti No-Show (HTR3ITfFDrK6eP2R)
**Status**: Ativo | **Nodes**: 52 | **Trigger**: Schedule (cada 15min)

Sistema de lembretes automaticos para reduzir faltas:
- Envia lembretes 48h, 24h e 2h antes da consulta
- Registra lembretes enviados em `lembretes_enviados`
- Calcula risco de no-show por paciente
- Escala para humano se paciente nao responde

---

#### 3. Botfy - Pre Check-In (BWDsb4A0GVs2NQnM)
**Status**: Ativo | **Nodes**: 9 | **Trigger**: Schedule (1h)

Envia mensagem de pre check-in 24h antes da consulta:
- Confirma dados cadastrais do paciente
- Solicita documentos pendentes
- Cria registro em `pre_checkin`

---

#### 4. Botfy - Pre Check-In Lembrete (3ryiGnLNLuPWEfmL)
**Status**: Ativo | **Nodes**: 6 | **Trigger**: Schedule (2h)

Envia lembrete para pacientes com pre check-in pendente:
- Busca pre check-ins nao completados
- Envia lembrete ~12h antes da consulta

---

#### 5. Botfy - Verificar Pendencias Pre Check-In (SMjeAMnZ6XkFPptn)
**Status**: Ativo | **Nodes**: 9 | **Trigger**: Schedule

Monitora pre check-ins pendentes e notifica a clinica:
- Classifica urgencia das pendencias
- Agrega relatorio
- Envia notificacao para clinica

---

### Workflows Auxiliares (Tools)

Estes workflows sao chamados como sub-workflows pelo Agente principal:

| ID | Nome | Funcao |
|----|------|--------|
| eEx2enJk3YpreNUm | Tool: Criar Agendamento | Cria paciente (se necessario) e agendamento |
| 21EHe24mkMmfBhK6 | Tool: Reagendar Agendamento | Atualiza data/hora do agendamento |
| gE2rpbLVUlnA5yMk | Tool: Cancelar Agendamento | Marca agendamento como cancelado |
| 8Ug0F3KuLov6EeCQ | Tool: Buscar Agendamentos | Busca agendamentos por data/paciente |
| igG6sZsStxiDzNRY | Tool: Buscar Paciente | Busca dados e agendamentos do paciente |

---

### Workflows Inativos/Legado

| ID | Nome | Status | Motivo |
|----|------|--------|--------|
| 3BtsyJCCLRo5wA3v | Agente IA Central | Desativado | Consolidado no Agendamento |
| p2YTCXaZCvRBB6oY | Router WhatsApp | Desativado | Substituido por webhook unico |
| E7T0VyKgGPBUcdPn | Agendamento - API Oficial | Desativado | Versao antiga |

---

## Dicionario de Dados - Supabase

### Tabela: `pacientes`
Cadastro de pacientes da clinica.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `nome` | VARCHAR(255) | Sim | Nome completo do paciente |
| `telefone` | VARCHAR(20) | Sim | Telefone com DDI (ex: 5511999999999) |
| `email` | VARCHAR(255) | Nao | Email do paciente |
| `data_nascimento` | DATE | Nao | Data de nascimento |
| `cpf` | VARCHAR(14) | Nao | CPF (apenas numeros ou formatado) |
| `endereco` | TEXT | Nao | Endereco completo |
| `convenio` | VARCHAR(100) | Nao | Nome do convenio |
| `numero_carteirinha` | VARCHAR(50) | Nao | Numero da carteirinha do convenio |
| `created_at` | TIMESTAMP | Auto | Data de criacao |
| `updated_at` | TIMESTAMP | Auto | Data de atualizacao |

---

### Tabela: `servicos`
Procedimentos oferecidos pela clinica.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `nome` | VARCHAR(100) | Sim | Nome do procedimento |
| `duracao_minutos` | INTEGER | Sim | Duracao em minutos |
| `ativo` | BOOLEAN | Sim | Se o servico esta disponivel |
| `preco` | DECIMAL(10,2) | Nao | Preco do procedimento |

**Servicos Cadastrados:**
- Avaliacao Facial (30 min)
- Limpeza de Pele (60 min)
- Peeling (45 min)
- Botox (30 min)
- Preenchimento (45 min)

---

### Tabela: `agendamentos`
Consultas agendadas.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `paciente_id` | INTEGER | FK | Referencia para pacientes.id |
| `servico_id` | INTEGER | FK | Referencia para servicos.id |
| `data_hora` | TIMESTAMP | Sim | Data e hora do agendamento |
| `tipo_consulta` | VARCHAR(100) | Nao | Nome do procedimento (redundante) |
| `profissional` | VARCHAR(100) | Sim | Nome do profissional (default: Dra. Paula) |
| `duracao_minutos` | INTEGER | Nao | Duracao em minutos |
| `status` | VARCHAR(20) | Sim | Status: `agendada`, `confirmado`, `cancelada`, `realizada`, `faltou` |
| `observacoes` | TEXT | Nao | Observacoes do agendamento |
| `created_at` | TIMESTAMP | Auto | Data de criacao |
| `updated_at` | TIMESTAMP | Auto | Data de atualizacao |

**Status possiveis:**
```
agendada    -> Agendamento criado, aguardando confirmacao
confirmado  -> Paciente confirmou presenca
cancelada   -> Agendamento cancelado
realizada   -> Consulta realizada
faltou      -> Paciente nao compareceu (no-show)
```

---

### Tabela: `chats`
Sessoes de conversa WhatsApp.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `remotejID` | VARCHAR(50) | Sim | ID do WhatsApp (ex: 5511999999999@s.whatsapp.net) |
| `status` | VARCHAR(20) | Sim | Status: `I.A`, `Humano`, `Finalizado` |
| `created_at` | TIMESTAMP | Auto | Data de criacao |
| `updated_at` | TIMESTAMP | Auto | Data de atualizacao |

**Status possiveis:**
```
I.A       -> Atendimento automatico pela Marilia
Humano    -> Transferido para atendente humano
Finalizado -> Conversa encerrada
```

---

### Tabela: `lembretes_enviados`
Tracking de lembretes anti no-show.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `agendamento_id` | INTEGER | FK | Referencia para agendamentos.id |
| `telefone` | VARCHAR(20) | Sim | Telefone do paciente |
| `tipo_lembrete` | VARCHAR(20) | Sim | Tipo: `48h`, `24h`, `2h` |
| `status_resposta` | VARCHAR(20) | Sim | Status: `pendente`, `confirmado`, `cancelado` |
| `evento_id` | VARCHAR(100) | Nao | ID do evento externo |
| `enviado_em` | TIMESTAMP | Auto | Data/hora do envio |
| `respondido_em` | TIMESTAMP | Nao | Data/hora da resposta |

---

### Tabela: `pre_checkin`
Status de pre check-in por agendamento.

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `agendamento_id` | INTEGER | FK | Referencia para agendamentos.id |
| `paciente_id` | INTEGER | FK | Referencia para pacientes.id |
| `status` | VARCHAR(20) | Sim | Status: `pendente`, `em_andamento`, `completo`, `incompleto` |
| `dados_confirmados` | BOOLEAN | Nao | Se os dados foram confirmados |
| `documentos_enviados` | BOOLEAN | Nao | Se os documentos foram enviados |
| `instrucoes_enviadas` | BOOLEAN | Nao | Se as instrucoes foram enviadas |
| `pendencias` | JSONB | Nao | Lista de pendencias |
| `mensagem_enviada_em` | TIMESTAMP | Nao | Data/hora da mensagem inicial |
| `lembrete_enviado_em` | TIMESTAMP | Nao | Data/hora do lembrete |
| `created_at` | TIMESTAMP | Auto | Data de criacao |
| `updated_at` | TIMESTAMP | Auto | Data de atualizacao |

---

### Tabela: `n8n_chat_histories`
Memoria do AI Agent (historico de conversas).

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | SERIAL | PK | Identificador unico |
| `session_id` | VARCHAR(100) | Sim | ID da sessao (ex: 5511999999999@s.whatsapp.net-calendar) |
| `message` | JSONB | Sim | Mensagem no formato {role, content} |
| `created_at` | TIMESTAMP | Auto | Data de criacao |

**Para limpar memoria de um paciente:**
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

## Variaveis de Ambiente N8N

```
EVOLUTION_API_URL=https://botfy-ai-agency-evolution-api.tb0oe2.easypanel.host
EVOLUTION_INSTANCE=Botfy AI - Brazil
EVOLUTION_API_KEY=6AD9F1ACABE9-4EF0-A554-B059D1A29264
SUPABASE_URL=https://gkweofpjwzsvlvnvfbom.supabase.co
SUPABASE_KEY=<anon_key>
```

---

## Configuracoes da Clinica

- **Horario**: 08:00 as 20:00 (seg-sex)
- **Almoco**: 12:00 as 13:00
- **Antecedencia minima**: 2 horas
- **Profissional**: Dra. Paula

### Servicos Disponiveis
- Avaliacao Facial (30 min)
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

## IMPORTANTE: Consultar Documentacao com Context7

**SEMPRE use o MCP context7 quando tiver duvidas sobre configuracao.**

```bash
# 1. Resolver ID da biblioteca
mcp__context7__resolve-library-id (query: "n8n", libraryName: "n8n")

# 2. Consultar documentacao
mcp__context7__query-docs (libraryId: "/n8n/n8n-docs", query: "Code Tool input schema")
```

**NAO perca tempo adivinhando. Consulte a documentacao primeiro.**

---

## Troubleshooting

### AI Agent nao chama tools
- Verificar se tool tem `toolSchema` JSON definido
- Verificar descricao da tool no prompt
- Checar execucao: node deve aparecer com `itemsInput > 0`

### Code Tool com itemsInput=0
- **CAUSA**: Falta `specifyInputSchema: true` no node
- **SOLUCAO**: Adicionar ao node:
  ```json
  {
    "specifyInputSchema": true,
    "schemaType": "manual",
    "inputSchema": "{ JSON Schema aqui }"
  }
  ```

### Erro "Wrong output type returned"
- **CAUSA**: Code Tool retornando objeto JSON
- **SOLUCAO**: Retornar STRING, nao objeto
  ```javascript
  return `Resultado: ${valor}`;  // CORRETO
  return { valor: valor };        // ERRADO
  ```

### Erro "No prompt specified"
- Usar referencia de node: `$('nodeName').first().json.campo`
- Nao usar `$json` diretamente apos nodes que sobrescrevem input

### AI inventa horarios
- Fortalecer prompt com instrucoes OBRIGATORIAS
- Verificar se `buscar_slots_disponiveis` tem schema correto
- Adicionar tabela de referencia de datas no prompt

### AI repete perguntas ou fica confusa
- **CAUSA**: Memoria do chat com historico de erros
- **SOLUCAO**: Limpar memoria do paciente
  ```sql
  DELETE FROM n8n_chat_histories
  WHERE session_id = 'TELEFONE@s.whatsapp.net-calendar';
  ```

### CRITICO: $fromAI() em Tools - Parametros undefined

**Sintoma**: Tool e chamada mas parametros chegam como `undefined` no sub-workflow.

**Causa**: O `$fromAI()` no node Edit Fields/Set nao esta configurado corretamente.

**Solucao**:
```javascript
// ERRADO - $fromAI sem configuracao completa
{
  "data": "$fromAI",
  "periodo": "{{ $json.periodo }}"
}

// CORRETO - $fromAI() com nome, descricao e tipo
{
  "data": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}",
  "periodo": "={{ $fromAI('periodo', 'Periodo: manha, tarde ou qualquer', 'string') }}"
}
```

**Estrutura**: `$fromAI(nome, descricao, tipo)`
- `nome`: identificador do parametro
- `descricao`: texto para o AI entender quando usar
- `tipo`: 'string', 'number', 'boolean', 'json'

**IMPORTANTE**:
- Use em nodes **Edit Fields/Set** que preparam dados para sub-workflows
- NAO use em Code Tools (la voce usa a variavel `query`)
- Sempre verifique na execucao se os valores estao chegando
