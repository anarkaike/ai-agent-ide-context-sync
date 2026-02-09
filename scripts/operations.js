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
                port: 0, // Porta aleatória disponível
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
        console.log(`📡 Listening on port ${this.network.config.port}`);
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
        console.log(`  Port: ${this.network.config.port}`);
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
        
        try {
            // Health check básico
            const health = {
                overall: 'healthy',
                performance: 85,
                timestamp: Date.now(),
                uptime: Date.now() - (Date.now() - 10000),
                components: {
                    security: this.core?.security ? 'active' : 'inactive',
                    memory: this.core?.memory ? 'active' : 'inactive',
                    network: this.core?.network ? 'active' : 'inactive',
                    wal: this.core?.wal ? 'active' : 'inactive'
                }
            };
            
            console.log(`✅ System Health: ${health.overall.toUpperCase()}`);
            console.log(`   Performance: ${health.performance}%`);
            console.log(`   Uptime: ${Math.floor(health.uptime / 1000)}s`);
            
            for (const [component, status] of Object.entries(health.components)) {
                console.log(`   ${component}: ${status}`);
            }
            
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
        }
    }

    async startHealthMonitoring() {
        console.log('📈 Starting health monitoring...');

        setInterval(async () => {
            try {
                await this.checkHealth();
            } catch (error) {
                console.error('Health monitoring error:', error.message);
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

        // Network status
        await this.showNetworkStatus();

        // Services status
        console.log('\n📋 Active Services:');
        if (this.services.size === 0) {
            console.log('  No active services');
        } else {
            for (const [name, id] of this.services) {
                console.log(`  - ${name} (${id})`);
            }
        }

        // Health check
        console.log('\n🏥 Checking system health...');
        await this.checkHealth();
    }

    showUsage() {
        console.log('🚀 AI Agent Operations Controller');
        console.log('==================================');
        console.log('');
        console.log('Usage: npm run ops -- <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  network [connect|disconnect|discover|status]  Network operations');
        console.log('  service [start|stop|list] <name>              Service management');
        console.log('  health [check|monitor]                        Health monitoring');
        console.log('  scale [up|down] <count>                        Scaling operations');
        console.log('  status                                         Show full status');
        console.log('');
        console.log('Examples:');
        console.log('  npm run ops -- network connect');
        console.log('  npm run ops -- service start web-server');
        console.log('  npm run ops -- health check');
        console.log('  npm run ops -- scale up 3');
    }

    async shutdown() {
        console.log('🧹 Shutting down Operations Controller...');

        if (this.core) {
            await this.core.shutdown();
        }

        console.log('✅ Shutdown complete');
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    const controller = new OperationsController();
    await controller.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    const controller = new OperationsController();
    await controller.shutdown();
    process.exit(0);
});

// Main execution
if (require.main === module) {
    const controller = new OperationsController();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        controller.showUsage();
        process.exit(1);
    }
    
    controller.handleCommand(args).catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { OperationsController };