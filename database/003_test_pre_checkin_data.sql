-- ============================================
-- Dados de Teste para Pre-Checkin Dashboard
-- ============================================
-- Execute este script no Supabase SQL Editor
-- Requer pacientes e agendamentos existentes
-- ============================================

-- Primeiro, vamos verificar se temos pacientes e agendamentos
-- Se nao tiver, cria alguns de teste

-- Inserir pacientes de teste (se nao existirem)
INSERT INTO pacientes (nome, telefone, email, cpf, data_nascimento)
SELECT 'Maria Silva', '5511999990001', 'maria.silva@teste.com', '12345678901', '1985-03-15'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE telefone = '5511999990001');

INSERT INTO pacientes (nome, telefone, email, cpf, data_nascimento)
SELECT 'Joao Santos', '5511999990002', 'joao.santos@teste.com', '12345678902', '1990-07-22'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE telefone = '5511999990002');

INSERT INTO pacientes (nome, telefone, email, cpf, data_nascimento)
SELECT 'Ana Oliveira', '5511999990003', 'ana.oliveira@teste.com', '12345678903', '1978-11-08'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE telefone = '5511999990003');

INSERT INTO pacientes (nome, telefone, email, cpf, data_nascimento)
SELECT 'Carlos Ferreira', '5511999990004', 'carlos.ferreira@teste.com', '12345678904', '1995-01-30'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE telefone = '5511999990004');

INSERT INTO pacientes (nome, telefone, email, cpf, data_nascimento)
SELECT 'Patricia Costa', '5511999990005', 'patricia.costa@teste.com', '12345678905', '1988-09-12'
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE telefone = '5511999990005');

-- Verificar se servicos existem
INSERT INTO servicos (nome, duracao_minutos, ativo, preco)
SELECT 'Avaliacao Facial', 30, true, 150.00
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Avaliacao Facial');

INSERT INTO servicos (nome, duracao_minutos, ativo, preco)
SELECT 'Limpeza de Pele', 60, true, 250.00
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Limpeza de Pele');

INSERT INTO servicos (nome, duracao_minutos, ativo, preco)
SELECT 'Peeling', 45, true, 350.00
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Peeling');

INSERT INTO servicos (nome, duracao_minutos, ativo, preco)
SELECT 'Botox', 30, true, 800.00
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Botox');

-- Criar agendamentos de teste para os proximos 7 dias
-- Paciente 1 - Agendamento amanha (para pre-checkin pendente)
INSERT INTO agendamentos (paciente_id, servico_id, data_hora, status)
SELECT p.id, s.id, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 'agendada'
FROM pacientes p, servicos s
WHERE p.telefone = '5511999990001' AND s.nome = 'Limpeza de Pele'
AND NOT EXISTS (
  SELECT 1 FROM agendamentos a
  WHERE a.paciente_id = p.id
  AND a.data_hora::date = (NOW() + INTERVAL '1 day')::date
);

-- Paciente 2 - Agendamento em 2 dias (para pre-checkin em andamento)
INSERT INTO agendamentos (paciente_id, servico_id, data_hora, status)
SELECT p.id, s.id, NOW() + INTERVAL '2 days' + INTERVAL '14 hours', 'confirmado'
FROM pacientes p, servicos s
WHERE p.telefone = '5511999990002' AND s.nome = 'Peeling'
AND NOT EXISTS (
  SELECT 1 FROM agendamentos a
  WHERE a.paciente_id = p.id
  AND a.data_hora::date = (NOW() + INTERVAL '2 days')::date
);

-- Paciente 3 - Agendamento em 3 dias (para pre-checkin completo)
INSERT INTO agendamentos (paciente_id, servico_id, data_hora, status)
SELECT p.id, s.id, NOW() + INTERVAL '3 days' + INTERVAL '9 hours', 'confirmado'
FROM pacientes p, servicos s
WHERE p.telefone = '5511999990003' AND s.nome = 'Botox'
AND NOT EXISTS (
  SELECT 1 FROM agendamentos a
  WHERE a.paciente_id = p.id
  AND a.data_hora::date = (NOW() + INTERVAL '3 days')::date
);

-- Paciente 4 - Agendamento hoje + 6h (para pre-checkin incompleto/atrasado)
INSERT INTO agendamentos (paciente_id, servico_id, data_hora, status)
SELECT p.id, s.id, NOW() + INTERVAL '6 hours', 'agendada'
FROM pacientes p, servicos s
WHERE p.telefone = '5511999990004' AND s.nome = 'Avaliacao Facial'
AND NOT EXISTS (
  SELECT 1 FROM agendamentos a
  WHERE a.paciente_id = p.id
  AND a.data_hora::date = NOW()::date
);

-- Paciente 5 - Agendamento em 4 dias (para pre-checkin pendente)
INSERT INTO agendamentos (paciente_id, servico_id, data_hora, status)
SELECT p.id, s.id, NOW() + INTERVAL '4 days' + INTERVAL '16 hours', 'agendada'
FROM pacientes p, servicos s
WHERE p.telefone = '5511999990005' AND s.nome = 'Limpeza de Pele'
AND NOT EXISTS (
  SELECT 1 FROM agendamentos a
  WHERE a.paciente_id = p.id
  AND a.data_hora::date = (NOW() + INTERVAL '4 days')::date
);

-- Agora criar pre_checkin records

-- Pre-checkin 1: PENDENTE (nenhum campo preenchido, enviado ha 2h)
INSERT INTO pre_checkin (agendamento_id, paciente_id, status, dados_confirmados, documentos_enviados, instrucoes_enviadas, mensagem_enviada_em, created_at)
SELECT a.id, a.paciente_id, 'pendente', false, false, false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE p.telefone = '5511999990001'
AND NOT EXISTS (SELECT 1 FROM pre_checkin pc WHERE pc.agendamento_id = a.id)
LIMIT 1;

-- Pre-checkin 2: EM_ANDAMENTO (dados confirmados, docs pendente)
INSERT INTO pre_checkin (agendamento_id, paciente_id, status, dados_confirmados, documentos_enviados, instrucoes_enviadas, mensagem_enviada_em, iniciado_em, created_at)
SELECT a.id, a.paciente_id, 'em_andamento', true, false, false, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '12 hours'
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE p.telefone = '5511999990002'
AND NOT EXISTS (SELECT 1 FROM pre_checkin pc WHERE pc.agendamento_id = a.id)
LIMIT 1;

-- Pre-checkin 3: COMPLETO (tudo ok)
INSERT INTO pre_checkin (agendamento_id, paciente_id, status, dados_confirmados, documentos_enviados, instrucoes_enviadas, mensagem_enviada_em, iniciado_em, completado_em, created_at)
SELECT a.id, a.paciente_id, 'completo', true, true, true, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '24 hours'
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE p.telefone = '5511999990003'
AND NOT EXISTS (SELECT 1 FROM pre_checkin pc WHERE pc.agendamento_id = a.id)
LIMIT 1;

-- Pre-checkin 4: INCOMPLETO (overdue - falta pouco tempo pro agendamento)
INSERT INTO pre_checkin (agendamento_id, paciente_id, status, dados_confirmados, documentos_enviados, instrucoes_enviadas, mensagem_enviada_em, lembrete_enviado_em, iniciado_em, created_at, pendencias)
SELECT a.id, a.paciente_id, 'incompleto', true, false, true, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '18 hours',
  '["Documento de identidade pendente", "Carteirinha do convenio pendente"]'::jsonb
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE p.telefone = '5511999990004'
AND NOT EXISTS (SELECT 1 FROM pre_checkin pc WHERE pc.agendamento_id = a.id)
LIMIT 1;

-- Pre-checkin 5: PENDENTE (recem criado)
INSERT INTO pre_checkin (agendamento_id, paciente_id, status, dados_confirmados, documentos_enviados, instrucoes_enviadas, mensagem_enviada_em, created_at)
SELECT a.id, a.paciente_id, 'pendente', false, false, false, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
FROM agendamentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE p.telefone = '5511999990005'
AND NOT EXISTS (SELECT 1 FROM pre_checkin pc WHERE pc.agendamento_id = a.id)
LIMIT 1;

-- Verificar dados criados
SELECT
  pc.id,
  pc.status,
  pc.dados_confirmados,
  pc.documentos_enviados,
  pc.instrucoes_enviadas,
  p.nome as paciente,
  s.nome as servico,
  a.data_hora,
  a.status as status_agendamento
FROM pre_checkin pc
JOIN agendamentos a ON pc.agendamento_id = a.id
JOIN pacientes p ON pc.paciente_id = p.id
JOIN servicos s ON a.servico_id = s.id
ORDER BY a.data_hora;

-- ============================================
-- Resultado esperado:
-- - 2 pendentes (0% progress)
-- - 1 em_andamento (33% progress)
-- - 1 completo (100% progress)
-- - 1 incompleto (66% progress, overdue)
-- ============================================
