/**
 * Intelligent Sync Engine - Core Implementation
 * 
 * Sistema de sincronização inteligente com delta sync,
 * compressão, resolução de conflitos e otimização de banda.
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const zlib = require('zlib');

class IntelligentSyncEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configurações
        this.compressionLevel = options.compressionLevel || 6;
        this.deltaThreshold = options.deltaThreshold || 1024; // 1KB
        this.conflictResolution = options.conflictResolution || 'latest-wins';
        this.syncInterval = options.syncInterval || 5000; // 5 segundos
        this.maxRetries = options.maxRetries || 3;
        this.priorityLevels = ['critical', 'high', 'normal', 'low'];
        
        // Estado
        this.isRunning = false;
        this.syncTimer = null;
        
        // Armazenamento
        this.dataStore = new Map(); // key -> data
        this.dataVersions = new Map(); // key -> version
        this.dataChecksums = new Map(); // key -> checksum
        this.deltaCache = new Map(); // key -> [delta operations]
        this.syncQueue = []; // priority queue
        this.conflicts = new Map(); // key -> conflict info
        
        // Métricas
        this.metrics = {
            syncsPerformed: 0,
            bytesTransferred: 0,
            bytesSaved: 0,
            conflictsResolved: 0,
            compressionRatio: 0,
            avgSyncTime: 0,
            lastSyncTime: null
        };
        
        // Peers para sincronização
        this.peers = new Set(); // peerIds
        
        console.log('[SyncEngine] Intelligent Sync Engine initialized');
    }
    
    /**
     * Inicia a engine de sincronização
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Sync engine is already running');
        }
        
        try {
            // Inicia sincronização periódica
            this._startSyncTimer();
            
            this.isRunning = true;
            console.log('[SyncEngine] Started');
            this.emit('started');
            
            return true;
        } catch (error) {
            console.error('[SyncEngine] Failed to start:', error);
            throw error;
        }
    }
    
    /**
     * Para a engine de sincronização
     */
    async stop() {
        if (!this.isRunning) return;
        
        try {
            // Para timer
            if (this.syncTimer) {
                clearInterval(this.syncTimer);
            }
            
            this.isRunning = false;
            console.log('[SyncEngine] Stopped');
            this.emit('stopped');
            
            return true;
        } catch (error) {
            console.error('[SyncEngine] Failed to stop:', error);
            throw error;
        }
    }
    
    /**
     * Adiciona peer para sincronização
     */
    addPeer(peerId) {
        this.peers.add(peerId);
        console.log(`[SyncEngine] Added peer ${peerId}`);
    }
    
    /**
     * Remove peer da sincronização
     */
    removePeer(peerId) {
        this.peers.delete(peerId);
        console.log(`[SyncEngine] Removed peer ${peerId}`);
    }
    
    /**
     * Armazena dados com versionamento
     */
    async store(key, data, options = {}) {
        const startTime = Date.now();
        
        try {
            // Gera checksum
            const checksum = this._generateChecksum(data);
            
            // Verifica se já existe
            const existingChecksum = this.dataChecksums.get(key);
            const existingVersion = this.dataVersions.get(key) || 0;
            
            if (existingChecksum === checksum) {
                console.log(`[SyncEngine] Data ${key} unchanged, skipping`);
                return { unchanged: true, version: existingVersion };
            }
            
            // Calcula delta se existir dado anterior
            let delta = null;
            const existingData = this.dataStore.get(key);
            if (existingData && this._shouldUseDelta(data, existingData)) {
                delta = this._calculateDelta(existingData, data);
            }
            
            // Atualiza armazenamento
            this.dataStore.set(key, data);
            this.dataVersions.set(key, existingVersion + 1);
            this.dataChecksums.set(key, checksum);
            
            // Armazena delta para sincronização
            if (delta) {
                if (!this.deltaCache.has(key)) {
                    this.deltaCache.set(key, []);
                }
                this.deltaCache.get(key).push({
                    delta,
                    timestamp: Date.now(),
                    version: existingVersion + 1
                });
            }
            
            // Adiciona à fila de sincronização
            this._queueSync(key, options.priority || 'normal');
            
            const duration = Date.now() - startTime;
            console.log(`[SyncEngine] Stored ${key} in ${duration}ms`);
            
            this.emit('dataStored', { key, version: existingVersion + 1, delta });
            
            return {
                stored: true,
                version: existingVersion + 1,
                delta: delta ? delta.size : null,
                duration
            };
        } catch (error) {
            console.error(`[SyncEngine] Failed to store ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Recupera dados
     */
    async retrieve(key) {
        const data = this.dataStore.get(key);
        const version = this.dataVersions.get(key) || 0;
        const checksum = this.dataChecksums.get(key);
        
        if (!data) {
            return null;
        }
        
        return {
            data,
            version,
            checksum,
            timestamp: Date.now()
        };
    }
    
    /**
     * Sincroniza com todos os peers
     */
    async syncWithPeers() {
        if (this.peers.size === 0) {
            console.log('[SyncEngine] No peers to sync with');
            return [];
        }
        
        const startTime = Date.now();
        const results = [];
        
        try {
            // Processa fila de sincronização
            const syncItems = this._processSyncQueue();
            
            for (const peerId of this.peers) {
                try {
                    const result = await this._syncWithPeer(peerId, syncItems);
                    results.push({ peerId, success: true, ...result });
                } catch (error) {
                    console.error(`[SyncEngine] Sync with ${peerId} failed:`, error);
                    results.push({ peerId, success: false, error: error.message });
                }
            }
            
            // Atualiza métricas
            const duration = Date.now() - startTime;
            this.metrics.syncsPerformed++;
            this.metrics.avgSyncTime = (this.metrics.avgSyncTime + duration) / 2;
            this.metrics.lastSyncTime = new Date();
            
            console.log(`[SyncEngine] Sync completed in ${duration}ms`);
            this.emit('syncCompleted', { results, duration });
            
            return results;
        } catch (error) {
            console.error('[SyncEngine] Sync failed:', error);
            throw error;
        }
    }
    
    /**
     * Sincroniza com um peer específico
     */
    async syncWithPeer(peerId) {
        const syncItems = this._processSyncQueue();
        return await this._syncWithPeer(peerId, syncItems);
    }
    
    /**
     * Resolve conflitos
     */
    async resolveConflict(key, strategy = null) {
        const conflict = this.conflicts.get(key);
        if (!conflict) {
            return { resolved: false, reason: 'No conflict found' };
        }
        
        const resolutionStrategy = strategy || this.conflictResolution;
        let resolvedData = null;
        let resolutionReason = '';
        
        switch (resolutionStrategy) {
            case 'latest-wins':
                resolvedData = conflict.local.timestamp > conflict.remote.timestamp 
                    ? conflict.local.data 
                    : conflict.remote.data;
                resolutionReason = 'Latest timestamp wins';
                break;
                
            case 'local-wins':
                resolvedData = conflict.local.data;
                resolutionReason = 'Local data wins';
                break;
                
            case 'remote-wins':
                resolvedData = conflict.remote.data;
                resolutionReason = 'Remote data wins';
                break;
                
            case 'merge':
                resolvedData = this._mergeData(conflict.local.data, conflict.remote.data);
                resolutionReason = 'Data merged';
                break;
                
            default:
                throw new Error(`Unknown conflict resolution strategy: ${resolutionStrategy}`);
        }
        
        // Aplica resolução
        await this.store(key, resolvedData, { priority: 'high' });
        this.conflicts.delete(key);
        
        this.metrics.conflictsResolved++;
        
        console.log(`[SyncEngine] Conflict resolved for ${key}: ${resolutionReason}`);
        this.emit('conflictResolved', { key, strategy: resolutionStrategy, reason: resolutionReason });
        
        return {
            resolved: true,
            strategy: resolutionStrategy,
            reason: resolutionReason,
            data: resolvedData
        };
    }
    
    /**
     * Obtém métricas da engine
     */
    getMetrics() {
        return {
            ...this.metrics,
            dataStoreSize: this.dataStore.size,
            deltaCacheSize: this.deltaCache.size,
            pendingConflicts: this.conflicts.size,
            queueSize: this.syncQueue.length,
            peerCount: this.peers.size,
            isRunning: this.isRunning
        };
    }
    
    /**
     * Sincroniza com peer específico
     */
    async _syncWithPeer(peerId, syncItems) {
        const startTime = Date.now();
        let bytesTransferred = 0;
        let bytesSaved = 0;
        
        // Prepara payload
        const payload = {
            nodeId: 'current-node', // viria da mesh network
            timestamp: Date.now(),
            items: []
        };
        
        for (const item of syncItems) {
            const syncData = await this._prepareSyncData(item.key);
            if (syncData) {
                payload.items.push(syncData);
                bytesTransferred += syncData.compressedSize;
                
                if (syncData.originalSize > syncData.compressedSize) {
                    bytesSaved += syncData.originalSize - syncData.compressedSize;
                }
            }
        }
        
        // Simula envio para peer (em implementação real usaria mesh network)
        console.log(`[SyncEngine] Syncing ${payload.items.length} items with ${peerId}`);
        
        // Simula resposta do peer
        const peerResponse = await this._simulatePeerResponse(peerId, payload);
        
        // Processa resposta
        await this._processPeerResponse(peerId, peerResponse);
        
        const duration = Date.now() - startTime;
        
        // Atualiza métricas
        this.metrics.bytesTransferred += bytesTransferred;
        this.metrics.bytesSaved += bytesSaved;
        if (bytesTransferred > 0) {
            this.metrics.compressionRatio = (this.metrics.compressionRatio + (bytesSaved / bytesTransferred)) / 2;
        }
        
        return {
            itemsSynced: payload.items.length,
            bytesTransferred,
            bytesSaved,
            duration,
            compressionRatio: bytesTransferred > 0 ? bytesSaved / bytesTransferred : 0
        };
    }
    
    /**
     * Prepara dados para sincronização
     */
    async _prepareSyncData(key) {
        const data = this.dataStore.get(key);
        const version = this.dataVersions.get(key);
        const checksum = this.dataChecksums.get(key);
        
        if (!data) return null;
        
        // Verifica se tem delta para enviar
        const deltas = this.deltaCache.get(key) || [];
        let payload = { data, version, checksum, type: 'full' };
        
        if (deltas.length > 0) {
            // Usa delta se for menor
            const latestDelta = deltas[deltas.length - 1];
            if (latestDelta.delta.size < JSON.stringify(data).length) {
                payload = {
                    delta: latestDelta.delta,
                    version,
                    checksum,
                    type: 'delta',
                    baseVersion: latestDelta.version - 1
                };
            }
        }
        
        // Comprime payload
        const serialized = JSON.stringify(payload);
        const compressed = await this._compress(serialized);
        
        return {
            key,
            payload: compressed,
            originalSize: serialized.length,
            compressedSize: compressed.length,
            version,
            checksum
        };
    }
    
    /**
     * Processa resposta do peer
     */
    async _processPeerResponse(peerId, response) {
        for (const item of response.items || []) {
            try {
                // Descomprime payload
                const decompressed = await this._decompress(item.payload);
                const payload = JSON.parse(decompressed);
                
                // Verifica conflitos
                await this._handleIncomingData(item.key, payload, peerId);
            } catch (error) {
                console.error(`[SyncEngine] Failed to process item from ${peerId}:`, error);
            }
        }
    }
    
    /**
     * Manipula dados recebidos
     */
    async _handleIncomingData(key, payload, fromPeerId) {
        const localVersion = this.dataVersions.get(key) || 0;
        const localChecksum = this.dataChecksums.get(key);
        
        if (payload.version <= localVersion) {
            // Dado desatualizado, ignora
            return;
        }
        
        if (payload.checksum === localChecksum) {
            // Mesmo checksum, ignora
            return;
        }
        
        // Verifica conflito
        if (localChecksum && localChecksum !== payload.checksum) {
            // Conflito detectado
            this.conflicts.set(key, {
                local: {
                    data: this.dataStore.get(key),
                    version: localVersion,
                    checksum: localChecksum,
                    timestamp: Date.now()
                },
                remote: {
                    data: payload.type === 'full' ? payload.data : null,
                    version: payload.version,
                    checksum: payload.checksum,
                    timestamp: payload.timestamp || Date.now(),
                    delta: payload.type === 'delta' ? payload.delta : null
                },
                fromPeerId
            });
            
            console.warn(`[SyncEngine] Conflict detected for ${key}`);
            this.emit('conflictDetected', { key, fromPeerId });
            return;
        }
        
        // Aplica dados recebidos
        if (payload.type === 'full') {
            this.dataStore.set(key, payload.data);
        } else if (payload.type === 'delta') {
            // Aplica delta ao dado local
            const baseData = this.dataStore.get(key);
            const newData = this._applyDelta(baseData, payload.delta);
            this.dataStore.set(key, newData);
        }
        
        this.dataVersions.set(key, payload.version);
        this.dataChecksums.set(key, payload.checksum);
        
        console.log(`[SyncEngine] Applied remote data for ${key} from ${fromPeerId}`);
        this.emit('dataUpdated', { key, fromPeerId, version: payload.version });
    }
    
    /**
     * Calcula delta entre dois dados
     */
    _calculateDelta(oldData, newData) {
        // Implementação simplificada - em produção usar algoritmo mais sofisticado
        const oldStr = JSON.stringify(oldData);
        const newStr = JSON.stringify(newData);
        
        // Se for pequeno, não usa delta
        if (newStr.length < this.deltaThreshold) {
            return null;
        }
        
        // Delta simplificado (diff)
        const operations = [];
        let i = 0, j = 0;
        
        while (i < oldStr.length || j < newStr.length) {
            if (i < oldStr.length && j < newStr.length && oldStr[i] === newStr[j]) {
                i++;
                j++;
            } else {
                // Encontra próxima igualdade
                let matchLen = 0;
                let maxMatch = Math.min(oldStr.length - i, newStr.length - j);
                
                for (let k = 0; k < maxMatch; k++) {
                    if (oldStr[i + k] === newStr[j + k]) {
                        matchLen++;
                    } else {
                        break;
                    }
                }
                
                if (matchLen > 3) {
                    // Operação de substituição
                    operations.push({
                        type: 'replace',
                        position: j,
                        deleteCount: j - i,
                        insert: newStr.substring(j, j + matchLen)
                    });
                    i += matchLen;
                    j += matchLen;
                } else {
                    // Operação de inserção
                    operations.push({
                        type: 'insert',
                        position: j,
                        text: newStr[j]
                    });
                    j++;
                }
            }
        }
        
        return {
            operations,
            size: JSON.stringify(operations).length
        };
    }
    
    /**
     * Aplica delta a dados
     */
    _applyDelta(baseData, delta) {
        const baseStr = JSON.stringify(baseData);
        let result = baseStr;
        
        // Aplica operações em ordem reversa para não afetar posições
        for (let i = delta.operations.length - 1; i >= 0; i--) {
            const op = delta.operations[i];
            
            switch (op.type) {
                case 'insert':
                    result = result.slice(0, op.position) + op.text + result.slice(op.position);
                    break;
                case 'replace':
                    result = result.slice(0, op.position) + op.insert + result.slice(op.position + op.deleteCount);
                    break;
            }
        }
        
        try {
            return JSON.parse(result);
        } catch (error) {
            console.error('[SyncEngine] Failed to apply delta, using full data');
            return baseData; // Fallback
        }
    }
    
    /**
     * Verifica se deve usar delta
     */
    _shouldUseDelta(newData, oldData) {
        const newSize = JSON.stringify(newData).length;
        const oldSize = JSON.stringify(oldData).length;
        
        // Usa delta se a diferença for pequena
        return Math.abs(newSize - oldSize) < (newSize * 0.3);
    }
    
    /**
     * Gera checksum dos dados
     */
    _generateChecksum(data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }
    
    /**
     * Comprime dados
     */
    async _compress(data) {
        return new Promise((resolve, reject) => {
            zlib.gzip(data, { level: this.compressionLevel }, (err, compressed) => {
                if (err) reject(err);
                else resolve(compressed.toString('base64'));
            });
        });
    }
    
    /**
     * Descomprime dados
     */
    async _decompress(compressedData) {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.from(compressedData, 'base64');
            zlib.gunzip(buffer, (err, decompressed) => {
                if (err) reject(err);
                else resolve(decompressed.toString());
            });
        });
    }
    
    /**
     * Adiciona item à fila de sincronização
     */
    _queueSync(key, priority) {
        const priorityIndex = this.priorityLevels.indexOf(priority);
        if (priorityIndex === -1) {
            priority = 'normal';
        }
        
        // Insere mantendo ordem de prioridade
        let insertIndex = this.syncQueue.length;
        for (let i = 0; i < this.syncQueue.length; i++) {
            const itemPriority = this.priorityLevels.indexOf(this.syncQueue[i].priority);
            if (priorityIndex < itemPriority) {
                insertIndex = i;
                break;
            }
        }
        
        this.syncQueue.splice(insertIndex, 0, { key, priority, timestamp: Date.now() });
    }
    
    /**
     * Processa fila de sincronização
     */
    _processSyncQueue() {
        const items = [...this.syncQueue];
        this.syncQueue = []; // Limpa fila
        
        // Remove duplicados e mantém mais recente
        const uniqueItems = new Map();
        for (const item of items.reverse()) {
            if (!uniqueItems.has(item.key)) {
                uniqueItems.set(item.key, item);
            }
        }
        
        return Array.from(uniqueItems.values());
    }
    
    /**
     * Inicia timer de sincronização
     */
    _startSyncTimer() {
        this.syncTimer = setInterval(async () => {
            try {
                await this.syncWithPeers();
            } catch (error) {
                console.error('[SyncEngine] Auto-sync failed:', error);
            }
        }, this.syncInterval);
    }
    
    /**
     * Mescla dados (para resolução de conflitos)
     */
    _mergeData(localData, remoteData) {
        // Implementação simplificada - mescla objetos
        if (typeof localData === 'object' && typeof remoteData === 'object') {
            return { ...localData, ...remoteData };
        }
        
        // Para outros tipos, usa o mais recente
        return remoteData;
    }
    
    /**
     * Simula resposta do peer
     */
    async _simulatePeerResponse(peerId, payload) {
        // Simula latência
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        // Simula dados do peer
        return {
            nodeId: peerId,
            timestamp: Date.now(),
            items: [] // Em implementação real, conteria dados do peer
        };
    }
}

module.exports = IntelligentSyncEngine;
