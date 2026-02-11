#!/bin/bash

# Build AlphaClinics Fixed - Script para construir imagens corrigidas
# Resolve problemas de DNS e dependências do Alpine Linux

set -e

echo "🔧 ALPHA CLINICS BUILD FIXED"
echo "============================"
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

# Parar containers existentes
stop_existing_containers() {
    log_status "Parando containers existentes..."
    
    cd /root/projects/dev/sistema-clinica-new && docker compose down 2>/dev/null || true
    cd /root/projects/prod/sistema-clinica-new && docker compose down 2>/dev/null || true
    
    # Forçar parada pelo nome
    docker stop sistema-clinica-db sistema-clinica-redis sistema-clinica-app 2>/dev/null || true
    docker rm sistema-clinica-db sistema-clinica-redis sistema-clinica-app 2>/dev/null || true
    
    log_success "Containers parados"
}

# Limpar imagens quebradas
cleanup_images() {
    log_status "Limpando imagens quebradas..."
    
    docker rmi sistema-clinica-new-app 2>/dev/null || true
    docker rmi sistema-clinica-new-app 2>/dev/null || true
    docker builder prune -f 2>/dev/null || true
    
    log_success "Limpeza concluída"
}

# Corrigir Dockerfile
fix_dockerfile() {
    log_status "Corrigindo Dockerfiles..."
    
    # Backup original
    cd /root/projects/dev/sistema-clinica-new
    [[ -f Dockerfile ]] && cp Dockerfile Dockerfile.backup
    
    cd /root/projects/prod/sistema-clinica-new
    [[ -f Dockerfile ]] && cp Dockerfile Dockerfile.backup
    
    # Copiar Dockerfile corrigido
    cp /root/projects/dev/ai-agent-ide-context-sync/skills/deploy-health-monitor/Dockerfile.fixed \
       /root/projects/dev/sistema-clinica-new/Dockerfile
    
    cp /root/projects/dev/ai-agent-ide-context-sync/skills/deploy-health-monitor/Dockerfile.fixed \
       /root/projects/prod/sistema-clinica-new/Dockerfile
    
    log_success "Dockerfiles corrigidos"
}

# Gerar package-lock.json se não existir
fix_package_lock() {
    log_status "Verificando package-lock.json..."
    
    cd /root/projects/dev/sistema-clinica-new
    if [[ ! -f package-lock.json ]]; then
        log_status "Gerando package-lock.json para DEV..."
        npm install --package-lock-only --silent
    fi
    
    cd /root/projects/prod/sistema-clinica-new
    if [[ ! -f package-lock.json ]]; then
        log_status "Gerando package-lock.json para PROD..."
        npm install --package-lock-only --silent
    fi
    
    log_success "package-lock.json verificado"
}

# Build ambiente DEV
build_dev() {
    log_status "Build ambiente DEV..."
    
    cd /root/projects/dev/sistema-clinica-new
    
    # Build apenas da imagem
    log_status "Construindo imagem DEV..."
    docker build -t sistema-clinica-new-app:dev .
    
    if [[ $? -eq 0 ]]; then
        log_success "Imagem DEV construída com sucesso"
    else
        log_error "Falha ao construir imagem DEV"
        return 1
    fi
}

# Build ambiente PROD
build_prod() {
    log_status "Build ambiente PROD..."
    
    cd /root/projects/prod/sistema-clinica-new
    
    # Build apenas da imagem
    log_status "Construindo imagem PROD..."
    docker build -t sistema-clinica-new-app:prod .
    
    if [[ $? -eq 0 ]]; then
        log_success "Imagem PROD construída com sucesso"
    else
        log_error "Falha ao construir imagem PROD"
        return 1
    fi
}

# Subir containers
start_containers() {
    log_status "Subindo containers..."
    
    # Subir DEV
    cd /root/projects/dev/sistema-clinica-new
    log_status "Subindo ambiente DEV..."
    docker compose up -d
    
    # Subir PROD
    cd /root/projects/prod/sistema-clinica-new
    log_status "Subindo ambiente PROD..."
    docker compose up -d
    
    log_success "Containers iniciados"
}

# Verificar status
verify_status() {
    log_status "Verificando status dos containers..."
    
    sleep 30  # Aguardar inicialização
    
    echo "=== STATUS DOS CONTAINERS ==="
    docker ps --filter "name=sistema-clinica" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "=== TESTE DE CONECTIVIDADE ==="
    
    # Testar banco
    if docker exec sistema-clinica-db pg_isready -U clinica -d clinica >/dev/null 2>&1; then
        log_success "Banco de dados acessível"
    else
        log_error "Banco de dados não acessível"
    fi
    
    # Testar aplicação
    if docker ps | grep -q "sistema-clinica-app.*Up"; then
        log_success "Aplicação rodando"
    else
        log_error "Aplicação não está rodando"
        docker logs sistema-clinica-app --tail 20
    fi
}

# Testar HTTP
test_http() {
    log_status "Testando acesso HTTP..."
    
    # Aguardar nginx reconhecer containers
    sleep 60
    
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

# Configurar monitoramento
setup_monitoring() {
    log_status "Configurando monitoramento contínuo..."
    
    # Criar script de monitoramento
    cat > /root/monitor-alphaclinics.sh << 'EOF'
#!/bin/bash
# Script de monitoramento AlphaClinics

ENVIRONMENTS=(
    "https://alphaclinics.servinder.com.br"
    "https://hmg.alphaclinics.servinder.com.br"
    "https://dev.alphaclinics.servinder.com.br"
)

for env in "${ENVIRONMENTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$env" --max-time 10 || echo "000")
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo "$(date): $env - HTTP $HTTP_CODE - PROBLEMA DETECTADO"
        
        # Tentar restart automático
        cd /root/projects/dev/sistema-clinica-new && docker compose restart app 2>/dev/null || true
        cd /root/projects/prod/sistema-clinica-new && docker compose restart app 2>/dev/null || true
        
        # Reload nginx
        docker exec nginx-wildcard-proxy nginx -s reload 2>/dev/null || true
    fi
done
EOF
    
    chmod +x /root/monitor-alphaclinics.sh
    
    # Adicionar ao crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /root/monitor-alphaclinics.sh >> /var/log/alphaclinics-monitor.log 2>&1") | crontab -
    
    log_success "Monitoramento configurado (cada 5 minutos)"
}

# Gerar relatório final
generate_report() {
    log_status "Gerando relatório final..."
    
    REPORT_FILE="/tmp/alphaclinics-build-fixed-$(date +%Y%m%d-%H%M%S).log"
    
    {
        echo "=== ALPHA CLINICS BUILD FIXED REPORT ==="
        echo "Timestamp: $(date)"
        echo "Server IP: $(hostname -I | awk '{print $1}')"
        echo ""
        echo "=== Container Status ==="
        docker ps --filter "name=sistema-clinica" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "=== Image Status ==="
        docker images | grep sistema-clinica
        echo ""
        echo "=== Network Info ==="
        docker network ls | grep -E "(bridge|sistema)"
        echo ""
        echo "=== Recent Logs ==="
        docker logs sistema-clinica-app --tail 20 2>/dev/null || echo "App container not found"
        echo ""
        echo "=== Monitoring Status ==="
        crontab -l | grep alphaclinics || echo "Monitoring not configured"
    } > "$REPORT_FILE"
    
    log_success "Relatório salvo em: $REPORT_FILE"
}

# Função principal
main() {
    echo "Iniciando build corrigido do AlphaClinics..."
    echo ""
    
    check_server
    echo ""
    
    stop_existing_containers
    echo ""
    
    cleanup_images
    echo ""
    
    fix_dockerfile
    echo ""
    
    fix_package_lock
    echo ""
    
    read -p "Construir qual ambiente? (1=DEV, 2=PROD, 3=AMBOS): " -n 1 -r
    echo
    case $REPLY in
        1)
            build_dev
            ;;
        2)
            build_prod
            ;;
        3)
            build_dev
            echo ""
            build_prod
            ;;
        *)
            log_warning "Opção inválida, construindo ambos"
            build_dev
            echo ""
            build_prod
            ;;
    esac
    
    echo ""
    start_containers
    echo ""
    verify_status
    echo ""
    test_http
    echo ""
    setup_monitoring
    echo ""
    generate_report
    
    echo ""
    log_success "Build corrigido concluído!"
    log_status "Sistema AlphaClinics deve estar funcionando em 2-3 minutos."
}

# Executar função principal
main "$@"
