/**
 * AIClient Migration Wrapper
 * 
 * Este arquivo faz a ponte entre o AIClient legado da extensão
 * e o novo @ai-agent/core unificado.
 */

const { initializeCore } = require('@ai-agent/core');
const vscode = require('vscode');
const path = require('path');

class MigrationAIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || vscode.workspace.rootPath;
        this.initialized = false;
        this.coreComponents = null;

        // Mantém compatibilidade com interface legada
        this.logger = null;
    }

    static setLogger(logger) {
        MigrationAIClient.logger = logger;
    }

    /**
     * Inicializa os componentes do Core (lazy initialization)
     */
    async _ensureInitialized() {
        if (this.initialized) return;

        try {
            // Inicializa o Core System
            this.coreComponents = await initializeCore({
                security: {
                    enableSandbox: true,
                    enableEncryption: true,
                    enableSigning: true
                },
                memory: {
                    enableWAL: true,
                    checkpointInterval: 60000,
                    workspacePath: this.projectRoot
                },
                basePath: this.projectRoot
            });

            this.initialized = true;
            if (MigrationAIClient.logger) {
                MigrationAIClient.logger.log('✅ Core System initialized successfully in Extension');
            }
        } catch (error) {
            if (MigrationAIClient.logger) {
                MigrationAIClient.logger.error('❌ Failed to initialize Core System in Extension:', error);
            }
            throw error;
        }
    }

    /**
     * Executa qualquer comando do CLI (interface legada)
     * @param {string[]} args 
     * @returns {Promise<string>}
     */
    async execute(args) {
        try {
            // Garante inicialização
            await this._ensureInitialized();

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
            case 'build': {
                // Usa o MemoryManager do core
                const context = await this.coreComponents.memory.buildContext();
                return JSON.stringify(context, null, 2);
            }

            case 'init': {
                // Usa o WAL do core
                await this.coreComponents.wal.beginTransaction();
                await this.coreComponents.wal.addOperation({
                    type: 'init',
                    timestamp: new Date().toISOString(),
                    data: { workspace: this.projectRoot }
                });
                await this.coreComponents.wal.commit();
                return 'Workspace initialized with Core WAL';
            }

            case 'status': {
                // Usa o MemoryManager para status
                const status = await this.coreComponents.memory.getStatus();
                return JSON.stringify(status, null, 2);
            }

            case 'create':
                if (restArgs[0] === 'persona') {
                    // Cria persona através do MemoryManager
                    const personaData = JSON.parse(restArgs[1] || '{}');
                    const result = await this.coreComponents.memory.createPersona(personaData);
                    return JSON.stringify(result, null, 2);
                }
                break;

            case 'list':
                if (restArgs[0] === 'personas') {
                    // Lista personas através do MemoryManager
                    const personas = await this.coreComponents.memory.listPersonas();
                    return JSON.stringify(personas, null, 2);
                }
                break;

            default:
                // Para comandos não mapeados, usa o execute do core
                return await this.coreComponents.client.execute(args);
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
        return this.coreComponents?.client;
    }

    /**
     * Acesso ao MemoryManager
     */
    getMemoryManager() {
        return this.coreComponents?.memory;
    }

    /**
     * Acesso ao WALManager
     */
    getWALManager() {
        return this.coreComponents?.wal;
    }

    /**
     * Acesso ao SecuritySandbox
     */
    getSecuritySandbox() {
        return this.coreComponents?.security;
    }
}

module.exports = MigrationAIClient;
