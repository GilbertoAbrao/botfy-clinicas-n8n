# Change: Implementar Módulo de Pré-Check-In com IA

## Why

Pacientes frequentemente chegam às consultas sem documentos necessários, sem preencher formulários obrigatórios, ou sem conhecer as instruções específicas para seus procedimentos. Isso causa filas, atrasos e erros administrativos. O módulo de Pré-Check-In automatiza a coleta antecipada de dados e documentos via WhatsApp, usando IA para extrair informações de documentos (OCR), validar campos, e fornecer instruções personalizadas por procedimento através de RAG.

## What Changes

- **NOVO**: Workflow de disparo de pré-check-in (24-48h antes da consulta)
- **NOVO**: Fluxo conversacional para coleta de dados do paciente via WhatsApp
- **NOVO**: Coleta e processamento de documentos (RG, CNH, cartão do convênio, guias)
- **NOVO**: Extração de dados via OCR/IA (OpenAI Vision)
- **NOVO**: Validação automática de campos extraídos
- **NOVO**: Sistema RAG para instruções personalizadas por procedimento (jejum, medicamentos, preparo)
- **NOVO**: Detecção e notificação de pendências antes do paciente chegar
- **NOVO**: Dashboard de status de pré-check-in por agendamento
- **NOVO**: Tabelas no Supabase para armazenar dados do pré-check-in

## Impact

- Affected specs: pre-checkin (nova capability)
- Affected code:
  - Novos workflows n8n: `Botfy - Pre Check-In`, `Botfy - Tool: Processar Documento`, `Botfy - Tool: Buscar Instrucoes`
  - Novas tabelas Supabase: `pre_checkin`, `documentos_paciente`, `instrucoes_procedimentos`
  - Integração com workflow existente: `Botfy - Agendamento` (bPJamJhBcrVCKgBg)
  - Integração com RAG existente: `RAG Supabase` (uIH1rCROxDgQH9Fy)
