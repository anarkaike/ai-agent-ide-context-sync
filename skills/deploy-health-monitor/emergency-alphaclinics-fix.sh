#!/bin/bash

# Emergency Fix Script - AlphaClinics System
# Script para diagnóstico e recuperação emergencial dos ambientes

set -e

echo "🚨 EMERGENCY FIX - ALPHA CLINICS SYSTEM"
echo "========================================"
echo "Timestamp: $(date)"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no servidor correto
check_server() {
    log_status "Verificando servidor..."
    
    # Verificar IP do servidor
    SERVER_IP=$(hostname -I | awk '{print $1}')
    EXPECTED_IP="158.220.106.233"
    
    if [[ "$SERVER_IP" == "$EXPECTED_IP" ]]; then
        log_success "Servidor correto detectado: $SERVER_IP"
    else
        log_error "Servidor incorreto! Detectado: $SERVER_IP, Esperado: $EXPECTED_IP"
        log_error "Execute este script no servidor de produção (158.220.106.233)"
        exit 1
    fi
}

# Verificar status dos serviços principais
check_services() {
    log_status "Verificando status dos serviços..."
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx está ATIVO"
        NGINX_STATUS="✅"
    else
        log_error "Nginx está INATIVO"
        NGINX_STATUS="❌"
    fi
    
    # PHP-FPM (se existir)
    if command -v php-fpm &> /dev/null; then
        if systemctl is-active --quiet php-fpm; then
            log_success "PHP-FPM está ATIVO"
            PHP_STATUS="✅"
        else
            log_error "PHP-FPM está INATIVO"
            PHP_STATUS="❌"
        fi
    else
        log_warning "PHP-FPM não encontrado"
        PHP_STATUS="⚠️"
    fi
    
    # Docker (se existir)
    if command -v docker &> /dev/null; then
        if systemctl is-active --quiet docker; then
            log_success "Docker está ATIVO"
            DOCKER_STATUS="✅"
        else
            log_error "Docker está INATIVO"
            DOCKER_STATUS="❌"
        fi
    else
        log_warning "Docker não encontrado"
        DOCKER_STATUS="⚠️"
    fi
}

# Verificar portas da aplicação
check_ports() {
    log_status "Verificando portas da aplicação..."
    
    # Portas comuns para aplicações web
    PORTS=(80 443 3000 8000 8080 9000 5000)
    
    for port in "${PORTS[@]}"; do
        if netstat -tlnp | grep -q ":$port "; then
            SERVICE=$(netstat -tlnp | grep ":$port " | head -1 | awk '{print $7}' | cut -d'/' -f2)
            log_success "Porta $port está em uso por: $SERVICE"
        else
            log_warning "Porta $port está LIVRE"
        fi
    done
}

# Verificar processos da aplicação
check_application_processes() {
    log_status "Verificando processos da aplicação..."
    
    # Procurar por processos comuns de aplicações
    PROCESSES=$(ps aux | grep -E "(node|npm|php|python|java|rails|puma|unicorn)" | grep -v grep | wc -l)
    
    if [ "$PROCESSES" -gt 0 ]; then
        log_success "Encontrados $PROCESSES processos de aplicação:"
        ps aux | grep -E "(node|npm|php|python|java|rails|puma|unicorn)" | grep -v grep | while read line; do
            echo "  - $line"
        done
    else
        log_error "NENHUM processo de aplicação encontrado!"
    fi
}

# Verificar containers Docker (se existirem)
check_docker_containers() {
    if command -v docker &> /dev/null && systemctl is-active --quiet docker; then
        log_status "Verificando containers Docker..."
        
        CONTAINERS=$(docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -v NAMES)
        
        if [ -n "$CONTAINERS" ]; then
            echo "$CONTAINERS"
            
            # Verificar containers relacionados à aplicação
            APP_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "(alpha|clinic|app|web|rails|node|php)" || true)
            
            if [ -n "$APP_CONTAINERS" ]; then
                log_status "Containers da aplicação encontrados:"
                for container in $APP_CONTAINERS; do
                    STATUS=$(docker inspect --format='{{.State.Status}}' $container)
                    log_status "  - $container: $STATUS"
                    
                    if [ "$STATUS" != "running" ]; then
                        log_warning "Container $container não está rodando. Tentando iniciar..."
                        docker start $container || log_error "Falha ao iniciar container $container"
                    fi
                done
            else
                log_warning "Nenhum container da aplicação encontrado"
            fi
        else
            log_warning "Nenhum container Docker encontrado"
        fi
    fi
}

# Analisar logs do Nginx
analyze_nginx_logs() {
    log_status "Analisando logs do Nginx..."
    
    if [ -f "/var/log/nginx/error.log" ]; then
        log_status "Últimas 10 linhas do error log:"
        tail -10 /var/log/nginx/error.log | while read line; do
            echo "  $line"
        done
        
        # Procurar por erros específicos
        if tail -50 /var/log/nginx/error.log | grep -q "connection refused"; then
            log_error "Detectado 'connection refused' - Application server não respondendo"
        fi
        
        if tail -50 /var/log/nginx/error.log | grep -q "upstream"; then
            log_error "Detectado erro de upstream - Problema na configuração do proxy"
        fi
    else
        log_warning "Log de erro do Nginx não encontrado em /var/log/nginx/error.log"
    fi
}

# Verificar configuração do Nginx
check_nginx_config() {
    log_status "Verificando configuração do Nginx..."
    
    if nginx -t; then
        log_success "Configuração do Nginx está OK"
    else
        log_error "Configuração do Nginx tem ERROS"
        return 1
    fi
    
    # Procurar por configurações de upstream
    log_status "Procurando configurações de upstream..."
    
    if [ -d "/etc/nginx/sites-available" ]; then
        grep -r "upstream" /etc/nginx/sites-available/ 2>/dev/null | while read line; do
            echo "  $line"
        done
    fi
    
    if [ -d "/etc/nginx/conf.d" ]; then
        grep -r "upstream" /etc/nginx/conf.d/ 2>/dev/null | while read line; do
            echo "  $line"
        done
    fi
}

# Tentar restart dos serviços
restart_services() {
    log_status "Tentando restart dos serviços..."
    
    # Restart PHP-FPM se existir
    if command -v php-fpm &> /dev/null; then
        log_status "Restart PHP-FPM..."
        systemctl restart php-fpm || log_error "Falha ao restart PHP-FPM"
    fi
    
    # Restart containers Docker se existirem
    if command -v docker &> /dev/null && systemctl is-active --quiet docker; then
        APP_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "(alpha|clinic|app|web)" || true)
        
        if [ -n "$APP_CONTAINERS" ]; then
            log_status "Restart containers da aplicação..."
            for container in $APP_CONTAINERS; do
                log_status "Restart $container..."
                docker restart $container || log_error "Falha ao restart $container"
            done
        fi
    fi
    
    # Reload Nginx (não restart para não derrubar conexões)
    log_status "Reload Nginx..."
    nginx -s reload || log_error "Falha ao reload Nginx"
    
    sleep 5
}

# Testar se os ambientes voltaram
test_environments() {
    log_status "Testando se os ambientes voltaram..."
    
    ENVIRONMENTS=(
        "https://alphaclinics.servinder.com.br"
        "https://hmg.alphaclinics.servinder.com.br"
        "https://dev.alphaclinics.servinder.com.br"
    )
    
    for env in "${ENVIRONMENTS[@]}"; do
        log_status "Testando $env..."
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$env" || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_success "$env: ✅ HTTP 200 - FUNCIONANDO!"
        elif [ "$HTTP_CODE" = "502" ]; then
            log_error "$env: ❌ HTTP 502 - Ainda com problema"
        elif [ "$HTTP_CODE" = "000" ]; then
            log_error "$env: ❌ Sem conexão"
        else
            log_warning "$env: ⚠️ HTTP $HTTP_CODE"
        fi
    done
}

# Gerar relatório final
generate_report() {
    log_status "Gerando relatório final..."
    
    REPORT_FILE="/tmp/alphaclinics-emergency-fix-$(date +%Y%m%d-%H%M%S).log"
    
    {
        echo "=== ALPHA CLINICS EMERGENCY FIX REPORT ==="
        echo "Timestamp: $(date)"
        echo "Server IP: $(hostname -I | awk '{print $1}')"
        echo ""
        echo "=== Service Status ==="
        echo "Nginx: $NGINX_STATUS"
        echo "PHP-FPM: $PHP_STATUS"
        echo "Docker: $DOCKER_STATUS"
        echo ""
        echo "=== Application Processes ==="
        ps aux | grep -E "(node|npm|php|python|java|rails|puma|unicorn)" | grep -v grep || echo "None found"
        echo ""
        echo "=== Docker Containers ==="
        docker ps -a 2>/dev/null || echo "Docker not available"
        echo ""
        echo "=== Recent Nginx Errors ==="
        tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Log not found"
    } > "$REPORT_FILE"
    
    log_success "Relatório salvo em: $REPORT_FILE"
}

# Função principal
main() {
    echo "Iniciando diagnóstico e recuperação emergencial..."
    echo ""
    
    check_server
    echo ""
    
    check_services
    echo ""
    
    check_ports
    echo ""
    
    check_application_processes
    echo ""
    
    check_docker_containers
    echo ""
    
    analyze_nginx_logs
    echo ""
    
    check_nginx_config
    echo ""
    
    read -p "Deseja tentar restart dos serviços? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_services
        echo ""
        test_environments
    else
        echo "Pulando restart dos serviços."
    fi
    
    echo ""
    generate_report
    
    echo ""
    log_success "Diagnóstico concluído!"
    log_status "Verifique o relatório gerado para detalhes completos."
}

# Executar função principal
main "$@"
