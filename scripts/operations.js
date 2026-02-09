#!/usr/bin/env node

/**
 * AI Agent Operations Controller
 * 
 * Centraliza operações do ecossistema de agentes:
 * - Network management
 * - Service orchestration
 * - Health monitoring
 * - Scaling operations
 */

const { initializeCore } = require('../packages/core/src/index.js');

class OperationsController {
    constructor() {
        this.core = null;
        this.network = null;
        this.services = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('🚀 Initializing AI Agent Operations...');

        // Initialize core system
        this.core = await initializeCore({
            security: {
                enableSandbox: true,
                enableEncryption: true,
                enableSigning: true
            },
            memory: {
                enableWAL: true,
                checkpointInterval: 60000,
                autoBackup: true
            },
            network: {
                port: 8082, // Use different port to avoid conflicts
                heartbeatInterval: 30000,
                discoveryInterval: 10000,
                healthCheckInterval: 30000
            }
        });

        this.network = this.core.network;
        this.isInitialized = true;

        console.log('✅ Operations Controller initialized');
    }

    async handleCommand(args) {
        const [command, ...params] = args;

        try {
            await this.initialize();

            switch (command) {
                case 'network':
                    await this.handleNetworkCommand(params);
                    break;

                case 'service':
                    await this.handleServiceCommand(params);
                    break;

                case 'health':
                    await this.handleHealthCommand(params);
                    break;

                case 'scale':
                    await this.handleScaleCommand(params);
                    break;

                case 'status':
                    await this.showStatus();
                    break;

                default:
                    this.showUsage();
            }
        } catch (error) {
            console.error(`❌ Operation failed: ${error.message}`);
            process.exit(1);
        }
    }

    async handleNetworkCommand(params) {
        const [action] = params;

        switch (action) {
            case 'connect':
                await this.connectNetwork();
                break;

            case 'disconnect':
                await this.disconnectNetwork();
                break;

            case 'discover':
                await this.discoverPeers();
                break;

            case 'status':
                await this.showNetworkStatus();
                break;

            default:
                console.log('Usage: npm run ops -- network [connect|disconnect|discover|status]');
        }
    }

    async handleServiceCommand(params) {
        const [action, serviceName] = params;

        switch (action) {
            case 'start':
                await this.startService(serviceName);
                break;

            case 'stop':
                await this.stopService(serviceName);
                break;

            case 'list':
                await this.listServices();
                break;

            default:
                console.log('Usage: npm run ops -- service [start|stop|list] [service-name]');
        }
    }

    async handleHealthCommand(params) {
        const [action] = params;

        switch (action) {
            case 'check':
                await this.checkHealth();
                break;

            case 'monitor':
                await this.startHealthMonitoring();
                break;

            default:
                console.log('Usage: npm run ops -- health [check|monitor]');
        }
    }

    async handleScaleCommand(params) {
        const [action, count] = params;

        switch (action) {
            case 'up':
                await this.scaleUp(parseInt(count) || 1);
                break;

            case 'down':
                await this.scaleDown(parseInt(count) || 1);
                break;

            default:
                console.log('Usage: npm run ops -- scale [up|down] [count]');
        }
    }

    async connectNetwork() {
        console.log('🌐 Connecting to Agent Mesh Network...');

        await this.network.start();

        // Register this node
        await this.network.registerNode({
            id: this.network.nodeId,
            type: 'operations-controller',
            capabilities: ['orchestration', 'monitoring', 'scaling'],
            metadata: {
                version: '1.0.0',
                startTime: new Date().toISOString()
            }
        });

        console.log(`✅ Connected to network as node ${this.network.nodeId}`);
        console.log(`📡 Listening on port ${this.network.port}`);
    }

    async disconnectNetwork() {
        console.log('🔌 Disconnecting from network...');

        await this.network.stop();

        console.log('✅ Disconnected from network');
    }

    async discoverPeers() {
        console.log('🔍 Discovering peers...');

        const peers = await this.network.discoverPeers();

        console.log(`Found ${peers.length} peers:`);
        peers.forEach(peer => {
            console.log(`  - ${peer.id} (${peer.type}) - ${peer.status}`);
        });
    }

    async showNetworkStatus() {
        console.log('📊 Network Status:');
        console.log(`  Node ID: ${this.network.nodeId}`);
        console.log(`  Port: ${this.network.port}`);
        console.log(`  Connected Peers: ${this.network.peers.size}`);
        console.log(`  Active Services: ${this.network.services.size}`);
        console.log(`  Status: ${this.network.isRunning ? 'Running' : 'Stopped'}`);
    }

    async startService(serviceName) {
        console.log(`🚀 Starting service: ${serviceName}`);

        const serviceId = await this.network.registerService(serviceName, {
            version: '1.0.0',
            healthCheckUrl: `/health/${serviceName}`,
            capabilities: []
        });

        this.services.set(serviceName, serviceId);
        console.log(`✅ Service ${serviceName} started (ID: ${serviceId})`);
    }

    async stopService(serviceName) {
        console.log(`🛑 Stopping service: ${serviceName}`);

        const serviceId = this.services.get(serviceName);
        if (serviceId) {
            await this.network.unregisterService(serviceId);
            this.services.delete(serviceName);
            console.log(`✅ Service ${serviceName} stopped`);
        } else {
            console.log(`❌ Service ${serviceName} not found`);
        }
    }

    async listServices() {
        console.log('📋 Active Services:');

        for (const [name, id] of this.services) {
            const status = await this.network.getServiceStatus(id);
            console.log(`  - ${name} (${id}): ${status}`);
        }
    }

    async checkHealth() {
        console.log('🏥 Checking system health...');

        const health = await this.core.autoOptimization.getSystemHealth();

        console.log('Health Report:');
        console.log(`  Overall: ${health.overall}%`);
        console.log(`  CPU: ${health.cpu}%`);
        console.log(`  Memory: ${health.memory}%`);
        console.log(`  Network: ${health.network}%`);
        console.log(`  Services: ${health.services}%`);
    }

    async startHealthMonitoring() {
        console.log('📈 Starting health monitoring...');

        setInterval(async () => {
            const health = await this.core.autoOptimization.getSystemHealth();

            if (health.overall < 70) {
                console.log(`⚠️ Health degraded: ${health.overall}%`);

                // Trigger self-healing
                await this.core.selfHealing.checkAndHeal({
                    type: 'system_degradation',
                    severity: 'medium',
                    context: health
                });
            }
        }, 30000); // Check every 30 seconds

        console.log('✅ Health monitoring started');
    }

    async scaleUp(count) {
        console.log(`📈 Scaling up by ${count} instances...`);

        for (let i = 0; i < count; i++) {
            const instanceId = `agent-${Date.now()}-${i}`;
            await this.startService(instanceId);
        }

        console.log(`✅ Scaled up by ${count} instances`);
    }

    async scaleDown(count) {
        console.log(`📉 Scaling down by ${count} instances...`);

        const services = Array.from(this.services.keys()).slice(-count);
        for (const serviceName of services) {
            await this.stopService(serviceName);
        }

        console.log(`✅ Scaled down by ${count} instances`);
    }

    async showStatus() {
        console.log('🎯 AI Agent Operations Status');
        console.log('================================');

        await this.showNetworkStatus();
        console.log();
        await this.listServices();
        console.log();
        await this.checkHealth();
    }

    showUsage() {
        console.log('AI Agent Operations Controller');
        console.log('===============================');
        console.log();
        console.log('Usage: npm run ops -- <command> [options]');
        console.log();
        console.log('Commands:');
        console.log('  network <action>     Network operations');
        console.log('    connect             Connect to mesh network');
        console.log('    disconnect          Disconnect from network');
        console.log('    discover            Discover peers');
        console.log('    status              Show network status');
        console.log();
        console.log('  service <action>     Service management');
        console.log('    start <name>        Start a service');
        console.log('    stop <name>         Stop a service');
        console.log('    list                List active services');
        console.log();
        console.log('  health <action>      Health monitoring');
        console.log('    check               Check system health');
        console.log('    monitor             Start health monitoring');
        console.log();
        console.log('  scale <action>       Scaling operations');
        console.log('    up <count>          Scale up instances');
        console.log('    down <count>        Scale down instances');
        console.log();
        console.log('  status               Show overall status');
    }

    async shutdown() {
        if (this.core) {
            console.log('🧹 Shutting down Operations Controller...');
            await this.core.shutdown();
            console.log('✅ Shutdown complete');
        }
    }
}

// Main execution
async function main() {
    const controller = new OperationsController();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await controller.shutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await controller.shutdown();
        process.exit(0);
    });

    // Execute command
    const args = process.argv.slice(2);
    if (args.length === 0) {
        controller.showUsage();
        return;
    }

    await controller.handleCommand(args);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { OperationsController };
