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

# Guia para Agentes AI - Botfy Clinicas

## Contexto do Projeto

Este e um sistema de automacao de atendimento para clinicas de estetica via WhatsApp.
A IA "Marilia" atende pacientes, agenda consultas e envia lembretes automaticos.

## Stack Tecnologico

| Componente | Tecnologia | Funcao |
|------------|------------|--------|
| Automacao | N8N | Workflows e AI Agents |
| WhatsApp | Evolution API | Gateway de mensagens |
| Banco de Dados | Supabase (PostgreSQL) | Persistencia |
| IA | OpenAI GPT-4o-mini | Processamento de linguagem |
| Hosting | EasyPanel | Infraestrutura |

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

---

## Workflows - Tabela Completa

### Workflows Ativos (Producao)

| ID | Nome | Status | Nodes | Trigger | Funcao |
|----|------|--------|-------|---------|--------|
| `bPJamJhBcrVCKgBg` | Botfy - Agendamento | **Ativo** | 82 | Webhook `/webhook/marilia` | **PRINCIPAL** - AI Agent de atendimento |
| `HTR3ITfFDrK6eP2R` | Botfy - Anti No-Show | **Ativo** | 52 | Schedule (15min) | Lembretes automaticos 48h/24h/2h |
| `BWDsb4A0GVs2NQnM` | Botfy - Pre Check-In | **Ativo** | 9 | Schedule (1h) | Envia pre check-in 24h antes |
| `3ryiGnLNLuPWEfmL` | Botfy - Pre Check-In Lembrete | **Ativo** | 6 | Schedule (2h) | Lembrete de pre check-in |
| `SMjeAMnZ6XkFPptn` | Botfy - Verificar Pendencias | **Ativo** | 9 | Schedule (2h) | Notifica clinica sobre pendencias |

### Tools (Sub-workflows)

| ID | Nome | Funcao | Chamado por |
|----|------|--------|-------------|
| `8Bke6sYr7r51aeEq` | Tool: Buscar Slots Disponiveis | Busca horarios livres por data/periodo | AI Agent |
| `eEx2enJk3YpreNUm` | Tool: Criar Agendamento | Cria paciente (se novo) + agendamento | AI Agent |
| `21EHe24mkMmfBhK6` | Tool: Reagendar Agendamento | Atualiza data_hora do agendamento | AI Agent |
| `gE2rpbLVUlnA5yMk` | Tool: Cancelar Agendamento | Marca status = 'cancelada' | AI Agent |
| `8Ug0F3KuLov6EeCQ` | Tool: Buscar Agendamentos | Lista agendamentos por periodo | AI Agent |
| `igG6sZsStxiDzNRY` | Tool: Buscar Paciente | Busca paciente + agendamentos | AI Agent |
| `4DNyXp5fPPfsFOnR` | Tool: Atualizar Dados Paciente | Atualiza campos do paciente | Webhook |

### Workflows Inativos/Legado

| ID | Nome | Motivo |
|----|------|--------|
| `3BtsyJCCLRo5wA3v` | Agente IA Central | Consolidado no Agendamento |
| `p2YTCXaZCvRBB6oY` | Router WhatsApp | Substituido por webhook unico |
| `E7T0VyKgGPBUcdPn` | Agendamento - API Oficial | Versao antiga |

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

## IMPORTANTE: Consultar Documentacao

**SEMPRE use o MCP context7 quando tiver duvidas sobre configuracao de qualquer tecnologia.**

```
# Primeiro, resolver o ID da biblioteca
mcp__context7__resolve-library-id (query: "n8n workflow automation", libraryName: "n8n")

# Depois, consultar a documentacao
mcp__context7__query-docs (libraryId: "/n8n/n8n-docs", query: "how to configure Code Tool with input schema")
```

### Quando usar context7:
- Duvidas sobre configuracao de nodes N8N
- Sintaxe de expressoes N8N (`$now`, `$input`, `$json`, etc)
- Configuracao de tools para AI Agent
- Qualquer erro que voce nao conheca a solucao

**NAO perca tempo tentando adivinhar configuracoes. Consulte a documentacao primeiro.**

---

## Padroes de Codigo N8N

### Referenciando Dados de Outros Nodes
```javascript
// CORRETO - Referencia explicita ao node
$('nodeName').first().json.campo

// ERRADO - Pode perder dados se node anterior sobrescrever
$json.campo
```

### Code Tools para AI Agent (toolCode)

**CRITICO**: Para Code Tools funcionarem com parametros, DEVE configurar:

```javascript
// No node toolCode, configurar:
{
  "specifyInputSchema": true,        // OBRIGATORIO para receber parametros
  "schemaType": "manual",            // Usar schema manual
  "inputSchema": "{...JSON Schema...}",  // Schema dos parametros
  "jsCode": "...",                   // Codigo que usa variavel 'query'
  "description": "..."               // Descricao para o AI Agent
}

// Exemplo de inputSchema:
{
  "type": "object",
  "properties": {
    "data": {
      "type": "string",
      "description": "Data no formato YYYY-MM-DD"
    },
    "periodo": {
      "type": "string",
      "enum": ["manha", "tarde", "qualquer"],
      "description": "Periodo do dia"
    }
  },
  "required": ["data"]
}

// ⚠️ IMPORTANTE: No Code Tool, parametros sao acessados via 'query'
// A variavel 'query' e um objeto JSON com os campos do schema
const data = query.data;
const periodo = query.periodo || 'qualquer';

// ⚠️ IMPORTANTE: Retornar STRING, nao objeto
return `Resultado: ${data}`;  // CORRETO
return { data: data };         // ERRADO - causa "Wrong output type"

// ❌ ERRADO - NAO usar $input.item.json em Code Tools!
// const data = $input.item.json.data;  // NAO FUNCIONA!
```

**ATENCAO**: Code Tools usam a variavel `query`, NAO `$input.item.json`.
- `query` sem schema: string simples
- `query` com schema (`specifyInputSchema: true`): objeto JSON

### Chamadas ao Supabase via Fetch
```javascript
const supabaseUrl = 'https://gkweofpjwzsvlvnvfbom.supabase.co';
const supabaseKey = $env.SUPABASE_KEY || $env.SUPABASE_ANON_KEY;

const resp = await fetch(
  `${supabaseUrl}/rest/v1/tabela?filtro=eq.valor`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
);
const data = await resp.json();
```

## Configuracoes da Clinica (Hardcoded)

```
Horario: 08:00 - 20:00 (seg-sex)
Almoco: 12:00 - 13:00
Antecedencia minima: 2 horas
Profissional: Dra. Paula
Persona IA: Marilia
```

## Checklist para Modificacoes

### Antes de Modificar Workflows
- [ ] Verificar qual workflow afeta (Agendamento e o principal)
- [ ] Fazer backup via `mcp__n8n-mcp__n8n_get_workflow`
- [ ] Entender fluxo atual lendo nodes e conexoes

### Ao Criar/Modificar Tools do AI Agent
- [ ] Definir `toolSchema` JSON com propriedades e tipos
- [ ] Incluir `description` clara para o AI entender quando usar
- [ ] Testar se `itemsInput > 0` na execucao

### Ao Modificar System Prompt
- [ ] Manter persona "Marilia"
- [ ] Incluir data/hora dinamica: `{{ $now.setZone('America/Sao_Paulo')... }}`
- [ ] Listar tools disponiveis e quando usar cada uma
- [ ] Ser explicito sobre o que NUNCA fazer

## Problemas Comuns e Solucoes

| Problema | Causa | Solucao |
|----------|-------|---------|
| AI nao chama tool | Falta toolSchema | Adicionar schema JSON |
| Tool com itemsInput=0 | Falta `specifyInputSchema: true` | Adicionar specifyInputSchema + inputSchema |
| Tool nao recebe parametros | Usa `$input.item.json` | Usar variavel `query` em vez de `$input.item.json` |
| Parametros undefined no sub-workflow | `$fromAI()` mal configurado | Ver secao abaixo |
| "Wrong output type" | Tool retorna objeto | Retornar STRING, nao objeto JSON |
| "No prompt specified" | Dados perdidos no fluxo | Usar `$('node').first().json` |
| AI inventa horarios | Nao chama buscar_slots | Fortalecer prompt + verificar schema |
| Erro de data/dia | AI calcula errado | Adicionar tabela de datas no prompt |
| AI repete perguntas | Memoria com erros | Limpar n8n_chat_histories do paciente |
| "Agent stopped due to max iterations" | Tool com erro + memoria poluida | Corrigir tool + limpar n8n_chat_histories |

### Problema Critico: $fromAI() em Tools

**Sintoma**: Tool e chamada mas parametros chegam como `undefined` ou vazios no sub-workflow.

**Causa**: O `$fromAI()` no node intermediario (Edit Fields/Set) nao esta configurado corretamente.

**Solucao**:

```javascript
// ERRADO - $fromAI sem configuracao
{
  "data": "$fromAI",
  "periodo": "{{ $json.periodo }}"
}

// CORRETO - $fromAI() com todos os parametros
{
  "data": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}",
  "periodo": "={{ $fromAI('periodo', 'Periodo: manha, tarde ou qualquer', 'string') }}"
}
```

**Estrutura do $fromAI()**:
```javascript
$fromAI(nome, descricao, tipo)
// nome: nome do parametro (usado internamente)
// descricao: descricao para o AI entender quando/como usar
// tipo: 'string', 'number', 'boolean', 'json'
```

**Onde usar**:
- Em nodes **Edit Fields** ou **Set** que preparam dados para sub-workflows
- NAO usar em Code Tools (use `query` diretamente)

## Arquivos de Backup

Workflows salvos em `workflows-backup/`:
```
{workflow_id}-{nome-kebab}.json
```

Atualizar backups apos modificacoes significativas.

## MCP Tools Disponiveis

Para interagir com N8N:
- `mcp__n8n-mcp__n8n_list_workflows` - Listar workflows
- `mcp__n8n-mcp__n8n_get_workflow` - Obter detalhes (mode: full/structure)
- `mcp__n8n-mcp__n8n_update_partial_workflow` - Atualizar nodes
- `mcp__n8n-mcp__n8n_executions` - Ver execucoes

Para Supabase:
- `mcp__supabase__execute_sql` - Queries SQL
- `mcp__supabase__list_tables` - Listar tabelas
- `mcp__supabase__apply_migration` - DDL changes
