# banco-dados Specification Delta

## Purpose
Define requirements para migration de timezone na coluna `data_hora` e configuração de timezone padrão no banco.

## ADDED Requirements

### Requirement: Coluna data_hora com Timezone Explícito
O sistema SHALL usar tipo TIMESTAMPTZ para armazenar datas/horas de agendamentos.

#### Scenario: Migration altera tipo de coluna
- **GIVEN** coluna `agendamentos.data_hora` é tipo TIMESTAMP (sem timezone)
- **WHEN** migration é executada
- **THEN** altera para tipo TIMESTAMPTZ
- **AND** converte dados existentes assumindo timezone 'America/Sao_Paulo'
- **AND** SQL: `ALTER TABLE agendamentos ALTER COLUMN data_hora TYPE TIMESTAMPTZ USING data_hora AT TIME ZONE 'America/Sao_Paulo'`

#### Scenario: Novos registros incluem timezone
- **GIVEN** coluna `data_hora` é TIMESTAMPTZ
- **WHEN** INSERT cria agendamento com valor '2026-01-17 15:30:00'
- **THEN** PostgreSQL adiciona timezone automaticamente
- **AND** valor armazenado é '2026-01-17 15:30:00-03' (BRT)
- **AND** internamente é convertido para UTC

#### Scenario: Query NOW() retorna TIMESTAMPTZ
- **GIVEN** banco está configurado com timezone 'America/Sao_Paulo'
- **WHEN** workflow executa `SELECT NOW()`
- **THEN** retorna timestamp com timezone
- **AND** cálculos de diferença usam timezone correto

---

### Requirement: Timezone Padrão do Banco
O sistema SHALL configurar timezone padrão do banco para 'America/Sao_Paulo'.

#### Scenario: Configuração de timezone no banco
- **WHEN** migration é executada
- **THEN** executa `ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo'`
- **AND** todas as novas sessões usarão BRT por padrão
- **AND** funções como NOW() retornarão horário em BRT

#### Scenario: Sessões existentes não afetadas imediatamente
- **GIVEN** migration foi executada
- **AND** existe sessão ativa antes da migration
- **WHEN** sessão executa NOW()
- **THEN** ainda pode usar timezone antigo
- **AND** novas sessões usarão BRT

---

### Requirement: Migração de Dados Existentes
O sistema SHALL converter dados existentes assumindo que são horário de Brasília.

#### Scenario: Conversão de agendamentos históricos
- **GIVEN** agendamento com data_hora = '2026-01-15 10:00:00' (TIMESTAMP sem TZ)
- **WHEN** migration converte para TIMESTAMPTZ
- **THEN** assume que é BRT: '2026-01-15 10:00:00-03'
- **AND** internamente armazena como UTC: '2026-01-15 13:00:00+00'

#### Scenario: Agendamentos futuros mantêm horário local
- **GIVEN** paciente agendou para "17/01/2026 às 15:30"
- **AND** registro no banco é '2026-01-17 15:30:00' (sem TZ)
- **WHEN** migration converte
- **THEN** mantém 15:30 no horário de Brasília
- **AND** NÃO muda para 18:30 (que seria se assumisse UTC)

---

### Requirement: Compatibilidade com Workflows Existentes
O sistema SHALL garantir que queries existentes continuem funcionando após migration.

#### Scenario: Comparação com NOW()
- **GIVEN** workflow usa `WHERE data_hora >= NOW()`
- **AND** data_hora é agora TIMESTAMPTZ
- **WHEN** query é executada
- **THEN** comparação funciona corretamente
- **AND** ambos os lados da comparação usam timezone

#### Scenario: INSERT sem timezone explícito
- **GIVEN** workflow insere `data_hora = '2026-01-17 15:30:00'` (string sem TZ)
- **WHEN** PostgreSQL processa INSERT
- **THEN** assume timezone configurado no banco (BRT)
- **AND** armazena corretamente como TIMESTAMPTZ

---

### Requirement: Rollback Seguro
O sistema SHALL permitir rollback da migration se necessário.

#### Scenario: Reverter para TIMESTAMP
- **GIVEN** migration foi aplicada e causou problemas
- **WHEN** rollback é executado
- **THEN** converte TIMESTAMPTZ de volta para TIMESTAMP
- **AND** SQL: `ALTER TABLE agendamentos ALTER COLUMN data_hora TYPE TIMESTAMP USING data_hora AT TIME ZONE 'America/Sao_Paulo'`
- **AND** dados preservam horário local (BRT)

#### Scenario: Rollback não perde dados
- **GIVEN** agendamentos foram criados após migration (com TIMESTAMPTZ)
- **WHEN** rollback converte para TIMESTAMP
- **THEN** todos os registros mantêm horário correto
- **AND** apenas timezone explícito é removido

---

### Requirement: Validação Pós-Migration
O sistema SHALL validar que conversão foi bem-sucedida.

#### Scenario: Verificação de tipo de coluna
- **GIVEN** migration foi executada
- **WHEN** validação é executada
- **THEN** query: `SELECT data_type FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'data_hora'`
- **AND** resultado é 'timestamp with time zone'

#### Scenario: Verificação de timezone do banco
- **GIVEN** migration configurou timezone
- **WHEN** validação executa `SHOW timezone`
- **THEN** resultado é 'America/Sao_Paulo'

#### Scenario: Verificação de dados não corrompidos
- **GIVEN** migration converteu dados
- **WHEN** validação compara contagem de registros
- **THEN** `SELECT COUNT(*) FROM agendamentos` retorna mesmo valor de antes
- **AND** agendamentos mantêm horário local esperado

---

## MODIFIED Requirements

N/A (nenhum requirement existente modificado - este é um spec novo)

---

## REMOVED Requirements

N/A (nenhum requirement removido - este é um spec novo)

---

## Related Changes

- **anti-no-show**: Depende de timezone correto para cálculo de janelas
- **pre-checkin**: Depende de timezone para formatação de mensagens
- Todos workflows que fazem cálculos com `NOW()` e `data_hora`
