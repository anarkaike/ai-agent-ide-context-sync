/**
 * CLI Core Integration Test
 * 
 * Testa se o CLI está corretamente integrado com o @ai-agent/core
 */

const AIClient = require('../core/AIClient');
const path = require('path');

describe('CLI Core Integration', () => {
    let client;

    beforeAll(() => {
        const testProjectRoot = path.join(__dirname, '../../..');
        client = new AIClient(testProjectRoot);
    });

    describe('Core Components Access', () => {
        test('deve acessar o Core AIClient', () => {
            const coreClient = client.getCoreClient();
            expect(coreClient).toBeDefined();
            expect(coreClient.memoryManager).toBeDefined();
            expect(coreClient.walManager).toBeDefined();
            expect(coreClient.securitySandbox).toBeDefined();
        });

        test('deve acessar o MemoryManager', () => {
            const memoryManager = client.getMemoryManager();
            expect(memoryManager).toBeDefined();
        });

        test('deve acessar o WALManager', () => {
            const walManager = client.getWALManager();
            expect(walManager).toBeDefined();
        });

        test('deve acessar o SecuritySandbox', () => {
            const securitySandbox = client.getSecuritySandbox();
            expect(securitySandbox).toBeDefined();
        });

        test('deve acessar o ToneManager legado', () => {
            const toneManager = client.getToneManager();
            expect(toneManager).toBeDefined();
        });
    });

    describe('Comandos Legados', () => {
        test('deve executar comando build', async () => {
            const result = await client.buildContext();
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('deve executar comando status', async () => {
            const result = await client.getStatus();
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('deve executar comando init', async () => {
            const result = await client.initializeWorkspace();
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('LLM Integration', () => {
        test('deve executar completion com tone', async () => {
            const prompt = 'Test prompt';
            const options = { temperature: 0.5 };
            
            const result = await client.complete(prompt, options);
            
            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
            expect(result.usage).toBeDefined();
            expect(result.config_used).toBeDefined();
            expect(result.config_used.temperature).toBe(0.5);
        });

        test('deve gerar prompt', async () => {
            const goal = 'Create a React component';
            
            const result = await client.generatePrompt(goal);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('Segurança', () => {
        test('deve validar comandos perigosos', async () => {
            const securitySandbox = client.getSecuritySandbox();
            
            // Testa validação de comando perigoso
            const isValid = securitySandbox.validateCommand('rm -rf /');
            expect(isValid).toBe(false);
        });

        test('deve sanitizar input', async () => {
            const securitySandbox = client.getSecuritySandbox();
            
            const maliciousInput = 'test; rm -rf /';
            const sanitized = securitySandbox.sanitizeInput(maliciousInput);
            
            expect(sanitized).not.toContain('rm -rf');
        });
    });
});
