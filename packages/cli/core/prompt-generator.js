/**
 * PromptGenerator - Sistema de Geração de Prompts Estruturados
 * 
 * Gera prompts otimizados para IA seguindo o padrão:
 * 1. 🎯 OBJETIVO
 * 2. 📋 CONTEXTO (Regras, Arquivos, Histórico)
 * 3. ⚠️ CONSTRAINTS
 */

const RulesManager = require('./rules-manager');
const ToneConfigManager = require('./ToneConfigManager');
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
        this.toneManager = new ToneConfigManager(this.projectRoot);
        this.semanticSearch = SemanticSearch ? new SemanticSearch(this.projectRoot) : null;
        this.cache = SmartCache ? new SmartCache(this.projectRoot) : null;
    }

    toNumber(value) {
        if (!value) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    getBudget(optionsBudget = {}) {
        return {
            maxChars: this.toNumber(optionsBudget.maxChars || process.env.AI_DOC_PROMPT_MAX_CHARS),
            maxRuleChars: this.toNumber(optionsBudget.maxRuleChars || process.env.AI_DOC_PROMPT_MAX_RULE_CHARS),
            maxRules: this.toNumber(optionsBudget.maxRules || process.env.AI_DOC_PROMPT_MAX_RULES),
            maxContextFiles: this.toNumber(optionsBudget.maxContextFiles || process.env.AI_DOC_PROMPT_MAX_CONTEXT_FILES),
            maxHistoryItems: this.toNumber(optionsBudget.maxHistoryItems || process.env.AI_DOC_PROMPT_MAX_HISTORY_ITEMS)
        };
    }

    trimText(text, maxChars, notice) {
        if (!maxChars || text.length <= maxChars) return text;
        const suffix = notice || '\n\n⚠️ Conteúdo truncado por orçamento de contexto.';
        const available = Math.max(0, maxChars - suffix.length);
        return text.slice(0, available) + suffix;
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
        const { goal, contextFiles = [], mentions = [], history = [], autoContext = true, budget: optionsBudget = {} } = options;
        const budget = this.getBudget(optionsBudget);

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

        if (budget.maxContextFiles && finalContextFiles.length > budget.maxContextFiles) {
            finalContextFiles = finalContextFiles.slice(0, budget.maxContextFiles);
        }

        const limitedHistory = budget.maxHistoryItems ? history.slice(-budget.maxHistoryItems) : history;

        // 0.5 Get Tone Config (Moved up for cache key)
        const toneConfig = this.toneManager.getConfig();

        // 0.6 Verifica Cache
        if (this.cache) {
            // Include tone params in cache key to differentiate prompts
            const cacheExtra = {
                temp: toneConfig?.temperature,
                model: toneConfig?.model_hint
            };
            const cached = this.cache.getCachedPrompt(goal, finalContextFiles, cacheExtra);
            if (cached) {
                return cached + "\n\n<!-- CACHED (SmartCache) -->";
            }
        }

        // 1. Coleta regras aplicáveis via RulesManager (Async)
        let rules = await this.collectRules(finalContextFiles, mentions, goal);
        if (budget.maxRules && rules.length > budget.maxRules) {
            rules = rules.slice(0, budget.maxRules);
        }
        if (budget.maxRuleChars) {
            rules = rules.map(rule => ({
                ...rule,
                content: this.trimText(rule.content || '', budget.maxRuleChars, '\n\n[...]')
            }));
        }

        // (Removed previous 1.5 Get Tone Config location)

        // 2. Monta seções
        const sections = [
            this.buildToneSection(toneConfig),
            this.buildGoalSection(goal),
            this.buildContextSection(finalContextFiles, rules, limitedHistory),
            this.buildConstraintsSection(rules)
        ];

        // 3. Junta tudo
        let finalPrompt = sections.filter(Boolean).join('\n\n');
        if (budget.maxChars) {
            finalPrompt = this.trimText(finalPrompt, budget.maxChars);
        }

        // Salva cache
        if (this.cache) {
            const cacheExtra = {
                temp: toneConfig?.temperature,
                model: toneConfig?.model_hint
            };
            this.cache.setCachedPrompt(goal, finalContextFiles, finalPrompt, cacheExtra);
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

    buildToneSection(config) {
        if (!config) return '';
        return `## 🎭 TONE & STYLE INSTRUCTIONS\n${config.instruction}\n\n> **Parameters**: Temp=${config.temperature}, MaxTokens=${config.max_tokens}, ModelHint=${config.model_hint}`;
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
