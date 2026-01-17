# Design Document: Correções de Bugs e Webhooks para Testes

## Architecture Overview

Esta mudança envolve **6 specs** distribuídos em 3 camadas do sistema:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ atendimento-     │  │   pre-checkin    │                 │
│  │   whatsapp       │  │                  │                 │
│  │  (workflows)     │  │   (workflows)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     CAMADA DE NEGÓCIO                        │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  anti-no-show    │  │ criar-agendamento│                 │
│  │  (workflows)     │  │    (tool)        │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                           │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  banco-dados     │  │ test-automation  │                 │
│  │  (migrations)    │  │   (webhooks)     │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Timezone Strategy

**Decisão**: Usar `TIMESTAMPTZ` no PostgreSQL + conversões explícitas em workflows.

**Alternativas Consideradas:**
- A) Manter `TIMESTAMP` e sempre tratar como BRT
- B) Migrar para `TIMESTAMPTZ` e ajustar workflows
- C) Usar biblioteca de datas no N8N para conversões

**Escolha**: **B** - `TIMESTAMPTZ` no banco

**Justificativa:**
- PostgreSQL recomenda `TIMESTAMPTZ` para dados com timezone
- Queries `NOW()` retornam UTC por padrão
- Workflows já usam `DateTime.setZone()` do Luxon
- Evita ambiguidade em cálculos de tempo

**Trade-offs:**
- ✅ Clareza: timezone explícito no tipo do dado
- ✅ Segurança: queries não precisam assumir timezone
- ❌ Migration: precisa alterar coluna existente
- ❌ Dados históricos: podem ter ambiguidade (assumir BRT)

**Implementation:**
```sql
-- Migration
ALTER TABLE agendamentos
  ALTER COLUMN data_hora TYPE TIMESTAMPTZ
  USING data_hora AT TIME ZONE 'America/Sao_Paulo';

-- Set timezone padrão
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';
```

**Workflows afetados:**
- Anti No-Show: cálculo de `horas_ate_consulta`
- Pre Check-In: filtro de janela 24h
- Todos os que fazem `NOW()` comparisons

---

### 2. Webhook Test Strategy

**Decisão**: Webhooks paralelos em paths `/test/*` que bypassam validações de negócio.

**Alternativas Consideradas:**
- A) Usar os mesmos webhooks com flag `?test=true`
- B) Criar webhooks separados em `/test/*`
- C) Criar workflows duplicados apenas para teste

**Escolha**: **B** - Webhooks separados em `/test/*`

**Justificativa:**
- Isolamento: testes não afetam webhooks de produção
- Controle: pode ter comportamento diferente (ex: skip delays)
- Clareza: URL deixa explícito que é teste

**Trade-offs:**
- ✅ Segurança: produção isolada de testes
- ✅ Flexibilidade: pode adicionar features de teste
- ❌ Duplicação: mais nodes nos workflows
- ❌ Manutenção: precisa manter 2 triggers sincronizados

**Implementation Pattern:**
```
Workflow: Botfy - Anti No-Show
├── Verifica Consultas (Schedule Trigger) ← produção
├── Test Trigger (Webhook /test/anti-no-show) ← novo
│   ├── Aceita payload: { "agendamento_id": 10 }
│   └── Bypassa schedule e busca direto no banco
└── [resto do workflow compartilhado]
```

**Exemplo de teste:**
```bash
curl -X POST https://n8n.host/webhook/test/anti-no-show \
  -H "Content-Type: application/json" \
  -d '{"agendamento_id": 10}'
```

---

### 3. AI Prompt Variable Resolution

**Decisão**: Node "Prepara Dados Lembrete" ANTES do node de IA.

**Problema Atual:**
```javascript
// Node: IA Gera Mensagem
Prompt: "Nome: {{ $json.nome }}"
       ↓
AI recebe LITERALMENTE: "Nome: {{ $json.nome }}"
       ↓
AI gera: "Oi {{ $json.nome }}!"
```

**Solução:**
```
[Calcula Tempo Restante]
        ↓
[Prepara Dados Lembrete] ← NOVO
  - nome: {{ $json.paciente_nome.split(' ')[0] }}
  - data_formatada: {{ DateTime...toFormat('dd/MM/yyyy') }}
  - horario: {{ DateTime...toFormat('HH:mm') }}
        ↓
[IA Gera Mensagem]
  Prompt: "Nome: {{ $json.nome }}"  ← agora $json.nome existe!
```

**Alternativas Consideradas:**
- A) Usar referências ao node anterior no prompt
- B) Criar node intermediário de preparação
- C) Modificar o Code Tool para fazer formatação

**Escolha**: **B** - Node intermediário

**Justificativa:**
- Separação de responsabilidades
- Reutilizável em outros workflows
- Testável isoladamente
- Não polui prompt com lógica de formatação

---

### 4. Anti No-Show Timing Logic

**Problema Atual:**
```javascript
// Condição: horas_ate <= config AND horas_ate >= (config - 2)
// Para lembrete de 2h:
//   Aceita: 0h até 2h (ERRADO - já passou!)
//   Rejeita: 2.1h (DEVERIA aceitar!)
```

**Solução:**
```javascript
// Condição: horas_ate >= config AND horas_ate <= (config + 0.5)
// Para lembrete de 2h:
//   Aceita: 2h até 2.5h (janela de 30min)
//   Rejeita: 2.6h, 1.9h
```

**Justificativa:**
- Janela fixa de 30min após o alvo
- Workflow roda a cada 15min, então janela de 30min garante 2 tentativas
- Comportamento mais intuitivo (lembrete quando FALTA X horas)

**Trade-off:**
- Se workflow atrasar >30min, lembrete pode não disparar
- Solução: adicionar alarme de execução atrasada

---

### 5. Pre Check-In Message Template

**Problema Atual:**
```javascript
// Node: Prepara Mensagem
assignments: [
  { name: "data_consulta", value: "={{ ... }}" },
  { name: "procedimento", value: "={{ ... }}" },
  { name: "mensagem", value: "=... {{ $json.data_consulta }} ..." }
                                      ↑ NÃO EXISTE AINDA!
]
```

**Solução 1 (Simples):**
```javascript
// Usar referência ao node anterior
{ name: "mensagem", value: "=... {{ $('Busca Agendamentos').item.json.data_hora }} ..." }
```

**Solução 2 (Melhor):**
```javascript
// Node 1: Extrai Variáveis
assignments: [
  { name: "data_consulta", value: "={{ ... }}" },
  { name: "procedimento", value: "={{ ... }}" },
]

// Node 2: Monta Mensagem
assignments: [
  { name: "mensagem", value: "=... {{ $json.data_consulta }} ..." }
]
```

**Escolha**: **Solução 1** (mais simples)

**Justificativa:**
- Evita adicionar mais um node
- Workflow já tem muitos nodes
- Performance não é crítica aqui

---

### 6. Variáveis de Ambiente vs Config Globais

**Situação Atual:**
- Anti No-Show usa tabela `config_globais` (funciona)
- Pre Check-In usa `$env.EVOLUTION_*` (não funciona)

**Decisão**: Padronizar em `config_globais` via node Supabase.

**Justificativa:**
- Consistência entre workflows
- Facilita mudanças sem restart do N8N
- Centraliza configuração no banco
- Workaround já testado e funcionando

**Implementation:**
Adicionar node "Variáveis Globais" em TODOS os workflows que precisam:
```
position: [-400, 120] (acima do fluxo principal)
parameters:
  operation: get
  tableId: config_globais
  id: 1
```

---

## Sequencing Strategy

### Phase 1: Fundação (Banco + Config)
1. Migration de timezone
2. Adicionar nodes "Variáveis Globais" nos workflows

### Phase 2: Correções Críticas (Anti No-Show + Pre Check-In)
3. Corrigir lógica de timing
4. Corrigir preparação de dados para IA
5. Corrigir template de mensagem

### Phase 3: Correções UX (Atendimento)
6. Implementar requisitos UX #1-5

### Phase 4: Tools (Criar Agendamento)
7. Implementar busca de paciente existente

### Phase 5: Automação (Webhooks)
8. Adicionar webhooks de teste em todos workflows

**Rationale:**
- Fundação primeiro (timezone afeta tudo)
- Críticos antes de UX (funcionalidade > experiência)
- Tools por último (dependem de workflows funcionando)
- Automação no final (para testar as correções)

---

## Testing Strategy

### Manual Testing (durante desenvolvimento)
1. Ajustar `data_hora` de agendamento de teste
2. Executar workflow manualmente
3. Verificar mensagem recebida no WhatsApp

### Automated Testing (após webhooks)
```bash
# Anti No-Show (lembrete de 2h)
curl -X POST $N8N_URL/webhook/test/anti-no-show \
  -d '{"agendamento_id": 10}'

# Pre Check-In (24h antes)
curl -X POST $N8N_URL/webhook/test/pre-checkin \
  -d '{"agendamento_id": 10}'
```

### Validation Checklist
- [ ] Timezone: `SELECT data_hora, data_hora AT TIME ZONE 'UTC' FROM agendamentos`
- [ ] Anti No-Show: lembrete dispara na janela correta
- [ ] Pre Check-In: mensagem formatada corretamente
- [ ] Criar Agendamento: não cria duplicatas
- [ ] Webhooks: todos workflows respondem via `/test/*`

---

## Rollback Strategy

Se algo der errado após merge:

1. **Timezone Migration:**
   ```sql
   -- Reverter para TIMESTAMP
   ALTER TABLE agendamentos
     ALTER COLUMN data_hora TYPE TIMESTAMP
     USING data_hora AT TIME ZONE 'America/Sao_Paulo';
   ```

2. **Workflows:**
   - Restaurar backups de `workflows-backup/*-backup-*.json`
   - Importar via n8n UI ou MCP

3. **Config Globais:**
   - Não precisa rollback (additive)

---

## Open Questions

1. **Dados históricos com timezone ambíguo:**
   - Assumir que todos os registros atuais são BRT?
   - Ou marcar como UTC e corrigir manualmente?

   **Recomendação**: Assumir BRT (95% dos agendamentos são locais)

2. **Webhooks em workflows com Schedule:**
   - Manter Schedule + Webhook ou só Webhook com cron externo?

   **Recomendação**: Manter ambos (Schedule para produção, Webhook para testes)

3. **Node "Variáveis Globais" em todos workflows:**
   - Criar sub-workflow reutilizável ou duplicar em cada?

   **Recomendação**: Duplicar (evita dependência externa, mais simples)

4. **Formato de testes automatizados:**
   - Criar script bash ou usar ferramenta como Postman?

   **Recomendação**: Bash script (mais portável, mais fácil de integrar CI/CD)
