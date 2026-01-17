# Change: Humanizar Respostas da Marília

## Why

As respostas do bot de atendimento (Marília) estão soando robóticas, com diversos padrões que entregam claramente que é uma automação:
- Mensagens fragmentadas em múltiplas seguidas (3-4 mensagens em sequência)
- Uso do nome completo do paciente em vez do primeiro nome
- Tom formal demais, estilo "checklist"
- Interpretação incorreta de expressões como "final da tarde"

Uma avaliação de conversa real indicou nota 8.5/10 de naturalidade, com potencial para 9.5/10 após ajustes.

## What Changes

- **Consolidação de mensagens**: Parar de fragmentar respostas por `\n\n`, enviando uma única mensagem
- **Uso do primeiro nome**: Extrair e usar apenas o primeiro nome do paciente após identificação
- **Tom conversacional**: Atualizar system prompt com linguagem mais natural e exemplos
- **Interpretação de horários**: Definir claramente o que significa "final da tarde", "manhã", etc.

## Impact

- Affected specs: `atendimento-whatsapp` (novo)
- Affected code:
  - Workflow `bPJamJhBcrVCKgBg` (Botfy - Agendamento)
    - Node `Edit Fields6`: Remover split por `\n\n`
    - Node `AI Agent`: Atualizar system prompt
