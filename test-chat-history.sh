#!/bin/bash

# Script de teste para validar registro de mensagens no histórico de chat
# Este script testa se todas as mensagens enviadas aos pacientes estão sendo
# registradas corretamente na tabela n8n_chat_histories

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
N8N_URL="${N8N_URL:-http://localhost:5678}"
TELEFONE_TESTE="${TELEFONE_TESTE:-5511999999999}"
SESSION_ID="${TELEFONE_TESTE}-calendar"

echo "=========================================="
echo "  Teste: Registro de Mensagens no Chat"
echo "=========================================="
echo "N8N URL: $N8N_URL"
echo "Telefone de teste: $TELEFONE_TESTE"
echo "Session ID: $SESSION_ID"
echo ""

# Função para consultar histórico no Supabase
verificar_historico() {
    local workflow_name="$1"
    local mensagens_esperadas="$2"

    echo -e "${BLUE}Verificando histórico após: ${workflow_name}${NC}"
    echo "  Consulte manualmente no Supabase:"
    echo "  SELECT created_at, message->>'content' as mensagem"
    echo "  FROM n8n_chat_histories"
    echo "  WHERE session_id = '${SESSION_ID}'"
    echo "  ORDER BY created_at DESC"
    echo "  LIMIT 5;"
    echo ""
    echo "  Mensagens esperadas no histórico: ${mensagens_esperadas}"
    echo ""
}

# Função para executar teste de workflow
test_workflow() {
    local name="$1"
    local path="$2"
    local payload="$3"
    local mensagens_esperadas="$4"

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Teste ${test_number}: ${name}${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  URL: $N8N_URL/webhook$path"
    echo "  Payload: $payload"
    echo ""

    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$N8N_URL/webhook$path" 2>&1)

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Workflow executado com sucesso (HTTP $http_code)${NC}"
        if [ -n "$body" ]; then
            echo "  Response: $body"
        fi
    else
        echo -e "${RED}✗ Erro na execução (HTTP $http_code)${NC}"
        echo "  Response: $body"
    fi

    echo ""
    verificar_historico "$name" "$mensagens_esperadas"

    echo -e "${BLUE}Pressione ENTER para continuar para o próximo teste...${NC}"
    read
}

# Limpar histórico antes dos testes (OPCIONAL)
echo -e "${YELLOW}ATENÇÃO: Deseja limpar o histórico de chat antes dos testes?${NC}"
echo "  Isso executará: DELETE FROM n8n_chat_histories WHERE session_id = '${SESSION_ID}'"
echo -e "${YELLOW}Digite 'sim' para confirmar ou ENTER para pular:${NC} "
read confirm

if [ "$confirm" = "sim" ]; then
    echo -e "${YELLOW}Execute manualmente no Supabase:${NC}"
    echo "  DELETE FROM n8n_chat_histories WHERE session_id = '${SESSION_ID}';"
    echo ""
    echo -e "${BLUE}Pressione ENTER após executar a query...${NC}"
    read
    echo -e "${GREEN}✓ Histórico limpo. Iniciando testes...${NC}"
    echo ""
fi

test_number=1

# ============================================
# TESTE 1: Anti No-Show - Lembrete
# ============================================
test_workflow \
    "Anti No-Show - Envio de Lembrete" \
    "/test/anti-no-show" \
    '{"agendamento_id": 10, "bypass_timing": true}' \
    "1 mensagem (lembrete gerado pela IA)"

((test_number++))

# ============================================
# TESTE 2: Pre Check-In
# ============================================
test_workflow \
    "Pre Check-In - Mensagem Inicial" \
    "/test/pre-checkin" \
    '{"agendamento_id": 10, "bypass_timing": true}' \
    "1 mensagem (pre check-in com confirmação de dados)"

((test_number++))

# ============================================
# TESTE 3: Pre Check-In Lembrete
# ============================================
test_workflow \
    "Pre Check-In Lembrete" \
    "/test/pre-checkin-lembrete" \
    '{"pre_checkin_id": 5}' \
    "1 mensagem (lembrete de pre check-in pendente)"

((test_number++))

# ============================================
# VERIFICAÇÃO FINAL
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Verificação Final${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Execute esta query no Supabase para ver TODAS as mensagens registradas:${NC}"
echo ""
echo "SELECT "
echo "  created_at,"
echo "  message->>'role' as role,"
echo "  LEFT(message->>'content', 100) as mensagem_preview"
echo "FROM n8n_chat_histories"
echo "WHERE session_id = '${SESSION_ID}'"
echo "ORDER BY created_at DESC;"
echo ""
echo -e "${GREEN}✓ Você deve ver pelo menos 3 mensagens de 'assistant' registradas${NC}"
echo ""

# ============================================
# TESTE INTEGRAÇÃO COM AI AGENT
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Teste de Integração: AI Agent com Contexto${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Agora teste manualmente via WhatsApp:${NC}"
echo ""
echo "1. Envie no WhatsApp (${TELEFONE_TESTE}): 'Confirmado'"
echo ""
echo "2. O AI Agent DEVE:"
echo "   ✓ Reconhecer que está respondendo a um lembrete anterior"
echo "   ✓ Chamar buscar_paciente para verificar agendamento"
echo "   ✓ Chamar confirmar_presenca"
echo "   ✓ Responder: 'Perfeito! Sua presença está confirmada para...'"
echo ""
echo "3. O AI Agent NÃO DEVE:"
echo "   ✗ Oferecer novos horários disponíveis"
echo "   ✗ Perguntar qual procedimento deseja"
echo "   ✗ Iniciar novo agendamento"
echo ""
echo -e "${YELLOW}Motivo: O AI Agent agora tem contexto completo das mensagens anteriores${NC}"
echo -e "${YELLOW}incluindo o lembrete que foi enviado pelo workflow Anti No-Show${NC}"
echo ""

# ============================================
# CHECKLIST DE VALIDAÇÃO
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Checklist de Validação${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "□ Todas as mensagens dos workflows foram registradas no Supabase"
echo "□ Campo 'session_id' está no formato: {telefone}-calendar"
echo "□ Campo 'message' é um JSON válido com role='assistant'"
echo "□ AI Agent reconhece contexto de lembretes anteriores"
echo "□ Bot não oferece novos horários quando confirma presença"
echo "□ Mensagens de lista de espera também são registradas"
echo ""
echo -e "${GREEN}✓ Testes concluídos!${NC}"
echo ""
