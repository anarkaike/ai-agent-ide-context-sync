#!/bin/bash

# Deploy Intelligence Layer - Installation Script
# Sistema inteligente de deploy e automação para projetos Laravel+Inertia+Vue+Chatwoot

set -e

echo "🚀 Installing Deploy Intelligence Layer..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log_info() {
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_warning "Running as root. This is recommended for system-wide installation."
fi

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        log_error "Node.js version 16+ is required. Current version: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    log_success "npm $(npm -v) found"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed. Some features may not work."
    else
        log_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) found"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_warning "Docker Compose is not installed. Container deployments will not work."
    else
        log_success "Docker Compose found"
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed."
        exit 1
    fi
    log_success "curl found"
}

# Install the Deploy Intelligence
install_deploy_intelligence() {
    log_info "Installing Deploy Intelligence..."
    
    # Get current directory
    CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Install dependencies
    log_info "Installing Node.js dependencies..."
    cd "$CURRENT_DIR"
    npm install
    
    # Make executable
    chmod +x index.js
    
    # Create global symlink
    if [[ $EUID -eq 0 ]]; then
        log_info "Creating global symlink..."
        ln -sf "$CURRENT_DIR/index.js" /usr/local/bin/deploy-intelligence
        log_success "deploy-intelligence command available globally"
    else
        log_warning "Not running as root. You can create a local symlink:"
        echo "  ln -sf $CURRENT_DIR/index.js ~/.local/bin/deploy-intelligence"
    fi
    
    # Create necessary directories
    log_info "Creating system directories..."
    mkdir -p /tmp/deploy-backups
    mkdir -p /var/log/deploy-intelligence
    
    # Set permissions
    if [[ $EUID -eq 0 ]]; then
        chmod 755 /tmp/deploy-backups
        chmod 755 /var/log/deploy-intelligence
    fi
    
    log_success "Deploy Intelligence installed successfully!"
}

# Setup environment file
setup_environment() {
    log_info "Setting up environment configuration..."
    
    CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ENV_FILE="$CURRENT_DIR/.env"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$CURRENT_DIR/.env.example" ]]; then
            cp "$CURRENT_DIR/.env.example" "$ENV_FILE"
            log_success "Environment file created from template"
            log_warning "Please edit $ENV_FILE with your configuration"
        else
            # Create basic .env file
            cat > "$ENV_FILE" << EOF
# Database Configuration
DB_PASSWORD=your_secure_db_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# Chatwoot Integration
CHATWOOT_URL=https://chatwoot.seudominio.com.br
CHATWOOT_TOKEN=your_chatwoot_api_token_here

# Deploy Configuration
AUTO_ROLLBACK=true
BACKUP_RETENTION_DAYS=7
HEALTH_CHECK_TIMEOUT=30000

# Environment URLs
DEV_URL=https://dev.alphaclinics.servinder.com.br
HMG_URL=https://hmg.alphaclinics.servinder.com.br
PROD_URL=https://alphaclinics.servinder.com.br
EOF
            log_success "Basic environment file created"
            log_warning "Please edit $ENV_FILE with your configuration"
        fi
    else
        log_info "Environment file already exists"
    fi
}

# Test installation
test_installation() {
    log_info "Testing installation..."
    
    CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Test status command
    if node "$CURRENT_DIR/index.js" status &> /dev/null; then
        log_success "Deploy Intelligence is working correctly!"
    else
        log_error "Installation test failed"
        exit 1
    fi
    
    # Show discovered projects
    echo ""
    log_info "Discovered projects:"
    node "$CURRENT_DIR/index.js" status | grep -E '"type":|"domains":' -A 1 | head -20
}

# Show usage information
show_usage() {
    echo ""
    log_success "Installation completed! 🎉"
    echo ""
    echo "📖 Usage:"
    echo "  deploy-intelligence status                          # Show all projects status"
    echo "  deploy-intelligence health <project> <env>          # Check project health"
    echo "  deploy-intelligence deploy <project> <env>          # Deploy project"
    echo "  deploy-intelligence rollback <project> <env>        # Rollback deployment"
    echo ""
    echo "🔧 Configuration:"
    echo "  Edit $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.env for settings"
    echo ""
    echo "📚 Documentation:"
    echo "  Read README.md for complete documentation"
    echo ""
    echo "🚀 Quick Start:"
    echo "  1. Configure .env file with your settings"
    echo "  2. Run: deploy-intelligence status"
    echo "  3. Deploy: deploy-intelligence deploy kanban-free dev"
    echo ""
}

# Main installation flow
main() {
    echo "Deploy Intelligence Layer Installer"
    echo "Version 1.0.0"
    echo ""
    
    check_requirements
    echo ""
    
    install_deploy_intelligence
    echo ""
    
    setup_environment
    echo ""
    
    test_installation
    echo ""
    
    show_usage
}

# Run main function
main "$@"
