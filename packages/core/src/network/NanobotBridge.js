import nanobot from 'nanobot';
import TrustSystem from '../swarm/TrustSystem.js';
import VaultManager from '../../../../cli/core/ethereum_bridge/VaultManager.js';

/**
 * NanobotBridge - Conecta à Nanobot Trust Network e Knowledge Base
 * Implementa o padrão oficial de integração Nanobot
 */
class NanobotBridge {
    constructor(options = {}) {
        this.options = {
            trustNetworkUrl: options.trustNetworkUrl || 'https://trust-network.nanobot.ai',
            knowledgeBaseUrl: options.knowledgeBaseUrl || 'https://kb.nanobot.ai',
            agentId: options.agentId || process.env.AGENT_ID || 'agent-nanobot',
            ...options
        };

        this.trustSystem = new TrustSystem();
        this.vaultManager = new VaultManager();
        this.isConnected = false;
        this.lastSync = null;

        // Cache local de knowledge base
        this.knowledgeCache = new Map();

        this.init();
    }

    async init() {
        try {
            // Inicializar cliente Nanobot
            this.nanobotClient = await nanobot.createClient({
                agentId: this.options.agentId,
                network: this.options.trustNetworkUrl,
                knowledgeBase: this.options.knowledgeBaseUrl
            });

            // Carregar configurações do vault
            await this.loadConfiguration();

            // Conectar à rede
            await this.connect();

            console.log(`[NanobotBridge] Connected as ${this.options.agentId}`);
        } catch (error) {
            console.error('[NanobotBridge] Failed to initialize:', error.message);
            // Continuar mesmo se falhar (modo offline)
        }
    }

    /**
     * Carrega configurações do Vault Manager
     */
    async loadConfiguration() {
        try {
            // Buscar SBTs de configuração
            const configSbt = await this.vaultManager.getSbt('nanobot-config');
            if (configSbt) {
                this.options = { ...this.options, ...configSbt.data };
            }
        } catch (error) {
            console.warn('[NanobotBridge] Could not load config from vault:', error.message);
        }
    }

    /**
     * Conecta à Nanobot Trust Network
     */
    async connect() {
        if (!this.nanobotClient) return false;

        try {
            // Registrar agente na trust network
            await this.nanobotClient.register({
                type: 'ai-agent',
                capabilities: this.getCapabilities(),
                trustLevel: await this.trustSystem.getTrustLevel(this.options.agentId),
                metadata: {
                    version: '1.0.0',
                    network: 'ai-agent-context-sync',
                    joinedAt: new Date().toISOString()
                }
            });

            // Sincronizar trust scores
            await this.syncTrustScores();

            // Iniciar heartbeat
            this.startHeartbeat();

            this.isConnected = true;
            this.lastSync = new Date();

            return true;
        } catch (error) {
            console.error('[NanobotBridge] Connection failed:', error.message);
            return false;
        }
    }

    /**
     * Obtém capacidades do agente
     */
    getCapabilities() {
        return [
            'code-generation',
            'code-analysis',
            'security-analysis',
            'performance-optimization',
            'conflict-resolution',
            'memory-management',
            'sync-coordination',
            'policy-enforcement'
        ];
    }

    /**
     * Sincroniza trust scores com a rede
     */
    async syncTrustScores() {
        try {
            // Obter trust scores locais
            const localTrustScores = this.trustSystem.getAllTrustScores();

            // Enviar para rede
            await this.nanobotClient.updateTrustScores(localTrustScores);

            // Receber trust scores da rede
            const networkTrustScores = await this.nanobotClient.getTrustScores();

            // Mesclar trust scores (rede tem precedência)
            for (const [agentId, score] of Object.entries(networkTrustScores)) {
                if (score > this.trustSystem.getTrustScore(agentId)) {
                    await this.trustSystem.updateTrustScore(agentId, score);
                }
            }

            console.log(`[NanobotBridge] Synced ${Object.keys(networkTrustScores).length} trust scores`);
        } catch (error) {
            console.warn('[NanobotBridge] Trust sync failed:', error.message);
        }
    }

    /**
     * Inicia heartbeat para manter conexão ativa
     */
    startHeartbeat() {
        setInterval(async () => {
            if (!this.isConnected) return;

            try {
                await this.nanobotClient.heartbeat({
                    status: 'active',
                    metrics: this.getMetrics(),
                    lastActivity: new Date().toISOString()
                });
            } catch (error) {
                console.warn('[NanobotBridge] Heartbeat failed:', error.message);
                this.isConnected = false;
            }
        }, 30000); // 30 segundos
    }

    /**
     * Obtém métricas do agente
     */
    getMetrics() {
        // Aqui poderia integrar com ObservabilityManager
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeConnections: this.trustSystem.getActiveConnections(),
            trustLevel: this.trustSystem.getTrustLevel(this.options.agentId)
        };
    }

    /**
     * Compartilha conhecimento na Knowledge Base
     */
    async shareKnowledge(knowledge) {
        if (!this.isConnected) {
            console.warn('[NanobotBridge] Not connected - caching knowledge locally');
            this.knowledgeCache.set(knowledge.id, knowledge);
            return false;
        }

        try {
            await this.nanobotClient.shareKnowledge({
                id: knowledge.id,
                type: knowledge.type,
                content: knowledge.content,
                tags: knowledge.tags || [],
                metadata: {
                    author: this.options.agentId,
                    createdAt: new Date().toISOString(),
                    trustLevel: this.trustSystem.getTrustLevel(this.options.agentId)
                }
            });

            console.log(`[NanobotBridge] Shared knowledge: ${knowledge.id}`);
            return true;
        } catch (error) {
            console.error('[NanobotBridge] Failed to share knowledge:', error.message);
            return false;
        }
    }

    /**
     * Busca conhecimento na Knowledge Base
     */
    async searchKnowledge(query, options = {}) {
        // Primeiro buscar no cache local
        const localResults = this.searchLocalCache(query);

        if (!this.isConnected) {
            return localResults;
        }

        try {
            // Buscar na rede
            const networkResults = await this.nanobotClient.searchKnowledge({
                query,
                limit: options.limit || 10,
                filters: {
                    type: options.type,
                    tags: options.tags,
                    minTrustLevel: options.minTrustLevel || 'PEER'
                }
            });

            // Combinar resultados (rede primeiro)
            const combined = [...networkResults, ...localResults];

            // Remover duplicados por ID
            const unique = combined.filter((item, index, self) =>
                index === self.findIndex(t => t.id === item.id)
            );

            return unique.slice(0, options.limit || 10);
        } catch (error) {
            console.error('[NanobotBridge] Knowledge search failed:', error.message);
            return localResults;
        }
    }

    /**
     * Busca no cache local
     */
    searchLocalCache(query) {
        const results = [];
        const queryLower = query.toLowerCase();

        for (const [id, knowledge] of this.knowledgeCache.entries()) {
            if (knowledge.content.toLowerCase().includes(queryLower) ||
                (knowledge.tags && knowledge.tags.some(tag => tag.toLowerCase().includes(queryLower)))) {
                results.push(knowledge);
            }
        }

        return results;
    }

    /**
     * Reporta incidente de segurança à rede
     */
    async reportSecurityIncident(incident) {
        if (!this.isConnected) return false;

        try {
            await this.nanobotClient.reportIncident({
                type: 'security',
                severity: incident.severity,
                description: incident.description,
                affectedAgent: incident.agentId,
                reporter: this.options.agentId,
                evidence: incident.evidence,
                timestamp: new Date().toISOString()
            });

            console.log(`[NanobotBridge] Reported security incident: ${incident.type}`);
            return true;
        } catch (error) {
            console.error('[NanobotBridge] Failed to report incident:', error.message);
            return false;
        }
    }

    /**
     * Obtém recomendações da rede
     */
    async getRecommendations(context) {
        if (!this.isConnected) return [];

        try {
            const recommendations = await this.nanobotClient.getRecommendations({
                context: {
                    operation: context.operation,
                    agentId: context.agentId,
                    trustLevel: context.trustLevel,
                    resources: context.resources
                },
                limit: 5
            });

            return recommendations.map(rec => ({
                ...rec,
                source: 'nanobot-network',
                confidence: rec.confidence || 0.5
            }));
        } catch (error) {
            console.error('[NanobotBridge] Failed to get recommendations:', error.message);
            return [];
        }
    }

    /**
     * Sincroniza aprendizado federado
     */
    async syncFederatedLearning(learningUpdate) {
        if (!this.isConnected) return false;

        try {
            await this.nanobotClient.publishLearningUpdate({
                agentId: this.options.agentId,
                type: 'federated_learning',
                aggregates: learningUpdate.aggregates,
                heuristics: learningUpdate.heuristics,
                timestamp: new Date().toISOString(),
                trustLevel: this.trustSystem.getTrustLevel(this.options.agentId)
            });

            // Receber updates de outros agentes
            const peerUpdates = await this.nanobotClient.getLearningUpdates({
                excludeAgent: this.options.agentId,
                minTrustLevel: 'PEER',
                limit: 10
            });

            console.log(`[NanobotBridge] Synced learning with ${peerUpdates.length} peers`);
            return peerUpdates;
        } catch (error) {
            console.error('[NanobotBridge] Federated learning sync failed:', error.message);
            return [];
        }
    }

    /**
     * Obtém status da conexão
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            agentId: this.options.agentId,
            lastSync: this.lastSync,
            networkUrl: this.options.trustNetworkUrl,
            knowledgeCacheSize: this.knowledgeCache.size,
            trustLevel: this.trustSystem.getTrustLevel(this.options.agentId)
        };
    }

    /**
     * Desconecta da rede
     */
    async disconnect() {
        if (this.nanobotClient && this.isConnected) {
            try {
                await this.nanobotClient.disconnect();
                console.log('[NanobotBridge] Disconnected from network');
            } catch (error) {
                console.error('[NanobotBridge] Disconnect error:', error.message);
            }
        }

        this.isConnected = false;
    }
}

// Singleton export
export default new NanobotBridge();
