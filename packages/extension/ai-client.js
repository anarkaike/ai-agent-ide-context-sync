/**
 * AIClient - Wrapper para comunicação com o CLI (Core Intelligence)
 */
const { execFile } = require('child_process');
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

            console.log(`[AIClient] Executing: ${command} ${commandArgs.join(' ')}`);

            execFile(command, commandArgs, { cwd: this.projectRoot }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[AIClient] Error: ${stderr}`);
                    reject(stderr || error.message);
                    return;
                }
                resolve(stdout.trim());
            });
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
        // Truque: executar run sem args lista workflows
        // O CLI retorna logs, precisamos parsear
        try {
            await this.execute(['run']);
        } catch (e) {
            // O CLI retorna erro se não passar workflow, mas lista os disponíveis no stdout/stderr antes
            // Precisamos adaptar o CLI para ter um comando 'list-workflows' limpo, ou parsear o output de erro
            // Por enquanto, vamos assumir que o output vem no reject ou stdout dependendo da implementação
            return []; // TODO: Implementar listagem limpa no CLI
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
        return this.execute(['rules', '--evolve']);
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
