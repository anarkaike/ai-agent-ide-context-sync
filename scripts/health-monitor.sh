#!/bin/bash

# =============================================================================
# AI Agent Swarm Health Monitor
# =============================================================================
# Monitor avançado com alertas e recuperação automática

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/.ai-workspace/logs"
HEALTH_FILE="$LOG_DIR/health-status.json"

# Configuração
WEBMAP_PORT=3456
MOTHERSHIP_IP="100.104.189.106"
DISCORD_WEBHOOK=${DISCORD_WEBHOOK:-""}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_DIR/health-monitor.log"
}

alert() {
    local message="🚨 AI Agent Swarm Alert: $*"
    log "$message"
    
    # Enviar para Discord se configurado
    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        curl -H "Content-Type: application/json" \
             -X POST \
             -d "{\"content\":\"$message\"}" \
             "$DISCORD_WEBHOOK" 2>/dev/null || true
    fi
    
    # Enviar para Slack se configurado
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -H "Content-Type: application/json" \
             -X POST \
             -d "{\"text\":\"$message\"}" \
             "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# Verificar saúde do WebMap
check_webmap_health() {
    local status="unhealthy"
    local details=""
    
    # Verificar se processo está rodando
    if ! pgrep -f "WebMap.js" >/dev/null; then
        details="Processo não encontrado"
    else
        # Verificar se está respondendo
        if curl -s --max-time 5 "http://localhost:$WEBMAP_PORT/api/comms/messages" >/dev/null 2>&1; then
            status="healthy"
            details="Respondendo na porta $WEBMAP_PORT"
        else
            details="Não está respondendo na porta $WEBMAP_PORT"
        fi
    fi
    
    echo "$status|$details"
}

# Verificar saúde do SwarmClient
check_swarmclient_health() {
    local status="unhealthy"
    local details=""
    
    # Verificar se processo está rodando
    if ! pgrep -f "SwarmClient.js" >/dev/null; then
        details="Processo não encontrado"
    else
        # Verificar logs recentes para erros
        local error_count=$(tail -100 "$LOG_DIR/swarmclient.log" 2>/dev/null | grep -c "ERROR\|❌" || echo "0")
        if [[ $error_count -gt 5 ]]; then
            status="unhealthy"
            details="Muitos erros nos logs ($error_count)"
        else
            status="healthy"
            details="Processo rodando normalmente"
        fi
    fi
    
    echo "$status|$details"
}

# Verificar conectividade com Mothership
check_mothership_connectivity() {
    local status="unhealthy"
    local details=""
    
    if curl -s --max-time 5 "http://$MOTHERSHIP_IP:$WEBMAP_PORT/api/comms/messages" >/dev/null 2>&1; then
        status="healthy"
        details="Conectado ao Mothership"
    else
        details="Não foi possível conectar ao Mothership"
    fi
    
    echo "$status|$details"
}

# Verificar uso de recursos
check_resource_usage() {
    local cpu_usage=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' 2>/dev/null || echo "0")
    local mem_usage=$(ps aux | grep -E "(WebMap|SwarmClient)" | awk '{sum+=$4} END {print sum}' 2>/dev/null || echo "0")
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo "warning|CPU alta: ${cpu_usage}%"
    elif (( $(echo "$mem_usage > 50" | bc -l) )); then
        echo "warning|Memória alta: ${mem_usage}%"
    else
        echo "healthy|CPU: ${cpu_usage}%, Mem: ${mem_usage}%"
    fi
}

# Salvar status de saúde
save_health_status() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local webmap_status=$1
    local swarmclient_status=$2
    local mothership_status=$3
    local resource_status=$4
    
    cat > "$HEALTH_FILE" << EOF
{
  "timestamp": "$timestamp",
  "webmap": {
    "status": "$(echo "$webmap_status" | cut -d'|' -f1)",
    "details": "$(echo "$webmap_status" | cut -d'|' -f2)"
  },
  "swarmclient": {
    "status": "$(echo "$swarmclient_status" | cut -d'|' -f1)",
    "details": "$(echo "$swarmclient_status" | cut -d'|' -f2)"
  },
  "mothership": {
    "status": "$(echo "$mothership_status" | cut -d'|' -f1)",
    "details": "$(echo "$mothership_status" | cut -d'|' -f2)"
  },
  "resources": {
    "status": "$(echo "$resource_status" | cut -d'|' -f1)",
    "details": "$(echo "$resource_status" | cut -d'|' -f2)"
  }
}
EOF
}

# Executar verificação completa
run_health_check() {
    log "🔍 Executando verificação completa de saúde..."
    
    local webmap_status=$(check_webmap_health)
    local swarmclient_status=$(check_swarmclient_health)
    local mothership_status=$(check_mothership_connectivity)
    local resource_status=$(check_resource_usage)
    
    save_health_status "$webmap_status" "$swarmclient_status" "$mothership_status" "$resource_status"
    
    # Exibir status
    echo ""
    echo "📊 Health Status Report - $(date)"
    echo "=================================="
    
    # WebMap
    if [[ "$webmap_status" == healthy* ]]; then
        echo -e "🟢 WebMap: $(echo "$webmap_status" | cut -d'|' -f2)"
    else
        echo -e "🔴 WebMap: $(echo "$webmap_status" | cut -d'|' -f2)"
    fi
    
    # SwarmClient
    if [[ "$swarmclient_status" == healthy* ]]; then
        echo -e "🟢 SwarmClient: $(echo "$swarmclient_status" | cut -d'|' -f2)"
    else
        echo -e "🔴 SwarmClient: $(echo "$swarmclient_status" | cut -d'|' -f2)"
    fi
    
    # Mothership
    if [[ "$mothership_status" == healthy* ]]; then
        echo -e "🟢 Mothership: $(echo "$mothership_status" | cut -d'|' -f2)"
    else
        echo -e "🔴 Mothership: $(echo "$mothership_status" | cut -d'|' -f2)"
    fi
    
    # Resources
    if [[ "$resource_status" == healthy* ]]; then
        echo -e "🟢 Resources: $(echo "$resource_status" | cut -d'|' -f2)"
    else
        echo -e "🟡 Resources: $(echo "$resource_status" | cut -d'|' -f2)"
    fi
    
    echo ""
    
    # Verificar se precisa de intervenção
    local needs_intervention=false
    
    if [[ "$webmap_status" != healthy* ]]; then
        alert "WebMap está com problemas: $(echo "$webmap_status" | cut -d'|' -f2)"
        needs_intervention=true
    fi
    
    if [[ "$swarmclient_status" != healthy* ]]; then
        alert "SwarmClient está com problemas: $(echo "$swarmclient_status" | cut -d'|' -f2)"
        needs_intervention=true
    fi
    
    if [[ "$mothership_status" != healthy* ]]; then
        alert "Conexão com Mothership perdida: $(echo "$mothership_status" | cut -d'|' -f2)"
    fi
    
    if [[ "$resource_status" == warning* ]]; then
        alert "Uso de recursos elevado: $(echo "$resource_status" | cut -d'|' -f2)"
    fi
    
    # Auto-recuperação se necessário
    if $needs_intervention; then
        log "🔄 Executando auto-recuperação..."
        "$SCRIPT_DIR/swarm-service-manager.sh" restart
    fi
}

# Main
case "${1:-check}" in
    check)
        run_health_check
        ;;
    watch)
        log "👀 Iniciando monitoramento contínuo (verifica a cada 60 segundos)..."
        while true; do
            run_health_check
            sleep 60
        done
        ;;
    report)
        if [[ -f "$HEALTH_FILE" ]]; then
            cat "$HEALTH_FILE" | python3 -m json.tool 2>/dev/null || cat "$HEALTH_FILE"
        else
            echo "Nenhum relatório de saúde encontrado. Execute 'check' primeiro."
        fi
        ;;
    *)
        echo "Uso: $0 [check|watch|report]"
        echo ""
        echo "Comandos:"
        echo "  check  - Executa verificação única"
        echo "  watch  - Monitoramento contínuo"
        echo "  report - Mostra último relatório"
        exit 1
        ;;
esac
