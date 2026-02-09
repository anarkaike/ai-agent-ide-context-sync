/**
 * AIClient Migration Wrapper
 * 
 * Este arquivo faz a ponte entre o AIClient legado da extensão
 * e o novo @ai-agent/core unificado.
 */

const { AIClient: CoreAIClient } = require('@ai-agent/core');
const vscode = require('vscode');
const path = require('path');

class MigrationAIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || vscode.workspace.rootPath;
        
        // Inicializa o Core AIClient
        this.coreClient = new CoreAIClient({
            basePath: this.projectRoot,
            logger: console
        });
        
        // Mantém compatibilidade com interface legada
        this.logger = null;
    }

    static setLogger(logger) {
        MigrationAIClient.logger = logger;
    }

    /**
     * Executa qualquer comando do CLI (interface legada)
     * @param {string[]} args 
     * @returns {Promise<string>}
     */
    async execute(args) {
        try {
            // Mapeia comandos legados para o Core AIClient
            const result = await this._mapLegacyCommand(args);
            return result;
        } catch (error) {
            if (MigrationAIClient.logger) {
                MigrationAIClient.logger.error(`[MigrationAIClient] Error executing command: ${args.join(' ')}`, error);
            }
            throw error;
        }
    }

    /**
     * Mapeia comandos legados para o novo Core AIClient
     * @param {string[]} args 
     * @returns {Promise<string>}
     */
    async _mapLegacyCommand(args) {
        const [command, ...restArgs] = args;

        switch (command) {
            case 'build':
                // Usa o MemoryManager do core
                const memory = this.coreClient.memoryManager;
                const context = await memory.buildContext();
                return JSON.stringify(context, null, 2);

            case 'init':
                // Usa o WAL do core
                const wal = this.coreClient.walManager;
                await wal.beginTransaction();
                await wal.addOperation({
                    type: 'init',
                    timestamp: new Date().toISOString(),
                    data: { workspace: this.projectRoot }
                });
                await wal.commit();
                return 'Workspace initialized with Core WAL';

            case 'status':
                // Usa o MemoryManager para status
                const status = await this.coreClient.memoryManager.getStatus();
                return JSON.stringify(status, null, 2);

            case 'create':
                if (restArgs[0] === 'persona') {
                    // Cria persona através do MemoryManager
                    const personaData = JSON.parse(restArgs[1] || '{}');
                    const result = await this.coreClient.memoryManager.createPersona(personaData);
                    return JSON.stringify(result, null, 2);
                }
                break;

            case 'list':
                if (restArgs[0] === 'personas') {
                    // Lista personas através do MemoryManager
                    const personas = await this.coreClient.memoryManager.listPersonas();
                    return JSON.stringify(personas, null, 2);
                }
                break;

            default:
                // Para comandos não mapeados, usa o execute do core
                return await this.coreClient.execute(args);
        }

        throw new Error(`Command not supported: ${command}`);
    }

    /**
     * Métodos de compatibilidade com interface legada
     */
    async buildContext() {
        return this.execute(['build']);
    }

    async initializeWorkspace() {
        return this.execute(['init']);
    }

    async getStatus() {
        return this.execute(['status']);
    }

    /**
     * Acesso direto ao Core AIClient para funcionalidades avançadas
     */
    getCoreClient() {
        return this.coreClient;
    }

    /**
     * Acesso ao MemoryManager
     */
    getMemoryManager() {
        return this.coreClient.memoryManager;
    }

    /**
     * Acesso ao WALManager
     */
    getWALManager() {
        return this.coreClient.walManager;
    }

    /**
     * Acesso ao SecuritySandbox
     */
    getSecuritySandbox() {
        return this.coreClient.securitySandbox;
    }
}

module.exports = MigrationAIClient;
