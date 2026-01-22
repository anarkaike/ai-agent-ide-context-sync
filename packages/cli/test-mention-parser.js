#!/usr/bin/env node
/**
 * Teste do MentionParser
 */

const MentionParser = require('./parsers/mention-parser');
const path = require('path');
const fs = require('fs');

// Setup mock files for testing
const mockDir = path.join(process.cwd(), 'mock-fs');
if (!fs.existsSync(mockDir)) fs.mkdirSync(mockDir);
const mockFile = path.join(mockDir, 'test.txt');
fs.writeFileSync(mockFile, 'hello');

console.log('🧪 Testando MentionParser...\n');

const parser = new MentionParser(process.cwd());

const input = "Por favor refatore @mock-fs/test.txt usando @clean-code e verifique @mock-fs/";

console.log(`Input: "${input}"\n`);
console.log('1️⃣ Parseando...');
const result = parser.parse(input);

console.log('\nResultados:');
console.log('Files:', result.files);
console.log('Folders:', result.folders);
console.log('Rules:', result.rules);

// Validação
let success = true;

if (!result.files.includes('mock-fs/test.txt')) {
    console.error('❌ Falha ao detectar arquivo');
    success = false;
}
if (!result.folders.includes('mock-fs/')) {
    console.error('❌ Falha ao detectar pasta');
    success = false;
}
if (!result.rules.includes('clean-code')) {
    console.error('❌ Falha ao detectar regra');
    success = false;
}

if (success) {
    console.log('\n✅ Teste passou com sucesso!');
} else {
    console.log('\n❌ Teste falhou');
}

// Cleanup
fs.unlinkSync(mockFile);
fs.rmdirSync(mockDir);
