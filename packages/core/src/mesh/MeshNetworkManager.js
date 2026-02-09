/**
 * Mesh Network Manager - Agent Mesh Topology
 * Implementação de rede mesh para comunicação resiliente
 */

import EventEmitter from 'events';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class MeshNetworkManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.nodeId = options.nodeId || this.generateNodeId();
        this.networkId = options.networkId || 'default-mesh';
        this.peers = new Map();
        this.routes = new Map();
        this.messageQueue = [];
        this.isRunning = false;
        this.config = {
            maxPeers: options.maxPeers || 10,
            heartbeatInterval: options.heartbeatInterval || 30000,
            messageTimeout: options.messageTimeout || 5000,
            retryAttempts: options.retryAttempts || 3,
            ...options
        };
        
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            peersConnected: 0,
            routesDiscovered: 0,
            uptime: Date.now()
        };
        
        this.loadNetworkState();
    }

    /**
     * Gera ID único do nó
     */
    generateNodeId() {
        const hostname = require('os').hostname();
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `node_${hostname}_${timestamp}_${random}`;
    }

    /**
     * Inicializa a rede mesh
     */
    async initialize() {
        console.log(`🕸️ Initializing Mesh Network`);
        console.log(`   Node ID: ${this.nodeId}`);
        console.log(`   Network ID: ${this.networkId}`);
        
        try {
            // Criar diretórios necessários
            await this.ensureDirectories();
            
            // Carregar estado anterior
            await this.loadNetworkState();
            
            // Iniciar heartbeat
            this.startHeartbeat();
            
            // Descobrir peers iniciais
            await this.discoverPeers();
            
            this.isRunning = true;
            this.emit('initialized', { nodeId: this.nodeId });
            
            console.log('✅ Mesh network initialized');
            
            return {
                success: true,
                nodeId: this.nodeId,
                networkId: this.networkId,
                peersCount: this.peers.size
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize mesh network:', error.message);
            throw error;
        }
    }

    /**
     * Descobre peers na rede
     */
    async discoverPeers() {
        console.log('🔍 Discovering mesh peers...');
        
        try {
            // Descobrir via WebMap API
            const localPeers = await this.discoverLocalPeers();
            
            // Descobrir via arquivos de configuração
            const configPeers = await this.discoverConfigPeers();
            
            // Combinar peers
            const allPeers = [...localPeers, ...configPeers];
            
            // Conectar aos peers
            for (const peer of allPeers) {
                await this.connectToPeer(peer);
            }
            
            console.log(`📡 Discovered ${allPeers.length} potential peers`);
            console.log(`🔗 Connected to ${this.peers.size} peers`);
            
            return {
                discovered: allPeers.length,
                connected: this.peers.size,
                peers: Array.from(this.peers.keys())
            };
            
        } catch (error) {
            console.error('❌ Peer discovery failed:', error.message);
            return { discovered: 0, connected: 0 };
        }
    }

    /**
     * Descobre peers locais via WebMap
     */
    async discoverLocalPeers() {
        const peers = [];
        
        try {
            // Verificar WebMap local
            const response = await fetch('http://localhost:3456/api/comms/messages');
            if (response.ok) {
                peers.push({
                    id: 'local-webmap',
                    address: 'localhost:3456',
                    type: 'webmap',
                    status: 'active'
                });
            }
        } catch (error) {
            // WebMap não disponível
        }
        
        // Verificar outros processos Swarm
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync('ps aux | grep SwarmClient | grep -v grep');
            const processes = stdout.trim().split('\n');
            
            processes.forEach((proc, index) => {
                if (proc.trim()) {
                    peers.push({
                        id: `swarm-${index}`,
                        address: `localhost:${3456 + index}`,
                        type: 'swarmclient',
                        status: 'running'
                    });
                }
            });
        } catch (error) {
            // Nenhum processo encontrado
        }
        
        return peers;
    }

    /**
     * Descobre peers via configuração
     */
    async discoverConfigPeers() {
        const peers = [];
        
        try {
            // Ler configuração de mesh
            const meshConfigPath = '.ai-workspace/mesh-config.json';
            if (fs.existsSync(meshConfigPath)) {
                const config = JSON.parse(fs.readFileSync(meshConfigPath, 'utf8'));
                
                // Adicionar peers configurados
                if (config.known_peers) {
                    config.known_peers.forEach(peer => {
                        peers.push({
                            id: peer.id,
                            address: peer.address,
                            type: 'configured',
                            status: 'unknown'
                        });
                    });
                }
            }
        } catch (error) {
            // Configuração não encontrada
        }
        
        return peers;
    }

    /**
     * Conecta a um peer
     */
    async connectToPeer(peer) {
        if (this.peers.has(peer.id)) {
            return; // Já conectado
        }
        
        if (this.peers.size >= this.config.maxPeers) {
            console.log('⚠️ Max peers reached, rejecting connection');
            return;
        }
        
        try {
            console.log(`🔗 Connecting to peer: ${peer.id} (${peer.address})`);
            
            // Testar conectividade
            const isConnected = await this.testPeerConnection(peer);
            
            if (isConnected) {
                this.peers.set(peer.id, {
                    ...peer,
                    connectedAt: Date.now(),
                    lastSeen: Date.now(),
                    status: 'connected'
                });
                
                this.metrics.peersConnected++;
                this.emit('peerConnected', peer);
                
                console.log(`✅ Connected to peer: ${peer.id}`);
                
                // Descobrir rotas através deste peer
                await this.discoverRoutes(peer);
                
            } else {
                console.log(`❌ Failed to connect to peer: ${peer.id}`);
            }
            
        } catch (error) {
            console.error(`❌ Connection to ${peer.id} failed:`, error.message);
        }
    }

    /**
     * Testa conexão com peer
     */
    async testPeerConnection(peer) {
        try {
            const [host, port] = peer.address.split(':');
            const url = `http://${host}:${port}/api/comms/messages`;
            
            const response = await fetch(url, { 
                method: 'GET',
                timeout: this.config.messageTimeout 
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Descobre rotas através de um peer
     */
    async discoverRoutes(peer) {
        try {
            console.log(`🗺️ Discovering routes through ${peer.id}...`);
            
            // Pedir lista de peers ao peer conectado
            const routes = await this.requestPeerRoutes(peer);
            
            for (const route of routes) {
                if (!this.routes.has(route.destination)) {
                    this.routes.set(route.destination, {
                        via: peer.id,
                        hops: route.hops || 1,
                        lastSeen: Date.now()
                    });
                    
                    this.metrics.routesDiscovered++;
                    this.emit('routeDiscovered', route);
                }
            }
            
            console.log(`📍 Discovered ${routes.length} routes through ${peer.id}`);
            
        } catch (error) {
            console.error(`❌ Route discovery through ${peer.id} failed:`, error.message);
        }
    }

    /**
     * Envia mensagem para a rede mesh
     */
    async sendMessage(destination, message, options = {}) {
        const messageId = this.generateMessageId();
        const messageObj = {
            id: messageId,
            from: this.nodeId,
            to: destination,
            content: message,
            timestamp: Date.now(),
            ttl: options.ttl || 5,
            route: []
        };
        
        try {
            console.log(`📤 Sending message to ${destination}`);
            
            // Determinar rota
            const route = this.findRoute(destination);
            
            if (route) {
                // Enviar via rota descoberta
                await this.sendViaRoute(messageObj, route);
            } else if (destination === 'broadcast') {
                // Broadcast para todos os peers
                await this.broadcastMessage(messageObj);
            } else {
                // Tentar entrega direta
                await this.sendDirect(messageObj, destination);
            }
            
            this.metrics.messagesSent++;
            this.emit('messageSent', messageObj);
            
            return {
                success: true,
                messageId: messageId,
                route: route || 'direct'
            };
            
        } catch (error) {
            console.error(`❌ Failed to send message to ${destination}:`, error.message);
            
            // Adicionar à fila para retry
            this.messageQueue.push({
                ...messageObj,
                retryCount: 0,
                nextRetry: Date.now() + 5000
            });
            
            throw error;
        }
    }

    /**
     * Envia mensagem via rota específica
     */
    async sendViaRoute(message, route) {
        const nextHop = route.via;
        const peer = this.peers.get(nextHop);
        
        if (!peer) {
            throw new Error(`Next hop ${nextHop} not available`);
        }
        
        // Adicionar à rota
        message.route.push(this.nodeId);
        
        // Enviar para o próximo hop
        await this.sendToPeer(peer, message);
    }

    /**
     * Envia mensagem broadcast
     */
    async broadcastMessage(message) {
        const promises = [];
        
        for (const peer of this.peers.values()) {
            if (peer.status === 'connected') {
                promises.push(this.sendToPeer(peer, { ...message, to: 'broadcast' }));
            }
        }
        
        await Promise.allSettled(promises);
    }

    /**
     * Envia mensagem diretamente
     */
    async sendDirect(message, destination) {
        const peer = this.peers.get(destination);
        
        if (peer && peer.status === 'connected') {
            await this.sendToPeer(peer, message);
        } else {
            throw new Error(`Peer ${destination} not available for direct delivery`);
        }
    }

    /**
     * Envia mensagem para peer específico
     */
    async sendToPeer(peer, message) {
        try {
            const [host, port] = peer.address.split(':');
            const url = `http://${host}:${port}/api/comms/send`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message),
                timeout: this.config.messageTimeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            peer.lastSeen = Date.now();
            
        } catch (error) {
            peer.status = 'error';
            throw error;
        }
    }

    /**
     * Encontra rota para destino
     */
    findRoute(destination) {
        // Rota direta se o peer estiver conectado
        if (this.peers.has(destination)) {
            return { via: destination, hops: 0 };
        }
        
        // Rota cacheada
        return this.routes.get(destination);
    }

    /**
     * Processa mensagem recebida
     */
    async processMessage(message) {
        try {
            console.log(`📥 Received message from ${message.from}`);
            
            this.metrics.messagesReceived++;
            this.emit('messageReceived', message);
            
            // Verificar se a mensagem é para este nó
            if (message.to === this.nodeId || message.to === 'broadcast') {
                // Processar mensagem localmente
                await this.handleMessage(message);
            }
            
            // Verificar TTL e fazer forward se necessário
            if (message.ttl > 0 && message.to !== this.nodeId) {
                await this.forwardMessage(message);
            }
            
        } catch (error) {
            console.error('❌ Failed to process message:', error.message);
        }
    }

    /**
     * Forward mensagem para outros peers
     */
    async forwardMessage(message) {
        const forwardedMessage = {
            ...message,
            ttl: message.ttl - 1,
            route: [...message.route, this.nodeId]
        };
        
        // Evitar loops
        if (forwardedMessage.route.includes(message.to)) {
            return;
        }
        
        // Enviar para todos os peers exceto o remetente
        for (const peer of this.peers.values()) {
            if (peer.id !== message.from && peer.status === 'connected') {
                try {
                    await this.sendToPeer(peer, forwardedMessage);
                } catch (error) {
                    // Ignorar falhas no forward
                }
            }
        }
    }

    /**
     * Lida com mensagem local
     */
    async handleMessage(message) {
        // Emitir evento para handlers registrados
        this.emit('message', message);
        
        // Salvar mensagem no histórico
        await this.saveMessage(message);
    }

    /**
     * Inicia heartbeat
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            await this.performHeartbeat();
        }, this.config.heartbeatInterval);
    }

    /**
     * Executa heartbeat
     */
    async performHeartbeat() {
        try {
            // Enviar heartbeat para todos os peers
            const heartbeat = {
                type: 'heartbeat',
                from: this.nodeId,
                timestamp: Date.now(),
                metrics: this.metrics
            };
            
            for (const peer of this.peers.values()) {
                try {
                    await this.sendToPeer(peer, heartbeat);
                    peer.status = 'connected';
                    peer.lastSeen = Date.now();
                } catch (error) {
                    peer.status = 'disconnected';
                }
            }
            
            // Limpar peers desconectados
            this.cleanupDisconnectedPeers();
            
            // Processar fila de retry
            await this.processRetryQueue();
            
        } catch (error) {
            console.error('❌ Heartbeat failed:', error.message);
        }
    }

    /**
     * Limpa peers desconectados
     */
    cleanupDisconnectedPeers() {
        const now = Date.now();
        const timeout = this.config.heartbeatInterval * 3;
        
        for (const [peerId, peer] of this.peers.entries()) {
            if (now - peer.lastSeen > timeout && peer.status === 'disconnected') {
                this.peers.delete(peerId);
                this.metrics.peersConnected--;
                this.emit('peerDisconnected', peer);
                console.log(`🔌 Peer disconnected: ${peerId}`);
            }
        }
    }

    /**
     * Processa fila de retry
     */
    async processRetryQueue() {
        const now = Date.now();
        const messagesToRetry = [];
        
        for (const msg of this.messageQueue) {
            if (now >= msg.nextRetry && msg.retryCount < this.config.retryAttempts) {
                messagesToRetry.push(msg);
            }
        }
        
        for (const msg of messagesToRetry) {
            try {
                await this.sendMessage(msg.to, msg.content);
                // Remover da fila se sucesso
                const index = this.messageQueue.indexOf(msg);
                this.messageQueue.splice(index, 1);
            } catch (error) {
                // Incrementar retry count
                msg.retryCount++;
                msg.nextRetry = now + (5000 * Math.pow(2, msg.retryCount));
            }
        }
    }

    /**
     * Obtém status da rede
     */
    getNetworkStatus() {
        return {
            nodeId: this.nodeId,
            networkId: this.networkId,
            isRunning: this.isRunning,
            peers: Array.from(this.peers.values()).map(peer => ({
                id: peer.id,
                address: peer.address,
                status: peer.status,
                connectedAt: peer.connectedAt,
                lastSeen: peer.lastSeen
            })),
            routes: Array.from(this.routes.entries()).map(([dest, route]) => ({
                destination: dest,
                via: route.via,
                hops: route.hops,
                lastSeen: route.lastSeen
            })),
            metrics: {
                ...this.metrics,
                uptime: Date.now() - this.metrics.uptime
            },
            queueSize: this.messageQueue.length
        };
    }

    /**
     * Salva estado da rede
     */
    async saveNetworkState() {
        try {
            const state = {
                nodeId: this.nodeId,
                networkId: this.networkId,
                peers: Array.from(this.peers.entries()),
                routes: Array.from(this.routes.entries()),
                metrics: this.metrics,
                savedAt: Date.now()
            };
            
            const statePath = '.ai-workspace/mesh-state.json';
            fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to save network state:', error.message);
        }
    }

    /**
     * Carrega estado da rede
     */
    async loadNetworkState() {
        try {
            const statePath = '.ai-workspace/mesh-state.json';
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                
                // Restaurar peers
                this.peers = new Map(state.peers || []);
                
                // Restaurar rotas
                this.routes = new Map(state.routes || []);
                
                // Restaurar métricas
                this.metrics = { ...this.metrics, ...state.metrics };
                
                console.log('📦 Network state loaded');
            }
        } catch (error) {
            console.error('⚠️ Failed to load network state:', error.message);
        }
    }

    /**
     * Salva mensagem no histórico
     */
    async saveMessage(message) {
        try {
            const messagePath = `.ai-workspace/mesh-messages-${Date.now()}.json`;
            fs.writeFileSync(messagePath, JSON.stringify(message, null, 2));
        } catch (error) {
            // Ignorar falhas no salvamento
        }
    }

    /**
     * Garante diretórios existam
     */
    async ensureDirectories() {
        const dirs = ['.ai-workspace', '.ai-workspace/logs'];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    /**
     * Gera ID de mensagem
     */
    generateMessageId() {
        return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Para a rede mesh
     */
    async shutdown() {
        console.log('🛑 Shutting down mesh network...');
        
        this.isRunning = false;
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        await this.saveNetworkState();
        
        this.emit('shutdown');
        
        console.log('✅ Mesh network shut down');
    }
}

export default MeshNetworkManager;
