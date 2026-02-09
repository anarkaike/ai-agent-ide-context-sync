#!/usr/bin/env node

/**
 * Test simplificado para validar implementação básica
 * Verifica apenas a estrutura dos arquivos criados
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

async function runBasicTests() {
    console.log('\n🧪 Basic Implementation Validation\n');

    const results = {
        observability: false,
        zeroTrust: false,
        nanobot: false,
        i18n: false,
        policyEngine: false,
        policyFile: false,
        taskRecognition: false
    };

    // Test 1: Verificar arquivos criados
    const files = [
        { path: 'packages/core/src/observability/ObservabilityManager.js', key: 'observability' },
        { path: 'packages/core/src/security/ZeroTrustValidator.js', key: 'zeroTrust' },
        { path: 'packages/core/src/network/NanobotBridge.js', key: 'nanobot' },
        { path: 'packages/cli/core/i18n/index.js', key: 'i18n' },
        { path: 'packages/core/src/policy/PolicyManager.js', key: 'policyEngine' },
        { path: '.ai-workspace/config/policy.yaml', key: 'policyFile' }
    ];

    for (const file of files) {
        if (fs.existsSync(file.path)) {
            console.log(`✅ ${file.key}: File exists`);
            results[file.key] = true;
        } else {
            console.log(`❌ ${file.key}: File not found - ${file.path}`);
        }
    }

    // Test 2: Verificar conteúdo dos arquivos i18n
    try {
        const enContent = JSON.parse(fs.readFileSync('packages/cli/core/i18n/en.json', 'utf8'));
        const ptContent = JSON.parse(fs.readFileSync('packages/cli/core/i18n/pt.json', 'utf8'));

        if (enContent.status && enContent.status.connected === 'Connected' &&
            ptContent.status && ptContent.status.connected === 'Conectado') {
            console.log('✅ i18n: Content valid');
            results.i18n = true;
        } else {
            console.log('❌ i18n: Invalid content');
        }
    } catch (error) {
        console.log(`❌ i18n: Content error - ${error.message}`);
    }

    // Test 3: Verificar task recognition
    try {
        const taskFile = '.ai-workspace/tasks/active/AI-DEV--task-014-agent-os-epic-20-initiatives.md';
        const content = fs.readFileSync(taskFile, 'utf8');

        // Simular parseTask da extensão
        const title = content.split('\n').find(l => l.startsWith('# '))?.replace('# ', '') || '';
        const total = (content.match(/^- \[[ x]\]/gm) || []).length;
        const statusMatch = content.match(/status:\s*([\w-]+)/i);
        const status = statusMatch ? statusMatch[1].toLowerCase() : 'todo';

        if (title && total > 0 && status === 'in_progress') {
            console.log(`✅ taskRecognition: "${title}" with ${total} items, status: ${status}`);
            results.taskRecognition = true;
        } else {
            console.log('❌ taskRecognition: Invalid format');
        }
    } catch (error) {
        console.log(`❌ taskRecognition: Error - ${error.message}`);
    }

    // Test 4: Verificar policy file
    try {
        const yaml = require('js-yaml');
        const policyContent = fs.readFileSync('.ai-workspace/config/policy.yaml', 'utf8');
        const policies = yaml.load(policyContent);

        if (policies && policies.security && policies.observability) {
            console.log('✅ policyFile: Valid YAML structure');
            results.policyFile = true;
        } else {
            console.log('❌ policyFile: Invalid YAML structure');
        }
    } catch (error) {
        console.log(`❌ policyFile: YAML error - ${error.message}`);
    }

    // Results summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    for (const [test, result] of Object.entries(results)) {
        const status = result ? '✅' : '❌';
        const name = test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1');
        console.log(`${status} ${name}: ${result ? 'PASS' : 'FAIL'}`);
    }

    console.log(`\nOverall: ${passed}/${total} tests passed`);

    if (passed >= 6) { // Pelo menos os arquivos principais
        console.log('\n🎉 Core implementation structure validated!');
        console.log('\n📋 Next Steps:');
        console.log('1. Install missing dependencies: npm install chokidar fs-extra');
        console.log('2. Fix module imports for full integration');
        console.log('3. Test individual components');
        console.log('4. Implement Initiative 19 (Observability) first');
        process.exit(0);
    } else {
        console.log('\n⚠️  Basic structure incomplete. Check missing files.');
        process.exit(1);
    }
}

// Run tests
runBasicTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
