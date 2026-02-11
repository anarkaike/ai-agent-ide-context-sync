#!/bin/bash

# WhatsApp Web Multidevice Manager - Installation Script
# Instala e configura a skill para todos os agentes

set -e

echo "🚀 Installing WhatsApp Web Multidevice Manager Skill..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root for system-wide installation
if [[ $EUID -eq 0 ]]; then
    INSTALL_DIR="/opt/ai-agent/skills"
    CONFIG_DIR="/etc/ai-agent"
else
    INSTALL_DIR="$HOME/.ai-agent/skills"
    CONFIG_DIR="$HOME/.ai-agent/config"
fi

# Create directories
print_status "Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    print_warning "Go is not installed. Installing Go..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -LO https://golang.org/dl/go1.24.0.linux-amd64.tar.gz
        sudo rm -rf /usr/local/go
        sudo tar -C /usr/local -xzf go1.24.0.linux-amd64.tar.gz
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        export PATH=$PATH:/usr/local/go/bin
        rm go1.24.0.linux-amd64.tar.gz
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install go
        else
            print_error "Please install Go manually or install Homebrew first"
            exit 1
        fi
    else
        print_error "Unsupported OS. Please install Go manually."
        exit 1
    fi
fi

# Install WhatsApp Web Multidevice
print_status "Installing WhatsApp Web Multidevice..."

WHATSAPP_DIR="$HOME/projects/prod/go-whatsapp-web-multidevice"
if [[ -d "$WHATSAPP_DIR" ]]; then
    print_status "Found existing installation at $WHATSAPP_DIR"
    cd "$WHATSAPP_DIR"
    
    # Build if binary doesn't exist
    if [[ ! -f "./whatsapp" ]]; then
        print_status "Building WhatsApp binary..."
        go build -o whatsapp ./cmd/whatsapp/
    fi
else
    print_status "Cloning WhatsApp Web Multidevice..."
    git clone https://github.com/aldinokemal/go-whatsapp-web-multidevice.git "$WHATSAPP_DIR"
    cd "$WHATSAPP_DIR"
    print_status "Building WhatsApp binary..."
    go build -o whatsapp ./cmd/whatsapp/
fi

# Create symlink for easy access
if [[ -f "$WHATSAPP_DIR/whatsapp" ]]; then
    sudo ln -sf "$WHATSAPP_DIR/whatsapp" /usr/local/bin/whatsapp 2>/dev/null || {
        ln -sf "$WHATSAPP_DIR/whatsapp" "$HOME/.local/bin/whatsapp"
        mkdir -p "$HOME/.local/bin"
        echo 'export PATH=$PATH:$HOME/.local/bin' >> ~/.bashrc
    }
    print_status "WhatsApp binary linked to PATH"
else
    print_error "Failed to build WhatsApp binary"
    exit 1
fi

# Copy skill files
print_status "Installing skill files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/skill.json" ]]; then
    cp -r "$SCRIPT_DIR" "$INSTALL_DIR/whatsapp-web-multidevice-manager"
    print_status "Skill files copied to $INSTALL_DIR/whatsapp-web-multidevice-manager"
else
    print_error "skill.json not found in current directory"
    exit 1
fi

# Install Node.js dependencies
if command -v npm &> /dev/null; then
    print_status "Installing Node.js dependencies..."
    cd "$INSTALL_DIR/whatsapp-web-multidevice-manager"
    npm init -y > /dev/null 2>&1 || true
    npm install axios form-data > /dev/null 2>&1 || true
fi

# Create configuration templates
print_status "Creating configuration templates..."

# Development config
cat > "$CONFIG_DIR/whatsapp-dev-config.json" << EOF
{
  "mode": "development",
  "server": {
    "host": "0.0.0.0",
    "port": 3000,
    "debug": true
  },
  "features": {
    "account_validation": true,
    "auto_download_media": true,
    "auto_mark_read": false,
    "auto_reject_call": false
  },
  "database": {
    "db_uri": "file:storages/whatsapp.db?_foreign_keys=on"
  }
}
EOF

# Production config
cat > "$CONFIG_DIR/whatsapp-prod-config.json" << EOF
{
  "mode": "production",
  "server": {
    "host": "127.0.0.1",
    "port": 8080,
    "basic_auth": "admin:your-secure-password",
    "trusted_proxies": "127.0.0.1/32"
  },
  "features": {
    "account_validation": true,
    "auto_download_media": false,
    "auto_mark_read": false,
    "auto_reject_call": true
  },
  "webhook": {
    "webhook": "https://your-webhook-endpoint.com/whatsapp",
    "webhook_secret": "production-secret-key",
    "webhook_events": "message,message.ack,group.participants"
  },
  "database": {
    "db_uri": "postgres://user:password@localhost:5432/whatsapp"
  }
}
EOF

# Chatwoot integration config
cat > "$CONFIG_DIR/whatsapp-chatwoot-config.json" << EOF
{
  "mode": "chatwoot-integration",
  "server": {
    "host": "0.0.0.0",
    "port": 3000,
    "debug": true
  },
  "chatwoot_integration": {
    "chatwoot_enabled": true,
    "chatwoot_device_id": "whatsapp-device-01",
    "chatwoot_import_messages": true,
    "chatwoot_days_limit_import_messages": 7
  },
  "webhook": {
    "webhook": "https://your-chatwoot.com/webhook",
    "webhook_secret": "chatwoot-webhook-secret"
  },
  "features": {
    "account_validation": true,
    "auto_download_media": true
  }
}
EOF

# Set permissions
chmod 755 "$INSTALL_DIR/whatsapp-web-multidevice-manager"
chmod 644 "$CONFIG_DIR"/whatsapp-*-config.json

# Test installation
print_status "Testing installation..."
if command -v whatsapp &> /dev/null; then
    whatsapp --help > /dev/null 2>&1
    print_status "WhatsApp binary installed and working"
else
    print_error "WhatsApp binary not found in PATH"
    exit 1
fi

# Create usage examples
print_status "Creating usage examples..."

# Basic usage example
cat > "$INSTALL_DIR/whatsapp-web-multidevice-manager/examples/basic-usage.js" << 'EOF'
const WhatsAppWebMultideviceManager = require('./index.js');

// Example usage
async function example() {
    const manager = new WhatsAppWebMultideviceManager({ 
        debug: true,
        baseURL: 'http://localhost:3000'
    });
    
    try {
        // Start server
        console.log('Starting WhatsApp server...');
        const server = await manager.startRESTServer({
            host: '0.0.0.0',
            port: '3000',
            debug: true
        });
        console.log('Server started:', server);
        
        // Check connection
        const status = await manager.checkConnection();
        console.log('Connection status:', status);
        
        // Get QR Code (for initial connection)
        const qrCode = await manager.getQRCode();
        console.log('QR Code generated, scan with WhatsApp mobile');
        
        // Send test message (when connected)
        // await manager.sendTextMessage('5511999999999@c.us', 'Hello from API!');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

example();
EOF

# Chatwoot integration example
cat > "$INSTALL_DIR/whatsapp-web-multidevice-manager/examples/chatwoot-integration.js" << 'EOF'
const WhatsAppWebMultideviceManager = require('./index.js');

// Chatwoot integration example
async function chatwootExample() {
    const manager = new WhatsAppWebMultideviceManager({ 
        debug: true,
        baseURL: 'http://localhost:3000'
    });
    
    try {
        // Start with Chatwoot integration
        console.log('Starting WhatsApp with Chatwoot integration...');
        const server = await manager.startWithChatwoot({
            deviceId: 'whatsapp-device-01',
            daysLimit: '7',
            webhookUrl: 'https://your-chatwoot.com/webhook',
            webhookSecret: 'your-webhook-secret'
        });
        console.log('Server started with Chatwoot integration:', server);
        
        // Monitor connection
        setInterval(async () => {
            try {
                const status = await manager.checkConnection();
                console.log('Connection OK:', status.connected);
            } catch (e) {
                console.log('Connection lost:', e.message);
            }
        }, 30000);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

chatwootExample();
EOF

# Production setup example
cat > "$INSTALL_DIR/whatsapp-web-multidevice-manager/examples/production-setup.js" << 'EOF'
const WhatsAppWebMultideviceManager = require('./index.js');

// Production setup example
async function productionExample() {
    const manager = new WhatsAppWebMultideviceManager({ 
        debug: false,
        baseURL: 'http://localhost:8080',
        auth: { username: 'admin', password: 'your-secure-password' }
    });
    
    try {
        // Start production server
        console.log('Starting WhatsApp in production mode...');
        const server = await manager.startProduction({
            port: '8080',
            basicAuth: 'admin:your-secure-password',
            trustedProxies: '127.0.0.1/32',
            webhookSecret: 'production-secret-key'
        });
        console.log('Production server started:', server);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

productionExample();
EOF

print_status "Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start development server: node $INSTALL_DIR/whatsapp-web-multidevice-manager/examples/basic-usage.js"
echo "2. Or start with Chatwoot: node $INSTALL_DIR/whatsapp-web-multidevice-manager/examples/chatwoot-integration.js"
echo "3. Or start production: node $INSTALL_DIR/whatsapp-web-multidevice-manager/examples/production-setup.js"
echo "4. Scan QR code with WhatsApp mobile app"
echo "5. Use API endpoints: http://localhost:3000"
echo ""
echo "📚 Configuration templates:"
echo "- Development: $CONFIG_DIR/whatsapp-dev-config.json"
echo "- Production: $CONFIG_DIR/whatsapp-prod-config.json"
echo "- Chatwoot: $CONFIG_DIR/whatsapp-chatwoot-config.json"
echo ""
echo "🔗 API Documentation: http://localhost:3000 after starting server"
