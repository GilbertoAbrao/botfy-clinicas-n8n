# atendimento-whatsapp Specification

## Purpose
TBD - created by archiving change humanizar-respostas-marilia. Update Purpose after archive.
## Requirements
### Requirement: Consolidação de Mensagens
O sistema SHALL enviar respostas do bot em uma única mensagem consolidada, em vez de múltiplas mensagens fragmentadas.

#### Scenario: Resposta normal do bot
- **WHEN** o AI Agent gera uma resposta com múltiplos parágrafos
- **THEN** o sistema envia UMA única mensagem com todos os parágrafos
- **AND** quebras de linha (`\n\n`) são preservadas dentro da mensagem

#### Scenario: Resposta muito longa
- **WHEN** a resposta excede 4000 caracteres (limite do WhatsApp)
- **THEN** o sistema divide em chunks respeitando quebras naturais
- **AND** cada chunk é enviado como mensagem separada com delay apropriado

---

### Requirement: Uso do Primeiro Nome
O sistema SHALL usar apenas o primeiro nome do paciente após a identificação inicial.

#### Scenario: Confirmação de dados
- **WHEN** o paciente informa "Maria Aparecida Rodrigues"
- **THEN** o bot usa "Maria" nas respostas subsequentes
- **AND** o nome completo é armazenado no cadastro mas não repetido no chat

#### Scenario: Variações de tratamento
- **WHEN** o bot precisa se referir ao paciente
- **THEN** usa variações como "Maria", "Prontinho, Maria!", "Te esperamos!"
- **AND** evita repetir o nome em toda frase

---

### Requirement: Tom Conversacional
O sistema SHALL usar linguagem natural e conversacional, evitando padrões robóticos.

#### Scenario: Coleta de dados
- **WHEN** o bot precisa solicitar nome e telefone
- **THEN** usa formato conversacional: "Me passa seu nome completo e um telefone com DDD?"
- **AND** evita listas com bullets para informações simples

#### Scenario: Confirmação de agendamento
- **WHEN** o bot confirma um agendamento
- **THEN** usa tom amigável: "Prontinho! Seu horário está confirmado"
- **AND** inclui no máximo 1-2 emojis por mensagem

#### Scenario: Encerramento
- **WHEN** o bot finaliza o atendimento
- **THEN** usa despedida natural: "Qualquer coisa, é só me chamar. Te esperamos!"
- **AND** evita frases genéricas de sistema

---

### Requirement: Interpretação de Períodos do Dia
O sistema SHALL interpretar corretamente expressões coloquiais de horário.

#### Scenario: Final da tarde
- **WHEN** o paciente pede "final da tarde"
- **THEN** o bot busca horários após 16h (16:00, 16:30, 17:00, 17:30, 18:00, 18:30, 19:00, 19:30)
- **AND** se não houver disponibilidade, informa claramente e oferece alternativas

#### Scenario: Meio da tarde
- **WHEN** o paciente pede "meio da tarde"
- **THEN** o bot busca horários entre 13h e 16h

#### Scenario: Manhã
- **WHEN** o paciente pede "manhã"
- **THEN** o bot busca horários entre 08h e 12h

#### Scenario: Horário ambíguo
- **WHEN** o paciente usa expressão ambígua como "tarde"
- **THEN** o bot pode perguntar: "Prefere início da tarde (13h-15h) ou mais pro final (16h-19h)?"

