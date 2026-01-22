/**
 * MentionParser - Sistema de extração de menções
 * 
 * Identifica e classifica referências no input do usuário:
 * - Arquivos: @src/comp/Button.tsx
 * - Pastas: @src/utils/
 * - Regras: @clean-code
 * - Símbolos: @Button (classe/função - futuro)
 */

const fs = require('fs');
const path = require('path');

class MentionParser {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
    }

    /**
     * Analisa o texto e extrai menções
     * @param {string} text Texto do usuário
     * @returns {Object} Menções categorizadas
     */
    parse(text) {
        const mentions = {
            files: [],
            folders: [],
            rules: [], // Regras ou símbolos abstratos
            raw: []    // Todos os tokens encontrados
        };

        if (!text) return mentions;

        // Regex para capturar tudo que começa com @ até o próximo espaço
        // Suporta caminhos com barras, pontos, hífens, underscores
        const regex = /@([a-zA-Z0-9_\-\.\/]+)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const token = match[1]; // conteúdo sem o @
            const fullToken = match[0]; // com @

            mentions.raw.push(fullToken);
            this.classifyToken(token, mentions);
        }

        return mentions;
    }

    /**
     * Classifica um token em Arquivo, Pasta ou Regra
     */
    classifyToken(token, mentions) {
        const absPath = path.resolve(this.projectRoot, token);

        // 1. Verifica se é Pasta (termina com / ou existe como dir)
        if (token.endsWith('/') || (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory())) {
            mentions.folders.push(token);
            return;
        }

        // 2. Verifica se é Arquivo (existe em disco)
        if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
            mentions.files.push(token);
            return;
        }

        // 3. Assumi-se que é Regra ou Símbolo
        // (RulesManager vai tentar validar se é uma regra válida depois)
        mentions.rules.push(token);
    }
}

module.exports = MentionParser;
