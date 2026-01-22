#!/usr/bin/env node
/**
 * Teste do RulesManager
 */

const RulesManager = require('./core/rules-manager');
const path = require('path');

console.log('🧪 Testando RulesManager...\n');

// 1. Teste de carregamento
console.log('1️⃣ Teste de Carregamento');
const manager = new RulesManager();
const stats = manager.stats();
console.log(`   ✓ Carregadas ${stats.total} regras`);
console.log(`   ✓ User: ${stats.byLevel.user}, Project: ${stats.byLevel.project}, Path-Specific: ${stats.byLevel.pathSpecific}`);
console.log();

// 2. Teste de regras 'always'
console.log('2️⃣ Teste de Regras Always');
const alwaysRules = manager.getApplicableRules({});
console.log(`   ✓ ${alwaysRules.length} regras com modo 'always'`);
alwaysRules.forEach(rule => {
    console.log(`     - ${rule.id} (${rule.level})`);
});
console.log();

// 3. Teste de globs
console.log('3️⃣ Teste de Globs');
const testFile = path.join(process.cwd(), 'src/components/Button.tsx');
const globRules = manager.getApplicableRules({ filePath: testFile });
console.log(`   ✓ ${globRules.length} regras aplicáveis para ${path.basename(testFile)}`);
globRules.forEach(rule => {
    console.log(`     - ${rule.id} (reason: ${rule.reason})`);
});
console.log();

// 4. Teste de @-mentions
console.log('4️⃣ Teste de @-Mentions');
const mentionRules = manager.getApplicableRules({ mentions: ['@api-patterns'] });
console.log(`   ✓ ${mentionRules.length} regras mencionadas`);
mentionRules.forEach(rule => {
    console.log(`     - ${rule.id} (reason: ${rule.reason})`);
});
console.log();

// 5. Teste de criação de regra
console.log('5️⃣ Teste de Criação de Regra');
try {
    const result = manager.createRule('project', {
        id: 'test-rule',
        description: 'Regra de teste criada automaticamente',
        mode: 'manual',
        globs: [],
        content: '# Test Rule\n\nEsta é uma regra de teste.'
    });
    console.log(`   ✓ Regra criada: ${result.filePath}`);

    // Recarrega e verifica
    manager.loadAll();
    const newStats = manager.stats();
    console.log(`   ✓ Total de regras agora: ${newStats.total}`);
} catch (err) {
    console.log(`   ✗ Erro: ${err.message}`);
}
console.log();

// 6. Estatísticas finais
console.log('6️⃣ Estatísticas Finais');
const finalStats = manager.stats();
console.log('   Por modo:');
Object.entries(finalStats.byMode).forEach(([mode, count]) => {
    console.log(`     - ${mode}: ${count}`);
});
console.log();

console.log('✅ Testes concluídos!\n');
