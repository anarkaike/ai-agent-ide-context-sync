#!/bin/bash

# 🚀 IA-First SSL Certificate Manager - Installation Script
# Automated setup for SSL certificate management with AI capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/ssl-manager"
SERVICE_USER="ssl-manager"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CERT_DIR="/etc/ssl/certs"
LE_DIR="/etc/letsencrypt"

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Detect system
detect_system() {
    if [[ -f /etc/debian_version ]]; then
        echo "debian"
    elif [[ -f /etc/redhat-release ]]; then
        echo "redhat"
    else
        error "Unsupported system"
    fi
}

# Install system dependencies
install_dependencies() {
    local system=$(detect_system)
    
    log "Installing system dependencies for $system"
    
    case $system in
        debian)
            apt-get update
            apt-get install -y curl wget git nginx certbot openssl nodejs npm
            ;;
        redhat)
            yum update -y
            yum install -y curl wget git nginx certbot openssl nodejs npm
            ;;
    esac
}

# Create service user
create_user() {
    if ! id "$SERVICE_USER" &>/dev/null; then
        log "Creating service user: $SERVICE_USER"
        useradd -r -s /bin/false -d $INSTALL_DIR $SERVICE_USER
    fi
}

# Install SSL Manager
install_ssl_manager() {
    log "Installing IA-First SSL Certificate Manager"
    
    # Create installation directory
    mkdir -p $INSTALL_DIR
    
    # Copy files (assuming script is run from the skill directory)
    cp -r . $INSTALL_DIR/
    
    # Set permissions
    chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    chmod +x $INSTALL_DIR/index.js
    
    # Install npm dependencies
    cd $INSTALL_DIR
    npm install --production
    
    # Create symlink for global access
    ln -sf $INSTALL_DIR/index.js /usr/local/bin/ssl-manager
    
    log "SSL Manager installed successfully"
}

# Setup directories
setup_directories() {
    log "Setting up directories"
    
    # Create necessary directories
    mkdir -p $CERT_DIR
    mkdir -p $NGINX_SITES
    mkdir -p $NGINX_ENABLED
    mkdir -p $LE_DIR
    mkdir -p /var/log/ssl-manager
    mkdir -p /var/lib/ssl-manager
    
    # Set permissions
    chown -R $SERVICE_USER:$SERVICE_USER /var/log/ssl-manager
    chown -R $SERVICE_USER:$SERVICE_USER /var/lib/ssl-manager
    chmod 755 $CERT_DIR
}

# Create systemd service
create_service() {
    log "Creating systemd service"
    
    cat > /etc/systemd/system/ssl-manager.service << EOF
[Unit]
Description=IA-First SSL Certificate Manager
After=network.target nginx.service
Wants=nginx.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/index.js monitor
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=SSL_EMAIL=admin@servinder.com.br

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$CERT_DIR $LE_DIR /var/log/ssl-manager /var/lib/ssl-manager

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ssl-manager
}

# Configure log rotation
setup_logrotate() {
    log "Setting up log rotation"
    
    cat > /etc/logrotate.d/ssl-manager << EOF
/var/log/ssl-manager/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload ssl-manager
    endscript
}
EOF
}

# Setup monitoring cron job
setup_cron() {
    log "Setting up monitoring cron job"
    
    # Add daily certificate check
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/ssl-manager check-all >> /var/log/ssl-manager/renewal.log") | crontab -
    
    # Add weekly cleanup
    (crontab -l 2>/dev/null; echo "0 3 * * 0 find $CERT_DIR -name '*.crt' -mtime +365 -delete") | crontab -
}

# Configure Nginx for SSL Manager
configure_nginx() {
    log "Configuring Nginx for SSL Manager"
    
    # Create nginx configuration for SSL Manager health endpoint
    cat > $NGINX_SITES/ssl-manager << EOF
# IA-First SSL Certificate Manager Health Endpoint
server {
    listen 127.0.0.1:3000;
    server_name localhost;
    
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    location /metrics {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF
    
    # Enable site
    ln -sf $NGINX_SITES/ssl-manager $NGINX_ENABLED/ssl-manager
    
    # Test nginx configuration
    nginx -t || error "Nginx configuration test failed"
    
    # Reload nginx
    systemctl reload nginx
}

# Create configuration file
create_config() {
    log "Creating configuration file"
    
    cat > $INSTALL_DIR/config.json << EOF
{
  "email": "admin@servinder.com.br",
  "nginxPath": "/etc/nginx",
  "certPath": "$CERT_DIR",
  "lePath": "$LE_DIR",
  "verbose": true,
  "monitoring": {
    "enabled": true,
    "interval": 3600000,
    "alerts": ["email"]
  },
  "aiDecisionEngine": {
    "strategies": ["letsencrypt", "self-signed", "wildcard"],
    "renewalThreshold": 30,
    "fallbackEnabled": true,
    "autoTroubleshoot": true
  }
}
EOF
    
    chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR/config.json
}

# Setup firewall rules
setup_firewall() {
    log "Setting up firewall rules"
    
    if command -v ufw &> /dev/null; then
        # Allow HTTP/HTTPS for Let's Encrypt
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw reload
    elif command -v firewall-cmd &> /dev/null; then
        # RHEL/CentOS
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
    fi
}

# Test installation
test_installation() {
    log "Testing installation"
    
    # Test command availability
    if ! command -v ssl-manager &> /dev/null; then
        error "ssl-manager command not found"
    fi
    
    # Test basic functionality
    ssl-manager --version || warn "Version check failed"
    
    # Test domain analysis (dry run)
    DRY_RUN=true ssl-manager analyze test.example.com || warn "Domain analysis test failed"
    
    log "Installation test completed"
}

# Start services
start_services() {
    log "Starting services"
    
    systemctl start ssl-manager
    systemctl status ssl-manager --no-pager
    
    log "SSL Manager service started"
}

# Show usage information
show_usage() {
    log "Installation completed successfully!"
    echo
    echo "🚀 IA-First SSL Certificate Manager is now installed and running"
    echo
    echo "Usage examples:"
    echo "  ssl-manager analyze domain.com"
    echo "  ssl-manager issue domain.com"
    echo "  ssl-manager renew domain.com"
    echo "  ssl-manager check-all"
    echo
    echo "Service management:"
    echo "  systemctl status ssl-manager"
    echo "  systemctl restart ssl-manager"
    echo "  journalctl -u ssl-manager -f"
    echo
    echo "Configuration file: $INSTALL_DIR/config.json"
    echo "Logs: /var/log/ssl-manager/"
    echo "Certificates: $CERT_DIR"
    echo
    echo "🔒 Your SSL certificates are now managed by AI!"
}

# Main installation function
main() {
    log "Starting IA-First SSL Certificate Manager installation"
    
    check_root
    install_dependencies
    create_user
    setup_directories
    install_ssl_manager
    create_config
    create_service
    setup_logrotate
    setup_cron
    configure_nginx
    setup_firewall
    test_installation
    start_services
    show_usage
    
    log "Installation completed successfully! 🚀"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "IA-First SSL Certificate Manager Installation Script"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --uninstall    Remove SSL Manager"
        echo "  --update       Update SSL Manager"
        echo
        exit 0
        ;;
    --uninstall)
        log "Uninstalling SSL Manager"
        systemctl stop ssl-manager || true
        systemctl disable ssl-manager || true
        rm -f /etc/systemd/system/ssl-manager.service
        rm -rf $INSTALL_DIR
        rm -f /usr/local/bin/ssl-manager
        rm -f $NGINX_ENABLED/ssl-manager
        rm -f $NGINX_SITES/ssl-manager
        userdel $SERVICE_USER || true
        systemctl daemon-reload
        log "SSL Manager uninstalled"
        exit 0
        ;;
    --update)
        log "Updating SSL Manager"
        systemctl stop ssl-manager
        cd $INSTALL_DIR
        git pull || warn "Git update failed, continuing..."
        npm install --production
        systemctl start ssl-manager
        log "SSL Manager updated"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        ;;
esac
