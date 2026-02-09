/**
 * CLI Migration Wrapper
 * 
 * Faz a ponte entre o AIClient legado do CLI
 * e o novo @ai-agent/core unificado.
 */

const { initializeCore } = require('@ai-agent/core');
const ToneConfigManager = require('./ToneConfigManager');

class CLIMigrationAIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        this.initialized = false;
        this.coreComponents = null;

        // Mantém o ToneConfigManager legado para compatibilidade
        this.toneManager = new ToneConfigManager(this.projectRoot);
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
            console.log('✅ Core System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Core System:', error);
            throw error;
        }
    }

    /**
     * Executa uma completion request ao LLM (interface legada)
     * @param {string} prompt O prompt text
     * @param {Object} options Override options { temperature, maxTokens, model }
     * @returns {Promise<Object>} Response object { content, usage, config_used }
     */
    async complete(prompt, options = {}) {
        try {
            // Garante inicialização
            await this._ensureInitialized();

            // 1. Get Tone Configuration (legado)
            const toneConfig = this.toneManager.getConfig();

            // 2. Merge Configuration (mantendo compatibilidade)
            const config = {
                temperature: options.temperature ?? toneConfig.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? toneConfig.max_tokens ?? 2048,
                model: options.model ?? toneConfig.model_hint ?? 'gpt-4o',
                system_instruction: toneConfig.instruction,
                min_chars: toneConfig.min_chars ?? 0,
                stream: options.stream ?? false
            };

            // 3. Usa o Core AIClient para completion
            const result = await this.coreComponents.client.complete(prompt, config);

            // 4. Retorna no formato legado
            return {
                content: result.content,
                usage: result.usage || {
                    prompt_tokens: prompt.length / 4,
                    completion_tokens: result.content.length / 4,
                    total_tokens: (prompt.length + result.content.length) / 4
                },
                config_used: config
            };
        } catch (error) {
            console.error(`[CLIMigrationAIClient] Error in completion:`, error);
            throw error;
        }
    }

    /**
     * Gera prompt baseado no goal (interface legada)
     * @param {string} goal 
     * @returns {Promise<string>}
     */
    async generatePrompt(goal) {
        try {
            // Garante inicialização
            await this._ensureInitialized();

            // Usa o Core AIClient
            return await this.coreComponents.client.generatePrompt(goal);
        } catch (error) {
            console.error(`[CLIMigrationAIClient] Error generating prompt:`, error);
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
            console.error(`[CLIMigrationAIClient] Error executing command: ${args.join(' ')}`, error);
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
                const context = await this.coreComponents.memory.buildContext();
                return JSON.stringify(context, null, 2);

            case 'init':
                // Usa o WAL do core
                await this.coreComponents.wal.beginTransaction();
                await this.coreComponents.wal.addOperation({
                    type: 'init',
                    timestamp: new Date().toISOString(),
                    data: { workspace: this.projectRoot }
                });
                await this.coreComponents.wal.commit();
                return 'Workspace initialized with Core WAL';

            case 'status':
                // Usa o MemoryManager para status
                const status = await this.coreComponents.memory.getStatus();
                return JSON.stringify(status, null, 2);

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

    /**
     * Acesso ao ToneManager (legado)
     */
    getToneManager() {
        return this.toneManager;
    }
}

module.exports = CLIMigrationAIClient;
