const SecurityKernel = require('./SecurityKernel');

/**
 * 📡 SwarmNetwork (Virtual P2P Router)
 * Simulates a secure network layer where agents communicate.
 * Enforces SecurityKernel rules for every packet.
 */
class SwarmNetwork {
    constructor() {
        this.nodes = new Map(); // ID -> SwarmNode instance
        this.security = new SecurityKernel();
        this.logs = []; // Traffic logs for observability
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
            return { success: false, error: 'ACCESS_DENIED', reason: access.reason };
        }

        // 📨 Deliver Message
        this._log(sourceId, targetId, type, 'DELIVERED', access.reason);
        
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
        this.logs.unshift(log);
        if (this.logs.length > 100) this.logs.pop(); // Keep last 100
    }

    getLogs() {
        return this.logs;
    }
}

// Singleton for the simulation
module.exports = new SwarmNetwork();
