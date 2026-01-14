# Design: Módulo de Pré-Check-In

## Context

O Botfy Clínicas já possui um sistema de agendamento e anti-no-show funcionando via WhatsApp com Evolution API. O módulo de pré-check-in se integra a esse ecossistema, disparando automaticamente antes das consultas para coletar dados e documentos dos pacientes.

**Stakeholders**: Clínicas médicas, recepcionistas, pacientes
**Constraints**:
- Deve funcionar 100% via WhatsApp (sem app adicional)
- LGPD: documentos sensíveis devem ter tratamento adequado
- Integração com sistemas existentes (Supabase, n8n, Evolution API)

## Goals / Non-Goals

**Goals**:
- Automatizar coleta de dados cadastrais antes da consulta
- Processar documentos (RG, CNH, carteirinha convênio) via OCR
- Fornecer instruções personalizadas por tipo de procedimento
- Identificar pendências antes do paciente chegar
- Reduzir tempo de atendimento na recepção

**Non-Goals**:
- Substituir sistema de prontuário eletrônico
- Processar pagamentos
- Integração com sistemas legados específicos (fase inicial)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Fluxo de Pré-Check-In                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────────────┐   │
│  │ Schedule │───▶│ Busca       │───▶│ Dispara Pre-Check-In │   │
│  │ Trigger  │    │ Agendamentos│    │ via WhatsApp         │   │
│  │ (24-48h) │    │ Pendentes   │    │                      │   │
│  └──────────┘    └─────────────┘    └──────────┬───────────┘   │
│                                                 │               │
│                                                 ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Conversa WhatsApp                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ Coleta      │  │ Recebe       │  │ Busca           │  │  │
│  │  │ Dados       │──▶│ Documentos   │──▶│ Instruções RAG  │  │  │
│  │  │ Cadastrais  │  │ (Fotos)      │  │ por Procedimento│  │  │
│  │  └─────────────┘  └──────┬───────┘  └─────────────────┘  │  │
│  └───────────────────────────┼──────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Processamento IA                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ OCR/Vision  │  │ Validação    │  │ Atualiza        │  │  │
│  │  │ Extrai      │──▶│ Campos       │──▶│ Status          │  │  │
│  │  │ Dados Doc   │  │ IA           │  │ Pre-Check-In    │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Decisions

### 1. Disparo baseado em tempo
- **Decisão**: Disparar pré-check-in 24-48h antes da consulta via Schedule Trigger
- **Alternativas**: Disparo manual, disparo imediato após agendamento
- **Rationale**: Tempo suficiente para paciente responder e clínica resolver pendências

### 2. OCR via OpenAI Vision
- **Decisão**: Usar GPT-4 Vision para extrair dados de documentos
- **Alternativas**: Google Cloud Vision, Amazon Textract, Tesseract local
- **Rationale**: Já temos integração OpenAI; qualidade superior para documentos brasileiros

### 3. RAG para instruções de procedimentos
- **Decisão**: Usar Supabase Vector Store existente para instruções
- **Alternativas**: Banco de dados relacional com busca full-text
- **Rationale**: Já temos infraestrutura RAG (workflow uIH1rCROxDgQH9Fy); instruções podem ser complexas e variadas

### 4. Armazenamento de documentos
- **Decisão**: Supabase Storage para arquivos + metadados em tabela
- **Alternativas**: S3 direto, armazenar base64 em banco
- **Rationale**: Supabase unifica storage e banco; RLS para segurança

## Data Model

```sql
-- Tabela principal de pré-check-in
CREATE TABLE pre_checkin (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER REFERENCES agendamentos(id),
  paciente_id INTEGER REFERENCES pacientes(id),
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_andamento, completo, incompleto
  dados_confirmados BOOLEAN DEFAULT FALSE,
  documentos_enviados BOOLEAN DEFAULT FALSE,
  instrucoes_enviadas BOOLEAN DEFAULT FALSE,
  pendencias JSONB DEFAULT '[]',
  iniciado_em TIMESTAMP,
  completado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documentos enviados pelo paciente
CREATE TABLE documentos_paciente (
  id SERIAL PRIMARY KEY,
  pre_checkin_id INTEGER REFERENCES pre_checkin(id),
  paciente_id INTEGER REFERENCES pacientes(id),
  tipo VARCHAR(50), -- rg, cnh, carteirinha_convenio, guia_autorizacao, outros
  arquivo_url TEXT,
  dados_extraidos JSONB, -- dados extraídos via OCR
  validado BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Instruções por procedimento (para RAG)
CREATE TABLE instrucoes_procedimentos (
  id SERIAL PRIMARY KEY,
  servico_id INTEGER REFERENCES servicos(id),
  tipo_instrucao VARCHAR(50), -- preparo, jejum, medicamentos, vestuario, acompanhante
  conteudo TEXT,
  embedding VECTOR(1536), -- para busca semântica
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| OCR pode extrair dados incorretos | Alto | Validação IA + confirmação do paciente |
| Paciente não responde no prazo | Médio | Lembretes automáticos + fallback manual |
| Documentos sensíveis (LGPD) | Alto | Criptografia, RLS, retenção limitada |
| Custo de tokens OpenAI Vision | Baixo | Compressão de imagens, cache |

## Migration Plan

1. Criar tabelas no Supabase (sem impacto em produção)
2. Criar workflow de pré-check-in desativado
3. Popular tabela de instruções por procedimento
4. Testar com agendamentos de teste
5. Ativar gradualmente (começar com 1-2 clínicas piloto)
6. Rollback: desativar workflow, dados permanecem históricos

## Open Questions

- [ ] Quais documentos são obrigatórios por tipo de convênio?
- [ ] Qual o tempo ideal de antecedência para disparo (24h ou 48h)?
- [ ] Deve haver limite de tentativas de coleta de documentos?
