#!/bin/bash

# =============================================================================
# AI Agent Swarm Service Manager - WSL Optimized
# =============================================================================
# Versão otimizada para Windows Subsystem for Linux

set -euo pipefail

# Detectar se está no WSL
if [[ -f /proc/version ]] && grep -qi "microsoft\|wsl" /proc/version; then
    IS_WSL=true
    echo "🪟 Detectado WSL - Habilitando integração Windows"
else
    IS_WSL=false
fi

# Configuração
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/.ai-workspace/logs"
PID_DIR="$PROJECT_ROOT/.ai-workspace/pids"

# Portas e IPs
WEBMAP_PORT=3456
MOTHERSHIP_IP=${MOTHERSHIP_IP:-"100.104.189.106"}

# No WSL, tentar usar IP do Windows host
if [[ "$IS_WSL" == "true" ]]; then
    # Tentar detectar IP do Windows host
    WINDOWS_IP=$(ip route | grep default | awk '{print $3}' | head -1)
    if [[ -n "$WINDOWS_IP" ]]; then
        echo "🌐 IP do Windows host detectado: $WINDOWS_IP"
        # Usar Windows IP como Mothership se não estiver definido
        if [[ "$MOTHERSHIP_IP" == "100.104.189.106" ]]; then
            MOTHERSHIP_IP="$WINDOWS_IP"
            echo "🔄 Usando Windows IP como Mothership: $MOTHERSHIP_IP"
        fi
    fi
fi

AGENT_ID=${AGENT_ID:-"WSL_$(hostname)_$(date +%s)"}

# Criar diretórios necessários
mkdir -p "$LOG_DIR" "$PID_DIR"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/swarm-service-wsl.log"
}

# Verificar se processo está rodando
is_running() {
    local service_name=$1
    local pid_file="$PID_DIR/${service_name}.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Iniciar WebMap com tratamento especial para WSL
start_webmap() {
    if is_running "webmap"; then
        log "✅ WebMap já está rodando (PID: $(cat "$PID_DIR/webmap.pid"))"
        return 0
    fi
    
    log "🚀 Iniciando WebMap na porta $WEBMAP_PORT..."
    cd "$PROJECT_ROOT"
    
    # No WSL, verificar se há conflito com Windows
    if [[ "$IS_WSL" == "true" ]]; then
        if netstat -tuln 2>/dev/null | grep -q ":$WEBMAP_PORT "; then
            log "⚠️ Porta $WEBMAP_PORT já está em uso (possivelmente no Windows)"
            log "💡 Dica: Verifique se não há WebMap rodando no Windows host"
        fi
    fi
    
    # Verificar se porta está em uso no WSL
    if ss -tuln 2>/dev/null | grep -q ":$WEBMAP_PORT "; then
        log "⚠️ Porta $WEBMAP_PORT já está em uso no WSL, tentando liberar..."
        pkill -f "WebMap.js" || true
        sleep 2
    fi
    
    # Iniciar WebMap
    nohup node packages/cli/core/swarm/WebMap.js > "$LOG_DIR/webmap-wsl.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/webmap.pid"
    
    # Verificar se iniciou corretamente
    sleep 3
    if is_running "webmap"; then
        log "✅ WebMap iniciado com sucesso (PID: $pid)"
        
        # No WSL, tentar acessar via Windows host
        if [[ "$IS_WSL" == "true" ]]; then
            sleep 2
            if curl -s "http://localhost:$WEBMAP_PORT/api/comms/messages" >/dev/null 2>&1; then
                log "✅ WebMap respondendo no WSL"
            else
                log "⚠️ WebMap não está respondendo - pode ser necessário acessar via Windows"
            fi
        fi
        return 0
    else
        log "❌ Falha ao iniciar WebMap"
        return 1
    fi
}

# Iniciar SwarmClient com tratamento especial para WSL
start_swarmclient() {
    if is_running "swarmclient"; then
        log "✅ SwarmClient já está rodando (PID: $(cat "$PID_DIR/swarmclient.pid"))"
        return 0
    fi
    
    log "🚀 Iniciando SwarmClient..."
    cd "$PROJECT_ROOT"
    
    # Configurar variáveis de ambiente
    export MOTHERSHIP_IP="$MOTHERSHIP_IP"
    export AGENT_ID="$AGENT_ID"
    export AGENT_ROLE="WSL_WORKER"
    
    # Iniciar SwarmClient
    nohup node packages/cli/core/swarm/SwarmClient.js > "$LOG_DIR/swarmclient-wsl.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/swarmclient.pid"
    
    # Verificar se iniciou corretamente
    sleep 3
    if is_running "swarmclient"; then
        log "✅ SwarmClient iniciado com sucesso (PID: $pid)"
        return 0
    else
        log "❌ Falha ao iniciar SwarmClient"
        return 1
    fi
}

# Parar serviços
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/${service_name}.pid"
    
    if is_running "$service_name"; then
        local pid=$(cat "$pid_file")
        log "🛑 Parando $service_name (PID: $pid)..."
        kill "$pid"
        
        # Esperar até 10 segundos para terminar gracefully
        for i in {1..10}; do
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Forçar kill se ainda estiver rodando
        if kill -0 "$pid" 2>/dev/null; then
            log "⚡ Forçando kill do $service_name"
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$pid_file"
        log "✅ $service_name parado"
    else
        log "ℹ️ $service_name não está rodando"
    fi
}

# Status dos serviços
show_status() {
    log "📊 Status dos Serviços Swarm (WSL):"
    echo ""
    
    if is_running "webmap"; then
        echo "🟢 WebMap: RODANDO (PID: $(cat "$PID_DIR/webmap.pid"))"
    else
        echo "🔴 WebMap: PARADO"
    fi
    
    if is_running "swarmclient"; then
        echo "🟢 SwarmClient: RODANDO (PID: $(cat "$PID_DIR/swarmclient.pid"))"
    else
        echo "🔴 SwarmClient: PARADO"
    fi
    
    echo ""
    echo "📡 Endpoint WebMap: http://localhost:$WEBMAP_PORT"
    echo "🌐 Mothership IP: $MOTHERSHIP_IP"
    echo "🤖 Agent ID: $AGENT_ID"
    
    if [[ "$IS_WSL" == "true" ]]; then
        echo "🪟 Ambiente: WSL detectado"
        echo "💡 Dica: Para acessar do Windows, use: http://localhost:$WEBMAP_PORT"
    fi
}

# Verificação e auto-correção com tratamento WSL
check_and_fix() {
    log "🔍 Executando verificação e auto-correção (WSL)..."
    
    local needs_restart=false
    
    # Verificar WebMap
    if ! is_running "webmap"; then
        log "⚠️ WebMap detectado como parado, tentando reiniciar..."
        start_webmap || needs_restart=true
    fi
    
    # Verificar SwarmClient
    if ! is_running "swarmclient"; then
        log "⚠️ SwarmClient detectado como parado, tentando reiniciar..."
        start_swarmclient || needs_restart=true
    fi
    
    # Verificar se WebMap está respondendo
    if is_running "webmap"; then
        if ! curl -s "http://localhost:$WEBMAP_PORT/api/comms/messages" >/dev/null 2>&1; then
            log "⚠️ WebMap não está respondendo, reiniciando..."
            stop_service "webmap"
            sleep 2
            start_webmap || needs_restart=true
        fi
    fi
    
    if $needs_restart; then
        log "🔄 Serviços reiniciados durante verificação"
        return 1
    else
        log "✅ Todos os serviços funcionando normalmente"
        return 0
    fi
}

# Testar conectividade WSL-Windows
test_wsl_connectivity() {
    if [[ "$IS_WSL" == "true" ]]; then
        log "🌐 Testando conectividade WSL-Windows..."
        
        # Testar acesso ao Windows host
        if [[ -n "${WINDOWS_IP:-}" ]]; then
            if ping -c 1 "$WINDOWS_IP" >/dev/null 2>&1; then
                log "✅ Conectividade com Windows host: OK"
            else
                log "⚠️ Sem conectividade com Windows host"
            fi
        fi
        
        # Testar se portas estão acessíveis
        log "📡 Verificando portas..."
        if ss -tuln 2>/dev/null | grep -q ":$WEBMAP_PORT "; then
            log "✅ Porta $WEBMAP_PORT está aberta no WSL"
        else
            log "⚠️ Porta $WEBMAP_PORT não está aberta"
        fi
    fi
}

# Main
case "${1:-check}" in
    start)
        log "🚀 Iniciando todos os serviços (WSL)..."
        start_webmap
        start_swarmclient
        show_status
        ;;
    stop)
        log "🛑 Parando todos os serviços..."
        stop_service "swarmclient"
        stop_service "webmap"
        ;;
    restart)
        log "🔄 Reiniciando todos os serviços..."
        stop_service "swarmclient"
        stop_service "webmap"
        sleep 2
        start_webmap
        start_swarmclient
        show_status
        ;;
    status)
        show_status
        ;;
    check)
        check_and_fix
        ;;
    test)
        test_wsl_connectivity
        ;;
    *)
        echo "Uso: $0 [start|stop|restart|status|check|test]"
        echo ""
        echo "Comandos:"
        echo "  start   - Inicia todos os serviços"
        echo "  stop    - Para todos os serviços"
        echo "  restart - Reinicia todos os serviços"
        echo "  status  - Mostra status atual"
        echo "  check   - Verifica e corrige problemas (default)"
        echo "  test    - Testa conectividade WSL-Windows"
        exit 1
        ;;
esac
