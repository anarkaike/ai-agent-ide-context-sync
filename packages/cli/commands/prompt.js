const fs = require('fs');
const path = require('path');
const RulesManager = require('../core/rules-manager');
const PromptGenerator = require('../core/prompt-generator');
const MentionParser = require('../parsers/mention-parser');

const log = (msg, color = 'white') => {
    // Simple logger shim
    console.log(msg);
};

module.exports = async (args) => {
    if (!PromptGenerator || !MentionParser) {
        log('❌ Módulos Core não encontrados. Reinstale o pacote.', 'red');
        return;
    }

    const query = args.join(' ');
    if (!query) {
        log('❌ Informe o prompt desejado. Ex: ai-doc prompt "Refatorar @file"', 'red');
        return;
    }

    const projectRoot = process.cwd();
    // Instancia parser e generator
    const parser = new MentionParser(projectRoot);
    const generator = new PromptGenerator(projectRoot);

    log('🔍 Analisando contexto...', 'dim');
    
    // Parseia menções
    const mentions = parser.parse(query);

    try {
        const prompt = await generator.generate({
            goal: query,
            contextFiles: mentions.files,
            mentions: mentions.rules,
            history: [],
            autoContext: true
        });

        console.log('\n=== 🤖 PROMPT GERADO ===');
        console.log(prompt);
        console.log();

        if (mentions.files.length > 0 || mentions.rules.length > 0) {
            log(`   Contexto: ${mentions.files.length} arquivos, ${mentions.rules.length} regras`, 'dim');
        }
    } catch (error) {
        log(`❌ Erro ao gerar prompt: ${error.message}`, 'red');
    }
};

module.exports.log = log; // Export for testing
