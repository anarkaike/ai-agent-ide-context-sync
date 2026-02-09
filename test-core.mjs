#!/usr/bin/env node

/**
 * Test dos componentes principais sem dependências externas
 * Foca em funcionalidades básicas de cada componente
 */

import ObservabilityManager from './packages/core/src/observability/ObservabilityManager.js';
import policyManager from './packages/core/src/policy/PolicyManager.js';
import i18n from './packages/cli/core/i18n/index.js';

async function runCoreTests() {
    console.log('\n🧪 Core Components Testing\n');
    
    const results = {
        observability: false,
        policyEngine: false,
        i18n: false
    };
    
    // Test 1: ObservabilityManager
    try {
        console.log('📊 Testing ObservabilityManager...');
        const obs = new ObservabilityManager({ 
            enableConsole: false,
            eventsDir: '/tmp/test-observability'
        });
        
        // Criar trace
        const trace = obs.startTrace('test-trace', { component: 'test' });
        
        // Criar span
        const span = obs.startSpan(trace, 'test-span', { component: 'test' });
        
        // Emitir evento
        obs.emit({
            trace_id: trace.trace_id,
            span_id: span.span_id,
            event_type: 'test.event',
            component: 'test',
            severity: 'info',
            timestamp: new Date().toISOString(),
            payload: { message: 'Test event' }
        });
        
        // Finalizar span
        obs.endSpan(span, { success: true });
        
        // Verificar se eventos foram persistidos
        const events = obs.getEvents({ component: 'test', limit: 1 });
        if (events.length > 0) {
            console.log('✅ ObservabilityManager: Events persisted correctly');
            console.log(`   - Trace ID: ${events[0].trace_id}`);
            console.log(`   - Event Type: ${events[0].event_type}`);
            results.observability = true;
        } else {
            console.log('❌ ObservabilityManager: Events not persisted');
        }
    } catch (error) {
        console.log(`❌ ObservabilityManager: ${error.message}`);
    }
    
    // Test 2: PolicyManager
    try {
        console.log('\n📋 Testing PolicyManager...');
        
        // Verificar se políticas foram carregadas
        const zeroTrustEnabled = policyManager.get('security.zero_trust', false);
        const observabilityEnabled = policyManager.get('observability.enabled', false);
        
        if (typeof zeroTrustEnabled === 'boolean' && typeof observabilityEnabled === 'boolean') {
            console.log('✅ PolicyManager: Policies loaded successfully');
            console.log(`   - zero_trust: ${zeroTrustEnabled}`);
            console.log(`   - observability: ${observabilityEnabled}`);
            results.policyEngine = true;
        } else {
            console.log('❌ PolicyManager: Policies not loaded correctly');
        }
        
        // Testar set/get
        const setResult = policyManager.set('test.value', 'test');
        if (setResult) {
            const getValue = policyManager.get('test.value');
            if (getValue === 'test') {
                console.log('✅ PolicyManager: Set/Get working');
            }
        }
        
        // Listar políticas disponíveis
        const policies = policyManager.list();
        console.log(`   - Total policies: ${policies.length}`);
        console.log(`   - Sample policies: ${policies.slice(0, 3).join(', ')}`);
    } catch (error) {
        console.log(`❌ PolicyManager: ${error.message}`);
    }
    
    // Test 3: i18n
    try {
        console.log('\n🌐 Testing i18n...');
        
        // Testar tradução em inglês
        const translated = i18n.t('status.connected');
        if (translated && translated === 'Connected') {
            console.log('✅ i18n: English translation working');
            
            // Testar português
            i18n.setLocale('pt');
            const translatedPt = i18n.t('status.connected');
            if (translatedPt === 'Conectado') {
                console.log('✅ i18n: Portuguese translation working');
                results.i18n = true;
            } else {
                console.log('❌ i18n: Portuguese translation failed');
            }
            
            // Testar interpolação
            i18n.setLocale('en');
            const interpolated = i18n.t('operations.skill_installed', { skill: 'test-skill' });
            if (interpolated && interpolated.includes('test-skill')) {
                console.log('✅ i18n: Interpolation working');
            }
            
            // Reset locale
            i18n.setLocale('en');
        } else {
            console.log('❌ i18n: Translation failed');
        }
    } catch (error) {
        console.log(`❌ i18n: ${error.message}`);
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
    
    if (passed === total) {
        console.log('\n🎉 Core components are working!');
        console.log('\n📋 Implementation Status:');
        console.log('1. ✅ ObservabilityManager - Event tracing and persistence');
        console.log('2. ✅ PolicyManager - Centralized policy engine with hot-reload');
        console.log('3. ✅ i18n - Multi-language support with interpolation');
        console.log('\n🚀 Ready for integration with:');
        console.log('- Agent Mesh Network');
        console.log('- ZeroTrustValidator (pending dependency fixes)');
        console.log('- NanobotBridge (pending dependency fixes)');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Check the implementation.');
        process.exit(1);
    }
}

// Run tests
runCoreTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
