#!/bin/bash

# =============================================================================
# AI Agent Swarm - Quick Setup
# =============================================================================
# Instalação e configuração completa em um único comando

set -euo pipefail

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Agent Swarm - Quick Setup${NC}"
echo "=================================="

# Detectar sistema
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo -e "${YELLOW}⚠️ Sistema não detectado automaticamente${NC}"
    read -p "Digite 'macos' ou 'linux': " OS
fi

echo -e "${BLUE}🖥️ Sistema: $OS${NC}"

# Verificar se está no diretório correto
if [[ ! -f "package.json" ]]; then
    echo -e "${YELLOW}⚠️ Navegando para o diretório do projeto...${NC}"
    cd "$(dirname "$0")/.." 2>/dev/null || cd ..
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️ Node.js não encontrado. Por favor, instale o Node.js primeiro.${NC}"
    echo "📥 https://nodejs.org/"
    exit 1
fi

# Instalar dependências
echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install

# Tornar scripts executáveis
echo -e "${BLUE}🔧 Configurando scripts...${NC}"
chmod +x scripts/*.sh

# Instalar serviço
echo -e "${BLUE}🛠️ Instalando serviço do sistema...${NC}"
if [[ "$OS" == "macos" ]]; then
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}⚠️ No macOS, não execute como root. Use usuário normal.${NC}"
        exit 1
    fi
else
    if [[ $EUID -ne 0 ]]; then
        echo -e "${YELLOW}⚠️ No Linux, precisa de root. Use: sudo $0${NC}"
        exit 1
    fi
fi

./scripts/install-swarm-service.sh install

# Verificar instalação
echo -e "${BLUE}🔍 Verificando instalação...${NC}"
sleep 3
./scripts/swarm-service-manager.sh status

# Testar comunicação
echo -e "${BLUE}📡 Testando comunicação...${NC}"
sleep 2
./scripts/health-monitor.sh check

echo ""
echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo "📋 Comandos úteis:"
echo "  ./scripts/swarm-service-manager.sh status    # Ver status"
echo "  ./scripts/swarm-service-manager.sh restart   # Reiniciar serviços"
echo "  ./scripts/health-monitor.sh check            # Ver saúde"
echo "  ./scripts/health-monitor.sh watch            # Monitorar contínuo"
echo ""
echo "📁 Logs: .ai-workspace/logs/"
echo "🌐 WebMap: http://localhost:3456"
echo ""
echo -e "${GREEN}🎉 O sistema está pronto e será iniciado automaticamente no boot!${NC}"
