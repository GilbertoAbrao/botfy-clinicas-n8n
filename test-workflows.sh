#!/bin/bash

# Script de Teste de Workflows Botfy Clinicas
# Este script testa os webhooks de todos os workflows automatizados

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Carregar variáveis de ambiente
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        # Ignorar linhas vazias e comentários
        if [[ -z "$key" ]] || [[ "$key" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        # Remover espaços em branco ao redor
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        # Exportar variável
        export "$key=$value"
    done < <(grep -v '^#' .env | grep -v '^$')
else
    echo -e "${RED}Erro: Arquivo .env não encontrado${NC}"
    exit 1
fi

# Verificar variáveis necessárias
if [ -z "$N8N_URL" ]; then
    echo -e "${RED}Erro: N8N_URL não definida no .env${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Teste de Workflows Botfy Clinicas${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Função para testar webhook
test_webhook() {
    local name=$1
    local path=$2
    local payload=$3

    echo -e "${YELLOW}Testando: $name${NC}"
    echo -e "Endpoint: ${N8N_URL}${path}"

    response=$(curl -s -w "\n%{http_code}" -X POST \
        "${N8N_URL}${path}" \
        -H "Content-Type: application/json" \
        -d "$payload")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ Sucesso (HTTP $http_code)${NC}"
        echo "Resposta:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Falha (HTTP $http_code)${NC}"
        echo "Resposta:"
        echo "$body"
    fi

    echo ""
    echo "---"
    echo ""
}

# ============================================
# 1. Anti No-Show - Teste Geral
# ============================================
test_webhook \
    "Anti No-Show (Teste Geral)" \
    "/webhook/test/anti-no-show" \
    '{}'

# ============================================
# 2. Anti No-Show - Teste com Agendamento Específico
# ============================================
# NOTA: Substitua 123 por um ID real de agendamento
test_webhook \
    "Anti No-Show (Agendamento Específico)" \
    "/webhook/test/anti-no-show" \
    '{"agendamento_id": 123}'

# ============================================
# 3. Pre Check-In - Teste Geral (24h)
# ============================================
test_webhook \
    "Pre Check-In (Teste Geral)" \
    "/webhook/test/pre-checkin" \
    '{}'

# ============================================
# 4. Pre Check-In - Teste com Agendamento Específico
# ============================================
# NOTA: Substitua 123 por um ID real de agendamento
test_webhook \
    "Pre Check-In (Agendamento Específico)" \
    "/webhook/test/pre-checkin" \
    '{"agendamento_id": 123, "bypass_timing": true}'

# ============================================
# 5. Pre Check-In Lembrete - Teste Geral
# ============================================
test_webhook \
    "Pre Check-In Lembrete (Teste Geral)" \
    "/webhook/test/pre-checkin-lembrete" \
    '{}'

# ============================================
# 6. Pre Check-In Lembrete - Teste Específico
# ============================================
# NOTA: Substitua 123 por um ID real de pre_checkin
test_webhook \
    "Pre Check-In Lembrete (Pre Check-In Específico)" \
    "/webhook/test/pre-checkin-lembrete" \
    '{"pre_checkin_id": 123}'

# ============================================
# 7. Verificar Pendencias - Teste Geral
# ============================================
test_webhook \
    "Verificar Pendencias (Teste Geral)" \
    "/webhook/test/verificar-pendencias" \
    '{}'

# ============================================
# Resumo
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testes Finalizados${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "1. Alguns webhooks podem retornar arrays vazios se não houver dados no período"
echo "2. Para testes específicos, substitua os IDs nos payloads acima"
echo "3. Verifique os logs de execução no N8N para detalhes"
echo ""
echo -e "${GREEN}Exemplos de Testes Manuais:${NC}"
echo ""
echo "# Testar Anti No-Show com agendamento específico:"
echo "curl -X POST \"${N8N_URL}/webhook/test/anti-no-show\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"agendamento_id\": 123}'"
echo ""
echo "# Testar Pre Check-In com agendamento específico:"
echo "curl -X POST \"${N8N_URL}/webhook/test/pre-checkin\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"agendamento_id\": 123, \"bypass_timing\": true}'"
echo ""
echo "# Testar Pre Check-In Lembrete com pre_checkin específico:"
echo "curl -X POST \"${N8N_URL}/webhook/test/pre-checkin-lembrete\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"pre_checkin_id\": 123}'"
echo ""
echo "# Testar Verificar Pendencias:"
echo "curl -X POST \"${N8N_URL}/webhook/test/verificar-pendencias\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{}'"
