/**
 * Service Discovery - Agent Mesh Network
 * 
 * Sistema de descoberta automática de serviços na rede mesh
 */

const crypto = require('crypto');

class ServiceDiscovery {
    constructor(meshNetwork) {
        this.mesh = meshNetwork;
        this.services = new Map(); // serviceId -> serviceInfo
        this.watchers = new Map(); // serviceType -> [callbacks]
        this.cache = new Map(); // serviceType -> [nodes]
        this.cacheTimeout = 30000; // 30 segundos
        this.discoveryInterval = 10000; // 10 segundos
        
        // Inicia discovery periódico
        this._startDiscovery();
        
        console.log('[ServiceDiscovery] Initialized');
    }
    
    /**
     * Registra um serviço
     */
    registerService(serviceType, metadata = {}) {
        const serviceId = this._generateServiceId();
        const serviceInfo = {
            id: serviceId,
            type: serviceType,
            nodeId: this.mesh.nodeId,
            metadata,
            registeredAt: Date.now(),
            health: 'healthy',
            version: metadata.version || '1.0.0'
        };
        
        this.services.set(serviceId, serviceInfo);
        
        // Registra no mesh
        this.mesh.registerService(serviceType, serviceInfo);
        
        console.log(`[ServiceDiscovery] Service ${serviceType} registered with ID ${serviceId}`);
        
        // Notifica watchers
        this._notifyWatchers(serviceType, 'registered', serviceInfo);
        
        return serviceInfo;
    }
    
    /**
     * Remove registro de serviço
     */
    unregisterService(serviceId) {
        const serviceInfo = this.services.get(serviceId);
        if (!serviceInfo) return false;
        
        this.services.delete(serviceId);
        
        console.log(`[ServiceDiscovery] Service ${serviceId} unregistered`);
        
        // Notifica watchers
        this._notifyWatchers(serviceInfo.type, 'unregistered', serviceInfo);
        
        return true;
    }
    
    /**
     * Descobre nós com um serviço específico
     */
    async discover(serviceType, options = {}) {
        const cacheKey = serviceType;
        const cached = this.cache.get(cacheKey);
        
        // Verifica cache
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.nodes;
        }
        
        // Descobre na rede
        const nodes = await this._discoverInNetwork(serviceType, options);
        
        // Atualiza cache
        this.cache.set(cacheKey, {
            nodes,
            timestamp: Date.now()
        });
        
        return nodes;
    }
    
    /**
     * Watch para mudanças em um serviço
     */
    watch(serviceType, callback) {
        if (!this.watchers.has(serviceType)) {
            this.watchers.set(serviceType, new Set());
        }
        
        const watcherId = this._generateWatcherId();
        this.watchers.get(serviceType).set(watcherId, callback);
        
        console.log(`[ServiceDiscovery] Watching service ${serviceType} with ID ${watcherId}`);
        
        // Retorna função para parar de watching
        return () => {
            const callbacks = this.watchers.get(serviceType);
            if (callbacks) {
                callbacks.delete(watcherId);
                if (callbacks.size === 0) {
                    this.watchers.delete(serviceType);
                }
            }
        };
    }
    
    /**
     * Obtém todos os serviços registrados localmente
     */
    getLocalServices() {
        return Array.from(this.services.values());
    }
    
    /**
     * Obtém serviços por tipo
     */
    getServicesByType(serviceType) {
        return Array.from(this.services.values()).filter(s => s.type === serviceType);
    }
    
    /**
     * Atualiza health de um serviço
     */
    updateServiceHealth(serviceId, health) {
        const service = this.services.get(serviceId);
        if (service) {
            service.health = health;
            service.lastHealthCheck = Date.now();
            
            if (health === 'unhealthy') {
                this._notifyWatchers(service.type, 'health-changed', service);
            }
        }
    }
    
    /**
     * Descobre serviços na rede mesh
     */
    async _discoverInNetwork(serviceType, options = {}) {
        const nodes = this.mesh.findServiceNodes(serviceType);
        const services = [];
        
        for (const nodeId of nodes) {
            if (nodeId === this.mesh.nodeId) continue; // Pula nó local
            
            try {
                const response = await this.mesh.sendMessage(nodeId, {
                    type: 'service-discovery',
                    serviceType,
                    requestId: this._generateRequestId()
                });
                
                if (response.services) {
                    services.push(...response.services);
                }
            } catch (error) {
                console.warn(`Failed to discover services on node ${nodeId}:`, error.message);
            }
        }
        
        return services;
    }
    
    /**
     * Inicia discovery periódico
     */
    _startDiscovery() {
        setInterval(() => {
            this._refreshCache();
        }, this.discoveryInterval);
    }
    
    /**
     * Atualiza cache de serviços
     */
    async _refreshCache() {
        for (const serviceType of this.watchers.keys()) {
            try {
                await this.discover(serviceType);
            } catch (error) {
                console.warn(`Failed to refresh cache for ${serviceType}:`, error.message);
            }
        }
    }
    
    /**
     * Notifica watchers de um serviço
     */
    _notifyWatchers(serviceType, event, serviceInfo) {
        const callbacks = this.watchers.get(serviceType);
        if (callbacks) {
            for (const callback of callbacks.values()) {
                try {
                    callback(event, serviceInfo);
                } catch (error) {
                    console.error('Error in service watcher callback:', error);
                }
            }
        }
    }
    
    /**
     * Gera ID único para serviço
     */
    _generateServiceId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * Gera ID único para watcher
     */
    _generateWatcherId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * Gera ID único para requisição
     */
    _generateRequestId() {
        return crypto.randomBytes(16).toString('hex');
    }
    
    /**
     * Limpa recursos
     */
    destroy() {
        this.services.clear();
        this.watchers.clear();
        this.cache.clear();
        console.log('[ServiceDiscovery] Destroyed');
    }
}

module.exports = ServiceDiscovery;
