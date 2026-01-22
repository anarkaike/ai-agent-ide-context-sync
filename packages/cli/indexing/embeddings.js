/**
 * EmbeddingsGenerator - Sistema de geração de embeddings locais
 * 
 * Usa @xenova/transformers para gerar embeddings vetoriais de arquivos
 * Modelo: Xenova/all-MiniLM-L6-v2 (leve e rápido para CPU)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EmbeddingsGenerator {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.cachePath = path.join(this.projectRoot, '.ai-workspace', 'cache', 'embeddings.json');
        this.pipeline = null;
        this.modelName = 'Xenova/all-MiniLM-L6-v2';
    }

    /**
     * Inicializa o modelo (lazy loading)
     */
    async init() {
        if (this.pipeline) return;

        try {
            // Import dinâmico pois é ESM
            const { pipeline } = await this._loadTransformer();
            this.pipeline = await pipeline('feature-extraction', this.modelName);
        } catch (err) {
            console.error('Erro ao carregar modelo de embeddings:', err);
            throw new Error('Falha ao inicializar Xenova. Verifique se @xenova/transformers está instalado.');
        }
    }

    /**
     * Wrapper para import dinâmico para facilitar testes
     */
    async _loadTransformer() {
        return await import('@xenova/transformers');
    }

    /**
     * Gera embedding para um texto
     * @param {string} text Texto para vetorizar
     * @returns {Promise<number[]>} Vetor de números
     */
    async generateEmbedding(text) {
        await this.init();

        // Limita tamanho do texto para evitar estouro de memória
        const truncated = text.slice(0, 1000);

        const result = await this.pipeline(truncated, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }

    /**
     * Processa um arquivo e retorna seu embedding
     */
    async processFile(filePath) {
        if (!fs.existsSync(filePath)) return null;

        const content = fs.readFileSync(filePath, 'utf-8');
        const hash = crypto.createHash('md5').update(content).digest('hex');

        // Gera embedding
        const vector = await this.generateEmbedding(content);

        return {
            path: path.relative(this.projectRoot, filePath),
            hash,
            vector,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = EmbeddingsGenerator;
