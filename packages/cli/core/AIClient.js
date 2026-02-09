/**
 * AIClient - Legacy Wrapper (MIGRADO para Core)
 * 
 * Este arquivo agora serve como um wrapper para manter compatibilidade
 * com o código existente enquanto usa o novo @ai-agent/core.
 * 
 * MIGRAÇÃO COMPLETA: Todos os métodos delegados para o Core Unificado
 */
const { AIClient: CoreAIClient, ToneConfigManager, SecuritySandbox } = require('../../core/src/index.js');

class AIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();

        // Inicializa o Core Unificado
        this.toneManager = new ToneConfigManager();
        this.security = new SecuritySandbox();
        this.coreClient = new CoreAIClient(this.toneManager, this.security);
    }

    /**
     * Executa uma completion request ao LLM (Core)
     */
    async complete(prompt, options = {}) {
        return await this.coreClient.complete(prompt, options);
    }

    /**
     * Gera prompt baseado no goal (Core)
     */
    async generatePrompt(goal) {
        return await this.coreClient.generatePrompt(goal);
    }

    /**
     * Executa qualquer comando do CLI (Core + Legacy fallback)
     */
    async execute(args) {
        try {
            // Operações nativas do Core
            if (args[0] === 'complete') {
                const prompt = args.slice(1).join(' ');
                return await this.coreClient.complete(prompt);
            }

            if (args[0] === 'generate-prompt') {
                const goal = args.slice(1).join(' ');
                return await this.coreClient.generatePrompt(goal);
            }

            // Para outros comandos, usa o método execute do Core
            return await this.coreClient.execute(args);
        } catch (error) {
            console.error(`[AIClient] Core execution failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Métodos migrados para o Core
     */
    async buildContext() {
        return await this.coreClient.buildContext();
    }

    async initializeWorkspace() {
        return await this.coreClient.initializeWorkspace();
    }

    async getStatus() {
        return await this.coreClient.getStatus();
    }

    /**
     * Métodos de compatibilidade adicional
     */
    async getPerformanceMetrics() {
        return await this.coreClient.getMetrics();
    }

    async getSecurityStatus() {
        return await this.security.getStatus();
    }

    async getMemoryStats() {
        return await this.coreClient.getMemoryStats();
    }
}

/**
 * Acesso direto aos componentes do Core
 */
getCoreClient() {
    return this.coreClient;
}

getMemoryManager() {
    return this.coreClient.getMemoryManager();
}

getWALManager() {
    return this.coreClient.getWALManager();
}

getSecuritySandbox() {
    return this.security;
}

getToneManager() {
    return this.toneManager;
}

module.exports = AIClient;
