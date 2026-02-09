/**
 * Load Balancer - Agent Mesh Network
 * 
 * Sistema de distribuição de carga para serviços na rede mesh
 */

class LoadBalancer {
    constructor(meshNetwork, options = {}) {
        this.mesh = meshNetwork;
        this.strategies = {
            'round-robin': this._roundRobin.bind(this),
            'least-connections': this._leastConnections.bind(this),
            'weighted': this._weighted.bind(this),
            'random': this._random.bind(this),
            'hash': this._hash.bind(this)
        };

        // Estado para estratégias
        this.roundRobinCounters = new Map(); // serviceType -> counter
        this.connectionCounts = new Map(); // nodeId -> count
        this.weights = new Map(); // nodeId -> weight

        // Configurações
        this.defaultStrategy = options.defaultStrategy || 'round-robin';
        this.healthCheckInterval = options.healthCheckInterval || 30000;

        // Inicia health checks
        this._startHealthChecks();

        console.log('[LoadBalancer] Initialized');
    }

    /**
     * Seleciona um nó para processar requisição
     */
    selectNode(serviceType, options = {}) {
        const strategy = options.strategy || this.defaultStrategy;
        const nodes = this.mesh.findServiceNodes(serviceType);

        if (nodes.length === 0) {
            return null;
        }

        // Filtra nós saudáveis
        const healthyNodes = this._filterHealthyNodes(nodes);
        if (healthyNodes.length === 0) {
            console.warn(`No healthy nodes available for service ${serviceType}`);
            return nodes[0]; // Fallback para primeiro nó
        }

        // Aplica estratégia de balanceamento
        const strategyFunc = this.strategies[strategy];
        if (!strategyFunc) {
            throw new Error(`Unknown load balancing strategy: ${strategy}`);
        }

        const selectedNode = strategyFunc(healthyNodes, options);

        // Incrementa contador de conexões
        this._incrementConnection(selectedNode);

        console.log(`[LoadBalancer] Selected node ${selectedNode} for service ${serviceType} using ${strategy}`);

        return selectedNode;
    }

    /**
     * Registra peso para um nó
     */
    setWeight(nodeId, weight) {
        this.weights.set(nodeId, weight);
        console.log(`[LoadBalancer] Set weight ${weight} for node ${nodeId}`);
    }

    /**
     * Obtém estatísticas de balanceamento
     */
    getStats() {
        return {
            connectionCounts: Object.fromEntries(this.connectionCounts),
            weights: Object.fromEntries(this.weights),
            roundRobinCounters: Object.fromEntries(this.roundRobinCounters),
            totalConnections: Array.from(this.connectionCounts.values()).reduce((a, b) => a + b, 0)
        };
    }

    /**
     * Estratégia: Round Robin
     */
    _roundRobin(nodes, options) {
        const serviceType = options.serviceType || 'default';

        if (!this.roundRobinCounters.has(serviceType)) {
            this.roundRobinCounters.set(serviceType, 0);
        }

        const counter = this.roundRobinCounters.get(serviceType);
        const selectedNode = nodes[counter % nodes.length];

        this.roundRobinCounters.set(serviceType, counter + 1);

        return selectedNode;
    }

    /**
     * Estratégia: Least Connections
     */
    _leastConnections(nodes, options) {
        let selectedNode = nodes[0];
        let minConnections = this.connectionCounts.get(selectedNode) || 0;

        for (const nodeId of nodes) {
            const connections = this.connectionCounts.get(nodeId) || 0;
            if (connections < minConnections) {
                minConnections = connections;
                selectedNode = nodeId;
            }
        }

        return selectedNode;
    }

    /**
     * Estratégia: Weighted
     */
    _weighted(nodes, options) {
        const totalWeight = nodes.reduce((sum, nodeId) => {
            return sum + (this.weights.get(nodeId) || 1);
        }, 0);

        if (totalWeight === 0) {
            return nodes[0];
        }

        let random = Math.random() * totalWeight;

        for (const nodeId of nodes) {
            const weight = this.weights.get(nodeId) || 1;
            random -= weight;
            if (random <= 0) {
                return nodeId;
            }
        }

        return nodes[nodes.length - 1];
    }

    /**
     * Estratégia: Random
     */
    _random(nodes, options) {
        return nodes[Math.floor(Math.random() * nodes.length)];
    }

    /**
     * Estratégia: Hash (para sticky sessions)
     */
    _hash(nodes, options) {
        const key = options.key || 'default';
        const hash = this._hashString(key);
        return nodes[hash % nodes.length];
    }

    /**
     * Filtra nós saudáveis
     */
    _filterHealthyNodes(nodes) {
        // Simplificado - em implementação real, verificaria health checks
        return nodes.filter(nodeId => {
            const peer = this.mesh.peers.get(nodeId);
            return peer && peer.status !== 'unhealthy';
        });
    }

    /**
     * Incrementa contador de conexões
     */
    _incrementConnection(nodeId) {
        const current = this.connectionCounts.get(nodeId) || 0;
        this.connectionCounts.set(nodeId, current + 1);
    }

    /**
     * Decrementa contador de conexões
     */
    decrementConnection(nodeId) {
        const current = this.connectionCounts.get(nodeId) || 0;
        this.connectionCounts.set(nodeId, Math.max(0, current - 1));
    }

    /**
     * Inicia health checks
     */
    _startHealthChecks() {
        setInterval(() => {
            this._performHealthChecks();
        }, this.healthCheckInterval);
    }

    /**
     * Realiza health checks nos nós
     */
    async _performHealthChecks() {
        for (const [nodeId, peer] of this.mesh.peers) {
            try {
                const response = await this.mesh.sendMessage(nodeId, {
                    type: 'health-check',
                    timestamp: Date.now()
                });

                if (response.status === 'healthy') {
                    peer.status = 'healthy';
                    peer.lastHealthCheck = Date.now();
                } else {
                    peer.status = 'unhealthy';
                }
            } catch (error) {
                peer.status = 'unhealthy';
                console.warn(`Health check failed for node ${nodeId}:`, error.message);
            }
        }
    }

    /**
     * Função de hash simples
     */
    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Limpa recursos
     */
    destroy() {
        this.roundRobinCounters.clear();
        this.connectionCounts.clear();
        this.weights.clear();
        console.log('[LoadBalancer] Destroyed');
    }
}

export { LoadBalancer };
