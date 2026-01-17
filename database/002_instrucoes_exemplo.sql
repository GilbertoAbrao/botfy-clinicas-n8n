-- ============================================
-- Instruções de Exemplo por Procedimento
-- ============================================
-- Execute após criar as tabelas
-- Nota: Os embeddings serão gerados via workflow n8n
-- ============================================

-- Limpa instruções existentes (para re-execução)
-- DELETE FROM instrucoes_procedimentos;

-- Instruções para procedimentos de estética (exemplo baseado nos serviços existentes)
-- Assumindo que existem serviços com IDs 1-5: Avaliação Facial, Limpeza de Pele, Peeling, Botox, Preenchimento

-- === AVALIAÇÃO FACIAL ===
INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'geral', 'Orientações para Avaliação Facial',
'Para sua avaliação facial, por favor:
- Venha com a pele limpa, sem maquiagem
- Traga fotos antigas se tiver (para comparação)
- Liste os produtos que usa na pele atualmente
- Informe se tem alguma alergia conhecida',
1
FROM servicos s WHERE s.nome ILIKE '%avaliação%' OR s.nome ILIKE '%avaliacao%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'documentos', 'Documentos necessários para Avaliação',
'Por favor, traga os seguintes documentos:
- Documento de identidade (RG ou CNH)
- Carteirinha do convênio (se aplicável)
- Exames dermatológicos anteriores (se tiver)',
2
FROM servicos s WHERE s.nome ILIKE '%avaliação%' OR s.nome ILIKE '%avaliacao%'
ON CONFLICT DO NOTHING;

-- === LIMPEZA DE PELE ===
INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'preparo', 'Preparo para Limpeza de Pele',
'Instruções de preparo para limpeza de pele:
- Não use esfoliantes 3 dias antes do procedimento
- Evite exposição solar intensa nas 48h anteriores
- Não aplique ácidos ou retinol 5 dias antes
- Venha com a pele limpa, sem maquiagem',
1
FROM servicos s WHERE s.nome ILIKE '%limpeza%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'medicamentos', 'Medicamentos - Limpeza de Pele',
'Sobre medicamentos:
- Pode tomar seus medicamentos normalmente
- Informe se está usando Roacutan ou similares (isotretinoína)
- Avise se usa anticoagulantes
- Se tiver herpes labial ativo, reagende o procedimento',
2
FROM servicos s WHERE s.nome ILIKE '%limpeza%'
ON CONFLICT DO NOTHING;

-- === PEELING ===
INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'preparo', 'Preparo para Peeling',
'Preparo obrigatório para peeling:
- Suspenda uso de ácidos e retinol 7 dias antes
- Não faça depilação facial 5 dias antes
- Evite exposição solar 7 dias antes
- Use protetor solar FPS 50 diariamente na semana anterior',
1
FROM servicos s WHERE s.nome ILIKE '%peeling%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'medicamentos', 'Contraindicações - Peeling',
'Informe se você:
- Está grávida ou amamentando (contraindicado)
- Usa Roacutan (aguardar 6 meses após término)
- Tem histórico de queloides
- Está com herpes ativa ou feridas na pele',
2
FROM servicos s WHERE s.nome ILIKE '%peeling%'
ON CONFLICT DO NOTHING;

-- === BOTOX ===
INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'preparo', 'Preparo para Aplicação de Botox',
'Orientações para aplicação de toxina botulínica:
- Evite consumo de álcool 24h antes
- Não tome anti-inflamatórios 3 dias antes (se possível)
- Venha sem maquiagem na região a ser tratada
- O procedimento leva aproximadamente 30 minutos',
1
FROM servicos s WHERE s.nome ILIKE '%botox%' OR s.nome ILIKE '%toxina%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'medicamentos', 'Medicamentos - Botox',
'Informações importantes:
- Suspenda aspirina e anticoagulantes 3 dias antes (com autorização médica)
- Evite vitamina E e ômega 3 uma semana antes
- Se usa antibióticos aminoglicosídeos, informe o médico
- Contraindicado para gestantes e lactantes',
2
FROM servicos s WHERE s.nome ILIKE '%botox%' OR s.nome ILIKE '%toxina%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'geral', 'Pós-procedimento Botox',
'Cuidados após a aplicação:
- Não deite nas primeiras 4 horas
- Evite atividade física intensa por 24h
- Não massageie o local da aplicação
- Evite chapéu ou óculos apertados na região
- Resultados aparecem em 3-7 dias',
3
FROM servicos s WHERE s.nome ILIKE '%botox%' OR s.nome ILIKE '%toxina%'
ON CONFLICT DO NOTHING;

-- === PREENCHIMENTO ===
INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'preparo', 'Preparo para Preenchimento',
'Orientações para preenchimento com ácido hialurônico:
- Evite álcool 48h antes do procedimento
- Não tome anti-inflamatórios 5 dias antes
- Se tiver histórico de herpes labial, avise (pode precisar de profilaxia)
- Procedimento dura aproximadamente 45 minutos',
1
FROM servicos s WHERE s.nome ILIKE '%preenchimento%' OR s.nome ILIKE '%acido hialuronico%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'medicamentos', 'Medicamentos - Preenchimento',
'Sobre medicamentos:
- Suspenda aspirina, ibuprofeno e anticoagulantes 7 dias antes
- Evite suplementos como vitamina E, ginkgo biloba, ômega 3
- Se tiver histórico de herpes, pode ser necessário tomar antiviral preventivo
- Informe todos os medicamentos que usa',
2
FROM servicos s WHERE s.nome ILIKE '%preenchimento%' OR s.nome ILIKE '%acido hialuronico%'
ON CONFLICT DO NOTHING;

INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
SELECT s.id, 'geral', 'Pós-procedimento Preenchimento',
'Cuidados após o preenchimento:
- Aplique gelo nas primeiras 24h (intervalos de 10 min)
- Evite exposição solar por 48h
- Não faça exercícios intensos por 24h
- Inchaço e pequenos hematomas são normais
- Evite pressionar ou massagear a região',
3
FROM servicos s WHERE s.nome ILIKE '%preenchimento%' OR s.nome ILIKE '%acido hialuronico%'
ON CONFLICT DO NOTHING;

-- === INSTRUÇÕES GERAIS (para todos os procedimentos) ===
INSERT INTO instrucoes_procedimentos (servico_id, tipo_instrucao, titulo, conteudo, prioridade)
VALUES
(NULL, 'documentos', 'Documentos Obrigatórios',
'Para seu atendimento, traga:
- Documento de identidade com foto (RG ou CNH)
- CPF
- Carteirinha do convênio (se aplicável)
- Guia de autorização (se exigido pelo convênio)',
1),

(NULL, 'geral', 'Chegada à Clínica',
'Informações sobre sua chegada:
- Chegue com 15 minutos de antecedência
- O endereço é: [ENDEREÇO DA CLÍNICA]
- Estacionamento disponível no local
- Se precisar remarcar, avise com 24h de antecedência',
2),

(NULL, 'acompanhante', 'Sobre Acompanhantes',
'Para a maioria dos procedimentos estéticos:
- Não é necessário acompanhante
- Se for usar sedação, obrigatório vir acompanhado
- Menores de 18 anos devem estar com responsável legal',
3);

-- Verificar quantidade de instruções criadas
SELECT tipo_instrucao, COUNT(*) as quantidade
FROM instrucoes_procedimentos
GROUP BY tipo_instrucao
ORDER BY quantidade DESC;
