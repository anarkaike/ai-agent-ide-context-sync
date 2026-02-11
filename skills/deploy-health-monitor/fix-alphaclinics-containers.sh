#!/bin/bash

# Fix AlphaClinics Containers - Emergency Resolution
# Script para subir os containers do sistema AlphaClinics

set -e

echo "🚨 ALPHA CLINICS CONTAINERS FIX"
echo "=================================="
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
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    EXPECTED_IP="158.220.106.233"
    
    if [[ "$SERVER_IP" == "$EXPECTED_IP" ]]; then
        log_success "Servidor correto detectado: $SERVER_IP"
    else
        log_error "Servidor incorreto! Detectado: $SERVER_IP, Esperado: $EXPECTED_IP"
        exit 1
    fi
}

# Verificar status atual dos containers
check_current_status() {
    log_status "Verificando status atual dos containers..."
    
    echo "Containers existentes:"
    docker ps --filter "name=sistema-clinica" --format "table {{.Names}}\t{{.Status}}" || echo "Nenhum container sistema-clinica encontrado"
    
    echo ""
    echo "Containers AlphaClinics esperados:"
    echo "- sistema-clinica-db (PostgreSQL)"
    echo "- sistema-clinica-redis (Redis)"
    echo "- sistema-clinica-app (Laravel App)"
    echo ""
}

# Parar containers existentes se houver
stop_existing_containers() {
    log_status "Parando containers existentes..."
    
    # Tentar parar containers do projeto
    cd /root/projects/dev/sistema-clinica-new 2>/dev/null && docker compose down 2>/dev/null || true
    cd /root/projects/prod/sistema-clinica-new 2>/dev/null && docker compose down 2>/dev/null || true
    
    # Forçar parada de containers pelo nome
    docker stop sistema-clinica-db sistema-clinica-redis sistema-clinica-app 2>/dev/null || true
    docker rm sistema-clinica-db sistema-clinica-redis sistema-clinica-app 2>/dev/null || true
    
    log_success "Containers existentes removidos"
}

# Limpar imagens quebradas
cleanup_broken_images() {
    log_status "Limpando imagens quebradas..."
    
    # Remover imagens de build que falharam
    docker rmi sistema-clinica-new-app 2>/dev/null || true
    
    # Limpar cache do builder
    docker builder prune -f 2>/dev/null || true
    
    log_success "Limpeza concluída"
}

# Verificar arquivos de configuração
check_config_files() {
    log_status "Verificando arquivos de configuração..."
    
    DEV_COMPOSE="/root/projects/dev/sistema-clinica-new/docker-compose.yml"
    PROD_COMPOSE="/root/projects/prod/sistema-clinica-new/docker-compose.yml"
    
    if [[ -f "$DEV_COMPOSE" ]]; then
        log_success "Config DEV encontrada: $DEV_COMPOSE"
    else
        log_error "Config DEV não encontrada: $DEV_COMPOSE"
    fi
    
    if [[ -f "$PROD_COMPOSE" ]]; then
        log_success "Config PROD encontrada: $PROD_COMPOSE"
    else
        log_error "Config PROD não encontrada: $PROD_COMPOSE"
    fi
}

# Subir ambiente de desenvolvimento (mais rápido)
start_dev_environment() {
    log_status "Iniciando ambiente de desenvolvimento..."
    
    cd /root/projects/dev/sistema-clinica-new
    
    # Verificar se existe Dockerfile
    if [[ ! -f "Dockerfile" ]]; then
        log_error "Dockerfile não encontrado em /root/projects/dev/sistema-clinica-new"
        return 1
    fi
    
    # Subir apenas o banco primeiro (mais rápido)
    log_status "Subindo banco de dados..."
    docker compose up -d db
    
    # Esperar banco ficar pronto
    log_status "Aguardando banco de dados ficar pronto..."
    for i in {1..30}; do
        if docker exec sistema-clinica-db pg_isready -U clinica -d clinica >/dev/null 2>&1; then
            log_success "Banco de dados pronto!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # Subir aplicação
    log_status "Subindo aplicação..."
    docker compose up -d app
    
    # Verificar status
    sleep 10
    if docker ps | grep -q "sistema-clinica-app"; then
        log_success "Aplicação subiu com sucesso!"
    else
        log_error "Falha ao subir aplicação"
        docker compose logs app
        return 1
    fi
}

# Subir ambiente de produção
start_prod_environment() {
    log_status "Iniciando ambiente de produção..."
    
    cd /root/projects/prod/sistema-clinica-new
    
    # Subir apenas o banco primeiro
    log_status "Subindo banco de dados..."
    docker compose up -d db redis
    
    # Esperar banco ficar pronto
    log_status "Aguardando banco de dados ficar pronto..."
    for i in {1..30}; do
        if docker exec sistema-clinica-db pg_isready -U clinica -d clinica >/dev/null 2>&1; then
            log_success "Banco de dados pronto!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # Subir aplicação
    log_status "Subindo aplicação..."
    docker compose up -d app
    
    # Verificar status
    sleep 10
    if docker ps | grep -q "sistema-clinica-app"; then
        log_success "Aplicação de produção subiu com sucesso!"
    else
        log_error "Falha ao subir aplicação de produção"
        docker compose logs app
        return 1
    fi
}

# Testar conectividade dos containers
test_connectivity() {
    log_status "Testando conectividade dos containers..."
    
    # Testar banco
    if docker exec sistema-clinica-db pg_isready -U clinica -d clinica >/dev/null 2>&1; then
        log_success "Banco de dados acessível"
    else
        log_error "Banco de dados não acessível"
    fi
    
    # Testar aplicação
    if docker ps | grep -q "sistema-clinica-app.*Up"; then
        APP_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sistema-clinica-app)
        if [[ -n "$APP_IP" ]]; then
            log_success "Aplicação rodando no IP: $APP_IP"
        else
            log_warning "Aplicação rodando mas sem IP detectável"
        fi
    else
        log_error "Aplicação não está rodando"
    fi
}

# Configurar nginx para apontar para os containers
configure_nginx() {
    log_status "Verificando configuração do nginx..."
    
    # Verificar se nginx-wildcard-proxy está rodando
    if docker ps | grep -q "nginx-wildcard-proxy.*Up"; then
        log_success "nginx-wildcard-proxy está rodando"
        
        # Recarregar configuração do nginx
        docker exec nginx-wildcard-proxy nginx -s reload || log_warning "Falha ao recarregar nginx"
        
        # Testar resolução de nomes
        if docker exec nginx-wildcard-proxy getent hosts sistema-clinica-app >/dev/null 2>&1; then
            log_success "nginx consegue resolver sistema-clinica-app"
        else
            log_warning "nginx não consegue resolver sistema-clinica-app"
        fi
    else
        log_error "nginx-wildcard-proxy não está rodando"
    fi
}

# Testar acesso via HTTP
test_http_access() {
    log_status "Testando acesso HTTP..."
    
    # Aguardar um pouco para tudo estabilizar
    sleep 15
    
    # Testar ambientes
    ENVIRONMENTS=(
        "https://alphaclinics.servinder.com.br"
        "https://hmg.alphaclinics.servinder.com.br"
        "https://dev.alphaclinics.servinder.com.br"
    )
    
    for env in "${ENVIRONMENTS[@]}"; do
        log_status "Testando $env..."
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$env" --max-time 10 || echo "000")
        
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
    
    REPORT_FILE="/tmp/alphaclinics-containers-fix-$(date +%Y%m%d-%H%M%S).log"
    
    {
        echo "=== ALPHA CLINICS CONTAINERS FIX REPORT ==="
        echo "Timestamp: $(date)"
        echo "Server IP: $(hostname -I | awk '{print $1}')"
        echo ""
        echo "=== Container Status ==="
        docker ps --filter "name=sistema-clinica" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "=== Network Info ==="
        docker network ls | grep -E "(bridge|sistema)"
        echo ""
        echo "=== Recent Logs ==="
        docker logs sistema-clinica-app --tail 20 2>/dev/null || echo "App container not found"
        echo ""
        echo "=== Nginx Status ==="
        docker ps | grep nginx-wildcard-proxy || echo "Nginx proxy not found"
    } > "$REPORT_FILE"
    
    log_success "Relatório salvo em: $REPORT_FILE"
}

# Função principal
main() {
    echo "Iniciando fix dos containers AlphaClinics..."
    echo ""
    
    check_server
    echo ""
    
    check_current_status
    echo ""
    
    check_config_files
    echo ""
    
    read -p "Deseja parar containers existentes e limpar? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop_existing_containers
        cleanup_broken_images
        echo ""
    fi
    
    read -p "Qual ambiente subir? (1=DEV, 2=PROD, 3=AMBOS): " -n 1 -r
    echo
    case $REPLY in
        1)
            start_dev_environment
            ;;
        2)
            start_prod_environment
            ;;
        3)
            start_dev_environment
            echo ""
            start_prod_environment
            ;;
        *)
            log_warning "Opção inválida, pulando start dos containers"
            ;;
    esac
    
    echo ""
    test_connectivity
    echo ""
    configure_nginx
    echo ""
    test_http_access
    echo ""
    generate_report
    
    echo ""
    log_success "Fix dos containers concluído!"
    log_status "Verifique o relatório gerado para detalhes completos."
}

# Executar função principal
main "$@"
