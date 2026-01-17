# criar-agendamento Specification Delta

## Purpose
Define requirements para correção da duplicação de pacientes no workflow Tool: Criar Agendamento.

## ADDED Requirements

### Requirement: Buscar Paciente Existente Antes de Criar
O sistema SHALL buscar paciente existente por telefone E nome antes de criar novo registro.

#### Scenario: Paciente já existe (match exato)
- **GIVEN** tool "Criar Agendamento" recebe telefone="5511999999999" e nome="Maria Aparecida"
- **AND** já existe paciente com telefone="5511999999999" e nome="Maria Aparecida Rodrigues"
- **WHEN** workflow executa busca de paciente
- **THEN** busca por `telefone = '5511999999999'`
- **AND** encontra paciente existente com id=8
- **AND** NÃO cria novo paciente
- **AND** usa paciente_id=8 para criar agendamento

#### Scenario: Paciente já existe (match parcial de nome)
- **GIVEN** tool recebe nome="Maria" e telefone="5511999999999"
- **AND** já existe paciente com nome="Maria Aparecida Rodrigues" e mesmo telefone
- **WHEN** workflow busca paciente
- **THEN** busca por telefone primeiro
- **AND** encontra match de telefone
- **AND** NÃO cria duplicata
- **AND** usa paciente existente

#### Scenario: Paciente não existe
- **GIVEN** tool recebe telefone="5511888888888" e nome="João Silva"
- **AND** NÃO existe paciente com esse telefone no banco
- **WHEN** workflow busca paciente
- **THEN** busca retorna 0 rows
- **AND** workflow cria NOVO paciente
- **AND** obtém paciente_id do INSERT RETURNING
- **AND** usa esse ID para criar agendamento

---

### Requirement: Busca por Telefone como Chave Primária
O sistema SHALL usar telefone como chave primária de busca, pois é único e imutável.

#### Scenario: Telefone como identificador único
- **GIVEN** dois pacientes com nomes similares mas telefones diferentes
- **WHEN** tool busca por telefone="5511999999999"
- **THEN** usa query `SELECT * FROM pacientes WHERE telefone = $1`
- **AND** retorna exatamente 0 ou 1 resultado
- **AND** NÃO depende de comparação fuzzy de nome

#### Scenario: Normalização de telefone
- **GIVEN** tool recebe telefone="(11) 99999-9999"
- **WHEN** workflow normaliza para busca
- **THEN** remove caracteres especiais: "5511999999999"
- **AND** garante que tem DDD (55 + DDD + número)
- **AND** busca no banco com formato normalizado

---

### Requirement: Atualização de Dados do Paciente Existente
O sistema SHALL atualizar campos vazios do paciente existente se novos dados forem fornecidos.

#### Scenario: Paciente existe mas falta email
- **GIVEN** paciente existente tem email = NULL
- **AND** tool recebe email="paciente@email.com" na criação do agendamento
- **WHEN** workflow encontra paciente existente
- **THEN** executa UPDATE para adicionar email
- **AND** UPDATE usa `WHERE id = $paciente_id`
- **AND** atualiza campos vazios sem sobrescrever dados existentes

#### Scenario: Paciente existe com todos os dados
- **GIVEN** paciente existente tem nome, telefone, email preenchidos
- **AND** tool recebe apenas nome e telefone
- **WHEN** workflow encontra paciente
- **THEN** NÃO executa UPDATE
- **AND** usa dados existentes diretamente
- **AND** cria apenas o agendamento

---

### Requirement: Fluxo Condicional com IF Node
O sistema SHALL usar node IF para decidir entre criar novo paciente ou usar existente.

#### Scenario: Estrutura do workflow
- **GIVEN** workflow Tool: Criar Agendamento
- **WHEN** visualizado no n8n
- **THEN** tem node "Busca Paciente" (Supabase)
- **AND** seguido por node "Paciente Existe?" (IF)
- **AND** output 0 (FALSE) vai para "Cria Novo Paciente"
- **AND** output 1 (TRUE) vai para "Atualiza Dados Paciente" (se necessário)
- **AND** ambos caminhos convergem em "Cria Agendamento"

#### Scenario: Condição IF verifica existência
- **GIVEN** node "Busca Paciente" executou
- **WHEN** node "Paciente Existe?" avalia
- **THEN** condição é `$json.id` exists
- **AND** se TRUE: paciente existe, output 1
- **AND** se FALSE: paciente não existe, output 0

---

### Requirement: Tratamento de Erro em Duplicatas
O sistema SHALL logar warning mas NÃO falhar se detectar duplicata inesperada.

#### Scenario: Múltiplos pacientes com mesmo telefone (inconsistência no banco)
- **GIVEN** banco tem 2 registros com telefone="5511999999999" (erro de dados)
- **WHEN** workflow busca paciente
- **THEN** query retorna 2+ resultados
- **AND** workflow usa o PRIMEIRO resultado
- **AND** registra warning: "Múltiplos pacientes encontrados para telefone X"
- **AND** continua execução normalmente

---

## MODIFIED Requirements

N/A (nenhum requirement existente modificado - este é um spec novo)

---

## REMOVED Requirements

N/A (nenhum requirement removido - este é um spec novo)

---

## Related Changes

- **atendimento-whatsapp**: Workflow principal que chama esta tool
- **test-automation**: Webhook para testar criação sem duplicatas
