const fs = require('fs');
const path = require('path');

/**
 * 🔦 Mecanismo de Atenção (Attention Mechanism)
 * 
 * Responsável por direcionar o "Foco da Lanterna" do agente.
 * Em vez de ler toda a memória o tempo todo, ele seleciona
 * o que é relevante para o "Momento" atual.
 */
class AttentionMechanism {
    constructor(workspacePath) {
        this.workspacePath = workspacePath || process.cwd();
        this.memoryPath = path.join(this.workspacePath, '.ai-workspace', 'memory');
    }

    /**
     * Foca a lanterna baseada no momento atual.
     * @param {Object} moment - O contexto atual (ex: { mode: 'philosophical', intent: 'fix' })
     * @returns {Object} - As regras e memórias iluminadas.
     */
    focus(moment = {}) {
        const result = {
            activeRules: [],
            relevantMemories: [],
            mode: moment.mode || 'default'
        };

        // 1. Buscar Regras Contextuais (MEM_PROJECT_RULES)
        const rulesPath = path.join(this.memoryPath, 'MEM_PROJECT_RULES.md');
        if (fs.existsSync(rulesPath)) {
            const rulesContent = fs.readFileSync(rulesPath, 'utf8');
            result.activeRules = this.extractActiveRules(rulesContent, result.mode);
        }

        // 2. Buscar Memórias Relevantes (Scan simples por palavras-chave)
        // (Implementação futura: Vector Search)
        
        return result;
    }

    /**
     * Extrai apenas as regras ativas para o modo atual.
     * @param {string} content - Conteúdo do arquivo de regras.
     * @param {string} currentMode - Modo atual (ex: 'creative', 'surgical', 'philosophical').
     */
    extractActiveRules(content, currentMode) {
        const lines = content.split('\n');
        const activeRules = [];
        let inTargetSection = false;
        
        // Se mode for default, pega regras globais (sem seção específica ou seção 'Global')
        if (currentMode === 'default') {
             // Simplificação: pega tudo que não está em outras seções
             // Para MVP, vamos assumir que default pega a primeira seção
             inTargetSection = true; 
        }

        for (const line of lines) {
            const trimLine = line.trim();
            
            // Detecta início de seção de modo (ex: ## Mode: Creative)
            if (trimLine.startsWith('## Mode:')) {
                const sectionMode = trimLine.split(':')[1].trim().toLowerCase();
                // Verifica se o modo atual corresponde (partial match allowed)
                if (currentMode.toLowerCase().includes(sectionMode) || sectionMode.includes(currentMode.toLowerCase())) {
                    inTargetSection = true;
                } else {
                    inTargetSection = false;
                }
                continue;
            }

            // Se estamos na seção alvo, coleta as regras
            if (inTargetSection && (trimLine.startsWith('-') || trimLine.startsWith('>'))) {
                activeRules.push(trimLine);
            }
        }

        return activeRules;
    }
}

module.exports = AttentionMechanism;
