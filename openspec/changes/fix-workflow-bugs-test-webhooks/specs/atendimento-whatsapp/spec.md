# atendimento-whatsapp Specification Delta

## Purpose
Adiciona requirements para correções de bugs UX identificados nos testes do workflow principal de atendimento.

## ADDED Requirements

### Requirement: Busca de Agendamento por Telefone Primeiro
O sistema SHALL buscar agendamentos por telefone do paciente antes de solicitar data/hora.

#### Scenario: Cancelamento - busca por telefone
- **GIVEN** paciente solicita "Quero cancelar minha consulta"
- **WHEN** AI Agent precisa localizar agendamento
- **THEN** chama tool `buscar_paciente` com telefone do chat
- **AND** obtém lista de agendamentos futuros do paciente
- **AND** NÃO solicita data/hora primeiro

#### Scenario: Múltiplos agendamentos encontrados
- **GIVEN** paciente tem 3 agendamentos futuros
- **WHEN** AI Agent busca por telefone
- **THEN** lista os agendamentos: "Você tem 3 consultas agendadas: 1) 20/01 às 10h - Limpeza de Pele, 2) ..."
- **AND** pergunta: "Qual deseja cancelar?"

#### Scenario: Nenhum agendamento encontrado
- **GIVEN** paciente não tem agendamentos futuros
- **WHEN** AI Agent busca por telefone
- **THEN** informa: "Não encontrei agendamentos no seu nome. Tem certeza que tem consulta marcada?"

#### Scenario: Apenas um agendamento encontrado
- **GIVEN** paciente tem apenas 1 agendamento futuro
- **WHEN** AI Agent busca
- **THEN** identifica automaticamente: "Encontrei sua consulta dia 20/01 às 10h. É essa que deseja cancelar?"

---

### Requirement: Oferecer Reagendamento Antes de Cancelar
O sistema SHALL oferecer opção de reagendamento ANTES de confirmar cancelamento.

#### Scenario: Paciente quer cancelar
- **GIVEN** paciente solicita "Cancelar minha consulta de amanhã"
- **AND** agendamento foi localizado
- **WHEN** AI Agent confirma intenção
- **THEN** pergunta: "Prefere remarcar para outro horário ou realmente cancelar?"
- **AND** NÃO cancela imediatamente

#### Scenario: Paciente prefere reagendar
- **GIVEN** AI Agent ofereceu reagendamento
- **WHEN** paciente responde "Prefiro remarcar"
- **THEN** inicia fluxo de reagendamento
- **AND** usa tool `buscar_slots_disponiveis`
- **AND** NÃO chama tool `cancelar_agendamento`

#### Scenario: Paciente confirma cancelamento
- **GIVEN** AI Agent ofereceu reagendamento
- **WHEN** paciente responde "Pode cancelar mesmo"
- **THEN** chama tool `cancelar_agendamento`
- **AND** confirma: "Consulta cancelada. Qualquer coisa, é só me chamar!"

#### Scenario: Cancelamento com motivo registrado
- **GIVEN** paciente cancela consulta
- **WHEN** tool `cancelar_agendamento` é chamada
- **THEN** registra motivo se paciente informou
- **AND** atualiza status para 'cancelada'

---

### Requirement: Mensagem de Encerramento Apropriada
O sistema SHALL enviar mensagem de encerramento apenas quando atendimento foi concluído com sucesso.

#### Scenario: Cancelamento bem-sucedido
- **GIVEN** paciente cancelou consulta
- **WHEN** AI Agent finaliza atendimento
- **THEN** envia apenas: "Consulta cancelada. Qualquer coisa, é só me chamar!"
- **AND** NÃO envia mensagem sobre "consulta confirmada" ou similar

#### Scenario: Agendamento bem-sucedido
- **GIVEN** paciente concluiu agendamento
- **WHEN** AI Agent finaliza
- **THEN** envia confirmação com detalhes
- **AND** encerra com: "Te esperamos no dia X! Qualquer dúvida, é só chamar."

#### Scenario: Reagendamento bem-sucedido
- **GIVEN** paciente reagendou consulta
- **WHEN** AI Agent finaliza
- **THEN** menciona: "Prontinho! Consulta remarcada para [nova data]."
- **AND** NÃO menciona cancelamento

---

## MODIFIED Requirements

### Requirement: Uso do Primeiro Nome
O sistema SHALL usar apenas o primeiro nome do paciente após a identificação inicial, mas PODE usar nome completo na primeira confirmação.

#### Scenario: Primeira confirmação pode usar nome completo
- **GIVEN** paciente informa "Maria Aparecida Rodrigues" pela primeira vez
- **WHEN** bot confirma identificação
- **THEN** bot PODE confirmar: "Ok, Maria Aparecida! Vamos agendar sua consulta?"
- **AND** mensagens subsequentes usam apenas "Maria"

#### Scenario: Uso consistente do primeiro nome após identificação
- **GIVEN** paciente já foi identificado como "Maria Aparecida Rodrigues"
- **WHEN** bot envia confirmações ou perguntas subsequentes
- **THEN** usa apenas "Maria" em todas as mensagens
- **AND** NÃO repete nome completo

#### Scenario: Extração do primeiro nome
- **GIVEN** paciente informa nome "João Carlos da Silva"
- **WHEN** sistema processa nome para uso futuro
- **THEN** extrai primeiro nome "João"
- **AND** usa "João" em todas as mensagens subsequentes

---

## REMOVED Requirements

N/A (nenhum requirement removido)

---

## Related Changes

- **criar-agendamento**: Busca de paciente existente se relaciona com busca por telefone
- **test-automation**: Webhook permitirá testar fluxo completo de cancelamento
