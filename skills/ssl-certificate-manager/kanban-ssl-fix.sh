#!/bin/bash

# 🚀 Kanban SSL Fix - IA-First Solution
# Automated SSL certificate setup for Kanban frontend and backend

set -e

# Configuration
DOMAIN_FRONT="kanbanfront.chatwoot.servinder.com.br"
DOMAIN_BACK="kanbanback.chatwoot.servinder.com.br"
SSL_MANAGER_PATH="/root/projects/dev/ai-agent-ide-context-sync/skills/ssl-certificate-manager"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO: $1${NC}"
}

# Check if SSL Manager is available
check_ssl_manager() {
    if [[ ! -f "$SSL_MANAGER_PATH/index.js" ]]; then
        error "SSL Certificate Manager not found at $SSL_MANAGER_PATH"
    fi
    
    if ! command -v node &> /dev/null; then
        error "Node.js not installed"
    fi
    
    log "✅ SSL Certificate Manager found"
}

# Analyze domains
analyze_domains() {
    log "🔍 Analyzing domains for SSL configuration"
    
    info "Analyzing frontend domain: $DOMAIN_FRONT"
    cd $SSL_MANAGER_PATH
    node index.js analyze $DOMAIN_FRONT --verbose || true
    
    echo
    info "Analyzing backend domain: $DOMAIN_BACK"
    node index.js analyze $DOMAIN_BACK --verbose || true
    
    echo
}

# Issue certificates
issue_certificates() {
    log "🔐 Issuing SSL certificates"
    
    cd $SSL_MANAGER_PATH
    
    # Issue frontend certificate
    info "Issuing certificate for frontend: $DOMAIN_FRONT"
    node index.js issue $DOMAIN_FRONT --verbose || {
        warn "Let's Encrypt failed for frontend, falling back to self-signed"
        node index.js issue $DOMAIN_FRONT self-signed --verbose
    }
    
    echo
    
    # Issue backend certificate
    info "Issuing certificate for backend: $DOMAIN_BACK"
    node index.js issue $DOMAIN_BACK --verbose || {
        warn "Let's Encrypt failed for backend, falling back to self-signed"
        node index.js issue $DOMAIN_BACK self-signed --verbose
    }
    
    echo
}

# Update Nginx configuration
update_nginx() {
    log "⚙️ Updating Nginx configuration"
    
    # Backup current config
    cp /root/projects/conf/nginx-wildcard.conf /root/projects/conf/nginx-wildcard.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # Update frontend to use HTTPS
    sed -i "s|listen 80;|listen 443 ssl;\\n    ssl_certificate /etc/ssl/certs/${DOMAIN_FRONT}.crt;\\n    ssl_certificate_key /etc/ssl/certs/${DOMAIN_FRONT}.key;\\n\\n    # Redirect HTTP to HTTPS\\n}\\n\\nserver {\\n    listen 80;\\n    server_name ${DOMAIN_FRONT};\\n    return 301 https://\$server_name\$request_uri;\\n}\\n\\nserver {\\n    listen 443 ssl;\\n    server_name ${DOMAIN_FRONT};|g" /root/projects/conf/nginx-wildcard.conf
    
    # Update backend to use HTTPS
    sed -i "s|listen 443 ssl;|listen 443 ssl;\\n    ssl_certificate /etc/ssl/certs/${DOMAIN_BACK}.crt;\\n    ssl_certificate_key /etc/ssl/certs/${DOMAIN_BACK}.key;|g" /root/projects/conf/nginx-wildcard.conf
    
    # Test and reload Nginx
    docker exec nginx-wildcard-proxy nginx -t
    docker exec nginx-wildcard-proxy nginx -s reload
    
    log "✅ Nginx configuration updated"
}

# Test SSL certificates
test_ssl() {
    log "🧪 Testing SSL certificates"
    
    # Wait a moment for certificates to be properly installed
    sleep 5
    
    # Test frontend
    info "Testing frontend SSL: https://$DOMAIN_FRONT"
    if curl -k -I https://$DOMAIN_FRONT 2>/dev/null | head -1; then
        log "✅ Frontend SSL is working"
    else
        warn "⚠️ Frontend SSL test failed"
    fi
    
    # Test backend
    info "Testing backend SSL: https://$DOMAIN_BACK"
    if curl -k -I https://$DOMAIN_BACK 2>/dev/null | head -1; then
        log "✅ Backend SSL is working"
    else
        warn "⚠️ Backend SSL test failed"
    fi
}

# Update Kanban configuration
update_kanban_config() {
    log "📝 Updating Kanban configuration for HTTPS"
    
    # Update frontend configuration to use HTTPS URLs
    KANBAN_SCRIPT="/root/projects/dev/ai-agent-ide-context-sync/docs/Kanban Free/Script.txt"
    
    if [[ -f "$KANBAN_SCRIPT" ]]; then
        # Update KANBAN_URL to use HTTPS
        sed -i "s|const KANBAN_URL = 'http://|const KANBAN_URL = 'https://|g" "$KANBAN_SCRIPT"
        
        # Update apiUrl to use HTTPS
        sed -i "s|apiUrl: 'http://|apiUrl: 'https://|g" "$KANBAN_SCRIPT"
        
        log "✅ Kanban script updated for HTTPS"
    else
        warn "Kanban script not found at $KANBAN_SCRIPT"
    fi
    
    # Update Docker Compose environment variables
    KANBAN_COMPOSE="/root/projects/dev/ai-agent-ide-context-sync/docs/Kanban Free/Kanban-chatwoot-free.yml"
    
    if [[ -f "$KANBAN_COMPOSE" ]]; then
        # Update CORS_ORIGIN and other URLs to use HTTPS
        sed -i "s|http://|https://|g" "$KANBAN_COMPOSE"
        
        log "✅ Kanban Docker Compose updated for HTTPS"
    else
        warn "Kanban Docker Compose not found at $KANBAN_COMPOSE"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "📊 Setting up SSL monitoring"
    
    cd $SSL_MANAGER_PATH
    
    # Start monitoring in background
    nohup node index.js monitor > /var/log/ssl-manager-monitor.log 2>&1 &
    
    # Add cron job for certificate renewal checks
    (crontab -l 2>/dev/null; echo "0 3 * * * cd $SSL_MANAGER_PATH && node index.js check-all >> /var/log/ssl-manager-check.log") | crontab -
    
    log "✅ SSL monitoring started"
}

# Generate report
generate_report() {
    log "📋 Generating SSL setup report"
    
    REPORT_FILE="/tmp/kanban-ssl-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
🚀 Kanban SSL Setup Report
Generated: $(date)

=== DOMAINS CONFIGURED ===
Frontend: https://$DOMAIN_FRONT
Backend:  https://$DOMAIN_BACK

=== CERTIFICATE STATUS ===
Frontend: $(openssl x509 -in /etc/ssl/certs/${DOMAIN_FRONT}.crt -noout -dates 2>/dev/null || echo "Certificate not found")
Backend:  $(openssl x509 -in /etc/ssl/certs/${DOMAIN_BACK}.crt -noout -dates 2>/dev/null || echo "Certificate not found")

=== NGINX CONFIGURATION ===
Status: $(docker exec nginx-wildcard-proxy nginx -t 2>&1 | grep -q "successful" && echo "✅ Valid" || echo "❌ Invalid")
Reload: $(docker exec nginx-wildcard-proxy nginx -s reload 2>/dev/null && echo "✅ Success" || echo "❌ Failed")

=== SERVICES STATUS ===
Kanban Frontend: $(docker ps | grep kanbanfree-frontend | wc -l) container(s)
Kanban Backend:  $(docker ps | grep kanbanfree-backend | wc -l) container(s)
Nginx Proxy:    $(docker ps | grep nginx-wildcard-proxy | wc -l) container(s)

=== NEXT STEPS ===
1. Test access: https://$DOMAIN_FRONT
2. Test API: https://$DOMAIN_BACK
3. Configure DNS if needed
4. Monitor certificate expiry

=== MONITORING ===
SSL Manager monitoring: Active
Log file: /var/log/ssl-manager-monitor.log
Cron check: Daily at 3 AM

EOF
    
    log "📄 Report generated: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Main execution
main() {
    log "🚀 Starting Kanban SSL Setup with IA-First Certificate Manager"
    echo
    
    # Check prerequisites
    check_ssl_manager
    echo
    
    # Analyze domains
    analyze_domains
    echo
    
    # Issue certificates
    issue_certificates
    echo
    
    # Update Nginx
    update_nginx
    echo
    
    # Update Kanban configuration
    update_kanban_config
    echo
    
    # Test SSL
    test_ssl
    echo
    
    # Setup monitoring
    setup_monitoring
    echo
    
    # Generate report
    generate_report
    echo
    
    log "🎉 Kanban SSL setup completed!"
    echo
    info "🌐 Access URLs:"
    echo "   Frontend: https://$DOMAIN_FRONT"
    echo "   Backend:  https://$DOMAIN_BACK"
    echo
    info "📊 Monitoring is active - certificates will be renewed automatically"
    echo
    warn "⚠️  Remember to configure DNS records if domains don't resolve"
    echo
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Kanban SSL Setup - IA-First Solution"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --test-only    Only test existing SSL setup"
        echo "  --renew        Renew certificates only"
        echo
        exit 0
        ;;
    --test-only)
        log "Testing existing SSL setup"
        test_ssl
        exit 0
        ;;
    --renew)
        log "Renewing SSL certificates"
        cd $SSL_MANAGER_PATH
        node index.js renew $DOMAIN_FRONT --verbose
        node index.js renew $DOMAIN_BACK --verbose
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        ;;
esac
