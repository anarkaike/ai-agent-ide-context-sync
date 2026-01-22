/**
 * SemanticSearch - Busca vetorial por similaridade
 * 
 * Gerencia o índice de embeddings e realiza buscas por similaridade de cosseno.
 */

const fs = require('fs');
const path = require('path');
const EmbeddingsGenerator = require('./embeddings');

class SemanticSearch {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.indexPath = path.join(this.projectRoot, '.ai-workspace', 'cache', 'embeddings-index.json');
        this.generator = new EmbeddingsGenerator(projectRoot);
        this.index = { files: [] };

        this.loadIndex();
    }

    loadIndex() {
        if (fs.existsSync(this.indexPath)) {
            try {
                this.index = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
            } catch (e) {
                console.error('Erro ao carregar índice, criando novo.');
                this.index = { files: [] };
            }
        }
    }

    saveIndex() {
        const dir = path.dirname(this.indexPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
    }

    /**
     * Indexa um arquivo (gera/atualiza embedding)
     */
    async indexFile(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        const existingEntry = this.index.files.find(f => f.path === relativePath);

        // Verifica se precisa atualizar (hash check seria ideal, mas simplificado aqui)
        // Na prática, EmbeddingsGenerator retornará hash

        console.log(`Indexando ${relativePath}...`);
        const entry = await this.generator.processFile(filePath);

        if (entry) {
            // Remove antigo se existir
            this.index.files = this.index.files.filter(f => f.path !== relativePath);
            this.index.files.push(entry);
            this.saveIndex();
            return true;
        }
        return false;
    }

    /**
     * Busca arquivos semanticamente similares a uma query
     */
    async search(query, limit = 5) {
        const queryVector = await this.generator.generateEmbedding(query);

        const results = this.index.files.map(file => {
            const similarity = this.cosineSimilarity(queryVector, file.vector);
            return { ...file, similarity };
        });

        // Ordena por similaridade (maior primeiro) e pega top N
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(r => ({ path: r.path, similarity: r.similarity }));
    }

    /**
     * Calcula similaridade de cosseno entre dois vetores
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

module.exports = SemanticSearch;
