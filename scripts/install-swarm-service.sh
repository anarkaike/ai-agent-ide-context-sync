#!/bin/bash

# =============================================================================
# AI Agent Swarm Service Installer
# =============================================================================
# Instala os serviços como daemon no macOS ou Linux

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"
}

success() {
    echo -e "${GREEN}✅ $*${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $*${NC}"
}

error() {
    echo -e "${RED}❌ $*${NC}"
}

# Detectar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

# Instalar no macOS
install_macos() {
    log "🍎 Instalando serviço para macOS..."
    
    # Criar diretórios
    mkdir -p "$HOME/Library/LaunchAgents"
    mkdir -p "$PROJECT_ROOT/.ai-workspace/logs"
    
    # Substituir $(whoami) no plist
    local user_home="$HOME"
    local username="$(whoami)"
    sed "s|\$(whoami)|$username|g" "$SCRIPT_DIR/com.aiagent.swarm-service.plist" > "$HOME/Library/LaunchAgents/com.aiagent.swarm-service.plist"
    
    # Tornar script executável
    chmod +x "$SCRIPT_DIR/swarm-service-manager.sh"
    
    # Carregar serviço
    launchctl load "$HOME/Library/LaunchAgents/com.aiagent.swarm-service.plist"
    
    # Iniciar serviço imediatamente
    launchctl start com.aiagent.swarm-service
    
    success "Serviço instalado e iniciado no macOS!"
    log "📁 Logs em: $PROJECT_ROOT/.ai-workspace/logs/"
    log "🔧 Gerenciar com: launchctl [start|stop|unload] com.aiagent.swarm-service"
}

# Instalar no Linux
install_linux() {
    log "🐧 Instalando serviço para Linux..."
    
    # Verificar se é root
    if [[ $EUID -ne 0 ]]; then
        error "Este script precisa ser executado como root no Linux"
        log "Tente: sudo $0"
        exit 1
    fi
    
    # Copiar service unit
    cp "$SCRIPT_DIR/aiagent-swarm.service" /etc/systemd/system/
    
    # Tornar script executável
    chmod +x "$SCRIPT_DIR/swarm-service-manager.sh"
    
    # Criar diretórios
    mkdir -p "$PROJECT_ROOT/.ai-workspace/logs"
    
    # Recarregar systemd
    systemctl daemon-reload
    
    # Habilitar e iniciar serviço
    systemctl enable aiagent-swarm.service
    systemctl start aiagent-swarm.service
    
    success "Serviço instalado e iniciado no Linux!"
    log "📁 Logs em: $PROJECT_ROOT/.ai-workspace/logs/"
    log "🔧 Gerenciar com: systemctl [start|stop|restart|status] aiagent-swarm"
}

# Verificar instalação
verify_installation() {
    log "🔍 Verificando instalação..."
    
    sleep 5
    
    # Executar verificação manual
    "$SCRIPT_DIR/swarm-service-manager.sh" status
    
    if [[ $? -eq 0 ]]; then
        success "Instalação verificada com sucesso!"
    else
        warning "Pode haver problemas. Verifique os logs."
    fi
}

# Desinstalar
uninstall() {
    log "🗑️ Desinstalando serviços..."
    
    local os=$(detect_os)
    
    case $os in
        "macos")
            launchctl stop com.aiagent.swarm-service 2>/dev/null || true
            launchctl unload "$HOME/Library/LaunchAgents/com.aiagent.swarm-service.plist" 2>/dev/null || true
            rm -f "$HOME/Library/LaunchAgents/com.aiagent.swarm-service.plist"
            success "Serviço desinstalado do macOS"
            ;;
        "linux")
            if [[ $EUID -ne 0 ]]; then
                error "Precisa ser root para desinstalar no Linux"
                exit 1
            fi
            systemctl stop aiagent-swarm.service 2>/dev/null || true
            systemctl disable aiagent-swarm.service 2>/dev/null || true
            rm -f /etc/systemd/system/aiagent-swarm.service
            systemctl daemon-reload
            success "Serviço desinstalado do Linux"
            ;;
        *)
            error "Sistema operacional não suportado"
            exit 1
            ;;
    esac
}

# Main
main() {
    local os=$(detect_os)
    
    log "🚀 AI Agent Swarm Service Installer"
    log "🖥️ Sistema detectado: $os"
    
    case "${1:-install}" in
        install)
            case $os in
                "macos")
                    install_macos
                    ;;
                "linux")
                    install_linux
                    ;;
                *)
                    error "Sistema operacional não suportado: $os"
                    exit 1
                    ;;
            esac
            verify_installation
            ;;
        uninstall)
            uninstall
            ;;
        *)
            echo "Uso: $0 [install|uninstall]"
            echo ""
            echo "Comandos:"
            echo "  install   - Instala o serviço como daemon"
            echo "  uninstall - Remove o serviço do sistema"
            exit 1
            ;;
    esac
}

main "$@"
