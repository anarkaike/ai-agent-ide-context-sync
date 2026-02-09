/**
 * Agent Mesh Network - Integration Test
 * 
 * Testa a funcionalidade da rede mesh de agentes
 */

const { initializeCore } = require('@ai-agent/core');

describe('Agent Mesh Network', () => {
    let core1, core2, core3;
    
    beforeAll(async () => {
        // Inicializa 3 nós na rede
        core1 = await initializeCore({
            network: { port: 8080 }
        });
        
        core2 = await initializeCore({
            network: { port: 8081 }
        });
        
        core3 = await initializeCore({
            network: { port: 8082 }
        });
    });
    
    afterAll(async () => {
        // Limpa os nós
        await core1.shutdown();
        await core2.shutdown();
        await core3.shutdown();
    });
    
    describe('Network Initialization', () => {
        test('deve inicializar rede mesh em cada nó', async () => {
            await expect(core1.network.start()).resolves.toBe(true);
            await expect(core2.network.start()).resolves.toBe(true);
            await expect(core3.network.start()).resolves.toBe(true);
        });
        
        test('deve ter nodeIds únicos', () => {
            expect(core1.network.nodeId).not.toBe(core2.network.nodeId);
            expect(core2.network.nodeId).not.toBe(core3.network.nodeId);
            expect(core1.network.nodeId).not.toBe(core3.network.nodeId);
        });
    });
    
    describe('Peer Connection', () => {
        test('deve conectar nós entre si', async () => {
            // Conecta nó 2 ao nó 1
            const connected1 = await core2.network.connectToPeer('http://localhost:8080');
            expect(connected1).toBe(true);
            
            // Conecta nó 3 ao nó 1
            const connected2 = await core3.network.connectToPeer('http://localhost:8080');
            expect(connected2).toBe(true);
            
            // Verifica se os peers estão conectados
            expect(core1.network.peers.size).toBe(2);
            expect(core2.network.peers.size).toBe(1);
            expect(core3.network.peers.size).toBe(1);
        });
    });
    
    describe('Service Registration', () => {
        test('deve registrar serviços em nós diferentes', () => {
            const service1 = core1.serviceDiscovery.registerService('ai-completion', {
                model: 'gpt-4',
                maxTokens: 2048
            });
            
            const service2 = core2.serviceDiscovery.registerService('code-analysis', {
                language: 'javascript',
                framework: 'react'
            });
            
            const service3 = core3.serviceDiscovery.registerService('ai-completion', {
                model: 'claude-3',
                maxTokens: 4096
            });
            
            expect(service1.type).toBe('ai-completion');
            expect(service2.type).toBe('code-analysis');
            expect(service3.type).toBe('ai-completion');
        });
    });
    
    describe('Service Discovery', () => {
        test('deve descobrir serviços na rede', async () => {
            // Descobre serviços de ai-completion
            const completionServices = await core1.serviceDiscovery.discover('ai-completion');
            expect(completionServices.length).toBe(2); // nó 1 e nó 3
            
            // Descobre serviços de code-analysis
            const analysisServices = await core1.serviceDiscovery.discover('code-analysis');
            expect(analysisServices.length).toBe(1); // apenas nó 2
        });
    });
    
    describe('Load Balancing', () => {
        test('deve selecionar nós para balanceamento', () => {
            // Round-robin
            const node1 = core1.loadBalancer.selectNode('ai-completion', {
                strategy: 'round-robin'
            });
            expect(node1).toBeDefined();
            
            // Least connections
            const node2 = core1.loadBalancer.selectNode('ai-completion', {
                strategy: 'least-connections'
            });
            expect(node2).toBeDefined();
            
            // Random
            const node3 = core1.loadBalancer.selectNode('ai-completion', {
                strategy: 'random'
            });
            expect(node3).toBeDefined();
        });
    });
    
    describe('Message Communication', () => {
        test('deve enviar mensagens entre nós', async () => {
            // Configura listener no nó 1
            let receivedMessage = null;
            core1.network.on('message', (data) => {
                receivedMessage = data;
            });
            
            // Envia mensagem do nó 2 para o nó 1
            const response = await core2.network.sendMessage(
                core1.network.nodeId,
                {
                    type: 'test',
                    content: 'Hello from node 2'
                }
            );
            
            expect(response.success).toBe(true);
            
            // Aguarda um pouco para a mensagem ser processada
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(receivedMessage).not.toBeNull();
            expect(receivedMessage.message.content).toBe('Hello from node 2');
        });
    });
    
    describe('Broadcast Messages', () => {
        test('deve fazer broadcast para todos os peers', async () => {
            // Configura listeners
            const messages = [];
            
            core1.network.on('message', (data) => {
                messages.push({ node: 'node1', data });
            });
            
            core2.network.on('message', (data) => {
                messages.push({ node: 'node2', data });
            });
            
            // Faz broadcast do nó 3
            await core3.network.broadcastMessage({
                type: 'broadcast-test',
                content: 'Broadcast message'
            });
            
            // Aguarda processamento
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verifica se nós 1 e 2 receberam
            expect(messages.length).toBe(2);
            expect(messages.some(m => m.node === 'node1')).toBe(true);
            expect(messages.some(m => m.node === 'node2')).toBe(true);
        });
    });
    
    describe('Network Metrics', () => {
        test('deve coletar métricas da rede', () => {
            const metrics1 = core1.network.getMetrics();
            const metrics2 = core2.network.getMetrics();
            
            expect(metrics1.peersCount).toBe(2);
            expect(metrics2.peersCount).toBe(1);
            expect(metrics1.isRunning).toBe(true);
            expect(metrics2.isRunning).toBe(true);
            expect(metrics1.messagesSent).toBeGreaterThan(0);
            expect(metrics1.messagesReceived).toBeGreaterThan(0);
        });
    });
    
    describe('Health Checks', () => {
        test('deve verificar saúde dos nós', async () => {
            // Aguarda um ciclo de health check
            await new Promise(resolve => setTimeout(resolve, 35000));
            
            // Verifica se todos os peers estão saudáveis
            for (const [nodeId, peer] of core1.network.peers) {
                expect(peer.status).toBe('healthy');
            }
        }, 40000); // Timeout maior para aguardar health checks
    });
});
