#!/bin/bash

# Backup Manager Skill - Installation Script
# Instala e configura a skill de backup para todos os agentes

set -e

echo "💾 Installing Backup Manager Skill..."

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
    BACKUP_DIR="/var/backups/ai-agent"
    LOG_DIR="/var/log/ai-agent"
else
    INSTALL_DIR="$HOME/.ai-agent/skills"
    CONFIG_DIR="$HOME/.ai-agent/config"
    BACKUP_DIR="$HOME/.ai-agent/backups"
    LOG_DIR="$HOME/.ai-agent/logs"
fi

# Create directories
print_status "Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$CONFIG_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "/var/backups/ai-agent" 2>/dev/null || true

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/skill.json" ]]; then
    cp -r "$SCRIPT_DIR" "$INSTALL_DIR/backup-manager"
    print_status "Skill files copied to $INSTALL_DIR/backup-manager"
    
    cd "$INSTALL_DIR/backup-manager"
    npm init -y > /dev/null 2>&1 || true
    npm install aws-sdk fs-extra archiver tar > /dev/null 2>&1 || true
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
        sudo apt-get install -y tar gzip cron
    # Check if we have yum
    elif command -v yum &> /dev/null; then
        sudo yum install -y tar gzip cronie
        sudo systemctl enable crond 2>/dev/null || true
        sudo systemctl start crond 2>/dev/null || true
    # Check if we have dnf
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y tar gzip cronie
        sudo systemctl enable crond 2>/dev/null || true
        sudo systemctl start crond 2>/dev/null || true
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - tar and gzip are included
    print_status "macOS detected - using built-in tools"
fi

# Create configuration files
print_status "Creating configuration files..."

# Main configuration
cat > "$CONFIG_DIR/backup-manager-config.json" << EOF
{
  "backupDir": "$BACKUP_DIR",
  "sources": [
    {
      "name": "agent_workspace",
      "path": "/root/projects/dev/ai-agent-ide-context-sync",
      "priority": "critical",
      "exclude": ["node_modules", ".git", "dist", "coverage", "*.tmp"]
    },
    {
      "name": "agent_config",
      "path": "/root/.ai-agent",
      "priority": "critical",
      "exclude": []
    },
    {
      "name": "agent_memory",
      "path": "/root/.ai-workspace",
      "priority": "critical",
      "exclude": ["cache", "temp"]
    },
    {
      "name": "system_config",
      "path": "/etc/ai-agent",
      "priority": "high",
      "exclude": []
    }
  ],
  "storage": {
    "local": {
      "enabled": true,
      "path": "$BACKUP_DIR"
    },
    "s3": {
      "enabled": false,
      "bucket": "ai-agent-backups",
      "region": "us-east-1"
    }
  },
  "encryption": {
    "enabled": true,
    "algorithm": "aes-256-gcm"
  },
  "compression": {
    "enabled": true,
    "level": 6
  },
  "retention": {
    "full": 28,
    "incremental": 7
  },
  "scheduling": {
    "enabled": true,
    "fullBackupInterval": "0 2 * * 0",
    "incrementalBackupInterval": "0 3 * * 1-6"
  }
}
EOF

# Production configuration
cat > "$CONFIG_DIR/backup-manager-prod-config.json" << EOF
{
  "backupDir": "$BACKUP_DIR",
  "sources": [
    {
      "name": "agent_workspace",
      "path": "/root/projects/dev/ai-agent-ide-context-sync",
      "priority": "critical",
      "exclude": ["node_modules", ".git", "dist", "coverage", "*.tmp"]
    },
    {
      "name": "agent_config",
      "path": "/root/.ai-agent",
      "priority": "critical",
      "exclude": []
    },
    {
      "name": "agent_memory",
      "path": "/root/.ai-workspace",
      "priority": "critical",
      "exclude": ["cache", "temp"]
    },
    {
      "name": "system_config",
      "path": "/etc/ai-agent",
      "priority": "high",
      "exclude": []
    },
    {
      "name": "agent_logs",
      "path": "$LOG_DIR",
      "priority": "medium",
      "exclude": []
    }
  ],
  "storage": {
    "local": {
      "enabled": true,
      "path": "$BACKUP_DIR"
    },
    "s3": {
      "enabled": true,
      "bucket": "ai-agent-backups-prod",
      "region": "us-east-1",
      "accessKeyId": "\${AWS_ACCESS_KEY_ID}",
      "secretAccessKey": "\${AWS_SECRET_ACCESS_KEY}"
    }
  },
  "encryption": {
    "enabled": true,
    "algorithm": "aes-256-gcm"
  },
  "compression": {
    "enabled": true,
    "level": 9
  },
  "retention": {
    "full": 90,
    "incremental": 30
  },
  "scheduling": {
    "enabled": true,
    "fullBackupInterval": "0 1 * * 0",
    "incrementalBackupInterval": "0 2 * * 1-6"
  }
}
EOF

# Development configuration
cat > "$CONFIG_DIR/backup-manager-dev-config.json" << EOF
{
  "backupDir": "$BACKUP_DIR",
  "sources": [
    {
      "name": "agent_workspace",
      "path": "/root/projects/dev/ai-agent-ide-context-sync",
      "priority": "critical",
      "exclude": ["node_modules", ".git", "dist", "coverage", "*.tmp"]
    }
  ],
  "storage": {
    "local": {
      "enabled": true,
      "path": "$BACKUP_DIR"
    },
    "s3": {
      "enabled": false
    }
  },
  "encryption": {
    "enabled": false
  },
  "compression": {
    "enabled": true,
    "level": 3
  },
  "retention": {
    "full": 7,
    "incremental": 3
  },
  "scheduling": {
    "enabled": false
  }
}
EOF

# S3 configuration template
cat > "$CONFIG_DIR/backup-manager-s3-config.json" << EOF
{
  "backupDir": "$BACKUP_DIR",
  "sources": [
    {
      "name": "agent_workspace",
      "path": "/root/projects/dev/ai-agent-ide-context-sync",
      "priority": "critical",
      "exclude": ["node_modules", ".git", "dist", "coverage", "*.tmp"]
    }
  ],
  "storage": {
    "local": {
      "enabled": false
    },
    "s3": {
      "enabled": true,
      "bucket": "your-backup-bucket-name",
      "region": "us-east-1",
      "accessKeyId": "YOUR_AWS_ACCESS_KEY_ID",
      "secretAccessKey": "YOUR_AWS_SECRET_ACCESS_KEY"
    }
  },
  "encryption": {
    "enabled": true,
    "algorithm": "aes-256-gcm"
  },
  "compression": {
    "enabled": true,
    "level": 6
  },
  "retention": {
    "full": 30,
    "incremental": 7
  },
  "scheduling": {
    "enabled": true,
    "fullBackupInterval": "0 2 * * 0",
    "incrementalBackupInterval": "0 3 * * 1-6"
  }
}
EOF

# Setup cron jobs for backup scheduling
print_status "Setting up cron jobs..."

# Create cron script
cat > "$INSTALL_DIR/backup-manager/backup-cron.sh" << 'EOF'
#!/bin/bash
# Backup Manager Cron Script

CONFIG_FILE="/etc/ai-agent/backup-manager-config.json"
LOG_FILE="/var/log/ai-agent/backup-cron.log"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check if backup manager is installed
if [[ ! -f "/opt/ai-agent/skills/backup-manager/index.js" ]]; then
    if [[ ! -f "$HOME/.ai-agent/skills/backup-manager/index.js" ]]; then
        log_message "ERROR: Backup Manager not found"
        exit 1
    fi
    BACKUP_MANAGER="$HOME/.ai-agent/skills/backup-manager"
else
    BACKUP_MANAGER="/opt/ai-agent/skills/backup-manager"
fi

cd "$BACKUP_MANAGER"

# Check day of week and hour for backup type
DAY_OF_WEEK=$(date +%u) # 1=Monday, 7=Sunday
HOUR=$(date +%H)

if [[ $DAY_OF_WEEK -eq 7 && $HOUR -eq 2 ]]; then
    # Sunday 2 AM - Full backup
    log_message "Starting scheduled full backup"
    node -e "
const BackupManager = require('./index.js');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
const manager = new BackupManager(config);
manager.createFullBackup().then(result => {
    console.log('Full backup result:', result);
}).catch(error => {
    console.error('Full backup error:', error);
});
" >> "$LOG_FILE" 2>&1
elif [[ $DAY_OF_WEEK -ge 1 && $DAY_OF_WEEK -le 6 && $HOUR -eq 3 ]]; then
    # Monday-Saturday 3 AM - Incremental backup
    log_message "Starting scheduled incremental backup"
    node -e "
const BackupManager = require('./index.js');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
const manager = new BackupManager(config);
manager.createIncrementalBackup().then(result => {
    console.log('Incremental backup result:', result);
}).catch(error => {
    console.error('Incremental backup error:', error);
});
" >> "$LOG_FILE" 2>&1
fi
EOF

chmod +x "$INSTALL_DIR/backup-manager/backup-cron.sh"

# Add to crontab
CRON_ENTRY="0 2 * * 0 $INSTALL_DIR/backup-manager/backup-cron.sh"
CRON_ENTRY_DAILY="0 3 * * 1-6 $INSTALL_DIR/backup-manager/backup-cron.sh"

# Check if cron entries already exist
if ! crontab -l 2>/dev/null | grep -q "backup-cron.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY"; echo "$CRON_ENTRY_DAILY") | crontab -
    print_status "Cron jobs added for automatic backups"
else
    print_warning "Cron jobs already exist"
fi

# Create log rotation configuration
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/ai-agent-backup > /dev/null << EOF
$LOG_DIR/backup*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Create systemd service (if running as root)
if [[ $EUID -eq 0 ]]; then
    print_status "Creating systemd service..."
    
    cat > /etc/systemd/system/ai-agent-backup.service << EOF
[Unit]
Description=AI Agent Backup Manager
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$INSTALL_DIR/backup-manager
ExecStart=/usr/bin/node $INSTALL_DIR/backup-manager/index.js --config /etc/ai-agent/backup-manager-config.json
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ai-agent-backup

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$BACKUP_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable ai-agent-backup
    
    print_status "Systemd service created and enabled"
fi

# Set permissions
print_status "Setting permissions..."
chmod 755 "$INSTALL_DIR/backup-manager"
chmod 644 "$CONFIG_DIR"/backup-manager*-config.json
chmod -R 755 "$BACKUP_DIR"

# Create usage examples
print_status "Creating usage examples..."

# Basic backup example
cat > "$INSTALL_DIR/backup-manager/examples/basic-backup.js" << 'EOF'
const BackupManager = require('../index.js');

// Basic backup example
async function basicBackup() {
    const manager = new BackupManager({
        backupDir: './backups',
        encryption: { enabled: false },
        scheduling: { enabled: false }
    });
    
    try {
        console.log('Starting backup manager...');
        await manager.start();
        
        // Create a full backup
        console.log('Creating full backup...');
        const result = await manager.createFullBackup();
        console.log('Backup result:', result);
        
        // List backups
        const backups = manager.listBackups();
        console.log('Available backups:', backups);
        
        // Get metrics
        const metrics = manager.getBackupMetrics();
        console.log('Backup metrics:', metrics);
        
    } catch (error) {
        console.error('Backup error:', error.message);
    }
}

basicBackup();
EOF

# S3 backup example
cat > "$INSTALL_DIR/backup-manager/examples/s3-backup.js" << 'EOF'
const BackupManager = require('../index.js');

// S3 backup example
async function s3Backup() {
    const manager = new BackupManager({
        backupDir: './backups',
        storage: {
            local: { enabled: false },
            s3: {
                enabled: true,
                bucket: 'my-backup-bucket',
                region: 'us-east-1',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        },
        encryption: { enabled: true },
        compression: { enabled: true }
    });
    
    try {
        console.log('Starting S3 backup manager...');
        await manager.start();
        
        // Create backup
        const result = await manager.createFullBackup();
        console.log('S3 backup result:', result);
        
    } catch (error) {
        console.error('S3 backup error:', error.message);
    }
}

s3Backup();
EOF

# Restore example
cat > "$INSTALL_DIR/backup-manager/examples/restore-backup.js" << 'EOF'
const BackupManager = require('../index.js');

// Restore backup example
async function restoreBackup() {
    const manager = new BackupManager({
        backupDir: './backups'
    });
    
    try {
        console.log('Loading backup manager...');
        await manager.start();
        
        // List available backups
        const backups = manager.listBackups();
        console.log('Available backups:', backups);
        
        if (backups.length === 0) {
            console.log('No backups found');
            return;
        }
        
        // Restore the latest backup
        const latestBackup = backups[0];
        console.log(`Restoring backup: ${latestBackup.id}`);
        
        const restoreResult = await manager.restoreBackup(
            latestBackup.id, 
            './restored-data'
        );
        
        console.log('Restore result:', restoreResult);
        
    } catch (error) {
        console.error('Restore error:', error.message);
    }
}

restoreBackup();
EOF

# Nanobot integration example
cat > "$INSTALL_DIR/backup-manager/examples/nanobot-integration.js" << 'EOF'
const BackupManager = require('../index.js');

// Nanobot trust network integration example
async function nanobotIntegration() {
    const manager = new BackupManager({
        backupDir: './backups',
        scheduling: { enabled: true }
    });
    
    try {
        console.log('Starting backup manager with Nanobot integration...');
        
        // Register with Nanobot trust network
        const { Nanobot } = require('@nanobot-ai/nanobot');
        const agent = new Nanobot({
            name: 'backup-manager',
            network: 'trust-network-ai-agent',
            capabilities: ['backup_creation', 'backup_restoration', 'disaster_recovery']
        });
        
        await agent.register('trust-network-ai-agent');
        console.log('Registered with Nanobot trust network');
        
        // Start backup manager
        await manager.start();
        
        // Share backup metrics with network
        setInterval(async () => {
            const metrics = manager.getBackupMetrics();
            await agent.shareKnowledge('backup-metrics', metrics);
        }, 300000); // Every 5 minutes
        
        // Listen for backup requests from network
        agent.onMessage('backup-request', async (message) => {
            if (message.type === 'full') {
                const result = await manager.createFullBackup();
                await agent.shareKnowledge('backup-results', result);
            }
        });
        
    } catch (error) {
        console.error('Nanobot integration error:', error.message);
    }
}

nanobotIntegration();
EOF

# Test installation
print_status "Testing installation..."
cd "$INSTALL_DIR/backup-manager"

if node -e "const BackupManager = require('./index.js'); console.log('Backup Manager skill loaded successfully');" 2>/dev/null; then
    print_status "Backup Manager skill installed and working correctly"
else
    print_error "Backup Manager skill installation failed"
    exit 1
fi

# Create startup script
cat > "$INSTALL_DIR/backup-manager/start-backup-manager.sh" << EOF
#!/bin/bash
# Backup Manager startup script

CONFIG_FILE="\${1:-/etc/ai-agent/backup-manager-config.json}"

echo "💾 Starting AI Agent Backup Manager..."
echo "Using config: \$CONFIG_FILE"

cd "$INSTALL_DIR/backup-manager"
node index.js --config "\$CONFIG_FILE"
EOF

chmod +x "$INSTALL_DIR/backup-manager/start-backup-manager.sh"

# Create emergency restore script
cat > "$INSTALL_DIR/backup-manager/emergency-restore.sh" << EOF
#!/bin/bash
# Emergency restore script

BACKUP_ID="\${1:-}"
TARGET_PATH="\${2:-./emergency-restore}"

if [[ -z "\$BACKUP_ID" ]]; then
    echo "Usage: \$0 <backup_id> [target_path]"
    echo "Available backups:"
    node -e "
const BackupManager = require('./index.js');
const manager = new BackupManager();
manager.loadBackupCatalog().then(() => {
    const backups = manager.listBackups();
    backups.forEach(b => console.log(\`  \${b.id} - \${b.type} - \${b.startTime}\`));
});
"
    exit 1
fi

echo "🚨 Emergency restore starting..."
echo "Backup ID: \$BACKUP_ID"
echo "Target: \$TARGET_PATH"

cd "$INSTALL_DIR/backup-manager"
node -e "
const BackupManager = require('./index.js');
const manager = new BackupManager();
manager.start().then(() => {
    return manager.restoreBackup('\$BACKUP_ID', '\$TARGET_PATH');
}).then(result => {
    console.log('Restore completed:', result);
}).catch(error => {
    console.error('Restore failed:', error.message);
    process.exit(1);
});
"
EOF

chmod +x "$INSTALL_DIR/backup-manager/emergency-restore.sh"

print_status "Installation completed successfully!"
echo ""
echo "📋 Configuration files created:"
echo "- Development: $CONFIG_DIR/backup-manager-dev-config.json"
echo "- Production: $CONFIG_DIR/backup-manager-prod-config.json"
echo "- S3: $CONFIG_DIR/backup-manager-s3-config.json"
echo "- Default: $CONFIG_DIR/backup-manager-config.json"
echo ""
echo "🚀 Usage examples:"
echo "- Basic: node $INSTALL_DIR/backup-manager/examples/basic-backup.js"
echo "- S3: node $INSTALL_DIR/backup-manager/examples/s3-backup.js"
echo "- Restore: node $INSTALL_DIR/backup-manager/examples/restore-backup.js"
echo "- Nanobot: node $INSTALL_DIR/backup-manager/examples/nanobot-integration.js"
echo ""
echo "🔧 Management:"
echo "- Start: $INSTALL_DIR/backup-manager/start-backup-manager.sh"
echo "- Emergency restore: $INSTALL_DIR/backup-manager/emergency-restore.sh [backup_id]"
echo "- List backups: $INSTALL_DIR/backup-manager/emergency-restore.sh"
echo ""
if [[ $EUID -eq 0 ]]; then
    echo "🔧 Service management:"
    echo "- Start: sudo systemctl start ai-agent-backup"
    echo "- Stop: sudo systemctl stop ai-agent-backup"
    echo "- Status: sudo systemctl status ai-agent-backup"
    echo "- Logs: sudo journalctl -u ai-agent-backup -f"
fi
echo ""
echo "📅 Automatic backups scheduled via cron:"
echo "- Full backups: Sunday 2:00 AM"
echo "- Incremental backups: Monday-Saturday 3:00 AM"
echo ""
echo "📊 Backup storage: $BACKUP_DIR"
echo "📝 Logs: $LOG_DIR/backup*.log"
echo ""
echo "⚠️  Important: Configure AWS credentials in environment variables or config file for S3 backups"
