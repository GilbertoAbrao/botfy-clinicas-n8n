# Botfy Clinicas

Sistema de automação de atendimento para clínicas de estética via WhatsApp, utilizando IA conversacional para agendamento de consultas, lembretes automáticos e pré check-in.

## Funcionalidades

- **Agendamento por WhatsApp** - Pacientes agendam, remarcam e cancelam consultas conversando com a IA
- **Anti No-Show** - Lembretes automáticos 48h, 24h e 2h antes da consulta
- **Pré Check-In** - Confirmação de dados cadastrais 24h antes
- **Confirmação de Presença** - Pacientes confirmam via WhatsApp
- **Busca Inteligente** - IA entende linguagem natural ("semana que vem", "final da tarde")

## Arquitetura

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   WhatsApp   │────>│  Evolution API   │────>│   N8N Webhook   │
│  (Paciente)  │<────│    (Gateway)     │<────│  /webhook/marilia│
└──────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │    AI Agent     │
                                              │   (Marilia)     │
                                              │  GPT-4o-mini    │
                                              └────────┬────────┘
                                                       │
                     ┌─────────────────────────────────┼─────────────────────────────────┐
                     │                                 │                                 │
                     ▼                                 ▼                                 ▼
            ┌────────────────┐              ┌────────────────┐              ┌────────────────┐
            │ Buscar Slots   │              │ Criar/Reagendar│              │ Buscar Paciente│
            │ Disponíveis    │              │ Cancelar       │              │ Confirmar Pres.│
            └────────────────┘              └────────────────┘              └────────────────┘
                     │                                 │                                 │
                     └─────────────────────────────────┼─────────────────────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │    Supabase     │
                                              │  (PostgreSQL)   │
                                              └─────────────────┘
```

## Stack Tecnológico

| Componente | Tecnologia | Função |
|------------|------------|--------|
| Automação | N8N | Workflows e AI Agents |
| WhatsApp | Evolution API | Gateway de mensagens |
| Banco de Dados | Supabase (PostgreSQL) | Persistência |
| IA | OpenAI GPT-4o-mini | Processamento de linguagem natural |
| Hosting | EasyPanel | Infraestrutura |

## Workflows

### Principais (Produção)

| Workflow | Trigger | Função |
|----------|---------|--------|
| **Botfy - Agendamento** | Webhook | Agente central de atendimento |
| **Botfy - Anti No-Show** | Cron 15min | Lembretes automáticos |
| **Botfy - Pre Check-In** | Cron 1h | Envia pré check-in 24h antes |
| **Botfy - Pre Check-In Lembrete** | Cron 2h | Lembrete de pré check-in |
| **Botfy - Verificar Pendências** | Cron 2h | Notifica clínica |

### Tools (Sub-workflows)

| Tool | Função |
|------|--------|
| `buscar_slots_disponiveis` | Busca horários livres por data/período |
| `criar_agendamento` | Cria paciente (se novo) + agendamento |
| `reagendar_agendamento` | Atualiza data/hora |
| `cancelar_agendamento` | Marca como cancelado |
| `buscar_agendamentos` | Lista agendamentos |
| `buscar_paciente` | Busca dados do paciente |
| `atualizar_dados_paciente` | Atualiza cadastro |

## Banco de Dados

### Tabelas Principais

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

| Tabela | Descrição |
|--------|-----------|
| `pacientes` | Cadastro de pacientes |
| `servicos` | Procedimentos disponíveis |
| `agendamentos` | Consultas agendadas |
| `chats` | Sessões de conversa WhatsApp |
| `lembretes_enviados` | Tracking anti no-show |
| `pre_checkin` | Status de pré check-in |
| `n8n_chat_histories` | Memória do AI Agent |

## Configuração

### Variáveis de Ambiente (N8N)

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_INSTANCE=Nome-da-Instancia
EVOLUTION_API_KEY=sua-api-key
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-anon-key
```

### Configurações da Clínica

| Parâmetro | Valor |
|-----------|-------|
| Horário de Funcionamento | 08:00 - 20:00 (seg-sex) |
| Horário de Almoço | 12:00 - 13:00 |
| Antecedência Mínima | 2 horas |
| Profissional | Dra. Paula |
| Persona IA | Marília |

### Serviços Disponíveis

| Serviço | Duração |
|---------|---------|
| Avaliação Facial | 30 min |
| Limpeza de Pele | 60 min |
| Peeling | 45 min |
| Botox | 30 min |
| Preenchimento | 45 min |

## Estrutura do Projeto

```
botfy-clinicas-n8n/
├── README.md                 # Este arquivo
├── CLAUDE.md                 # Instruções para Claude Code
├── AGENTS.md                 # Guia para agentes AI
├── openspec/                 # Especificações OpenSpec
│   ├── project.md
│   ├── specs/
│   └── changes/
└── workflows-backup/         # Backup dos workflows N8N
    ├── workflows-index.json
    ├── bPJamJhBcrVCKgBg-agendamento.json
    ├── HTR3ITfFDrK6eP2R-anti-no-show.json
    └── ...
```

## Uso

### Fluxo de Agendamento

1. Paciente envia mensagem no WhatsApp
2. Evolution API recebe e encaminha para N8N
3. Buffer acumula mensagens por 15 segundos
4. AI Agent (Marília) processa e responde
5. Se necessário, chama tools para buscar/criar dados
6. Resposta enviada de volta ao paciente

### Exemplo de Conversa

```
Paciente: Oi, quero agendar uma avaliação facial
Marília: Olá! Vou te ajudar a agendar sua avaliação facial com a Dra. Paula.
         Qual dia seria melhor pra você?

Paciente: Pode ser quinta no final da tarde
Marília: Perfeito! Na quinta-feira (16/01) tenho esses horários disponíveis:
         - 16:00
         - 16:30
         - 17:00
         - 17:30
         Qual prefere?

Paciente: 17:00
Marília: Ótimo! Para confirmar, preciso do seu nome completo e telefone com DDD.

Paciente: Maria Silva, 11999999999
Marília: Prontinho, Maria! Sua avaliação facial está agendada:
         📅 Quinta-feira, 16/01 às 17:00
         👩‍⚕️ Dra. Paula
         📍 [Endereço da clínica]

         Te envio um lembrete antes da consulta. Até lá!
```

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| AI não chama tools | Falta toolSchema | Adicionar schema JSON ao node |
| Tool com itemsInput=0 | Falta specifyInputSchema | Adicionar `specifyInputSchema: true` |
| AI inventa horários | Não chama buscar_slots | Verificar schema e prompt |
| AI repete perguntas | Memória poluída | Limpar `n8n_chat_histories` |
| Tool não recebe parâmetros | Uso incorreto de $fromAI | Ver seção abaixo |

### Problema Crítico: $fromAI() em Tools

**Sintoma**: Tool é chamada mas parâmetros chegam como `undefined` ou vazios.

**Causa**: Configuração incorreta do `$fromAI()` no node que chama a tool.

**Solução**: Ao usar nodes que passam parâmetros para tools do AI Agent, o `$fromAI()` deve ser configurado corretamente:

```javascript
// ERRADO - $fromAI sem parênteses ou mal configurado
{
  "data": "$fromAI",
  "periodo": "{{ $json.periodo }}"
}

// CORRETO - $fromAI() com schema completo
{
  "data": "={{ $fromAI('data', 'Data no formato YYYY-MM-DD', 'string') }}",
  "periodo": "={{ $fromAI('periodo', 'Período: manha, tarde ou qualquer', 'string') }}"
}
```

**Estrutura do $fromAI()**:
```javascript
$fromAI(nome, descricao, tipo)
// nome: nome do parâmetro
// descricao: descrição para o AI entender quando usar
// tipo: 'string', 'number', 'boolean', 'json'
```

**Importante**:
- O `$fromAI()` é usado em nodes **intermediários** (como Set/Edit Fields) que preparam dados para sub-workflows
- Em **Code Tools**, use a variável `query` diretamente
- Sempre teste se os parâmetros estão chegando verificando a execução no N8N

### Limpar Memória de um Paciente

```sql
DELETE FROM n8n_chat_histories
WHERE session_id LIKE '5511999999999%';
```

## Backup e Restauração

Os workflows são salvos em `workflows-backup/` no formato:
```
{workflow_id}-{nome-kebab}.json
```

Para restaurar, importe o JSON diretamente no N8N.

## Documentação Adicional

- **CLAUDE.md** - Instruções completas para Claude Code
- **AGENTS.md** - Guia detalhado para agentes AI
- **openspec/** - Especificações de features e mudanças

## Licença

Projeto proprietário - Botfy AI Agency
