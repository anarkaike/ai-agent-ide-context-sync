const CLIMigrationAIClient = require('./CLIMigrationAIClient');

/**
 * AIClient - Legacy Wrapper
 * 
 * Este arquivo agora serve como um wrapper para manter compatibilidade
 * com o código existente enquanto usa o novo @ai-agent/core.
 */
class AIClient {
    constructor(projectRoot) {
        // Inicializa o Migration Client que usa o Core
        this.migrationClient = new CLIMigrationAIClient(projectRoot);
        this.projectRoot = projectRoot || process.cwd();
    }

    /**
     * Executa uma completion request ao LLM (delegado para o Core)
     */
    async complete(prompt, options = {}) {
        return await this.migrationClient.complete(prompt, options);
    }

    /**
     * Gera prompt baseado no goal (delegado para o Core)
     */
    async generatePrompt(goal) {
        return await this.migrationClient.generatePrompt(goal);
    }

    /**
     * Executa qualquer comando do CLI (delegado para o Core)
     */
    async execute(args) {
        return await this.migrationClient.execute(args);
    }

    /**
     * Métodos de compatibilidade
     */
    async buildContext() {
        return await this.migrationClient.buildContext();
    }

    async initializeWorkspace() {
        return await this.migrationClient.initializeWorkspace();
    }

    async getStatus() {
        return await this.migrationClient.getStatus();
    }

    /**
     * Acesso direto aos componentes do Core
     */
    getCoreClient() {
        return this.migrationClient.getCoreClient();
    }

    getMemoryManager() {
        return this.migrationClient.getMemoryManager();
    }

    getWALManager() {
        return this.migrationClient.getWALManager();
    }

    getSecuritySandbox() {
        return this.migrationClient.getSecuritySandbox();
    }

    getToneManager() {
        return this.migrationClient.getToneManager();
    }
}

module.exports = AIClient;
