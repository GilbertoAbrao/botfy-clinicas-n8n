# anti-no-show Specification Delta

## Purpose
Define requirements para correções críticas no workflow Anti No-Show, incluindo lógica de timing, timezone e preparação de dados para IA.

## ADDED Requirements

### Requirement: Cálculo Correto de Janelas de Tempo
O sistema SHALL calcular janelas de tempo de lembretes usando lógica >= (maior ou igual) ao invés de <= (menor ou igual).

#### Scenario: Lembrete de 2 horas
- **GIVEN** um agendamento às 14:00 (UTC)
- **AND** horário atual é 11:45 (UTC)
- **AND** horas_ate_consulta = 2.25h
- **WHEN** workflow verifica se está na janela de lembrete_2h
- **THEN** condição verifica: `horas_ate >= 2 AND horas_ate <= 2.5`
- **AND** o lembrete É disparado

#### Scenario: Lembrete de 2 horas - fora da janela (muito cedo)
- **GIVEN** um agendamento às 14:00 (UTC)
- **AND** horário atual é 11:00 (UTC)
- **AND** horas_ate_consulta = 3.0h
- **WHEN** workflow verifica se está na janela de lembrete_2h
- **THEN** condição verifica: `horas_ate >= 2 AND horas_ate <= 2.5`
- **AND** o lembrete NÃO é disparado

#### Scenario: Lembrete de 2 horas - fora da janela (atrasado)
- **GIVEN** um agendamento às 14:00 (UTC)
- **AND** horário atual é 12:30 (UTC)
- **AND** horas_ate_consulta = 1.5h
- **WHEN** workflow verifica se está na janela de lembrete_2h
- **THEN** condição verifica: `horas_ate >= 2 AND horas_ate <= 2.5`
- **AND** o lembrete NÃO é disparado (janela já passou)

#### Scenario: Lembrete de 24 horas
- **GIVEN** um agendamento às 14:00 de amanhã (UTC)
- **AND** horário atual permite horas_ate_consulta entre 24.0h e 24.5h
- **WHEN** workflow verifica se está na janela de lembrete_24h
- **THEN** condição verifica: `horas_ate >= 24 AND horas_ate <= 24.5`
- **AND** o lembrete É disparado

---

### Requirement: Preparação de Dados para Prompt de IA
O sistema SHALL criar um node intermediário que prepara e formata TODAS as variáveis antes de enviar para o prompt da IA.

#### Scenario: Dados formatados para lembrete
- **GIVEN** workflow está gerando lembrete para paciente "Maria Aparecida Rodrigues"
- **AND** consulta é "Avaliação Facial" às "2026-01-17T15:30:00"
- **WHEN** node "Prepara Dados Lembrete" é executado
- **THEN** cria variável `nome` com valor "Maria" (primeiro nome)
- **AND** cria variável `tipo_consulta` com valor "Avaliação Facial"
- **AND** cria variável `data_formatada` com valor "17/01/2026" (formato dd/MM/yyyy)
- **AND** cria variável `horario` com valor "12:30" (formato HH:mm em BRT)
- **AND** cria variável `tipo_lembrete` com valor ex: "lembrete_2h"

#### Scenario: Prompt de IA recebe variáveis interpoladas
- **GIVEN** node "Prepara Dados Lembrete" criou todas as variáveis
- **WHEN** node "IA Gera Mensagem" executa
- **THEN** prompt contém "Nome: Maria" (interpolado, não "{{ $json.nome }}")
- **AND** prompt contém "Consulta: Avaliação Facial" (interpolado)
- **AND** prompt contém "Data: 17/01/2026" (interpolado)
- **AND** prompt contém "Horario: 12:30" (interpolado)
- **AND** IA gera mensagem usando valores reais, não templates

#### Scenario: Formatação de data com timezone correto
- **GIVEN** consulta tem `data_hora` = "2026-01-17T15:30:00+00:00" (UTC)
- **WHEN** node "Prepara Dados Lembrete" formata para BRT
- **THEN** `data_formatada` = "17/01/2026"
- **AND** `horario` = "12:30" (15:30 UTC = 12:30 BRT)

---

### Requirement: Uso de Timezone Explícito
O sistema SHALL usar timezone explícito (TIMESTAMPTZ) em todos os cálculos de tempo do workflow Anti No-Show.

#### Scenario: Cálculo de horas até consulta
- **GIVEN** `data_hora` é TIMESTAMPTZ com valor "2026-01-17T15:30:00+00:00"
- **AND** `NOW()` retorna "2026-01-16T13:15:00+00:00"
- **WHEN** workflow calcula `horas_ate_consulta`
- **THEN** resultado é ~26.25 horas
- **AND** cálculo não assume timezone implícito

#### Scenario: Comparação com janelas de tempo
- **GIVEN** workflow está verificando janela de 24h
- **AND** cálculo retornou `horas_ate_consulta` = 24.15h
- **WHEN** compara com config_horas_antes = 24
- **THEN** condição `24.15 >= 24 AND 24.15 <= 24.5` é TRUE
- **AND** lembrete É disparado

---

### Requirement: Configuração via Banco de Dados
O sistema SHALL buscar configurações de API (URL, key, instance) da tabela `config_globais` no banco.

#### Scenario: Workflow busca variáveis globais
- **GIVEN** workflow Anti No-Show inicia
- **WHEN** node "Variáveis Globais" executa
- **THEN** busca registro `id=1` da tabela `config_globais`
- **AND** obtém `api_url`, `api_key`, `instancia`
- **AND** esses valores são usados no node "Envia WhatsApp"

#### Scenario: Fallback se config não existe
- **GIVEN** tabela `config_globais` está vazia
- **WHEN** node "Variáveis Globais" executa
- **THEN** workflow continua mas node "Envia WhatsApp" falha com erro claro
- **AND** erro indica "Config globais não encontrada"

---

## MODIFIED Requirements

N/A (nenhum requirement existente modificado - este é um spec novo)

---

## REMOVED Requirements

N/A (nenhum requirement removido - este é um spec novo)

---

## Related Changes

- **banco-dados**: Migration de timezone afeta cálculo de `horas_ate_consulta`
- **test-automation**: Webhook de teste permitirá validar correções automaticamente
