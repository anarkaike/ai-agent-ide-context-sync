const SecurityKernel = require('./SecurityKernel');
const DatabaseManager = require('./DatabaseManager');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 📡 SwarmNetwork (Virtual P2P Router)
 * Simulates a secure network layer where agents communicate.
 * Enforces SecurityKernel rules for every packet.
 */
class SwarmNetwork {
    constructor() {
        this.nodes = new Map(); // ID -> SwarmNode instance
        this.dbManager = new DatabaseManager();
        this.security = new SecurityKernel(this.dbManager); // Pass DB Manager for logging
        this.logFile = path.join(os.homedir(), '.ai-doc', 'swarm', 'network_logs.json');
        this.init();
    }

    async init() {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, JSON.stringify([], null, 2));
        }
        
        try {
            await this.dbManager.init();
            console.log('🔌 [Network] Connected to SQLite persistence.');
        } catch (e) {
            console.error('❌ [Network] Failed to connect to SQLite:', e);
        }
    }

    /**
     * Connect a node to the network
     */
    connect(node) {
        this.nodes.set(node.config.id, node);
        console.log(`🔌 [Network] Node connected: ${node.config.id}`);
    }

    disconnect(nodeId) {
        this.nodes.delete(nodeId);
    }

    /**
     * Send a message from one node to another
     */
    async send(sourceId, targetId, type, payload) {
        const source = this.nodes.get(sourceId);
        const target = this.nodes.get(targetId);

        if (!source || !target) {
            this._log(sourceId, targetId, type, 'DROPPED', 'Node not found');
            return { success: false, error: 'NODE_NOT_FOUND' };
        }

        // 🛡️ Security Check
        const access = this.security.validateCommunication(source.config, target.config);
        
        if (!access.allowed) {
            console.warn(`🛡️ [Network] BLOCKED: ${source.config.name} -> ${target.config.name} (${access.reason})`);
            this._log(sourceId, targetId, type, 'BLOCKED', access.reason);
            
            // Log Security Event
            this.security.logSecurityEvent({
                severity: 'HIGH',
                action: 'COMMUNICATION_BLOCKED',
                agent_role: source.config.roles[0],
                resource: `AGENT:${target.config.name}`,
                details: access.reason,
                ip: source.config.network?.ip || '0.0.0.0'
            }).catch(err => console.error('Failed to log security event:', err));

            return { success: false, error: 'ACCESS_DENIED', reason: access.reason };
        }

        // 📨 Deliver Message
        this._log(sourceId, targetId, type, 'DELIVERED', access.reason);
        
        // Record Interaction in Topology
        this.dbManager.recordInteraction(sourceId, targetId, type).catch(err => console.error('Topology Record Error:', err));

        // Async delivery simulation
        setImmediate(() => {
            if (target.receiveMessage) {
                target.receiveMessage({
                    from: sourceId,
                    type: type,
                    payload: payload,
                    timestamp: Date.now()
                });
            }
        });

        return { success: true };
    }

    _log(from, to, type, status, reason) {
        const log = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: Date.now(),
            from,
            to,
            type,
            status,
            reason
        };
        
        // Log to SQLite
        this.dbManager.logNetworkEvent(log).catch(err => console.error('Network Log Error:', err));

        // Load existing logs
        let logs = [];
        try {
            logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
        } catch (e) {
            logs = [];
        }

        logs.unshift(log);
        if (logs.length > 100) logs = logs.slice(0, 100); // Keep last 100

        try {
            fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
        } catch (e) {
            console.error('Failed to write network logs', e);
        }
    }

    getLogs() {
        try {
            return JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
        } catch (e) {
            return [];
        }
    }
}

// Singleton for the simulation
module.exports = new SwarmNetwork();
