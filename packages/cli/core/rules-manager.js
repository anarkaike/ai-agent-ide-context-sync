#!/usr/bin/env node
/**
 * RulesManager - Sistema de Regras Multi-Nível
 * 
 * Gerencia regras em 3 níveis:
 * 1. User Rules (globais, ~/.ai-doc/rules/user/)
 * 2. Project Rules (repositório, .ai-context/rules/project/)
 * 3. Path-Specific Rules (repositório, .ai-context/rules/path-specific/)
 * 
 * Modos de aplicação:
 * - always: Sempre aplicar
 * - intelligent: Aplicar quando relevante (via embedding similarity)
 * - globs: Aplicar quando path matcher
 * - manual: Aplicar via @-mention
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');
let MetricsTracker = null;
try {
    MetricsTracker = require('../evolution/tracker');
} catch (e) { }

class RulesManager {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.userRulesPath = path.join(os.homedir(), '.ai-doc', 'rules', 'user');
        this.projectRulesPath = path.join(this.projectRoot, '.ai-context', 'rules', 'project');
        this.pathSpecificRulesPath = path.join(this.projectRoot, '.ai-context', 'rules', 'path-specific');

        if (MetricsTracker) {
            this.tracker = new MetricsTracker(this.projectRoot);
        }

        this.rules = {
            user: [],
            project: [],
            pathSpecific: []
        };

        this.loadAll();
    }

    /**
     * Carrega todas as regras de todos os níveis
     */
    loadAll() {
        this.rules.user = this.loadRulesFromDir(this.userRulesPath, 'user');
        this.rules.project = this.loadRulesFromDir(this.projectRulesPath, 'project');
        this.rules.pathSpecific = this.loadRulesFromDir(this.pathSpecificRulesPath, 'path-specific');
    }

    /**
     * Carrega regras de um diretório
     */
    loadRulesFromDir(dirPath, level) {
        if (!fs.existsSync(dirPath)) {
            return [];
        }

        const rules = [];
        const files = fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.md') || f.endsWith('.mdc'));

        files.forEach(file => {
            try {
                const filePath = path.join(dirPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const rule = this.parseRule(content, file, level);
                if (rule) {
                    rules.push(rule);
                }
            } catch (err) {
                console.error(`Erro ao carregar regra ${file}:`, err.message);
            }
        });

        return rules;
    }

    /**
     * Parse de arquivo de regra (com ou sem frontmatter)
     */
    parseRule(content, filename, level) {
        const rule = {
            id: filename.replace(/\.(md|mdc)$/, ''),
            filename,
            level,
            mode: 'manual', // default
            description: '',
            globs: [],
            alwaysApply: false,
            content: content
        };

        // Verifica se tem frontmatter YAML
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (frontmatterMatch) {
            try {
                const frontmatter = yaml.load(frontmatterMatch[1]);
                rule.description = frontmatter.description || '';
                rule.globs = frontmatter.globs || [];
                rule.alwaysApply = frontmatter.alwaysApply || false;
                rule.content = frontmatterMatch[2].trim();

                // Determina modo baseado no frontmatter
                if (rule.alwaysApply) {
                    rule.mode = 'always';
                } else if (rule.globs.length > 0) {
                    rule.mode = 'globs';
                } else if (rule.description) {
                    rule.mode = 'intelligent';
                }
            } catch (err) {
                console.error(`Erro ao parsear frontmatter de ${filename}:`, err.message);
            }
        }

        return rule;
    }

    /**
     * Inicializa busca semântica para regras
     */
    async initSemanticSearch() {
        if (this.embeddingsGenerator) return;

        try {
            const EmbeddingsGenerator = require('../indexing/embeddings');
            this.embeddingsGenerator = new EmbeddingsGenerator(this.projectRoot);
            // Indexa regras inteligentes em memória
            await this.indexIntelligentRules();
        } catch (e) {
            console.warn('Busca semântica não disponível (módulos ausentes ou erro na init).');
        }
    }

    /**
     * Gera embeddings para regras com modo 'intelligent'
     */
    async indexIntelligentRules() {
        const intelligentRules = this.getAllRules().filter(r => r.mode === 'intelligent');
        if (intelligentRules.length === 0) return;

        console.log(`Indexando ${intelligentRules.length} regras inteligentes...`);
        for (const rule of intelligentRules) {
            if (!rule.embedding) {
                // Combina descrição e conteúdo (resumido) para o embedding
                const text = `${rule.description}\n${rule.content.slice(0, 500)}`;
                rule.embedding = await this.embeddingsGenerator.generateEmbedding(text);
            }
        }
    }

    /**
     * Calcula similaridade de cosseno
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB) return 0;
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Obtém regras aplicáveis para um contexto específico
     */
    async getApplicableRulesAsync(context = {}) {
        const { filePath = null, mentions = [], query = null } = context;
        const applicable = [];

        // Inicializa semântica se houver query
        if (query) await this.initSemanticSearch();

        // 1. Regras com modo 'always'
        this.getAllRules().forEach(rule => {
            if (rule.mode === 'always') {
                applicable.push({ ...rule, reason: 'always-apply' });
            }
        });

        // 2. Regras mencionadas via @
        if (mentions.length > 0) {
            this.getAllRules().forEach(rule => {
                if (mentions.includes(rule.id) || mentions.includes(`@${rule.id}`)) {
                    applicable.push({ ...rule, reason: 'manual-mention' });
                }
            });
        }

        // 3. Regras com globs que fazem match no filePath
        if (filePath) {
            this.getAllRules().forEach(rule => {
                if (rule.mode === 'globs' && this.matchesGlobs(filePath, rule.globs)) {
                    applicable.push({ ...rule, reason: 'glob-match' });
                }
            });
        }

        // 4. Regras inteligentes (via similaridade)
        if (query && this.embeddingsGenerator) {
            const queryVector = await this.embeddingsGenerator.generateEmbedding(query);
            const intelligentRules = this.getAllRules().filter(r => r.mode === 'intelligent');

            for (const rule of intelligentRules) {
                if (rule.embedding) {
                    const similarity = this.cosineSimilarity(queryVector, rule.embedding);
                    // Threshold arbitrário 0.4 para relevância
                    if (similarity > 0.4) {
                        applicable.push({ ...rule, reason: `semantic-match (${similarity.toFixed(2)})` });
                    }
                }
            }
        }

        // Remove duplicatas e rastreia
        const seen = new Set();
        return applicable.filter(rule => {
            if (seen.has(rule.id)) return false;
            seen.add(rule.id);

            // Track stats
            if (this.tracker) {
                this.tracker.trackRuleUsage(rule.id, rule.reason);
            }

            return true;
        });
    }

    /**
     * Wrapper síncrono para manter compatibilidade (sem intelligent mode)
     */
    getApplicableRules(context = {}) {
        // Versão simplificada síncrona que ignora 'intelligent' se não tiver cache
        // O ideal é migrar tudo para async, mas mantendo a assinatura antiga por enquanto
        const { filePath = null, mentions = [] } = context;
        const applicable = [];

        this.getAllRules().forEach(rule => {
            if (rule.mode === 'always') {
                applicable.push({ ...rule, reason: 'always-apply' });
            } else if (mentions && (mentions.includes(rule.id) || mentions.includes(`@${rule.id}`))) {
                applicable.push({ ...rule, reason: 'manual-mention' });
            } else if (filePath && rule.mode === 'globs' && this.matchesGlobs(filePath, rule.globs)) {
                applicable.push({ ...rule, reason: 'glob-match' });
            }
        });

        const seen = new Set();
        return applicable.filter(rul => {
            if (seen.has(rul.id)) return false;
            seen.add(rul.id);
            return true;
        });
    }

    /**
     * Verifica se um path faz match com globs
     */
    matchesGlobs(filePath, globs) {
        const relativePath = path.relative(this.projectRoot, filePath);

        return globs.some(glob => {
            const normalized = glob.replace(/\\/g, '/');
            const regex = this.globToRegex(normalized);
            return regex.test(relativePath.replace(/\\/g, '/'));
        });
    }

    globToRegex(glob) {
        let regex = '';
        let i = 0;
        while (i < glob.length) {
            const char = glob[i];
            const next = glob[i + 1];

            if (char === '*' && next === '*') {
                regex += '.*';
                i += 2;
                continue;
            }

            if (char === '*') {
                regex += '[^/]*';
                i += 1;
                continue;
            }

            if (char === '?') {
                regex += '.';
                i += 1;
                continue;
            }

            if ('\\.[]{}()+-^$|'.includes(char)) {
                regex += `\\${char}`;
                i += 1;
                continue;
            }

            regex += char;
            i += 1;
        }

        return new RegExp(`^${regex}$`);
    }

    /**
     * Obtém todas as regras (user + project + path-specific)
     */
    getAllRules() {
        return [
            ...this.rules.user,
            ...this.rules.project,
            ...this.rules.pathSpecific
        ];
    }

    /**
     * Cria uma nova regra
     */
    createRule(level, ruleData) {
        const { id, description, mode, globs, content } = ruleData;

        // Determina diretório baseado no nível
        let dirPath;
        if (level === 'user') {
            dirPath = this.userRulesPath;
        } else if (level === 'project') {
            dirPath = this.projectRulesPath;
        } else if (level === 'path-specific') {
            dirPath = this.pathSpecificRulesPath;
        } else {
            throw new Error(`Nível inválido: ${level}`);
        }

        // Cria diretório se não existir
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Monta frontmatter
        const frontmatter = {
            description: description || '',
            alwaysApply: mode === 'always',
            globs: globs || []
        };

        // Monta conteúdo final
        const fileContent = `---
${yaml.dump(frontmatter).trim()}
---

${content}`;

        // Salva arquivo
        const filename = `${id}.mdc`;
        const filePath = path.join(dirPath, filename);
        fs.writeFileSync(filePath, fileContent, 'utf-8');

        // Recarrega regras
        this.loadAll();

        return { success: true, filePath };
    }

    /**
     * Estatísticas
     */
    stats() {
        return {
            total: this.getAllRules().length,
            byLevel: {
                user: this.rules.user.length,
                project: this.rules.project.length,
                pathSpecific: this.rules.pathSpecific.length
            },
            byMode: {
                always: this.getAllRules().filter(r => r.mode === 'always').length,
                intelligent: this.getAllRules().filter(r => r.mode === 'intelligent').length,
                globs: this.getAllRules().filter(r => r.mode === 'globs').length,
                manual: this.getAllRules().filter(r => r.mode === 'manual').length
            }
        };
    }

    static runCLI() {
        const manager = new RulesManager();
        const stats = manager.stats();

        console.log('\n=== Sistema de Regras Multi-Nível ===\n');
        console.log(`Total: ${stats.total} regras\n`);
        console.log('Por nível:');
        Object.entries(stats.byLevel).forEach(([level, count]) => {
            console.log(`  ${level}: ${count}`);
        });
        console.log('\nPor modo:');
        Object.entries(stats.byMode).forEach(([mode, count]) => {
            console.log(`  ${mode}: ${count}`);
        });
        console.log();
    }
}

// Exporta para uso em outros scripts
/* istanbul ignore next */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RulesManager;
}

// CLI quando executado diretamente
/* istanbul ignore next */
if (require.main === module) {
    RulesManager.runCLI();
}
