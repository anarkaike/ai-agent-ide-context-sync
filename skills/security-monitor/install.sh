#!/bin/bash

# Security Monitor Skill - Installation Script
# Instala e configura a skill de segurança para todos os agentes

set -e

echo "🛡️ Installing Security Monitor Skill..."

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
    LOG_DIR="/var/log/ai-agent"
else
    INSTALL_DIR="$HOME/.ai-agent/skills"
    CONFIG_DIR="$HOME/.ai-agent/config"
    LOG_DIR="$HOME/.ai-agent/logs"
fi

# Create directories
print_status "Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "/var/log/ai-agent" 2>/dev/null || true

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/skill.json" ]]; then
    cp -r "$SCRIPT_DIR" "$INSTALL_DIR/security-monitor"
    print_status "Skill files copied to $INSTALL_DIR/security-monitor"
    
    cd "$INSTALL_DIR/security-monitor"
    npm init -y > /dev/null 2>&1 || true
    npm install axios fs-extra > /dev/null 2>&1 || true
else
    print_error "skill.json not found in current directory"
    exit 1
fi

# Install system dependencies
print_status "Installing system dependencies..."

# Install required tools based on platform
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check if we have apt-get
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y net-tools sysstat procps auditd
    # Check if we have yum
    elif command -v yum &> /dev/null; then
        sudo yum install -y net-tools sysstat procps-ng audit
    # Check if we have dnf
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y net-tools sysstat procps-ng audit
    fi
    
    # Enable auditd
    sudo systemctl enable auditd 2>/dev/null || true
    sudo systemctl start auditd 2>/dev/null || true
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        brew install nmap
    fi
fi

# Create configuration files
print_status "Creating configuration files..."

# Main configuration
cat > "$CONFIG_DIR/security-monitor-config.json" << EOF
{
  "monitoringInterval": 30000,
  "logLevel": "info",
  "alertThresholds": {
    "cpuThreshold": 90,
    "memoryThreshold": 85,
    "networkThreshold": 1000
  },
  "alerting": {
    "enabled": true,
    "channels": ["console", "log"],
    "webhookUrl": null
  },
  "securityPolicies": {
    "maxFailedAttempts": 3,
    "lockoutDuration": 900,
    "enableIntrusionDetection": true,
    "enableFileIntegrityCheck": true,
    "enableNetworkMonitoring": true
  },
  "threatIntelligence": {
    "enabled": true,
    "updateInterval": 3600000,
    "sources": [
      "internal_database",
      "custom_feeds"
    ]
  },
  "compliance": {
    "frameworks": ["NIST", "ISO27001"],
    "auditInterval": 86400000
  }
}
EOF

# Production configuration
cat > "$CONFIG_DIR/security-monitor-prod-config.json" << EOF
{
  "monitoringInterval": 15000,
  "logLevel": "warn",
  "alertThresholds": {
    "cpuThreshold": 80,
    "memoryThreshold": 75,
    "networkThreshold": 500
  },
  "alerting": {
    "enabled": true,
    "channels": ["console", "log", "webhook"],
    "webhookUrl": "https://your-security-webhook.com/alerts"
  },
  "securityPolicies": {
    "maxFailedAttempts": 3,
    "lockoutDuration": 1800,
    "enableIntrusionDetection": true,
    "enableFileIntegrityCheck": true,
    "enableNetworkMonitoring": true,
    "automatedResponse": true
  },
  "threatIntelligence": {
    "enabled": true,
    "updateInterval": 1800000,
    "sources": [
      "internal_database",
      "custom_feeds",
      "commercial_threat_feeds"
    ]
  },
  "compliance": {
    "frameworks": ["NIST", "ISO27001", "CIS"],
    "auditInterval": 43200000
  }
}
EOF

# Development configuration
cat > "$CONFIG_DIR/security-monitor-dev-config.json" << EOF
{
  "monitoringInterval": 60000,
  "logLevel": "debug",
  "alertThresholds": {
    "cpuThreshold": 95,
    "memoryThreshold": 90,
    "networkThreshold": 2000
  },
  "alerting": {
    "enabled": true,
    "channels": ["console"],
    "webhookUrl": null
  },
  "securityPolicies": {
    "maxFailedAttempts": 5,
    "lockoutDuration": 300,
    "enableIntrusionDetection": true,
    "enableFileIntegrityCheck": false,
    "enableNetworkMonitoring": true
  },
  "threatIntelligence": {
    "enabled": false,
    "updateInterval": 0,
    "sources": []
  },
  "compliance": {
    "frameworks": [],
    "auditInterval": 0
  }
}
EOF

# Create log rotation configuration
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/ai-agent-security > /dev/null << EOF
$LOG_DIR/security-monitor.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload ai-agent-security 2>/dev/null || true
    endscript
}
EOF

# Create systemd service (if running as root)
if [[ $EUID -eq 0 ]]; then
    print_status "Creating systemd service..."
    
    cat > /etc/systemd/system/ai-agent-security.service << EOF
[Unit]
Description=AI Agent Security Monitor
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$INSTALL_DIR/security-monitor
ExecStart=/usr/bin/node $INSTALL_DIR/security-monitor/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ai-agent-security

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$LOG_DIR /var/log/ai-agent

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable ai-agent-security
    
    print_status "Systemd service created and enabled"
fi

# Set permissions
print_status "Setting permissions..."
chmod 755 "$INSTALL_DIR/security-monitor"
chmod 644 "$CONFIG_DIR"/security-monitor*-config.json

# Create log directory with proper permissions
sudo mkdir -p /var/log/ai-agent
sudo chmod 755 /var/log/ai-agent

# Create usage examples
print_status "Creating usage examples..."

# Basic usage example
cat > "$INSTALL_DIR/security-monitor/examples/basic-monitoring.js" << 'EOF'
const SecurityMonitor = require('../index.js');

// Basic security monitoring example
async function basicMonitoring() {
    const monitor = new SecurityMonitor({
        monitoringInterval: 30000,
        alerting: {
            enabled: true,
            channels: ['console', 'log']
        }
    });
    
    try {
        console.log('Starting security monitoring...');
        const result = await monitor.startMonitoring();
        console.log('Monitoring started:', result);
        
        // Run a security check
        const checkResult = await monitor.performSecurityCheck();
        console.log('Security check result:', JSON.stringify(checkResult, null, 2));
        
        // Keep monitoring for 5 minutes
        setTimeout(async () => {
            await monitor.stopMonitoring();
            console.log('Monitoring stopped');
            
            // Generate final report
            const report = await monitor.generateSecurityReport();
            console.log('Security report:', JSON.stringify(report, null, 2));
        }, 300000);
        
    } catch (error) {
        console.error('Security monitoring error:', error.message);
    }
}

basicMonitoring();
EOF

# Production monitoring example
cat > "$INSTALL_DIR/security-monitor/examples/production-monitoring.js" << 'EOF'
const SecurityMonitor = require('../index.js');
const fs = require('fs');

// Production security monitoring with all features
async function productionMonitoring() {
    const configPath = '/etc/ai-agent/security-monitor-prod-config.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    const monitor = new SecurityMonitor(config);
    
    try {
        console.log('Starting production security monitoring...');
        const result = await monitor.startMonitoring();
        console.log('Production monitoring started:', result);
        
        // Set up periodic reporting
        setInterval(async () => {
            const report = await monitor.generateSecurityReport();
            console.log('Periodic security report generated');
            
            // In production, you would send this to your SIEM or monitoring system
            if (report.summary.criticalAlerts > 0) {
                console.error('🚨 CRITICAL SECURITY ALERTS DETECTED!');
            }
        }, 3600000); // Every hour
        
    } catch (error) {
        console.error('Production monitoring error:', error.message);
    }
}

productionMonitoring();
EOF

# Nanobot integration example
cat > "$INSTALL_DIR/security-monitor/examples/nanobot-integration.js" << 'EOF'
const SecurityMonitor = require('../index.js');

// Nanobot trust network integration example
async function nanobotIntegration() {
    const monitor = new SecurityMonitor({
        monitoringInterval: 30000,
        alerting: {
            enabled: true,
            channels: ['console', 'log', 'nanobot_network']
        }
    });
    
    try {
        console.log('Starting security monitoring with Nanobot integration...');
        
        // Register with Nanobot trust network
        const { Nanobot } = require('@nanobot-ai/nanobot');
        const agent = new Nanobot({
            name: 'security-monitor',
            network: 'trust-network-ai-agent',
            capabilities: ['threat_detection', 'security_monitoring', 'vulnerability_analysis']
        });
        
        await agent.register('trust-network-ai-agent');
        console.log('Registered with Nanobot trust network');
        
        // Start monitoring
        await monitor.startMonitoring();
        
        // Share security events with network
        setInterval(async () => {
            const events = monitor.securityEvents.slice(-10); // Last 10 events
            for (const event of events) {
                await agent.shareKnowledge('security-events', event);
            }
        }, 60000); // Every minute
        
    } catch (error) {
        console.error('Nanobot integration error:', error.message);
    }
}

nanobotIntegration();
EOF

# Test installation
print_status "Testing installation..."
cd "$INSTALL_DIR/security-monitor"

if node -e "const SecurityMonitor = require('./index.js'); console.log('Security Monitor skill loaded successfully');" 2>/dev/null; then
    print_status "Security Monitor skill installed and working correctly"
else
    print_error "Security Monitor skill installation failed"
    exit 1
fi

# Create startup script
cat > "$INSTALL_DIR/security-monitor/start-security-monitor.sh" << EOF
#!/bin/bash
# Security Monitor startup script

CONFIG_FILE="\${1:-/etc/ai-agent/security-monitor-config.json}"

echo "🛡️ Starting AI Agent Security Monitor..."
echo "Using config: \$CONFIG_FILE"

cd "$INSTALL_DIR/security-monitor"
node index.js --config "\$CONFIG_FILE"
EOF

chmod +x "$INSTALL_DIR/security-monitor/start-security-monitor.sh"

print_status "Installation completed successfully!"
echo ""
echo "📋 Configuration files created:"
echo "- Development: $CONFIG_DIR/security-monitor-dev-config.json"
echo "- Production: $CONFIG_DIR/security-monitor-prod-config.json"
echo "- Default: $CONFIG_DIR/security-monitor-config.json"
echo ""
echo "🚀 Usage examples:"
echo "- Basic: node $INSTALL_DIR/security-monitor/examples/basic-monitoring.js"
echo "- Production: node $INSTALL_DIR/security-monitor/examples/production-monitoring.js"
echo "- Nanobot: node $INSTALL_DIR/security-monitor/examples/nanobot-integration.js"
echo ""
echo "🔧 Service management:"
if [[ $EUID -eq 0 ]]; then
    echo "- Start: sudo systemctl start ai-agent-security"
    echo "- Stop: sudo systemctl stop ai-agent-security"
    echo "- Status: sudo systemctl status ai-agent-security"
    echo "- Logs: sudo journalctl -u ai-agent-security -f"
else
    echo "- Start: $INSTALL_DIR/security-monitor/start-security-monitor.sh"
    echo "- Logs: tail -f $LOG_DIR/security-monitor.log"
fi
echo ""
echo "📊 Security dashboard: Check logs at $LOG_DIR/security-monitor.log"
echo ""
echo "⚠️  Note: This skill requires appropriate permissions to monitor system security"
