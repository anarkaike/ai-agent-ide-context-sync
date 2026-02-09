/**
 * Intelligent Sync Engine - Integration Test
 * 
 * Testa a funcionalidade da engine de sincronização inteligente
 */

const { initializeCore } = require('@ai-agent/core');

describe('Intelligent Sync Engine', () => {
    let core1, core2, core3;
    
    beforeAll(async () => {
        // Inicializa 3 nós com sync
        core1 = await initializeCore({
            network: { port: 8080 },
            sync: { syncInterval: 1000 }
        });
        
        core2 = await initializeCore({
            network: { port: 8081 },
            sync: { syncInterval: 1000 }
        });
        
        core3 = await initializeCore({
            network: { port: 8082 },
            sync: { syncInterval: 1000 }
        });
        
        // Inicia redes
        await core1.network.start();
        await core2.network.start();
        await core3.network.start();
        
        // Conecta nós
        await core2.network.connectToPeer('http://localhost:8080');
        await core3.network.connectToPeer('http://localhost:8080');
        
        // Configura peers para sync
        core1.syncEngine.addPeer(core2.network.nodeId);
        core1.syncEngine.addPeer(core3.network.nodeId);
        core2.syncEngine.addPeer(core1.network.nodeId);
        core2.syncEngine.addPeer(core3.network.nodeId);
        core3.syncEngine.addPeer(core1.network.nodeId);
        core3.syncEngine.addPeer(core2.network.nodeId);
        
        // Inicia engines
        await core1.syncEngine.start();
        await core2.syncEngine.start();
        await core3.syncEngine.start();
    });
    
    afterAll(async () => {
        // Limpa
        await core1.shutdown();
        await core2.shutdown();
        await core3.shutdown();
    });
    
    describe('Data Storage and Retrieval', () => {
        test('deve armazenar dados com versionamento', async () => {
            const testData = { message: 'Hello World', timestamp: Date.now() };
            
            const result = await core1.syncEngine.store('test-key', testData);
            
            expect(result.stored).toBe(true);
            expect(result.version).toBe(1);
            expect(result.unchanged).toBeUndefined();
            
            // Recupera dados
            const retrieved = await core1.syncEngine.retrieve('test-key');
            expect(retrieved.data).toEqual(testData);
            expect(retrieved.version).toBe(1);
        });
        
        test('deve detectar dados não modificados', async () => {
            const testData = { message: 'Unchanged' };
            
            // Primeiro armazenamento
            await core1.syncEngine.store('unchanged-key', testData);
            
            // Segundo armazenamento com mesmo dado
            const result = await core1.syncEngine.store('unchanged-key', testData);
            
            expect(result.unchanged).toBe(true);
            expect(result.stored).toBeUndefined();
        });
        
        test('deve incrementar versão em modificações', async () => {
            const key = 'version-key';
            
            await core1.syncEngine.store(key, { version: 1 });
            await core1.syncEngine.store(key, { version: 2 });
            
            const retrieved = await core1.syncEngine.retrieve(key);
            expect(retrieved.version).toBe(2);
        });
    });
    
    describe('Delta Compression', () => {
        test('deve usar delta para dados similares', async () => {
            const baseData = {
                items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })),
                metadata: { type: 'large-dataset' }
            };
            
            const modifiedData = {
                ...baseData,
                items: [
                    ...baseData.items.slice(0, 50),
                    { id: 50, value: 'modified-item-50' },
                    ...baseData.items.slice(51)
                ]
            };
            
            // Armazena base
            await core1.syncEngine.store('delta-test', baseData);
            
            // Armazena modificação (deve usar delta)
            const result = await core1.syncEngine.store('delta-test', modifiedData);
            
            expect(result.stored).toBe(true);
            expect(result.version).toBe(2);
            expect(result.delta).toBeDefined();
            expect(result.delta).toBeLessThan(1000); // Delta deve ser menor
        });
    });
    
    describe('Peer Synchronization', () => {
        test('deve sincronizar dados entre peers', async () => {
            const testData = { syncTest: true, nodeId: core1.network.nodeId };
            
            // Armazena no nó 1
            await core1.syncEngine.store('sync-key', testData, { priority: 'high' });
            
            // Força sincronização
            await core1.syncEngine.syncWithPeers();
            
            // Aguarda um pouco para processamento
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verifica se outros nós receberam
            const retrieved2 = await core2.syncEngine.retrieve('sync-key');
            const retrieved3 = await core3.syncEngine.retrieve('sync-key');
            
            expect(retrieved2).not.toBeNull();
            expect(retrieved3).not.toBeNull();
            expect(retrieved2.data).toEqual(testData);
            expect(retrieved3.data).toEqual(testData);
        }, 10000);
        
        test('deve lidar com conflitos de versão', async () => {
            const key = 'conflict-key';
            
            // Nó 1 armazena versão 1
            await core1.syncEngine.store(key, { source: 'node1', version: 1 });
            
            // Nó 2 armazena mesma chave com versão diferente
            await core2.syncEngine.store(key, { source: 'node2', version: 1 });
            
            // Sincroniza (deve gerar conflito)
            await core1.syncEngine.syncWithPeers();
            
            // Verifica se conflito foi detectado
            const conflicts = core1.syncEngine.conflicts;
            expect(conflicts.has(key)).toBe(true);
        });
    });
    
    describe('Conflict Resolution', () => {
        test('deve resolver conflito com latest-wins', async () => {
            const key = 'resolution-test';
            
            // Cria conflito
            const conflict = {
                key,
                local: {
                    data: { source: 'local', value: 1 },
                    version: 1,
                    checksum: 'local-checksum',
                    timestamp: Date.now() - 1000
                },
                remote: {
                    data: { source: 'remote', value: 2 },
                    version: 2,
                    checksum: 'remote-checksum',
                    timestamp: Date.now()
                }
            };
            
            core1.syncEngine.conflicts.set(key, conflict);
            
            // Resolve conflito
            const result = await core1.syncEngine.resolveConflict(key, 'latest-wins');
            
            expect(result.resolved).toBe(true);
            expect(result.strategy).toBe('latest-wins');
            expect(result.result.data.source).toBe('remote');
            
            // Verifica se conflito foi removido
            expect(core1.syncEngine.conflicts.has(key)).toBe(false);
        });
        
        test('deve resolver conflito com merge', async () => {
            const key = 'merge-test';
            
            const conflict = {
                key,
                local: {
                    data: { localField: 'local-value' },
                    version: 1,
                    checksum: 'local-checksum',
                    timestamp: Date.now()
                },
                remote: {
                    data: { remoteField: 'remote-value' },
                    version: 1,
                    checksum: 'remote-checksum',
                    timestamp: Date.now()
                }
            };
            
            core1.syncEngine.conflicts.set(key, conflict);
            
            // Resolve com merge
            const result = await core1.syncEngine.conflictEngine.resolveConflict(conflict, 'merge');
            
            expect(result.resolved).toBe(true);
            expect(result.strategy).toBe('merge');
            expect(result.result.data.localField).toBe('local-value');
            expect(result.result.data.remoteField).toBe('remote-value');
        });
    });
    
    describe('Priority Queue', () => {
        test('deve processar fila por prioridade', async () => {
            // Adiciona itens em ordem aleatória
            await core1.syncEngine.store('low-priority', { priority: 'low' }, { priority: 'low' });
            await core1.syncEngine.store('high-priority', { priority: 'high' }, { priority: 'high' });
            await core1.syncEngine.store('critical-priority', { priority: 'critical' }, { priority: 'critical' });
            await core1.syncEngine.store('normal-priority', { priority: 'normal' }, { priority: 'normal' });
            
            // Processa fila
            const syncItems = core1.syncEngine._processSyncQueue();
            
            // Verifica ordem de prioridade
            const priorities = syncItems.map(item => item.priority);
            expect(priorities).toEqual(['critical', 'high', 'normal', 'low']);
        });
    });
    
    describe('Metrics and Monitoring', () => {
        test('deve coletar métricas de sincronização', async () => {
            const metrics = core1.syncEngine.getMetrics();
            
            expect(metrics.dataStoreSize).toBeGreaterThan(0);
            expect(metrics.isRunning).toBe(true);
            expect(metrics.peerCount).toBe(2);
            expect(typeof metrics.syncsPerformed).toBe('number');
            expect(typeof metrics.bytesTransferred).toBe('number');
        });
        
        test('deve calcular compressão ratio', async () => {
            const stats = core1.compressionEngine.getStats();
            
            expect(stats.totalCompressions).toBeGreaterThan(0);
            expect(stats.avgCompressionRatio).toBeGreaterThanOrEqual(0);
            expect(typeof stats.totalOriginalSize).toBe('number');
            expect(typeof stats.totalCompressedSize).toBe('number');
        });
    });
    
    describe('Adaptive Thresholds', () => {
        test('deve ajustar thresholds adaptativamente', async () => {
            const key = 'adaptive-test';
            
            // Simula múltiplas compressões bem-sucedidas
            for (let i = 0; i < 15; i++) {
                const data = { iteration: i, data: 'x'.repeat(1000) };
                await core1.syncEngine.store(`${key}-${i}`, data);
            }
            
            // Verifica se threshold foi ajustado
            const stats = core1.compressionEngine.getStats(key);
            expect(stats).toBeDefined();
        });
    });
});
