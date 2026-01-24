/**
 * AIClient - Wrapper para comunicação com o CLI (Core Intelligence)
 */
const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

class AIClient {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || vscode.workspace.rootPath;
        // Caminho relativo ao CLI dentro do monorepo (packages/extension -> packages -> root -> packages/cli)
        this.cliPath = path.resolve(__dirname, '../cli/cli/ai-doc.js');
    }

    /**
     * Executa qualquer comando do CLI
     * @param {string[]} args 
     * @returns {Promise<string>}
     */
    async execute(args) {
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
                        console.error(msg);
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
        console.log(`[AIClient] Executing: ${command} ${commandArgs.join(' ')}`);
        execFile(command, commandArgs, { cwd: this.projectRoot }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[AIClient] Error: ${stderr}`);
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
                console.error('[AIClient] Failed to parse workflows JSON:', parseError);
                return [];
            }
        } catch (e) {
            console.error('[AIClient] Error listing workflows:', e);
            return [];
        }
    }

    /**
     * Executa um workflow
     */
    async runWorkflow(workflowId, params = {}) {
        const paramsStr = Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ');

        return this.execute(['run', workflowId, paramsStr]);
    }

    async scanDocs(targetDir = '.') {
        return this.execute(['scan', targetDir]);
    }

    async runRitual() {
        return this.execute(['ritual']);
    }

    async evolveRules() {
        return this.execute(['evolve']);
    }

    async getKernelStatus() {
         return this.execute(['kernel']);
    }

    async listRules() {
        // Retorna output bruto, parsing deve ser feito por quem chama ou melhorar CLI para JSON
        return this.execute(['rules', '--list']);
    }

    async initWorkspace() {
        return this.execute(['init']);
    }

    async buildContext() {
        return this.execute(['build']);
    }

    async getStatus() {
        return this.execute(['status']);
    }

    async createIdentity(name) {
        return this.execute(['identity', 'create', name]);
    }

    async listHeuristics() {
        return this.execute(['heuristics']);
    }
}

module.exports = AIClient;
