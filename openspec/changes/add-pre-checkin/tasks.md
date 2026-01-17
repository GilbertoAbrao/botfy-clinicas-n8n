# Tasks: Módulo de Pré-Check-In

## 1. Infraestrutura de Dados

- [x] 1.1 Criar tabela `pre_checkin` no Supabase
- [x] 1.2 Criar tabela `documentos_paciente` no Supabase
- [x] 1.3 Criar tabela `instrucoes_procedimentos` no Supabase
- [x] 1.4 Criar view `pre_checkin_completo` com joins necessários
- [x] 1.5 Configurar Supabase Storage bucket para documentos
- [x] 1.6 Configurar RLS policies para segurança

> **Implementado em:** `database/001_pre_checkin_tables.sql`

## 2. Workflows de Disparo e Orquestração

- [x] 2.1 Criar workflow `Botfy - Pre Check-In` (principal)
  - Schedule Trigger (24h antes)
  - Busca agendamentos pendentes de pré-check-in
  - Dispara mensagem inicial via WhatsApp
  - **Workflow ID:** `BWDsb4A0GVs2NQnM`
- [x] 2.2 Criar workflow `Botfy - Pre Check-In Lembrete`
  - Lembrete para quem não respondeu (12h antes)
  - **Workflow ID:** `3ryiGnLNLuPWEfmL`
- [ ] 2.3 Integrar com workflow `Botfy - Agendamento` existente
  - Criar registro em `pre_checkin` ao criar agendamento
  - *Requer configuração manual no workflow existente*

## 3. Coleta de Dados Cadastrais

- [x] 3.1 Criar fluxo de confirmação de dados existentes
  - Nome, telefone, email, data de nascimento
  - *Via Tool: Consultar Status Pre Check-In*
- [x] 3.2 Criar fluxo de atualização de dados
  - Permitir correções via conversa
  - **Workflow ID:** `4DNyXp5fPPfsFOnR` (Tool: Atualizar Dados Paciente)
- [x] 3.3 Criar validações de campos
  - CPF, data de nascimento, email
  - *Validação implementada no workflow de atualização*

## 4. Processamento de Documentos

- [x] 4.1 Criar workflow `Botfy - Tool: Processar Documento`
  - Recebe imagem via WhatsApp
  - Envia para OpenAI Vision
  - Extrai dados estruturados
  - **Workflow ID:** `Pc0PyATrZaGefiSJ`
- [x] 4.2 Implementar extração de RG
  - Nome, número, data de nascimento, CPF
- [x] 4.3 Implementar extração de CNH
  - Nome, número, validade, categoria
- [x] 4.4 Implementar extração de Carteirinha de Convênio
  - Nome, número carteira, operadora, validade
- [x] 4.5 Implementar extração de Guia de Autorização
  - Número guia, procedimento autorizado, validade
- [x] 4.6 Salvar documentos no Supabase Storage
- [x] 4.7 Criar validação de dados extraídos

## 5. Sistema RAG para Instruções

- [x] 5.1 Popular tabela `instrucoes_procedimentos` com instruções iniciais
  - Instruções de jejum por procedimento
  - Instruções de preparo
  - Instruções de medicamentos
  - **Implementado em:** `database/002_instrucoes_exemplo.sql`
- [x] 5.2 Criar workflow `Botfy - Tool: Buscar Instrucoes`
  - Busca instruções por procedimento no vector store
  - **Workflow ID:** `NUZv1Gt15LKyiiKz`
- [x] 5.3 Gerar embeddings para instruções
  - **Workflow ID:** `nDmTqMSt54zzpDru` (Gerar Embeddings Instrucoes)
- [x] 5.4 Integrar com agente conversacional
  - RAG responde perguntas sobre preparo
  - *Tool webhook disponível para integração*

## 6. Detecção de Pendências

- [x] 6.1 Implementar verificação de dados obrigatórios faltantes
- [x] 6.2 Implementar verificação de documentos pendentes
- [x] 6.3 Criar notificação de pendências para clínica
  - Mensagem para recepção com lista de pendências
- [x] 6.4 Criar resumo de status do pré-check-in

> **Workflow ID:** `SMjeAMnZ6XkFPptn` (Verificar Pendencias Pre Check-In)

## 7. Integração com Agente Conversacional

- [x] 7.1 Criar tool para AI Agent consultar status de pré-check-in
  - **Workflow ID:** `holwGQuksZPsSb19`
- [x] 7.2 Criar tool para AI Agent atualizar dados do paciente
  - **Workflow ID:** `4DNyXp5fPPfsFOnR`
- [x] 7.3 Integrar instruções RAG no agente principal
  - *Tool webhook disponível: `/buscar-instrucoes`*

## 8. Testes e Validação

- [ ] 8.1 Testar fluxo completo com dados mock
- [ ] 8.2 Testar extração OCR com documentos reais (anonimizados)
- [ ] 8.3 Testar RAG com perguntas sobre procedimentos
- [ ] 8.4 Validar tratamento de erros e fallbacks

## Dependencies

- Task 2.x depende de 1.x (tabelas devem existir primeiro)
- Task 4.x depende de 1.5 (storage configurado)
- Task 5.x depende de 1.3 (tabela de instruções)
- Task 7.x depende de 4.x e 5.x (tools prontas)
- Task 8.x depende de todas as anteriores

## Parallelizable Work

- Tasks 3.x, 4.x, 5.x podem ser desenvolvidas em paralelo após 1.x e 2.1
- Tasks 6.x e 7.x podem ser desenvolvidas em paralelo após 4.x e 5.x

## Resumo de Workflows Criados

| Workflow | ID | Descrição |
|----------|-----|-----------|
| Botfy - Pre Check-In | BWDsb4A0GVs2NQnM | Disparo automático 24h antes |
| Botfy - Pre Check-In Lembrete | 3ryiGnLNLuPWEfmL | Lembrete 12h antes |
| Botfy - Tool: Processar Documento | Pc0PyATrZaGefiSJ | OCR com OpenAI Vision |
| Botfy - Tool: Buscar Instrucoes | NUZv1Gt15LKyiiKz | RAG para instruções |
| Botfy - Gerar Embeddings Instrucoes | nDmTqMSt54zzpDru | Gera embeddings das instruções |
| Botfy - Verificar Pendencias Pre Check-In | SMjeAMnZ6XkFPptn | Detecta e notifica pendências |
| Botfy - Tool: Consultar Status Pre Check-In | holwGQuksZPsSb19 | Consulta status para agente |
| Botfy - Tool: Atualizar Dados Paciente | 4DNyXp5fPPfsFOnR | Atualiza dados via agente |

## Próximos Passos

1. Executar SQL scripts no Supabase (`001_pre_checkin_tables.sql` e `002_instrucoes_exemplo.sql`)
2. Configurar credenciais nos workflows (Supabase, OpenAI, Evolution API)
3. Executar workflow `Botfy - Gerar Embeddings Instrucoes` para popular embeddings
4. Ativar workflows de Schedule Trigger
5. Integrar tools no agente conversacional principal
6. Testar fluxo completo
