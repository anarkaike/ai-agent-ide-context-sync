/**
 * SmartCache - Sistema de cache inteligente para contexto
 * 
 * Funcionalidades:
 * 1. Cache de prompts gerados (hash da query + contexto)
 * 2. Invalidação baseada em timestamp de modificação dos arquivos
 * 3. Compressão de histórico (resumo) - placeholder para futuro
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SmartCache {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.cacheFile = path.join(this.projectRoot, '.ai-workspace', 'cache', 'smart-cache.json');
        this.load();
    }

    load() {
        if (fs.existsSync(this.cacheFile)) {
            try {
                this.cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
            } catch (e) {
                this.cache = { prompts: {}, files: {} };
            }
        } else {
            this.cache = { prompts: {}, files: {} };
        }
    }

    save() {
        const dir = path.dirname(this.cacheFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    }

    /**
     * Gera chave de cache para uma query de prompt
     */
    generateKey(query, contextFiles) {
        const payload = JSON.stringify({ query, files: contextFiles.sort() });
        return crypto.createHash('md5').update(payload).digest('hex');
    }

    /**
     * Tenta recuperar prompt do cache
     */
    getCachedPrompt(query, contextFiles) {
        const key = this.generateKey(query, contextFiles);
        const entry = this.cache.prompts[key];

        if (!entry) return null;

        // Verifica validade (TTL 24h)
        const age = Date.now() - entry.timestamp;
        if (age > 24 * 60 * 60 * 1000) {
            delete this.cache.prompts[key];
            return null;
        }

        // Verifica se arquivos mudaram
        for (const file of contextFiles) {
            if (this.isFileModified(file, entry.fileSnapshots[file])) {
                return null; // Invalida cache
            }
        }

        return entry.prompt;
    }

    /**
     * Salva prompt no cache
     */
    setCachedPrompt(query, contextFiles, promptContent) {
        const key = this.generateKey(query, contextFiles);

        const fileSnapshots = {};
        contextFiles.forEach(f => {
            fileSnapshots[f] = this.getFileTimestamp(f);
        });

        this.cache.prompts[key] = {
            prompt: promptContent,
            timestamp: Date.now(),
            fileSnapshots
        };
        this.save();
    }

    /**
     * Helper para timestamp
     */
    getFileTimestamp(filePath) {
        const absPath = path.resolve(this.projectRoot, filePath);
        if (fs.existsSync(absPath)) {
            return fs.statSync(absPath).mtimeMs;
        }
        return 0;
    }

    /**
     * Verifica modificação
     */
    isFileModified(filePath, cachedTimestamp) {
        const current = this.getFileTimestamp(filePath);
        return current !== cachedTimestamp;
    }
}

module.exports = SmartCache;
