#!/usr/bin/env node
/**
 * Teste do PromptGenerator
 */

const PromptGenerator = require('./core/prompt-generator');
const path = require('path');

console.log('🧪 Testando PromptGenerator...\n');

const generator = new PromptGenerator();

// Mock do cenário
const goal = "Refatorar o componente Button para usar TypeScript e seguir nossos padrões de design.";
const contextFiles = ['src/components/Button.tsx', 'src/utils/theme.ts'];
const mentions = ['@clean-code', '@react-patterns'];
const history = ['User asked about styling props', 'Added new theme variables'];

console.log('1️⃣ Gerando Prompt Estruturado...');
const prompt = generator.generate({
    goal,
    contextFiles,
    mentions,
    history
});

console.log('\n--- OUTPUT START ---\n');
console.log(prompt);
console.log('\n--- OUTPUT END ---\n');

// Validações básicas
if (prompt.includes('🎯 OBJETIVO') &&
    prompt.includes('📋 CONTEXTO') &&
    prompt.includes('⚠️ CONSTRAINTS')) {
    console.log('✅ Estrutura básica validada');
} else {
    console.error('❌ Falha na validação da estrutura');
}

if (prompt.includes('react-patterns') && prompt.includes('clean-code')) {
    console.log('✅ Regras incluídas corretamente');
} else {
    console.error('❌ Regras faltantes no prompt');
}
