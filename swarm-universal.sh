#!/bin/bash

# =============================================================================
# AI Agent Swarm - Universal Cross-Platform Setup
# =============================================================================
# Detecta automaticamente o ambiente e executa o script apropriado

set -euo pipefail

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Função de log
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

info() {
    echo -e "${CYAN}ℹ️ $*${NC}"
}

# Detectar ambiente
detect_environment() {
    local os=""
    local shell=""
    local env=""
    
    # Detectar sistema operacional
    case "$OSTYPE" in
        "darwin"*)
            os="macos"
            ;;
        "linux-gnu"*)
            os="linux"
            # Verificar se é WSL
            if [[ -f /proc/version ]] && grep -qi "microsoft\|wsl" /proc/version; then
                env="wsl"
                os="wsl"
            fi
            ;;
        "msys"|"cygwin"*)
            os="windows"
            ;;
        *)
            # Verificar ambiente Windows
            if [[ "$OSTYPE" == "" ]] && command -v cmd.exe >/dev/null 2>&1; then
                os="windows"
            elif [[ "$OSTYPE" == "" ]] && command -v powershell.exe >/dev/null 2>&1; then
                os="windows"
            else
                os="unknown"
            fi
            ;;
    esac
    
    # Detectar shell
    if [[ -n "${ZSH_VERSION:-}" ]]; then
        shell="zsh"
    elif [[ -n "${BASH_VERSION:-}" ]]; then
        shell="bash"
    elif [[ -n "${FISH_VERSION:-}" ]]; then
        shell="fish"
    else
        shell="unknown"
    fi
    
    # Detectar se está no Git Bash (Windows)
    if [[ "$os" == "windows" ]] && command -v git >/dev/null 2>&1; then
        if git --version | grep -q "windows"; then
            env="gitbash"
        fi
    fi
    
    # Detectar PowerShell
    if command -v powershell.exe >/dev/null 2>&1; then
        if [[ -z "$env" ]]; then
            env="powershell"
        fi
    fi
    
    echo "$os|$shell|$env"
}

# Verificar dependências
check_dependencies() {
    local missing_deps=()
    
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("node")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "Dependências faltando: ${missing_deps[*]}"
        echo ""
        echo "Por favor, instale:"
        echo "📥 Node.js: https://nodejs.org/"
        return 1
    fi
    
    return 0
}

# Obter diretório do script
get_script_dir() {
    if [[ "${BASH_SOURCE[0]}" ]]; then
        cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
    else
        pwd
    fi
}

# Executar script apropriado
execute_platform_script() {
    local action=${1:-check}
    local script_dir=$(get_script_dir)
    
    case "$PLATFORM" in
        "macos")
            "$script_dir/swarm-service-manager.sh" "$action"
            ;;
        "linux")
            # Verificar se é root para serviços do sistema
            if [[ "$action" == "install" ]] || [[ "$action" == "uninstall" ]]; then
                if [[ $EUID -ne 0 ]]; then
                    error "Ação '$action' precisa de root no Linux"
                    info "Tente: sudo $0 $action"
                    return 1
                fi
            fi
            "$script_dir/swarm-service-manager.sh" "$action"
            ;;
        "wsl")
            "$script_dir/swarm-service-manager-wsl.sh" "$action"
            ;;
        "windows-powershell")
            if command -v powershell.exe >/dev/null 2>&1; then
                powershell.exe -ExecutionPolicy Bypass -File "$script_dir/swarm-service-manager.ps1" "$action"
            else
                error "PowerShell não encontrado"
                return 1
            fi
            ;;
        "windows-gitbash"|"windows-cmd")
            if command -v cmd.exe >/dev/null 2>&1; then
                cmd.exe /c "$script_dir\\swarm-service-manager.bat" "$action"
            else
                error "CMD não encontrado"
                return 1
            fi
            ;;
        *)
            error "Plataforma não suportada: $PLATFORM"
            return 1
            ;;
    esac
}

# Mostrar ajuda
show_help() {
    echo "AI Agent Swarm - Universal Cross-Platform Manager"
    echo "=================================================="
    echo ""
    echo "Ambiente detectado:"
    echo "  OS: $OS"
    echo "  Shell: $SHELL"
    echo "  Environment: $ENV"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start     - Inicia todos os serviços"
    echo "  stop      - Para todos os serviços"
    echo "  restart   - Reinicia todos os serviços"
    echo "  status    - Mostra status atual"
    echo "  check     - Verifica e corrige problemas (default)"
    echo "  install   - Instala como serviço do sistema"
    echo "  uninstall - Remove serviço do sistema"
    echo "  help      - Mostra esta ajuda"
    echo ""
    echo "Plataformas suportadas:"
    echo "  ✅ macOS (launchd)"
    echo "  ✅ Linux (systemd)"
    echo "  ✅ Windows (PowerShell + NSSM)"
    echo "  ✅ Windows (Batch/CMD)"
    echo "  ✅ WSL (Windows Subsystem for Linux)"
    echo "  ✅ Git Bash (Windows)"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Verifica status"
    echo "  $0 start              # Inicia serviços"
    echo "  $0 install            # Instala como serviço"
    echo ""
    echo "Logs disponíveis em: .ai-workspace/logs/"
}

# Instalação rápida
quick_install() {
    log "🚀 Iniciando instalação rápida..."
    
    # Verificar dependências
    if ! check_dependencies; then
        return 1
    fi
    
    # Instalar dependências npm
    log "📦 Instalando dependências npm..."
    npm install
    
    # Tornar scripts executáveis
    log "🔧 Configurando scripts..."
    local script_dir=$(get_script_dir)
    chmod +x "$script_dir"/*.sh 2>/dev/null || true
    
    # Instalar serviço se possível
    case "$PLATFORM" in
        "macos"|"linux"|"wsl")
            if [[ "$PLATFORM" == "linux" ]] && [[ $EUID -ne 0 ]]; then
                warning "No Linux, execute 'sudo $0 install' para instalar como serviço"
            else
                execute_platform_script "install"
            fi
            ;;
        "windows-powershell")
            warning "No Windows, execute como Administrador: $0 install"
            ;;
        *)
            info "Iniciando serviços manualmente..."
            execute_platform_script "start"
            ;;
    esac
    
    # Verificar instalação
    sleep 3
    execute_platform_script "status"
    
    success "Instalação concluída!"
    echo ""
    echo "📋 Comandos úteis:"
    echo "  $0 status     # Ver status"
    echo "  $0 restart    # Reiniciar serviços"
    echo "  $0 check      # Ver saúde"
    echo ""
    echo "📁 Logs: .ai-workspace/logs/"
    echo "🌐 WebMap: http://localhost:3456"
}

# Main
main() {
    # Detectar ambiente
    local detection=$(detect_environment)
    OS=$(echo "$detection" | cut -d'|' -f1)
    SHELL=$(echo "$detection" | cut -d'|' -f2)
    ENV=$(echo "$detection" | cut -d'|' -f3)
    
    # Construir identificador de plataforma
    case "$OS" in
        "macos")
            PLATFORM="macos"
            ;;
        "linux")
            PLATFORM="linux"
            ;;
        "wsl")
            PLATFORM="wsl"
            ;;
        "windows")
            case "$ENV" in
                "powershell")
                    PLATFORM="windows-powershell"
                    ;;
                "gitbash")
                    PLATFORM="windows-gitbash"
                    ;;
                *)
                    PLATFORM="windows-cmd"
                    ;;
            esac
            ;;
        *)
            error "Sistema operacional não detectado: $OS"
            exit 1
            ;;
    esac
    
    # Banner
    log "🚀 AI Agent Swarm - Universal Manager"
    info "Plataforma: $PLATFORM"
    
    # Processar argumentos
    case "${1:-check}" in
        "install"|"start"|"stop"|"restart"|"status"|"check"|"uninstall")
            # Verificar dependências
            if ! check_dependencies; then
                exit 1
            fi
            
            # Executar script apropriado
            execute_platform_script "$1"
            ;;
        "quick"|"setup")
            quick_install
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "Comando desconhecido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar main
main "$@"
