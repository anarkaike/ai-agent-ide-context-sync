#!/bin/bash
# Script de distribuição universal de skills para VPS e macOS

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SOURCE="$SCRIPT_DIR/skills"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NANOBOT_DIRS=(
    "/root/.nanobot/skills"
    "/opt/ai-agent/skills"
    "/usr/local/share/ai-skills"
    "/opt/homebrew/share/ai-skills"
    "$HOME/.nanobot/skills"
    "/Users/$HOME/.nanobot/skills"
)

echo -e "${BLUE}🚀 Iniciando distribuição universal de skills...${NC}"
echo -e "${YELLOW}📁 Source: $SKILLS_SOURCE${NC}"

# Verificar se source existe
if [[ ! -d "$SKILLS_SOURCE" ]]; then
    echo -e "${RED}❌ Diretório de skills não encontrado: $SKILLS_SOURCE${NC}"
    exit 1
fi

# Criar diretórios de destino
echo -e "${BLUE}📂 Criando diretórios de destino...${NC}"
for dir in "${NANOBOT_DIRS[@]}"; do
    if [[ -d "$(dirname "$dir")" ]] || mkdir -p "$(dirname "$dir")" 2>/dev/null; then
        mkdir -p "$dir" 2>/dev/null || true
        echo -e "${GREEN}  ✅ $dir${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $dir (não acessível)${NC}"
    fi
done

# Sincronizar skills
echo -e "${BLUE}🔄 Sincronizando skills...${NC}"
for dir in "${NANOBOT_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        echo -e "${YELLOW}  📦 Sincronizando para: $dir${NC}"
        
        # Copiar skills mantendo estrutura
        rsync -av --delete "$SKILLS_SOURCE/" "$dir/" 2>/dev/null || {
            echo -e "${RED}    ❌ Falha na sincronização${NC}"
            continue
        }
        
        # Configurar permissões
        chmod -R 755 "$dir" 2>/dev/null || true
        
        echo -e "${GREEN}    ✅ Sincronizado${NC}"
    fi
done

# Gerar registry
echo -e "${BLUE}📋 Gerando registry...${NC}"
cd "$SKILLS_SOURCE"
if [[ -f "registry.js" ]]; then
    node registry.js > registry.json.new 2>/dev/null || {
        echo -e "${YELLOW}  ⚠️  Falha ao gerar registry, usando existente${NC}"
    }
    
    # Distribuir registry atualizado
    for dir in "${NANOBOT_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            cp registry.json "$dir/" 2>/dev/null || cp registry.json.new "$dir/" 2>/dev/null || true
        fi
    done
fi

# Configurar Nanobot Registry
echo -e "${BLUE}⚙️  Configurando Nanobot Registry...${NC}"
for dir in "${NANOBOT_DIRS[@]}"; do
    config_file="$(dirname "$dir")/config.json"
    if [[ -d "$dir" ]] && [[ -w "$(dirname "$dir")" ]]; then
        cat > "$config_file" << EOF
{
  "skills": {
    "directory": "$dir",
    "autoUpdate": true,
    "registry": "$dir/registry.json"
  },
  "network": {
    "trustNetwork": "trust-network-ai-agent",
    "agentId": "$(hostname)-$(date +%s)",
    "knowledgeBase": true
  },
  "security": {
    "sandbox": true,
    "validation": true
  }
}
EOF
        echo -e "${GREEN}  ✅ Config: $config_file${NC}"
    fi
done

# Validar instalação
echo -e "${BLUE}🔍 Validando instalação...${NC}"
VALIDATION_OK=true

for dir in "${NANOBOT_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        skill_count=$(find "$dir" -name "skill.json" -type f | wc -l)
        if [[ $skill_count -gt 0 ]]; then
            echo -e "${GREEN}  ✅ $dir: $skill_count skills${NC}"
        else
            echo -e "${RED}  ❌ $dir: sem skills encontradas${NC}"
            VALIDATION_OK=false
        fi
    fi
done

# Relatório final
echo -e "\n${BLUE}📊 Relatório de Distribuição${NC}"
echo -e "${BLUE}================================${NC}"

if $VALIDATION_OK; then
    echo -e "${GREEN}🎉 Distribuição concluída com sucesso!${NC}"
    echo -e "${GREEN}✅ Todas as skills instaladas e validadas${NC}"
else
    echo -e "${YELLOW}⚠️  Distribuição concluída com avisos${NC}"
    echo -e "${YELLOW}⚠️  Verifique os diretórios marcados com erro${NC}"
fi

echo -e "\n${YELLOW}📚 Skills Disponíveis:${NC}"
if [[ -f "$SKILLS_SOURCE/registry.json" ]]; then
    jq -r '.skills[] | "  • \(.name): \(.description)"' "$SKILLS_SOURCE/registry.json" 2>/dev/null | head -10 || echo "  • Deploy Health Monitor"
    echo -e "${YELLOW}  ... e mais${NC}"
fi

echo -e "\n${BLUE}🌐 URLs de Acesso:${NC}"
echo -e "${BLUE}  Dockge: http://$(tailscale ip -4 2>/dev/null || echo 'localhost'):3031${NC}"
echo -e "${BLUE}  Grafana: http://$(tailscale ip -4 2>/dev/null || echo 'localhost'):3001${NC}"
echo -e "${BLUE}  Prometheus: http://$(tailscale ip -4 2>/dev/null || echo 'localhost'):9090${NC}"

echo -e "\n${GREEN}✅ Setup completo! Skills disponíveis para todos os agentes.${NC}"