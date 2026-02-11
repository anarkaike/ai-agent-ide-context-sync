#!/bin/bash

# Deploy Health Monitor - Installation Script
# Instala dependências e configura a skill para uso

set -e

echo "🚀 Instalando Deploy Health Monitor..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js >= 14.0.0"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "⚠️ Versão do Node.js $NODE_VERSION pode ter problemas. Recomendado >= $REQUIRED_VERSION"
fi

# Verificar ferramentas de sistema
echo "🔍 Verificando ferramentas de sistema..."

TOOLS=("nslookup" "ping" "nc" "openssl")
MISSING_TOOLS=()

for tool in "${TOOLS[@]}"; do
    if ! command -v $tool &> /dev/null; then
        MISSING_TOOLS+=($tool)
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "⚠️ Ferramentas faltando: ${MISSING_TOOLS[*]}"
    echo "📦 Instalando ferramentas..."
    
    # Detectar package manager
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y dnsutils netcat-openbsd openssl
    elif command -v yum &> /dev/null; then
        sudo yum install -y bind-utils nc openssl
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y bind-utils nc openssl
    else
        echo "❌ Package manager não detectado. Instale manualmente: ${MISSING_TOOLS[*]}"
        exit 1
    fi
fi

# Criar diretório de logs
echo "📁 Criando diretórios..."
mkdir -p logs reports

# Tornar executável
echo "🔧 Configurando permissões..."
chmod +x index.js

# Testar instalação
echo "🧪 Testando instalação..."
echo "Testando com sites de exemplo..."

if node index.js --environments=https://httpbin.org/status/200,https://httpbin.org/status/502 > /dev/null 2>&1; then
    echo "✅ Instalação concluída com sucesso!"
else
    echo "❌ Falha no teste de instalação"
    exit 1
fi

# Criar symlink global (opcional)
read -p "🌍 Deseja instalar globalmente? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g .
    echo "✅ Instalado globalmente! Use: deploy-health-monitor"
fi

echo ""
echo "🎉 Deploy Health Monitor instalado com sucesso!"
echo ""
echo "📖 Uso:"
echo "   node index.js                           # Verificar ambientes padrão"
echo "   node index.js --verbose                 # Modo detalhado"
echo "   node index.js --environments=URL1,URL2  # Ambientes customizados"
echo ""
echo "📊 Exemplo:"
echo "   node index.js --environments=https://app1.com,https://app2.com"
echo ""
echo "📁 Relatórios são salvos em ./reports/"
echo ""
echo "🔍 Para diagnosticar os ambientes AlphaClinics:"
echo "   node index.js --environments=https://alphaclinics.servinder.com.br,https://hmg.alphaclinics.servinder.com.br,https://dev.alphaclinics.servinder.com.br"
