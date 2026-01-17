# test-automation Specification Delta

## Purpose
Define requirements para adição de webhooks de teste em todos os workflows principais, permitindo testes automatizados via API.

## ADDED Requirements

### Requirement: Webhook de Teste em Path Separado
O sistema SHALL adicionar trigger webhook de teste em path `/test/*` em todos workflows principais.

#### Scenario: Anti No-Show com webhook de teste
- **GIVEN** workflow "Botfy - Anti No-Show"
- **WHEN** visualizado no n8n
- **THEN** possui trigger webhook com path="/test/anti-no-show"
- **AND** método HTTP = POST
- **AND** webhook está em paralelo com Schedule trigger (não substitui)

#### Scenario: Pre Check-In com webhook de teste
- **GIVEN** workflow "Botfy - Pre Check-In"
- **WHEN** visualizado no n8n
- **THEN** possui trigger webhook com path="/test/pre-checkin"
- **AND** método HTTP = POST

#### Scenario: Pre Check-In Lembrete com webhook de teste
- **GIVEN** workflow "Botfy - Pre Check-In Lembrete"
- **WHEN** possui trigger webhook com path="/test/pre-checkin-lembrete"

#### Scenario: Verificar Pendencias com webhook de teste
- **GIVEN** workflow "Botfy - Verificar Pendencias"
- **WHEN** possui trigger webhook com path="/test/verificar-pendencias"

---

### Requirement: Payload Parametrizável
O sistema SHALL aceitar payload JSON para parametrizar cenários de teste.

#### Scenario: Teste de Anti No-Show com agendamento específico
- **GIVEN** webhook `/test/anti-no-show`
- **WHEN** recebe payload: `{"agendamento_id": 10}`
- **THEN** workflow bypassa Schedule trigger
- **AND** busca diretamente agendamento com id=10 no banco
- **AND** processa lembrete para esse agendamento específico

#### Scenario: Teste de Pre Check-In com agendamento específico
- **GIVEN** webhook `/test/pre-checkin`
- **WHEN** recebe payload: `{"agendamento_id": 10}`
- **THEN** workflow busca agendamento id=10
- **AND** processa pre check-in ignorando janela de 24h

#### Scenario: Teste sem payload (default behavior)
- **GIVEN** webhook de teste recebe payload vazio `{}`
- **WHEN** workflow executa
- **THEN** comporta-se como Schedule normal
- **AND** busca todos agendamentos elegíveis

---

### Requirement: Bypass de Validações de Tempo
O sistema SHALL permitir bypass de validações de janela de tempo em modo de teste.

#### Scenario: Anti No-Show ignora janela de tempo
- **GIVEN** webhook `/test/anti-no-show` com `{"agendamento_id": 10, "bypass_timing": true}`
- **WHEN** workflow processa
- **THEN** node "Timing Correto?" é bypassado
- **AND** lembrete é enviado independente de `horas_ate_consulta`

#### Scenario: Pre Check-In ignora janela de 24h
- **GIVEN** webhook `/test/pre-checkin` com `{"bypass_timing": true}`
- **WHEN** workflow executa query
- **THEN** remove filtro `AND data_hora >= NOW() + INTERVAL '23 hours'`
- **AND** busca TODOS agendamentos com status válido

---

### Requirement: Resposta HTTP Estruturada
O sistema SHALL retornar resposta HTTP estruturada com resultado da execução.

#### Scenario: Teste bem-sucedido
- **GIVEN** webhook de teste executou sem erros
- **WHEN** workflow finaliza
- **THEN** retorna HTTP 200
- **AND** body: `{"success": true, "execution_id": "...", "items_processed": 1}`

#### Scenario: Teste com erro
- **GIVEN** webhook de teste encontrou erro (ex: agendamento não existe)
- **WHEN** workflow falha
- **THEN** retorna HTTP 400 ou 500
- **AND** body: `{"success": false, "error": "Agendamento not found"}`

#### Scenario: Teste com múltiplos itens
- **GIVEN** webhook sem `agendamento_id` específico
- **WHEN** workflow processa múltiplos agendamentos
- **THEN** retorna HTTP 200
- **AND** body: `{"success": true, "items_processed": 5, "execution_id": "..."}`

---

### Requirement: Isolamento de Produção
O sistema SHALL garantir que webhooks de teste não afetem triggers de produção.

#### Scenario: Schedule trigger continua ativo
- **GIVEN** workflow tem webhook de teste adicionado
- **WHEN** Schedule trigger dispara (ex: a cada 15min)
- **THEN** execução normal continua funcionando
- **AND** webhook de teste NÃO interfere

#### Scenario: Webhooks de teste não aparecem em produção
- **GIVEN** sistema tem URLs de webhook configuradas
- **WHEN** listagem de webhooks públicos é feita
- **THEN** apenas webhooks de produção aparecem (ex: `/webhook/marilia`)
- **AND** webhooks de teste (`/test/*`) são documentados separadamente

---

### Requirement: Documentação de Webhooks
O sistema SHALL documentar todos webhooks de teste com exemplos de uso.

#### Scenario: README com exemplos curl
- **GIVEN** projeto tem documentação
- **WHEN** developer consulta README
- **THEN** encontra seção "Testing Workflows"
- **AND** contém exemplos curl para cada webhook:
  ```bash
  # Anti No-Show
  curl -X POST $N8N_URL/webhook/test/anti-no-show \
    -H "Content-Type: application/json" \
    -d '{"agendamento_id": 10}'
  ```

#### Scenario: Documentação de payload schema
- **GIVEN** webhook de teste
- **WHEN** developer consulta documentação
- **THEN** encontra schema JSON do payload esperado
- **AND** schema documenta campos opcionais vs obrigatórios

---

### Requirement: Validação de Payload
O sistema SHALL validar payload de entrada antes de processar.

#### Scenario: Payload inválido
- **GIVEN** webhook espera `{"agendamento_id": <number>}`
- **WHEN** recebe `{"agendamento_id": "abc"}` (string em vez de number)
- **THEN** retorna HTTP 400
- **AND** body: `{"error": "Invalid payload: agendamento_id must be a number"}`

#### Scenario: Campo extra ignorado
- **GIVEN** webhook recebe `{"agendamento_id": 10, "extra_field": "value"}`
- **WHEN** workflow processa
- **THEN** ignora campo extra
- **AND** processa normalmente com agendamento_id=10

---

### Requirement: Log de Execuções de Teste
O sistema SHALL registrar execuções de teste separadamente para auditoria.

#### Scenario: Execução via webhook registrada
- **GIVEN** webhook de teste é chamado
- **WHEN** workflow executa
- **THEN** n8n registra execução com mode="webhook"
- **AND** metadata indica origem: "test"
- **AND** histórico de execuções mostra claramente que foi teste

#### Scenario: Estatísticas separadas
- **GIVEN** workflows possuem webhooks de teste
- **WHEN** métricas de execução são consultadas
- **THEN** execuções de teste são contabilizadas separadamente
- **AND** não afetam SLA de produção

---

## MODIFIED Requirements

N/A (nenhum requirement existente modificado - este é um spec novo)

---

## REMOVED Requirements

N/A (nenhum requirement removido - este é um spec novo)

---

## Related Changes

- Todos workflows: receberão webhooks de teste
- Documentação: README com exemplos de teste
- CI/CD (futuro): poderá usar webhooks para validação automatizada
