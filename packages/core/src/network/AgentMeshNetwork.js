/**
 * Agent Mesh Network - Core Implementation
 * 
 * Implementação da rede mesh para comunicação entre agentes IA
 * com service discovery, load balancing e fault tolerance.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { createServer } from 'http';
import http from 'http';

class AgentMeshNetwork extends EventEmitter {
    constructor(options = {}) {
        super();

        this.nodeId = options.nodeId || this._generateNodeId();
        this.port = options.port || 8083;
        this.peers = new Map(); // nodeId -> peer info
        this.config = {
            port: options.port || 8083, // Mudado de 8082 para 8083 (conflito Docker)
            host: options.host || '0.0.0.0',
            maxPeers: options.maxPeers || 50,
            heartbeatInterval: options.heartbeatInterval || 30000,
            discoveryInterval: options.discoveryInterval || 60000,
            messageTimeout: options.messageTimeout || 5000,
            retryAttempts: options.retryAttempts || 3,
            enableEncryption: options.enableEncryption !== false,
            enableCompression: options.enableCompression !== false,
            ...options
        };
        this.services = new Map(); // serviceType -> [nodeIds]
        this.messageQueue = new Map(); // nodeId -> [messages]

        // Mesh state
        this.isRunning = false;
        this.server = null;
        this.heartbeatTimer = null;

        // Metrics
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            peersConnected: 0,
            servicesRegistered: 0,
            uptime: 0
        };

        console.log(`[MeshNetwork] Node ${this.nodeId} initialized`);
    }

    /**
     * Gera ID único para o nó
     */
    _generateNodeId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Inicia a rede mesh
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Mesh network is already running');
        }

        try {
            // Inicializa o servidor
            await this._startServer();

            // Inicia heartbeat
            this._startHeartbeat();

            this.isRunning = true;
            this.metrics.uptime = Date.now();

            console.log(`[MeshNetwork] Started on port ${this.port}`);
            this.emit('started', { nodeId: this.nodeId, port: this.port });

            return true;
        } catch (error) {
            console.error('[MeshNetwork] Failed to start:', error);
            throw error;
        }
    }

    /**
     * Para a rede mesh
     */
    async stop() {
        if (!this.isRunning) return;

        try {
            // Para heartbeat
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
            }

            // Notifica peers sobre desconexão
            await this._broadcastGoodbye();

            // Para servidor
            if (this.server) {
                this.server.close();
            }

            this.isRunning = false;
            console.log(`[MeshNetwork] Stopped`);
            this.emit('stopped', { nodeId: this.nodeId });

            return true;
        } catch (error) {
            console.error('[MeshNetwork] Failed to stop:', error);
            throw error;
        }
    }

    /**
     * Registra um nó na rede mesh
     */
    async registerNode(nodeInfo) {
        try {
            const node = {
                id: nodeInfo.id || this.nodeId,
                type: nodeInfo.type || 'agent',
                capabilities: nodeInfo.capabilities || [],
                metadata: nodeInfo.metadata || {},
                registeredAt: Date.now(),
                status: 'active'
            };

            // Adicionar ao registry local
            this.peers.set(node.id, {
                ...node,
                address: `localhost:${this.port}`,
                lastSeen: Date.now()
            });

            // Registrar serviços do nó
            if (nodeInfo.capabilities) {
                for (const capability of nodeInfo.capabilities) {
                    this.registerService(capability, node.metadata);
                }
            }

            console.log(`[MeshNetwork] Node ${node.id} registered successfully`);
            this.emit('nodeRegistered', node);

            return node;
        } catch (error) {
            console.error(`[MeshNetwork] Failed to register node:`, error);
            throw error;
        }
    }

    /**
     * Conecta a um peer existente
     */
    async connectToPeer(peerAddress) {
        try {
            const response = await this._sendRequest(peerAddress, '/handshake', {
                nodeId: this.nodeId,
                port: this.port,
                timestamp: Date.now()
            });

            if (response.success) {
                this._addPeer(response.nodeId, peerAddress, response.services);
                console.log(`[MeshNetwork] Connected to peer ${response.nodeId}`);
                this.emit('peerConnected', { nodeId: response.nodeId, address: peerAddress });
                return true;
            }

            return false;
        } catch (error) {
            console.error(`[MeshNetwork] Failed to connect to peer ${peerAddress}:`, error);
            return false;
        }
    }

    /**
     * Registra um serviço no nó
     */
    registerService(serviceType, metadata = {}) {
        const serviceInfo = {
            nodeId: this.nodeId,
            type: serviceType,
            metadata,
            registeredAt: Date.now()
        };

        if (!this.services.has(serviceType)) {
            this.services.set(serviceType, new Set());
        }

        this.services.get(serviceType).add(this.nodeId);
        this.metrics.servicesRegistered++;

        console.log(`[MeshNetwork] Service ${serviceType} registered`);
        this.emit('serviceRegistered', serviceInfo);

        // Broadcast para a rede
        this._broadcastServiceRegistration(serviceInfo);

        return serviceInfo;
    }

    /**
     * Encontra nós com um serviço específico
     */
    findServiceNodes(serviceType) {
        const nodes = this.services.get(serviceType);
        return nodes ? Array.from(nodes) : [];
    }

    /**
     * Envia mensagem para um nó específico
     */
    async sendMessage(nodeId, message) {
        const peer = this.peers.get(nodeId);
        if (!peer) {
            throw new Error(`Peer ${nodeId} not found`);
        }

        try {
            const response = await this._sendRequest(peer.address, '/message', {
                from: this.nodeId,
                to: nodeId,
                message,
                timestamp: Date.now()
            });

            this.metrics.messagesSent++;
            return response;
        } catch (error) {
            console.error(`[MeshNetwork] Failed to send message to ${nodeId}:`, error);
            throw error;
        }
    }

    /**
     * Broadcast mensagem para todos os peers
     */
    async broadcastMessage(message, excludeNodes = []) {
        const promises = [];

        for (const [nodeId, peer] of this.peers) {
            if (!excludeNodes.includes(nodeId)) {
                promises.push(
                    this.sendMessage(nodeId, message).catch(err => {
                        console.error(`Broadcast to ${nodeId} failed:`, err);
                    })
                );
            }
        }

        await Promise.all(promises);
        this.metrics.messagesSent += promises.length;
    }

    /**
     * Executa load balancing para um serviço
     */
    selectNodeForService(serviceType, strategy = 'round-robin') {
        const nodes = this.findServiceNodes(serviceType);
        if (nodes.length === 0) {
            return null;
        }

        switch (strategy) {
            case 'round-robin':
                // Implementar round-robin
                return nodes[Math.floor(Math.random() * nodes.length)];

            case 'least-connections':
                // Implementar least-connections
                return nodes[0]; // Simplificado

            case 'random':
            default:
                return nodes[Math.floor(Math.random() * nodes.length)];
        }
    }

    /**
     * Obtém métricas da rede
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.isRunning ? Date.now() - this.metrics.uptime : 0,
            peersCount: this.peers.size,
            servicesCount: this.services.size,
            isRunning: this.isRunning
        };
    }

    /**
     * Inicia servidor HTTP para comunicação
     */
    async _startServer() {
        this.server = createServer(async (req, res) => {
            try {
                const url = new URL(req.url, `http://localhost:${this.port}`);
                const path = url.pathname;

                // CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                if (req.method === 'OPTIONS') {
                    res.writeHead(200);
                    res.end();
                    return;
                }

                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const data = body ? JSON.parse(body) : {};
                        const result = await this._handleRequest(path, data, req.method);

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });

        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Manipula requisições HTTP
     */
    async _handleRequest(path, data, method) {
        switch (path) {
            case '/handshake':
                return this._handleHandshake(data);

            case '/message':
                return this._handleMessage(data);

            case '/heartbeat':
                return this._handleHeartbeat(data);

            case '/services/register':
                return this._handleServiceRegistration(data);

            case '/services/discover':
                return this._handleServiceDiscovery(data);

            case '/metrics':
                return this.getMetrics();

            default:
                throw new Error(`Unknown endpoint: ${path}`);
        }
    }

    /**
     * Handle handshake
     */
    _handleHandshake(data) {
        this._addPeer(data.nodeId, `http://${data.address}:${data.port}`, data.services || []);

        return {
            success: true,
            nodeId: this.nodeId,
            port: this.port,
            services: this._getMyServices()
        };
    }

    /**
     * Handle message
     */
    _handleMessage(data) {
        this.metrics.messagesReceived++;
        this.emit('message', {
            from: data.from,
            to: data.to,
            message: data.message,
            timestamp: data.timestamp
        });

        return { success: true, received: true };
    }

    /**
     * Handle heartbeat
     */
    _handleHeartbeat(data) {
        const peer = this.peers.get(data.nodeId);
        if (peer) {
            peer.lastSeen = Date.now();
        }

        return { success: true, timestamp: Date.now() };
    }

    /**
     * Handle service registration
     */
    _handleServiceRegistration(data) {
        if (!this.services.has(data.type)) {
            this.services.set(data.type, new Set());
        }

        this.services.get(data.type).add(data.nodeId);

        this.emit('serviceRegistered', data);

        return { success: true };
    }

    /**
     * Handle service discovery
     */
    _handleServiceDiscovery(data) {
        const nodes = this.findServiceNodes(data.serviceType);
        return { success: true, nodes };
    }

    /**
     * Adiciona peer à rede
     */
    _addPeer(nodeId, address, services = []) {
        this.peers.set(nodeId, {
            nodeId,
            address,
            services,
            connectedAt: Date.now(),
            lastSeen: Date.now()
        });

        this.metrics.peersConnected++;

        // Registra serviços do peer
        services.forEach(service => {
            if (!this.services.has(service)) {
                this.services.set(service, new Set());
            }
            this.services.get(service).add(nodeId);
        });
    }

    /**
     * Envia requisição HTTP
     */
    async _sendRequest(address, path, data) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(data);

            const options = {
                hostname: address.split(':')[1].replace('//', ''),
                port: parseInt(address.split(':')[2]),
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * Inicia heartbeat
     */
    _startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this._sendHeartbeat();
            this._checkPeerHealth();
        }, this.heartbeatInterval);
    }

    /**
     * Envia heartbeat para todos os peers
     */
    async _sendHeartbeat() {
        const now = Date.now();
        const timeout = this.heartbeatInterval * 3;
        const peersToRemove = [];

        for (const [nodeId, peer] of this.peers) {
            try {
                await this._sendRequest(peer.address, '/heartbeat', {
                    nodeId: this.nodeId,
                    timestamp: now
                });

                // Atualiza last heartbeat sucesso
                peer.lastHeartbeat = now;

            } catch (error) {
                console.warn(`Heartbeat to ${nodeId} failed:`, error.message);

                // Incrementa contador de falhas
                peer.failedHeartbeats = (peer.failedHeartbeats || 0) + 1;

                // Remove peer após 3 falhas consecutivas
                if (peer.failedHeartbeats >= 3) {
                    console.log(`🗑️ Removing inactive peer: ${nodeId}`);
                    peersToRemove.push(nodeId);
                }
            }
        }

        // Remove peers inativos
        for (const nodeId of peersToRemove) {
            this.peers.delete(nodeId);
            console.log(`✅ Peer ${nodeId} removed from network`);
        }
    }

    /**
     * Verifica saúde dos peers
     */
    _checkPeerHealth() {
        const now = Date.now();
        const timeout = this.heartbeatInterval * 3;

        for (const [nodeId, peer] of this.peers) {
            if (now - peer.lastSeen > timeout) {
                console.warn(`Peer ${nodeId} appears to be dead, removing...`);
                this._removePeer(nodeId);
            }
        }
    }

    /**
     * Remove peer da rede
     */
    _removePeer(nodeId) {
        this.peers.delete(nodeId);
        this.metrics.peersConnected--;

        // Remove serviços do peer
        for (const [serviceType, nodes] of this.services) {
            nodes.delete(nodeId);
            if (nodes.size === 0) {
                this.services.delete(serviceType);
            }
        }

        this.emit('peerDisconnected', { nodeId });
    }

    /**
     * Broadcast de goodbye
     */
    async _broadcastGoodbye() {
        await this.broadcastMessage({
            type: 'goodbye',
            nodeId: this.nodeId,
            timestamp: Date.now()
        });
    }

    /**
     * Broadcast de registro de serviço
     */
    async _broadcastServiceRegistration(serviceInfo) {
        await this.broadcastMessage({
            type: 'service-registered',
            service: serviceInfo
        });
    }

    /**
     * Obtém serviços locais
     */
    _getMyServices() {
        const services = [];
        for (const [serviceType, nodes] of this.services) {
            if (nodes.has(this.nodeId)) {
                services.push(serviceType);
            }
        }
        return services;
    }
}

export { AgentMeshNetwork };
