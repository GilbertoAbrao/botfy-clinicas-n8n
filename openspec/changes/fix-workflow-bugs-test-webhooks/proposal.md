# Proposal: Correções de Bugs e Webhooks para Testes Automatizados

## Change ID
`fix-workflow-bugs-test-webhooks`

## Problem Statement

Durante os testes manuais dos workflows N8N do sistema Botfy Clínicas, foram identificados **15 bugs críticos e de UX** que impactam a experiência do usuário e a confiabilidade do sistema. Adicionalmente, o processo de teste é manual e depende de disparo via interface do N8N, tornando-o lento e propenso a erros.

### Bugs Identificados

**UX Issues (5):**
1. Sistema usa nome completo em vez de primeiro nome nas respostas
2. Mensagem de encerramento aparece mesmo após cancelamento
3. Mensagens fragmentadas (múltiplos envios)
4. Busca de agendamento solicita data/hora antes de buscar por telefone
5. Cancelamento não oferece opção de reagendamento primeiro

**Bugs Críticos (10):**
6. ✅ Anti No-Show: Campo errado no alerta para recepcionista (CORRIGIDO)
7. Criar Agendamento: Cria paciente duplicado em vez de encontrar existente
8. (merged with #9)
9. Timezone: Banco e workflows sem timezone - `data_hora` armazenado sem TZ
10. Anti No-Show: Lógica de timing invertida (lembretes disparam no horário errado)
11. ✅ Pre Check-In: Filtro busca apenas status 'confirmado' (CORRIGIDO)
12. ✅ Pre Check-In: Node sem `alwaysOutputData` para workflow (CORRIGIDO)
13. Pre Check-In: Variáveis de ambiente não carregadas
14. Pre Check-In: Template de mensagem com variáveis inexistentes
15. Anti No-Show: Prompt IA com variáveis não interpoladas

### Falta de Automação de Testes

Atualmente, todos os workflows precisam ser testados manualmente:
- Ajuste manual de horários de agendamentos no banco
- Disparo manual via interface N8N
- Impossibilidade de testes automatizados via CI/CD
- Dificuldade para validar correções

## Proposed Solution

### 1. Correções de Bugs

Organizar correções em 5 categorias de specs:

**a) atendimento-whatsapp** (bugs UX #1-5)
- Modificar requirements existentes
- Adicionar cenários para busca de agendamento
- Adicionar comportamento de cancelamento

**b) anti-no-show** (bugs #9, #10, #15)
- Criar spec com requirements de timezone
- Corrigir lógica de janelas de tempo
- Corrigir preparação de dados para IA

**c) pre-checkin** (bugs #13, #14)
- Criar spec com requirements de configuração
- Corrigir template de mensagem

**d) criar-agendamento** (bug #7)
- Criar spec com requirement de busca de paciente existente

**e) banco-dados** (bug #9)
- Criar spec com migration de timezone

### 2. Webhooks para Testes Automatizados

Adicionar triggers webhook em TODOS os workflows principais para permitir:
- Testes automatizados via API
- Parametrização de cenários via payload
- Validação de correções sem intervenção manual

**Workflows que receberão webhooks:**
1. Botfy - Agendamento (já tem)
2. Botfy - Anti No-Show (adicionar)
3. Botfy - Pre Check-In (adicionar)
4. Botfy - Pre Check-In Lembrete (adicionar)
5. Botfy - Verificar Pendencias (adicionar)

## Capabilities Affected

- `atendimento-whatsapp` (MODIFIED)
- `anti-no-show` (NEW)
- `pre-checkin` (NEW)
- `criar-agendamento` (NEW)
- `banco-dados` (NEW)
- `test-automation` (NEW)

## Success Criteria

1. ✅ Todos os 10 bugs não corrigidos são resolvidos
2. ✅ Todos os workflows principais possuem webhook de teste
3. ✅ Testes automatizados podem ser executados via `curl` ou ferramenta similar
4. ✅ Timezone configurado corretamente no banco e workflows
5. ✅ Validação via `openspec validate --strict` sem erros

## Out of Scope

- Migração de dados históricos de `data_hora` (apenas novos registros)
- Refatoração de workflows não relacionados aos bugs
- Implementação de suite de testes automatizados (apenas webhooks)
- Correção de bugs não identificados nos testes

## Dependencies

- Acesso ao n8n via MCP
- Acesso ao Supabase via MCP
- Credenciais Evolution API configuradas

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Migration de timezone quebra queries existentes | Alto | Testar queries críticas antes/depois da migration |
| Mudanças em webhooks afetam integrações | Médio | Webhooks de teste em paths separados (`/test/...`) |
| Correções de IA alteram tom das mensagens | Baixo | Manter guidelines de tom no prompt |

## Timeline Estimate

- Specs + Design: 1 sessão
- Implementação: 2-3 sessões
- Validação: 1 sessão

**Total**: 4-5 sessões de trabalho
