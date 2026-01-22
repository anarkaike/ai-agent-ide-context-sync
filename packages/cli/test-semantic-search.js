#!/usr/bin/env node
/**
 * Teste do SemanticSearch
 */

const SemanticSearch = require('./indexing/semantic-search');
const path = require('path');
const fs = require('fs');

async function runTest() {
    console.log('🧪 Testando SemanticSearch com @xenova/transformers...\n');

    // Cria arquivos de mock para indexar
    const mockDir = path.join(process.cwd(), 'mock-search');
    if (!fs.existsSync(mockDir)) fs.mkdirSync(mockDir);

    const file1 = path.join(mockDir, 'auth.js');
    const file2 = path.join(mockDir, 'utils.js');
    const file3 = path.join(mockDir, 'styles.css');

    fs.writeFileSync(file1, 'function login(user, password) { // Authenticate user logic }');
    fs.writeFileSync(file2, 'function formatDate(date) { return date.toISOString(); }');
    fs.writeFileSync(file3, '.button { color: red; background: blue; }');

    const searcher = new SemanticSearch(process.cwd());

    try {
        console.log('1️⃣ Indexando arquivos...');
        await searcher.indexFile(file1);
        await searcher.indexFile(file2);
        await searcher.indexFile(file3);
        console.log('✅ Indexação concluída');

        console.log('\n2️⃣ Buscando por "authentication"...');
        const resultsAuth = await searcher.search('authentication login user', 2);
        console.log('Resultados:', resultsAuth);

        if (resultsAuth[0] && resultsAuth[0].path.includes('auth.js')) {
            console.log('✅ Top result correto: auth.js');
        } else {
            console.log('❌ Falha na busca semântica (auth)');
        }

        console.log('\n3️⃣ Buscando por "start date"...');
        const resultsDate = await searcher.search('how to format date', 2);
        console.log('Resultados:', resultsDate);

        if (resultsDate[0] && resultsDate[0].path.includes('utils.js')) {
            console.log('✅ Top result correto: utils.js');
        } else {
            console.log('❌ Falha na busca semântica (utils)');
        }

    } catch (err) {
        console.error('❌ Erro no teste:', err);
    } finally {
        // Cleanup
        fs.unlinkSync(file1);
        fs.unlinkSync(file2);
        fs.unlinkSync(file3);
        fs.rmdirSync(mockDir);
    }
}

runTest();
