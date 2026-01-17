# Tasks: Humanizar Respostas da Marília

## 1. Consolidação de Mensagens
- [ ] 1.1 Atualizar node `Edit Fields6` para não fragmentar por `\n\n`
- [ ] 1.2 Implementar chunking inteligente apenas para mensagens > 4000 caracteres
- [ ] 1.3 Testar envio de mensagem única consolidada

## 2. Uso do Primeiro Nome
- [ ] 2.1 Adicionar regra "USO DO NOME DO PACIENTE" no system prompt
- [ ] 2.2 Definir extração do primeiro nome ("Maria Aparecida" → "Maria")
- [ ] 2.3 Testar uso do primeiro nome em confirmações

## 3. Tom Conversacional
- [ ] 3.1 Adicionar seção "ESTILO DE COMUNICAÇÃO" no system prompt
- [ ] 3.2 Incluir exemplos de transformação robótico → humano
- [ ] 3.3 Definir uso moderado de emojis (máx 1-2 por mensagem)
- [ ] 3.4 Testar respostas com tom natural

## 4. Interpretação de Horários
- [ ] 4.1 Adicionar seção "INTERPRETAÇÃO DE HORÁRIOS" no system prompt
- [ ] 4.2 Definir "final da tarde" = após 16h
- [ ] 4.3 Definir "meio da tarde" = 13h-16h
- [ ] 4.4 Testar interpretação correta de períodos

## 5. Validação Final
- [ ] 5.1 Limpar histórico de chat (`n8n_chat_histories`)
- [ ] 5.2 Executar fluxo completo de agendamento
- [ ] 5.3 Verificar: mensagem única, primeiro nome, tom natural
- [ ] 5.4 Documentar resultado da avaliação
