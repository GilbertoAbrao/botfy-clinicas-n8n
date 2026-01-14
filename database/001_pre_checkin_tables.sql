-- ============================================
-- Módulo de Pré-Check-In - Botfy Clínicas
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Tabela principal de pré-check-in
CREATE TABLE IF NOT EXISTS pre_checkin (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'completo', 'incompleto', 'cancelado')),
  dados_confirmados BOOLEAN DEFAULT FALSE,
  documentos_enviados BOOLEAN DEFAULT FALSE,
  instrucoes_enviadas BOOLEAN DEFAULT FALSE,
  pendencias JSONB DEFAULT '[]'::jsonb,
  mensagem_enviada_em TIMESTAMP WITH TIME ZONE,
  lembrete_enviado_em TIMESTAMP WITH TIME ZONE,
  iniciado_em TIMESTAMP WITH TIME ZONE,
  completado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agendamento_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pre_checkin_agendamento ON pre_checkin(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_paciente ON pre_checkin(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_status ON pre_checkin(status);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_created ON pre_checkin(created_at);

-- 2. Tabela de documentos enviados pelo paciente
CREATE TABLE IF NOT EXISTS documentos_paciente (
  id SERIAL PRIMARY KEY,
  pre_checkin_id INTEGER REFERENCES pre_checkin(id) ON DELETE CASCADE,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('rg', 'cnh', 'carteirinha_convenio', 'guia_autorizacao', 'comprovante_residencia', 'outros')),
  arquivo_url TEXT,
  arquivo_path TEXT, -- path no Supabase Storage
  dados_extraidos JSONB DEFAULT '{}'::jsonb,
  confianca_extracao DECIMAL(3,2), -- 0.00 a 1.00
  validado BOOLEAN DEFAULT FALSE,
  validado_por VARCHAR(100), -- 'ia' ou 'manual' ou nome do usuário
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_pre_checkin ON documentos_paciente(pre_checkin_id);
CREATE INDEX IF NOT EXISTS idx_documentos_paciente ON documentos_paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos_paciente(tipo);

-- 3. Tabela de instruções por procedimento (para RAG)
-- Nota: A coluna embedding usa o tipo vector do pgvector (já habilitado no Supabase)
CREATE TABLE IF NOT EXISTS instrucoes_procedimentos (
  id SERIAL PRIMARY KEY,
  servico_id INTEGER REFERENCES servicos(id) ON DELETE CASCADE,
  tipo_instrucao VARCHAR(50) NOT NULL CHECK (tipo_instrucao IN ('preparo', 'jejum', 'medicamentos', 'vestuario', 'acompanhante', 'documentos', 'geral')),
  titulo VARCHAR(200) NOT NULL,
  conteudo TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002
  prioridade INTEGER DEFAULT 0, -- ordem de exibição
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_instrucoes_servico ON instrucoes_procedimentos(servico_id);
CREATE INDEX IF NOT EXISTS idx_instrucoes_tipo ON instrucoes_procedimentos(tipo_instrucao);
CREATE INDEX IF NOT EXISTS idx_instrucoes_ativo ON instrucoes_procedimentos(ativo);

-- Índice para busca por similaridade (HNSW para performance)
CREATE INDEX IF NOT EXISTS idx_instrucoes_embedding ON instrucoes_procedimentos
USING hnsw (embedding vector_cosine_ops);

-- 4. View para pré-check-in completo com dados do agendamento e paciente
CREATE OR REPLACE VIEW pre_checkin_completo AS
SELECT
  pc.id as pre_checkin_id,
  pc.status,
  pc.dados_confirmados,
  pc.documentos_enviados,
  pc.instrucoes_enviadas,
  pc.pendencias,
  pc.mensagem_enviada_em,
  pc.lembrete_enviado_em,
  pc.iniciado_em,
  pc.completado_em,
  pc.created_at as pre_checkin_criado_em,
  -- Dados do agendamento
  a.id as agendamento_id,
  a.data_hora,
  a.tipo_consulta,
  a.status as agendamento_status,
  a.profissional,
  -- Dados do paciente
  p.id as paciente_id,
  p.nome as paciente_nome,
  p.telefone as paciente_telefone,
  p.email as paciente_email,
  p.cpf as paciente_cpf,
  p.data_nascimento as paciente_data_nascimento,
  p.convenio as paciente_convenio,
  -- Dados do serviço
  s.id as servico_id,
  s.nome as servico_nome,
  s.duracao_minutos as servico_duracao,
  -- Contagem de documentos
  (SELECT COUNT(*) FROM documentos_paciente dp WHERE dp.pre_checkin_id = pc.id) as total_documentos,
  (SELECT COUNT(*) FROM documentos_paciente dp WHERE dp.pre_checkin_id = pc.id AND dp.validado = true) as documentos_validados
FROM pre_checkin pc
LEFT JOIN agendamentos a ON pc.agendamento_id = a.id
LEFT JOIN pacientes p ON pc.paciente_id = p.id
LEFT JOIN servicos s ON a.servico_id = s.id;

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_pre_checkin_updated_at ON pre_checkin;
CREATE TRIGGER update_pre_checkin_updated_at
  BEFORE UPDATE ON pre_checkin
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instrucoes_updated_at ON instrucoes_procedimentos;
CREATE TRIGGER update_instrucoes_updated_at
  BEFORE UPDATE ON instrucoes_procedimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS Policies (Row Level Security)
ALTER TABLE pre_checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrucoes_procedimentos ENABLE ROW LEVEL SECURITY;

-- Policy para permitir todas as operações via service_role (n8n usa service_role)
CREATE POLICY "Service role full access pre_checkin" ON pre_checkin
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access documentos" ON documentos_paciente
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access instrucoes" ON instrucoes_procedimentos
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Função para buscar instruções por similaridade (RAG)
CREATE OR REPLACE FUNCTION buscar_instrucoes_similares(
  query_embedding vector(1536),
  servico_filter INTEGER DEFAULT NULL,
  limite INTEGER DEFAULT 5
)
RETURNS TABLE (
  id INTEGER,
  servico_id INTEGER,
  tipo_instrucao VARCHAR(50),
  titulo VARCHAR(200),
  conteudo TEXT,
  similaridade FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip.id,
    ip.servico_id,
    ip.tipo_instrucao,
    ip.titulo,
    ip.conteudo,
    1 - (ip.embedding <=> query_embedding) as similaridade
  FROM instrucoes_procedimentos ip
  WHERE ip.ativo = true
    AND (servico_filter IS NULL OR ip.servico_id = servico_filter)
  ORDER BY ip.embedding <=> query_embedding
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentários nas tabelas para documentação
COMMENT ON TABLE pre_checkin IS 'Registro de pré-check-in de pacientes antes das consultas';
COMMENT ON TABLE documentos_paciente IS 'Documentos enviados pelos pacientes durante pré-check-in';
COMMENT ON TABLE instrucoes_procedimentos IS 'Instruções de preparo por procedimento para busca semântica (RAG)';
COMMENT ON VIEW pre_checkin_completo IS 'View consolidada de pré-check-in com dados de agendamento, paciente e serviço';
