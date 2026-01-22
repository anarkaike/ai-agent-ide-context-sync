/**
 * WorkflowManager - Gerenciador de tarefas automatizadas
 * 
 * Permite definir e executar workflows compostos por múltiplos passos.
 * 
 * Formato do Workflow (YAML/Frontmatter):
 * ---
 * name: Create Component
 * description: Scaffolds a new React component
 * params:
 *   - name: componentName
 *     description: Name of the component
 * ---
 * 
 * steps:
 *   - name: Create File
 *     action: create_file
 *     path: src/components/${componentName}.tsx
 *     content: |
 *       import React from 'react';
 *       export const ${componentName} = () => <div>${componentName}</div>;
 * 
 *   - name: Create Test
 *     action: create_file
 *     path: src/components/__tests__/${componentName}.test.tsx
 *     content: ...
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

class WorkflowManager {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.workflowsPath = path.join(this.projectRoot, '.ai-context', 'workflows');
        this.globalWorkflowsPath = path.join(os.homedir(), '.ai-doc', 'workflows');
    }

    /**
     * Lista todos os workflows disponíveis
     */
    listWorkflows() {
        const workflows = [];

        // Helper para ler diretório
        const readDir = (dir, source) => {
            if (!fs.existsSync(dir)) return;
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.md'));

            files.forEach(file => {
                try {
                    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
                    const parsed = this.parseWorkflow(content);
                    if (parsed) {
                        workflows.push({
                            id: file.replace(/\.(yaml|yml|md)$/, ''),
                            source,
                            ...parsed
                        });
                    }
                } catch (e) {
                    console.error(`Erro ao ler workflow ${file}:`, e.message);
                }
            });
        };

        readDir(this.globalWorkflowsPath, 'global');
        readDir(this.workflowsPath, 'project');

        return workflows;
    }

    /**
     * Parseia o conteúdo de um arquivo de workflow
     */
    parseWorkflow(content) {
        // Suporta YAML puro ou Markdown com frontmatter
        let data = {};

        // Tenta parsear como Frontmatter + Content (Markdown)
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (frontmatterMatch) {
            try {
                const fm = yaml.load(frontmatterMatch[1]);
                // Se o corpo tiver passos definidos em YAML (estilo GitHub Actions no MD)
                // ou se os passos estiverem no frontmatter
                data = fm;

                // Se não tiver steps no frontmatter, tenta parsear o body como blocos de ação?
                // Por simplicidade, vamos assumir que steps estao no YAML por enquanto
            } catch (e) {
                return null;
            }
        } else {
            // Tenta parsear como YAML puro
            try {
                data = yaml.load(content);
            } catch (e) {
                return null;
            }
        }

        if (!data || !data.steps) return null;
        return data;
    }

    /**
     * Executa um workflow
     * @param {string} workflowId Nome do workflow
     * @param {Object} params Parâmetros para substituição
     */
    async runWorkflow(workflowId, params = {}) {
        const workflows = this.listWorkflows();
        const workflow = workflows.find(w => w.id === workflowId);

        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found.`);
        }

        console.log(`🚀 Iniciando workflow: ${workflow.name || workflowId}`);

        // Valida parâmetros obrigatórios
        if (workflow.params) {
            const missing = workflow.params.filter(p => p.required && !params[p.name]);
            if (missing.length > 0) {
                throw new Error(`Missing required params: ${missing.map(p => p.name).join(', ')}`);
            }
        }

        // Executa passos
        for (const step of workflow.steps) {
            console.log(`▶️  Step: ${step.name}`);
            await this.executeStep(step, params);
        }

        console.log('✅ Workflow concluído!');
    }

    /**
     * Executa um passo individual
     */
    async executeStep(step, params) {
        const action = step.action;

        // Substitui variáveis ${var} nas propriedades relevantes
        const processTemplate = (str) => {
            if (typeof str !== 'string') return str;
            return str.replace(/\$\{([^}]+)\}/g, (_, key) => params[key] || '');
        };

        const pathSolved = processTemplate(step.path);
        const contentSolved = processTemplate(step.content);
        const commandSolved = processTemplate(step.command);

        switch (action) {
            case 'create_file':
                this.ensureDir(path.dirname(path.join(this.projectRoot, pathSolved)));
                fs.writeFileSync(path.join(this.projectRoot, pathSolved), contentSolved);
                console.log(`   Created: ${pathSolved}`);
                break;

            case 'run_command':
                const { execSync } = require('child_process');
                console.log(`   Running: ${commandSolved}`);
                execSync(commandSolved, { stdio: 'inherit', cwd: this.projectRoot });
                break;

            case 'append_file':
                // TODO: Implementar append
                break;

            default:
                console.warn(`   ⚠️  Unknown action: ${action}`);
        }
    }

    ensureDir(dir) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
}

module.exports = WorkflowManager;
