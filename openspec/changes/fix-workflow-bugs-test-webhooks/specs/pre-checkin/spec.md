# pre-checkin Specification Delta

## Purpose
Define requirements para correções no workflow Pre Check-In, incluindo template de mensagem e configuração de variáveis de ambiente.

## ADDED Requirements

### Requirement: Template de Mensagem com Referências Corretas
O sistema SHALL construir template de mensagem usando referências ao node anterior, não variáveis locais inexistentes.

#### Scenario: Construção de mensagem com dados do agendamento
- **GIVEN** node "Busca Agendamentos Proximos" retornou agendamento
- **AND** agendamento tem `data_hora` = "2026-01-17T15:30:00+00:00"
- **AND** paciente_nome = "Maria Aparecida Rodrigues"
- **AND** servico_nome = "Avaliação Facial"
- **WHEN** node "Prepara Mensagem" executa
- **THEN** usa `$('Busca Agendamentos Proximos').item.json.data_hora` para formatar data
- **AND** usa `$('Busca Agendamentos Proximos').item.json.paciente_nome.split(' ')[0]` para primeiro nome
- **AND** usa `$('Busca Agendamentos Proximos').item.json.servico_nome` para procedimento
- **AND** NÃO tenta usar `$json.data_consulta` (que ainda não existe)

#### Scenario: Mensagem formatada corretamente
- **GIVEN** node "Prepara Mensagem" processou dados
- **WHEN** mensagem é construída
- **THEN** contém "Olá Maria! 👋" (primeiro nome, não completo)
- **AND** contém "📅 *17/01/2026 12:30*" (não "📅 **")
- **AND** contém "💆 *Avaliação Facial*" (não "💆 **")
- **AND** contém "👩‍⚕️ *Dra. Paula*" (não "👩‍⚕️ **")

#### Scenario: Formatação de data/hora com timezone
- **GIVEN** `data_hora` é "2026-01-17T15:30:00+00:00" (UTC)
- **WHEN** node formata para exibição
- **THEN** usa `DateTime.fromISO(...).setZone('America/Sao_Paulo').toFormat('dd/MM/yyyy HH:mm')`
- **AND** resultado é "17/01/2026 12:30" (BRT)

---

### Requirement: Configuração via Banco de Dados
O sistema SHALL buscar configurações de API da tabela `config_globais` em vez de variáveis de ambiente.

#### Scenario: Workflow busca variáveis globais
- **GIVEN** workflow Pre Check-In inicia
- **WHEN** node "Variáveis Globais" executa (após trigger, antes de buscar agendamentos)
- **THEN** busca registro `id=1` da tabela `config_globais`
- **AND** obtém `api_url`, `api_key`, `instancia`
- **AND** node "Envia WhatsApp" usa `$('Variáveis Globais').first().json.api_url`

#### Scenario: Node Variáveis Globais posicionado corretamente
- **GIVEN** workflow tem trigger "Disparo Agendado"
- **WHEN** workflow é visualizado no n8n
- **THEN** node "Variáveis Globais" está conectado ao trigger
- **AND** posição é aproximadamente (-400, 120)
- **AND** executa em paralelo com "Busca Agendamentos Proximos"

---

### Requirement: Filtro de Status Inclusivo
O sistema SHALL buscar agendamentos com status 'agendada' OU 'confirmado', não apenas 'confirmado'.

#### Scenario: Busca agendamentos na janela de 24h
- **GIVEN** existem 2 agendamentos nas próximas 24h
- **AND** agendamento A tem status = 'agendada'
- **AND** agendamento B tem status = 'confirmado'
- **WHEN** node "Busca Agendamentos Proximos" executa query
- **THEN** query usa `WHERE status IN ('agendada', 'confirmado')`
- **AND** AMBOS agendamentos são retornados

#### Scenario: Agendamentos cancelados não são incluídos
- **GIVEN** existe agendamento com status = 'cancelada' na janela de 24h
- **WHEN** node "Busca Agendamentos Proximos" executa
- **THEN** esse agendamento NÃO é incluído no resultado

---

### Requirement: Continuidade de Workflow com Resultado Vazio
O sistema SHALL configurar nodes críticos com `alwaysOutputData: true` para não interromper workflow.

#### Scenario: Pre check-in não existe ainda
- **GIVEN** agendamento id=10 não tem registro em `pre_checkin`
- **WHEN** node "Verifica Pre Check-In Existente" executa query
- **THEN** query retorna 0 rows
- **AND** node tem `alwaysOutputData: true`
- **AND** workflow continua para node "Pre Check-In Existe?"
- **AND** output é `{}` (objeto vazio)

#### Scenario: Condição verifica existência corretamente
- **GIVEN** node anterior retornou `{}`
- **WHEN** node "Pre Check-In Existe?" avalia condição
- **THEN** usa operator `notExists` para verificar se campo `id` não existe
- **AND** condição é TRUE (não existe)
- **AND** workflow segue para criar pre check-in

---

### Requirement: Referência Correta em INSERT
O sistema SHALL usar referência ao node anterior para obter IDs, não $json direto.

#### Scenario: Criação de pre check-in
- **GIVEN** node "Pre Check-In Existe?" determinou que não existe
- **AND** node "Busca Agendamentos Proximos" tem agendamento com id=10, paciente_id=8
- **WHEN** node "Cria Pre Check-In" executa INSERT
- **THEN** query usa `$('Busca Agendamentos Proximos').item.json.id` para agendamento_id
- **AND** query usa `$('Busca Agendamentos Proximos').item.json.paciente_id` para paciente_id
- **AND** NÃO usa `$json.id` (que seria undefined)

#### Scenario: Erro se referência incorreta
- **GIVEN** query tenta usar `$json.id` diretamente
- **WHEN** node executa
- **THEN** SQL recebe `INSERT ... VALUES (undefined, undefined, ...)`
- **AND** PostgreSQL retorna erro "column 'undefined' does not exist"
- **AND** workflow falha

---

## MODIFIED Requirements

N/A (nenhum requirement existente modificado - este é um spec novo)

---

## REMOVED Requirements

N/A (nenhum requirement removido - este é um spec novo)

---

## Related Changes

- **banco-dados**: Timezone afeta formatação de data_hora na mensagem
- **test-automation**: Webhook de teste para validar mensagem formatada
