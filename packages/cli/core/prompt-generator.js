/**
 * PromptGenerator - Sistema de Geração de Prompts Estruturados
 * 
 * Gera prompts otimizados para IA seguindo o padrão:
 * 1. 🎯 OBJETIVO
 * 2. 📋 CONTEXTO (Regras, Arquivos, Histórico)
 * 3. ⚠️ CONSTRAINTS
 */

const RulesManager = require('./rules-manager');
const path = require('path');
const fs = require('fs');
let SemanticSearch = null;
let SmartCache = null;
try {
    SemanticSearch = require('../indexing/semantic-search');
    SmartCache = require('./smart-cache');
} catch (e) { }

class PromptGenerator {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.rulesManager = new RulesManager(this.projectRoot);
        this.semanticSearch = SemanticSearch ? new SemanticSearch(this.projectRoot) : null;
        this.cache = SmartCache ? new SmartCache(this.projectRoot) : null;
    }

    /**
     * Gera um prompt estruturado completo
     * @param {Object} options
     * @param {string} options.goal Objetivo principal da tarefa
     * @param {string[]} options.contextFiles Arquivos de contexto (caminhos absolutos ou relativos)
     * @param {string[]} options.mentions Menções explícitas (@rule, @file, etc)
     * @param {string[]} options.history Histórico recente de comandos/prompts
     * @param {boolean} options.autoContext Se true, busca arquivos semanticamente relevantes
     * @returns {Promise<string>} Prompt formatado
     */
    async generate(options = {}) {
        const { goal, contextFiles = [], mentions = [], history = [], autoContext = true } = options;

        let finalContextFiles = [...contextFiles];

        // 0. Auto-sugestão de arquivos via Semantic Search
        if (autoContext && this.semanticSearch && goal) {
            try {
                // Busca top 3 arquivos relevantes
                const suggestions = await this.semanticSearch.search(goal, 3);
                // Adiciona se já não estiverem na lista
                suggestions.forEach(s => {
                    const relative = s.path;
                    // Verifica se já não foi incluído explicitamente
                    const alreadyIncluded = finalContextFiles.some(f =>
                        path.relative(this.projectRoot, path.resolve(this.projectRoot, f)) === relative
                    );

                    if (!alreadyIncluded && s.similarity > 0.4) {
                        finalContextFiles.push(relative);
                    }
                });
            } catch (e) {
                console.warn('Falha na busca semântica automática:', e.message);
            }
        }

        // 0.5 Verifica Cache
        if (this.cache) {
            const cached = this.cache.getCachedPrompt(goal, finalContextFiles);
            if (cached) {
                return cached + "\n\n<!-- CACHED (SmartCache) -->";
            }
        }

        // 1. Coleta regras aplicáveis via RulesManager (Async)
        const rules = await this.collectRules(finalContextFiles, mentions, goal);

        // 2. Monta seções
        const sections = [
            this.buildGoalSection(goal),
            this.buildContextSection(finalContextFiles, rules, history),
            this.buildConstraintsSection(rules)
        ];

        // 3. Junta tudo
        const finalPrompt = sections.filter(Boolean).join('\n\n');

        // Salva cache
        if (this.cache) {
            this.cache.setCachedPrompt(goal, finalContextFiles, finalPrompt);
        }

        return finalPrompt;
    }

    /**
     * Coleta regras usando o RulesManager
     */
    async collectRules(contextFiles, mentions, query) {
        // Para cada arquivo de contexto, busca regras aplicáveis
        let allRules = [];

        // 1. Regras globais (mentions, always e intelligent via query)
        const globalRules = await this.rulesManager.getApplicableRulesAsync({ mentions, query });
        allRules = [...globalRules];

        // 2. Regras por arquivo
        for (const file of contextFiles) {
            const fileRules = await this.rulesManager.getApplicableRulesAsync({
                filePath: path.resolve(this.projectRoot, file)
            });
            allRules = [...allRules, ...fileRules];
        }

        // Remove duplicatas
        const seen = new Set();
        return allRules.filter(rule => {
            if (seen.has(rule.id)) return false;
            seen.add(rule.id);
            return true;
        });
    }

    buildGoalSection(goal) {
        if (!goal) return '';
        return `## 🎯 OBJETIVO\n${goal}`;
    }

    buildContextSection(contextFiles, rules, history) {
        const parts = [];

        // Arquivos
        if (contextFiles.length > 0) {
            const filesContent = contextFiles.map(file => {
                const absPath = path.resolve(this.projectRoot, file);
                const relPath = path.relative(this.projectRoot, absPath);
                return `- \`${relPath}\``;
            }).join('\n');
            parts.push(`### 📂 Arquivos Relevantes\n${filesContent}`);
        }

        // Regras Ativas
        if (rules.length > 0) {
            const ruleslist = rules.map(r => `- **${r.id}** (${r.level}): ${r.description || 'Sem descrição'}`).join('\n');
            parts.push(`### 📏 Regras Aplicadas\n${ruleslist}`);
        }

        // Histórico
        if (history.length > 0) {
            parts.push(`### 🕒 Histórico Recente\n${history.map(h => `- ${h}`).join('\n')}`);
        }

        if (parts.length === 0) return '';
        return `## 📋 CONTEXTO\n${parts.join('\n\n')}`;
    }

    buildConstraintsSection(rules) {
        if (rules.length === 0) return '';

        const ruleContents = rules.map(rule => {
            return `### ${rule.id}\n${rule.content}`;
        }).join('\n\n');

        return `## ⚠️ CONSTRAINTS & REGRAS DETALHADAS\n\n${ruleContents}`;
    }
}

module.exports = PromptGenerator;
