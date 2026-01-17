#!/bin/bash
# Script para iniciar Botfy ClinicOps em desenvolvimento

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Botfy ClinicOps Development Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verifica se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}❌ Execute este script do diretório raiz do projeto${NC}"
    exit 1
fi

# Verifica dependências
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js não encontrado${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}❌ npm não encontrado${NC}"
    exit 1
fi

# Verifica se .env.local existe
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
    echo -e "${YELLOW}   Copie .env.example para .env.local e configure as variáveis${NC}"
    exit 1
fi

# Mata processos antigos se existirem
echo -e "${YELLOW}🧹 Limpando processos antigos...${NC}"
pkill -f "next dev.*3051" 2>/dev/null || true
sleep 2

# Função para cleanup
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Encerrando servidor...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Verifica se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
    echo ""
fi

# Inicia Next.js dev server
echo -e "${GREEN}🚀 Iniciando Next.js dev server (porta 3051)...${NC}"
PORT=3051 npm run dev > /tmp/botfy-clinicops-dev.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"
sleep 5

# Verifica se servidor iniciou
if curl -s http://localhost:3051 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Servidor iniciado com sucesso!${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor pode estar demorando para iniciar...${NC}"
fi

echo ""
echo -e "${GREEN}✓ Botfy ClinicOps rodando!${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC} http://localhost:3051"
echo -e "  ${BLUE}API:${NC}      http://localhost:3051/api"
echo ""
echo -e "  ${BLUE}Logs:${NC}"
echo -e "    Dev server: /tmp/botfy-clinicops-dev.log"
echo ""
echo -e "  ${BLUE}Acesso rápido:${NC}"
echo -e "    Dashboard:  http://localhost:3051/dashboard"
echo -e "    Pacientes:  http://localhost:3051/pacientes"
echo -e "    Agenda:     http://localhost:3051/agenda"
echo ""
echo -e "Pressione ${GREEN}Ctrl+C${NC} para encerrar"
echo ""

# Aguarda indefinidamente
wait
