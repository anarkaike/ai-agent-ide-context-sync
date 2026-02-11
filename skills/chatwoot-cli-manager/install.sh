#!/bin/bash

# Chatwoot CLI Manager - Installation Script
# Instala e configura a skill para todos os agentes

set -e

echo "🚀 Installing Chatwoot CLI Manager Skill..."

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

# Install Chatwoot CLI
print_status "Installing Chatwoot CLI..."
if ! command -v chatwoot &> /dev/null; then
    go install github.com/chatwoot/chatwoot-cli/cmd/chatwoot@latest
    
    # Add to PATH if not already there
    if ! echo $PATH | grep -q "$HOME/go/bin"; then
        echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
        export PATH=$PATH:$HOME/go/bin
    fi
    
    print_status "Chatwoot CLI installed successfully"
else
    print_status "Chatwoot CLI already installed"
fi

# Copy skill files
print_status "Installing skill files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/skill.json" ]]; then
    cp -r "$SCRIPT_DIR" "$INSTALL_DIR/chatwoot-cli-manager"
    print_status "Skill files copied to $INSTALL_DIR/chatwoot-cli-manager"
else
    print_error "skill.json not found in current directory"
    exit 1
fi

# Install Node.js dependencies if needed
if command -v npm &> /dev/null; then
    print_status "Installing Node.js dependencies..."
    cd "$INSTALL_DIR/chatwoot-cli-manager"
    npm init -y > /dev/null 2>&1 || true
    npm install js-yaml axios > /dev/null 2>&1 || true
fi

# Create configuration template
print_status "Creating configuration template..."
cat > "$CONFIG_DIR/chatwoot-config.template.yaml" << EOF
# Chatwoot CLI Configuration Template
# Copy this file to ~/.chatwoot/config.yaml and fill in your credentials

base_url: "https://your-chatwoot-instance.com"
api_key: "your-api-key-here"
account_id: your-account-id-here

# Optional settings
timeout: 30
max_retries: 3
debug: false
EOF

# Set permissions
chmod 755 "$INSTALL_DIR/chatwoot-cli-manager"
chmod 644 "$CONFIG_DIR/chatwoot-config.template.yaml"

# Test installation
print_status "Testing installation..."
if command -v chatwoot &> /dev/null; then
    VERSION=$(chatwoot --version)
    print_status "Chatwoot CLI version: $VERSION"
else
    print_error "Chatwoot CLI not found in PATH"
    exit 1
fi

# Create usage example
print_status "Creating usage examples..."
cat > "$INSTALL_DIR/chatwoot-cli-manager/examples/basic-usage.js" << 'EOF'
const ChatwootCLIManager = require('./index.js');

// Example usage
async function example() {
    const manager = new ChatwootCLIManager({ debug: true });
    
    try {
        // Authenticate
        await manager.authenticate({
            baseUrl: 'https://your-chatwoot.com',
            apiKey: 'your-api-key',
            accountId: '123'
        });
        
        // List conversations
        const conversations = await manager.listConversations({ 
            status: 'open', 
            output: 'json' 
        });
        console.log('Open conversations:', conversations.data.length);
        
        // Get daily summary
        const summary = await manager.getDailySupportSummary();
        console.log('Daily summary:', summary);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

example();
EOF

print_status "Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Chatwoot CLI: chatwoot auth login"
echo "2. Or copy config template: cp $CONFIG_DIR/chatwoot-config.template.yaml ~/.chatwoot/config.yaml"
echo "3. Edit the config file with your credentials"
echo "4. Test with: node $INSTALL_DIR/chatwoot-cli-manager/examples/basic-usage.js"
echo ""
echo "📚 Documentation available in: $INSTALL_DIR/chatwoot-cli-manager/"
