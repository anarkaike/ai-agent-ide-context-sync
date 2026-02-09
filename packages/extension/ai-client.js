/**
 * AIClient - Wrapper para comunicação com o Core Unificado
 * 
 * MIGRADO: Agora usa @ai-agent/core em vez de CLI direto
 */
const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

// Import do Core Unificado
const { AIClient: CoreAIClient, ToneConfigManager, SecuritySandbox } = require('../../core/src/index.js');

class AIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || vscode.workspace.rootPath;

        // Inicializa o Core AIClient
        this.toneManager = new ToneConfigManager();
        this.security = new SecuritySandbox();
        this.coreClient = new CoreAIClient(this.toneManager, this.security);

        // Legacy support
        this.cliPath = path.resolve(__dirname, '../cli/cli/ai-doc.js');
    }

    static setLogger(logger) {
        AIClient.logger = logger;
    }

    /**
     * Executa qualquer comando do CLI (MIGRADO para Core)
     * @param {string[]} args 
     * @returns {Promise<string>}
     */
    async execute(args) {
        try {
            // Usa o Core AIClient para operações nativas
            if (args[0] === 'complete') {
                const prompt = args.slice(1).join(' ');
                return await this.coreClient.complete(prompt);
            }

            if (args[0] === 'generate-prompt') {
                const goal = args.slice(1).join(' ');
                return await this.coreClient.generatePrompt(goal);
            }

            // Fallback para CLI legacy se necessário
            return await this._executeLegacy(args);
        } catch (error) {
            if (AIClient.logger) {
                AIClient.logger.error(`[AIClient] Core execution failed: ${error.message}`, error);
            } else {
                console.error(`[AIClient] Core execution failed: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Legacy CLI execution para comandos não migrados
     */
    async _executeLegacy(args) {
        return new Promise((resolve, reject) => {
            const useLocal = fs.existsSync(this.cliPath);
            const command = useLocal ? 'node' : 'ai-doc';
            const commandArgs = useLocal ? [this.cliPath, ...args] : args;

            // Se for usar comando global, verifica se existe antes
            if (!useLocal) {
                const checkCmd = process.platform === 'win32' ? 'where ai-doc' : 'which ai-doc';
                exec(checkCmd, (checkError) => {
                    if (checkError) {
                        const msg = `[AIClient] CLI não encontrado. Instale globalmente com 'npm install -g ai-agent-ide-context-sync' ou use 'npm link' no diretório do CLI.`;
                        if (AIClient.logger) {
                            AIClient.logger.error(msg, checkError);
                        } else {
                            console.error(msg);
                        }
                        vscode.window.showErrorMessage("AI Agent CLI not found! Please install it globally: npm install -g ai-agent-ide-context-sync");
                        reject(msg);
                        return;
                    }

                    // Se existe, executa
                    this._runExecFile(command, commandArgs, resolve, reject);
                });
            } else {
                // Se for local, executa direto
                this._runExecFile(command, commandArgs, resolve, reject);
            }
        });
    }

    _runExecFile(command, commandArgs, resolve, reject) {
        if (AIClient.logger) {
            AIClient.logger.log(`[AIClient] Executing: ${command} ${commandArgs.join(' ')}`);
        } else {
            console.log(`[AIClient] Executing: ${command} ${commandArgs.join(' ')}`);
        }
        execFile(command, commandArgs, { cwd: this.projectRoot }, (error, stdout, stderr) => {
            if (error) {
                if (AIClient.logger) {
                    AIClient.logger.error(`[AIClient] Error: ${stderr}`, error);
                } else {
                    console.error(`[AIClient] Error: ${stderr}`);
                }
                reject(stderr || error.message);
                return;
            }
            resolve(stdout.trim());
        });
    }

    /**
     * Gera um prompt inteligente estruturado
     * @param {string} goal Objetivo do usuário
     */
    async generatePrompt(goal) {
        if (!goal) throw new Error('Goal is required');

        // Escapa aspas para evitar quebra no shell
        const safeGoal = goal.replace(/"/g, '\\"');
        const output = await this.execute(['prompt', safeGoal]);

        // O CLI retorna logs coloridos e outras infos. Precisamos extrair apenas o prompt.
        // O prompt starts with "=== 🤖 PROMPT GERADO ==="
        const marker = '=== 🤖 PROMPT GERADO ===';
        const index = output.indexOf(marker);

        if (index !== -1) {
            return output.substring(index + marker.length).trim();
        }

        return output;
    }

    /**
     * Lista workflows disponíveis
     */
    async listWorkflows() {
        try {
            const output = await this.execute(['workflows', '--json']);
            try {
                return JSON.parse(output);
            } catch (parseError) {
                if (AIClient.logger) {
                    AIClient.logger.error('[AIClient] Failed to parse workflows JSON:', parseError);
                } else {
                    console.error('[AIClient] Failed to parse workflows JSON:', parseError);
                }
                return [];
            }
        } catch (e) {
            if (AIClient.logger) {
                AIClient.logger.error('[AIClient] Error listing workflows:', e);
            } else {
                console.error('[AIClient] Error listing workflows:', e);
            }
            return [];
        }
    }

    /**
     * Executa um workflow
     */
    async runWorkflow(workflowId, params = {}, options = {}) {
        const args = ['run', workflowId];

        Object.entries(params).forEach(([key, value]) => {
            args.push(`${key}=${value}`);
        });

        if (options.opId) {
            args.push(`--op=${options.opId}`);
        }

        return this.execute(args);
    }

    // Métodos migrados para o Core
    async buildContext() {
        return await this.coreClient.buildContext();
    }

    async getStatus() {
        return await this.coreClient.getStatus();
    }

    async initializeWorkspace() {
        return await this.coreClient.initializeWorkspace();
    }

    // Métodos legacy que ainda usam CLI
    async scanDocs(targetDir = '.') {
        return this._executeLegacy(['scan', targetDir]);
    }

    async runRitual() {
        return this._executeLegacy(['ritual']);
    }

    async evolveRules() {
        return this._executeLegacy(['evolve']);
    }

    async getKernelStatus() {
        return this._executeLegacy(['kernel']);
    }

    async listRules() {
        return this._executeLegacy(['rules', '--list']);
    }

    async initWorkspace() {
        return this._executeLegacy(['init']);
    }

    async createIdentity(name) {
        return this._executeLegacy(['identity', 'create', name]);
    }

    async listHeuristics() {
        return this._executeLegacy(['heuristics']);
    }
}

module.exports = AIClient;
