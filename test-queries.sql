-- ============================================
-- QUERIES PARA TESTAR REGISTRO DE MENSAGENS
-- ============================================
-- Execute estas queries no Supabase SQL Editor
-- para validar o registro de mensagens no chat

-- ============================================
-- PREPARAÇÃO: Definir telefone de teste
-- ============================================
-- Altere este valor para o telefone que você usará nos testes
\set telefone_teste '5511999999999'
\set session_id :telefone_teste || '-calendar'

-- ============================================
-- 1. LIMPAR HISTÓRICO (OPCIONAL)
-- ============================================
-- Execute ANTES dos testes se quiser começar do zero
-- CUIDADO: Isso apaga todas as mensagens desta sessão

-- DELETE FROM n8n_chat_histories
-- WHERE session_id = :'session_id';

-- Verificar que foi limpo:
-- SELECT COUNT(*) as total_apos_limpeza
-- FROM n8n_chat_histories
-- WHERE session_id = :'session_id';
-- Esperado: 0

-- ============================================
-- 2. VER TODAS AS MENSAGENS DA SESSÃO
-- ============================================
-- Execute DEPOIS de cada teste para ver novas mensagens

SELECT
  id,
  created_at,
  session_id,
  message->>'role' as role,
  LEFT(message->>'content', 100) as mensagem_preview,
  LENGTH(message->>'content') as tamanho_mensagem
FROM n8n_chat_histories
WHERE session_id = :'session_id'
ORDER BY created_at DESC;

-- ============================================
-- 3. CONTAR MENSAGENS POR PERÍODO
-- ============================================

-- Últimos 5 minutos (útil durante testes)
SELECT COUNT(*) as mensagens_ultimos_5min
FROM n8n_chat_histories
WHERE session_id = :'session_id'
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Últimas 24 horas
SELECT COUNT(*) as mensagens_ultimas_24h
FROM n8n_chat_histories
WHERE session_id = :'session_id'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Total geral
SELECT COUNT(*) as total_mensagens
FROM n8n_chat_histories
WHERE session_id = :'session_id';

-- ============================================
-- 4. VALIDAR FORMATO DAS MENSAGENS
-- ============================================

-- Verificar se todas as mensagens têm o formato correto
SELECT
  id,
  created_at,
  jsonb_typeof(message) as tipo_json,
  message ? 'role' as tem_campo_role,
  message ? 'content' as tem_campo_content,
  message->>'role' as role_value,
  CASE
    WHEN jsonb_typeof(message) = 'object'
      AND message ? 'role'
      AND message ? 'content'
      AND message->>'role' = 'assistant'
    THEN '✅ Válido'
    ELSE '❌ Inválido'
  END as status_validacao
FROM n8n_chat_histories
WHERE session_id = :'session_id'
ORDER BY created_at DESC;

-- ============================================
-- 5. VER MENSAGEM COMPLETA (SEM TRUNCAR)
-- ============================================

-- Útil para ver o conteúdo exato de uma mensagem específica
-- Substitua o ID pelo ID da mensagem que quer ver

-- SELECT
--   id,
--   created_at,
--   message->>'role' as role,
--   message->>'content' as mensagem_completa
-- FROM n8n_chat_histories
-- WHERE id = 123;  -- Substitua 123 pelo ID real

-- ============================================
-- 6. COMPARAR ANTES E DEPOIS
-- ============================================

-- Execute ANTES dos testes
CREATE TEMP TABLE IF NOT EXISTS snapshot_inicial AS
SELECT COUNT(*) as total
FROM n8n_chat_histories
WHERE session_id = :'session_id';

-- Execute DEPOIS dos testes
SELECT
  (SELECT total FROM snapshot_inicial) as antes,
  COUNT(*) as depois,
  COUNT(*) - (SELECT total FROM snapshot_inicial) as novas_mensagens
FROM n8n_chat_histories
WHERE session_id = :'session_id';

-- ============================================
-- 7. VERIFICAR CONTEXTO DO AI AGENT
-- ============================================

-- Ver as últimas 50 mensagens (janela de contexto do AI Agent)
SELECT
  created_at,
  message->>'role' as role,
  LEFT(message->>'content', 80) as preview
FROM (
  SELECT * FROM n8n_chat_histories
  WHERE session_id = :'session_id'
  ORDER BY created_at DESC
  LIMIT 50
) as janela
ORDER BY created_at ASC;  -- Ordem cronológica

-- Contar quantas mensagens estão na janela
SELECT COUNT(*) as mensagens_na_janela_contexto
FROM (
  SELECT * FROM n8n_chat_histories
  WHERE session_id = :'session_id'
  ORDER BY created_at DESC
  LIMIT 50
) as janela;

-- ============================================
-- 8. BUSCAR MENSAGENS POR CONTEÚDO
-- ============================================

-- Encontrar mensagens que contêm palavras específicas
SELECT
  created_at,
  message->>'content' as mensagem
FROM n8n_chat_histories
WHERE session_id = :'session_id'
  AND message->>'content' ILIKE '%lembrete%'
ORDER BY created_at DESC;

-- Exemplos de buscas úteis:
-- Lembretes: ILIKE '%lembrete%'
-- Pre check-in: ILIKE '%pre check%' OR ILIKE '%pré check%'
-- Confirmações: ILIKE '%confirmada%' OR ILIKE '%confirmado%'
-- Cancelamentos: ILIKE '%cancelad%'

-- ============================================
-- 9. ESTATÍSTICAS GERAIS
-- ============================================

SELECT
  DATE(created_at) as data,
  COUNT(*) as total_mensagens,
  MIN(created_at) as primeira_mensagem,
  MAX(created_at) as ultima_mensagem
FROM n8n_chat_histories
WHERE session_id = :'session_id'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- ============================================
-- 10. DEBUG: VER TODAS AS SESSÕES
-- ============================================

-- Útil para verificar se há problemas com session_id
SELECT
  session_id,
  COUNT(*) as total_mensagens,
  MIN(created_at) as primeira,
  MAX(created_at) as ultima
FROM n8n_chat_histories
GROUP BY session_id
ORDER BY MAX(created_at) DESC
LIMIT 20;

-- ============================================
-- 11. TIMELINE DE MENSAGENS (VISUAL)
-- ============================================

-- Ver sequência cronológica com tempo entre mensagens
WITH mensagens_ordenadas AS (
  SELECT
    created_at,
    message->>'content' as conteudo,
    LAG(created_at) OVER (ORDER BY created_at) as mensagem_anterior
  FROM n8n_chat_histories
  WHERE session_id = :'session_id'
)
SELECT
  created_at,
  LEFT(conteudo, 60) as preview,
  CASE
    WHEN mensagem_anterior IS NULL THEN 'Primeira mensagem'
    ELSE EXTRACT(EPOCH FROM (created_at - mensagem_anterior))::text || ' segundos depois'
  END as intervalo
FROM mensagens_ordenadas
ORDER BY created_at;

-- ============================================
-- 12. VALIDAÇÃO FINAL - CHECKLIST
-- ============================================

WITH validacoes AS (
  SELECT
    -- Verifica se há mensagens
    (SELECT COUNT(*) > 0 FROM n8n_chat_histories WHERE session_id = :'session_id')
      as tem_mensagens,

    -- Verifica formato correto
    (SELECT COUNT(*) = 0 FROM n8n_chat_histories
     WHERE session_id = :'session_id'
       AND (jsonb_typeof(message) != 'object'
            OR NOT (message ? 'role')
            OR NOT (message ? 'content')))
      as formato_valido,

    -- Verifica que todas são 'assistant'
    (SELECT COUNT(*) = 0 FROM n8n_chat_histories
     WHERE session_id = :'session_id'
       AND message->>'role' != 'assistant')
      as todas_assistant,

    -- Verifica mensagens recentes (últimos 10 minutos)
    (SELECT COUNT(*) > 0 FROM n8n_chat_histories
     WHERE session_id = :'session_id'
       AND created_at > NOW() - INTERVAL '10 minutes')
      as tem_mensagens_recentes
)
SELECT
  CASE WHEN tem_mensagens THEN '✅' ELSE '❌' END || ' Tem mensagens registradas' as check1,
  CASE WHEN formato_valido THEN '✅' ELSE '❌' END || ' Formato JSON correto' as check2,
  CASE WHEN todas_assistant THEN '✅' ELSE '❌' END || ' Todas com role=assistant' as check3,
  CASE WHEN tem_mensagens_recentes THEN '✅' ELSE '❌' END || ' Mensagens recentes (últimos 10min)' as check4
FROM validacoes;

-- ============================================
-- DICAS DE USO
-- ============================================

/*
SEQUÊNCIA RECOMENDADA:

1. Configure o telefone de teste no início deste arquivo
2. Execute query #1 (limpar histórico) - OPCIONAL
3. Execute seus testes via webhooks
4. Execute query #2 para ver novas mensagens
5. Execute query #4 para validar formato
6. Execute query #12 para checklist final

ATALHOS:

- Ver últimas 5 mensagens:
  SELECT created_at, LEFT(message->>'content', 100)
  FROM n8n_chat_histories
  WHERE session_id = '5511999999999-calendar'
  ORDER BY created_at DESC LIMIT 5;

- Contar total:
  SELECT COUNT(*) FROM n8n_chat_histories
  WHERE session_id = '5511999999999-calendar';

- Limpar tudo:
  DELETE FROM n8n_chat_histories
  WHERE session_id = '5511999999999-calendar';
*/
