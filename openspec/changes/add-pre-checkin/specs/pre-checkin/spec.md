# Pre-Check-In Specification

## ADDED Requirements

### Requirement: Disparo Automático de Pré-Check-In

The system SHALL automatically trigger the pre-check-in process for confirmed appointments within a configurable time window before the consultation. O sistema MUST disparar automaticamente o processo de pré-check-in para agendamentos confirmados.

#### Scenario: Disparo 24 horas antes da consulta
- **GIVEN** um agendamento confirmado com data_hora em 24 horas
- **AND** o agendamento não possui pré-check-in iniciado
- **WHEN** o Schedule Trigger executa
- **THEN** o sistema MUST criar um registro em `pre_checkin` com status "pendente"
- **AND** MUST enviar mensagem inicial de pré-check-in via WhatsApp

#### Scenario: Agendamento já possui pré-check-in
- **GIVEN** um agendamento que já possui registro de pré-check-in
- **WHEN** o Schedule Trigger executa
- **THEN** o sistema SHALL NOT criar novo registro
- **AND** SHALL NOT enviar nova mensagem inicial

### Requirement: Coleta de Dados Cadastrais

The system SHALL allow the patient to confirm or update their registration data during pre-check-in via WhatsApp conversation. O sistema MUST permitir confirmação e atualização de dados cadastrais.

#### Scenario: Paciente confirma dados existentes
- **GIVEN** um paciente com dados cadastrais já preenchidos
- **WHEN** o sistema apresenta os dados para confirmação
- **AND** o paciente responde confirmando
- **THEN** o sistema MUST marcar `dados_confirmados` como TRUE
- **AND** MUST atualizar o status do pré-check-in

#### Scenario: Paciente solicita correção de dados
- **GIVEN** um paciente visualizando seus dados cadastrais
- **WHEN** o paciente indica que precisa corrigir algum dado
- **THEN** o sistema SHALL permitir a atualização campo por campo
- **AND** SHALL validar o formato dos campos (CPF, email, telefone)
- **AND** MUST persistir as alterações na tabela `pacientes`

### Requirement: Coleta de Documentos via WhatsApp

The system SHALL allow the patient to send photos of required documents via WhatsApp, automatically processing them with OCR/AI. O sistema MUST processar documentos com OCR/IA automaticamente.

#### Scenario: Paciente envia foto de RG
- **GIVEN** o sistema solicitou envio do documento de identidade
- **WHEN** o paciente envia uma foto do RG
- **THEN** o sistema MUST processar a imagem com OpenAI Vision
- **AND** SHALL extrair: nome completo, número do RG, CPF, data de nascimento
- **AND** MUST salvar a imagem no Supabase Storage
- **AND** MUST criar registro em `documentos_paciente` com dados extraídos

#### Scenario: Paciente envia foto de carteirinha do convênio
- **GIVEN** o agendamento é para paciente com convênio
- **AND** o sistema solicitou envio da carteirinha
- **WHEN** o paciente envia uma foto da carteirinha
- **THEN** o sistema SHALL extrair: nome, número da carteira, operadora, validade
- **AND** MUST validar se a carteira está dentro da validade
- **AND** SHALL registrar pendência se carteira estiver vencida

#### Scenario: Documento ilegível
- **GIVEN** o paciente enviou uma foto de documento
- **WHEN** o OCR não consegue extrair dados com confiança mínima
- **THEN** o sistema MUST informar que o documento está ilegível
- **AND** SHALL solicitar novo envio com melhor iluminação/foco

### Requirement: Instruções Personalizadas por Procedimento

The system SHALL provide personalized preparation instructions based on the scheduled procedure type, using RAG for semantic search. O sistema MUST fornecer instruções via RAG.

#### Scenario: Consulta com exigência de jejum
- **GIVEN** um agendamento para procedimento que exige jejum
- **WHEN** o pré-check-in atinge a fase de instruções
- **THEN** o sistema MUST buscar instruções de jejum no vector store
- **AND** SHALL enviar as instruções específicas para o paciente
- **AND** SHALL confirmar se o paciente entendeu as instruções

#### Scenario: Paciente pergunta sobre preparo
- **GIVEN** um paciente em conversa de pré-check-in
- **WHEN** o paciente faz uma pergunta sobre preparo do procedimento
- **THEN** o agente IA MUST buscar resposta no RAG de instruções
- **AND** SHALL responder de forma contextualizada ao procedimento agendado

#### Scenario: Procedimento sem instruções especiais
- **GIVEN** um agendamento para procedimento sem instruções cadastradas
- **WHEN** o pré-check-in atinge a fase de instruções
- **THEN** o sistema SHALL informar que não há preparo especial
- **AND** SHALL perguntar se o paciente tem alguma dúvida

### Requirement: Detecção de Pendências

The system SHALL identify and communicate pre-check-in pending items before the appointment, to both patient and clinic. O sistema MUST detectar e notificar pendências.

#### Scenario: Pendência de documento obrigatório
- **GIVEN** um pré-check-in em andamento
- **AND** um documento obrigatório não foi enviado
- **WHEN** o prazo de antecedência é menor que 6 horas
- **THEN** o sistema MUST registrar a pendência
- **AND** SHALL notificar a clínica sobre documentos faltantes
- **AND** SHALL enviar lembrete ao paciente

#### Scenario: Paciente não respondeu ao pré-check-in
- **GIVEN** um pré-check-in foi disparado há mais de 12 horas
- **AND** o paciente não iniciou a resposta
- **WHEN** o sistema verifica pré-check-ins pendentes
- **THEN** o sistema MUST enviar lembrete ao paciente
- **AND** SHALL notificar a clínica sobre a falta de resposta

#### Scenario: Pré-check-in completo
- **GIVEN** um pré-check-in onde todos os itens foram preenchidos
- **AND** todos os documentos obrigatórios foram validados
- **WHEN** o sistema verifica o status
- **THEN** o sistema MUST marcar status como "completo"
- **AND** SHALL notificar a clínica que o paciente está pronto
- **AND** SHALL enviar confirmação ao paciente

### Requirement: Validação de Dados com IA

The system SHALL automatically validate data extracted from documents and provided by the patient using AI. O sistema MUST validar dados automaticamente com IA.

#### Scenario: Validação de CPF extraído
- **GIVEN** o OCR extraiu um número de CPF de documento
- **WHEN** o sistema valida os dados
- **THEN** o sistema MUST verificar se o CPF é matematicamente válido
- **AND** SHALL comparar com CPF já cadastrado do paciente
- **AND** SHALL registrar inconsistência se houver divergência

#### Scenario: Validação cruzada de dados
- **GIVEN** dados foram extraídos de múltiplos documentos
- **WHEN** o sistema valida a consistência
- **THEN** o sistema SHALL comparar nome em todos os documentos
- **AND** SHALL verificar se datas de nascimento conferem
- **AND** MUST alertar sobre inconsistências para revisão manual

### Requirement: Armazenamento Seguro de Documentos

The system SHALL store documents securely, respecting privacy requirements and LGPD. O sistema MUST armazenar documentos de forma segura.

#### Scenario: Upload de documento
- **GIVEN** um paciente enviou foto de documento
- **WHEN** o sistema processa o upload
- **THEN** o documento MUST ser salvo no Supabase Storage com bucket privado
- **AND** o acesso SHALL ser restrito via RLS ao paciente e clínica
- **AND** SHALL ser gerada URL assinada para visualização temporária

#### Scenario: Retenção de documentos
- **GIVEN** documentos armazenados de um pré-check-in
- **AND** o agendamento foi concluído há mais de 30 dias
- **WHEN** o processo de limpeza executa
- **THEN** os arquivos de documentos MAY ser removidos do storage
- **AND** os metadados e dados extraídos SHALL ser mantidos
