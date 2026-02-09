/**
 * Core System Integration Test
 * 
 * Tests the unified core system functionality including:
 * - Security sandbox
 * - WAL rollback system
 * - Memory management
 * - AI client integration
 */

import { initializeCore } from './index.js';
import fs from 'fs-extra';
import path from 'path';

async function runIntegrationTest() {
  console.log('🧪 Starting Core System Integration Test...\n');

  const results = {
    security: { passed: 0, failed: 0, errors: [] },
    wal: { passed: 0, failed: 0, errors: [] },
    memory: { passed: 0, failed: 0, errors: [] },
    client: { passed: 0, failed: 0, errors: [] }
  };

  try {
    // Initialize core system
    console.log('🔧 Initializing Core System...');
    const core = await initializeCore({
      security: {
        enableSandbox: true,
        enableEncryption: true,
        enableSigning: true
      },
      memory: {
        enableWAL: true,
        checkpointInterval: 5000,
        maxJournalSize: 100
      }
    });
    console.log('✅ Core System Initialized\n');

    // Test Security Sandbox
    await testSecuritySandbox(core, results);

    // Test WAL System
    await testWALSystem(core, results);

    // Test Memory Management
    await testMemoryManagement(core, results);

    // Test AI Client
    await testAIClient(core, results);

    // Print results
    printTestResults(results);

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    results.client.errors.push(error.message);
  } finally {
    if (core) {
      console.log('\n🧹 Cleaning up Core System...');
      await core.shutdown();
      console.log('✅ Cleanup completed');
    }
  }

  return results;
}

async function testSecuritySandbox(core, results) {
  console.log('🔒 Testing Security Sandbox...');

  try {
    // Test input sanitization
    const maliciousInput = 'rm -rf / && echo "hacked"';
    const sanitized = await core.security.sanitizeInput(maliciousInput);
    if (!sanitized.includes('rm -rf')) {
      results.security.passed++;
      console.log('  ✅ Input sanitization works');
    } else {
      results.security.failed++;
      results.security.errors.push('Input sanitization failed');
    }

    // Test command validation
    try {
      await core.security.validateCommand(['rm', '-rf', '/']);
      results.security.failed++;
      results.security.errors.push('Command validation failed - blocked command allowed');
    } catch (error) {
      results.security.passed++;
      console.log('  ✅ Command validation blocks dangerous commands');
    }

    // Test encryption/decryption
    const testData = 'sensitive information';
    const encrypted = await core.security.encrypt(testData);
    const decrypted = await core.security.decrypt(encrypted);

    if (decrypted === testData) {
      results.security.passed++;
      console.log('  ✅ Encryption/decryption works');
    } else {
      results.security.failed++;
      results.security.errors.push('Encryption/decryption failed');
    }

    // Test signing/verification
    const signed = await core.security.sign(testData);
    const isValid = await core.security.verify(signed);

    if (isValid) {
      results.security.passed++;
      console.log('  ✅ Digital signatures work');
    } else {
      results.security.failed++;
      results.security.errors.push('Digital signatures failed');
    }

  } catch (error) {
    results.security.failed++;
    results.security.errors.push(`Security test error: ${error.message}`);
  }

  console.log('');
}

async function testWALSystem(core, results) {
  console.log('💾 Testing WAL System...');

  try {
    // Test transaction begin
    const transactionId = await core.wal.beginTransaction('TEST_TRANSACTION', {
      description: 'Integration test transaction'
    });

    if (transactionId) {
      results.wal.passed++;
      console.log('  ✅ Transaction creation works');
    } else {
      results.wal.failed++;
      results.wal.errors.push('Transaction creation failed');
    }

    // Test operation addition
    await core.wal.addOperation('TEST_OPERATION', {
      type: 'file_write',
      path: 'test.txt',
      content: 'test data'
    });
    results.wal.passed++;
    console.log('  ✅ Operation addition works');

    // Test transaction commit
    const commitResult = await core.wal.commitTransaction();
    if (commitResult.success) {
      results.wal.passed++;
      console.log('  ✅ Transaction commit works');
    } else {
      results.wal.failed++;
      results.wal.errors.push('Transaction commit failed');
    }

    // Test rollback
    const rollbackTxId = await core.wal.beginTransaction('ROLLBACK_TEST');
    await core.wal.addOperation('TEST_ROLLBACK', { data: 'test' });
    const rollbackResult = await core.wal.rollbackTransaction('test rollback');

    if (rollbackResult.success) {
      results.wal.passed++;
      console.log('  ✅ Transaction rollback works');
    } else {
      results.wal.failed++;
      results.wal.errors.push('Transaction rollback failed');
    }

    // Test checkpoint creation
    const checkpointId = await core.wal.createCheckpoint('integration-test', {
      purpose: 'integration testing'
    });

    if (checkpointId) {
      results.wal.passed++;
      console.log('  ✅ Checkpoint creation works');
    } else {
      results.wal.failed++;
      results.wal.errors.push('Checkpoint creation failed');
    }

    // Test WAL statistics
    const stats = core.wal.getStats();
    if (stats.journalSize >= 0) {
      results.wal.passed++;
      console.log('  ✅ WAL statistics available');
    } else {
      results.wal.failed++;
      results.wal.errors.push('WAL statistics failed');
    }

  } catch (error) {
    results.wal.failed++;
    results.wal.errors.push(`WAL test error: ${error.message}`);
  }

  console.log('');
}

async function testMemoryManagement(core, results) {
  console.log('🧠 Testing Memory Management...');

  try {
    // Test memory addition
    const memoryId = await core.memory.addMemory('TEST_MEMORY', 'integration test memory', {
      type: 'test',
      importance: 'low'
    });

    if (memoryId) {
      results.memory.passed++;
      console.log('  ✅ Memory addition works');
    } else {
      results.memory.failed++;
      results.memory.errors.push('Memory addition failed');
    }

    // Test SBT minting
    const sbtId = await core.memory.mintSBT('TEST_SBT', {
      purpose: 'integration test',
      data: 'test data'
    });

    if (sbtId) {
      results.memory.passed++;
      console.log('  ✅ SBT minting works');
    } else {
      results.memory.failed++;
      results.memory.errors.push('SBT minting failed');
    }

    // Test micélio connection
    const connectionId = await core.memory.addMyceliumConnection('test-node', {
      type: 'test',
      strength: 0.8
    });

    if (connectionId) {
      results.memory.passed++;
      console.log('  ✅ Mycelium connection works');
    } else {
      results.memory.failed++;
      results.memory.errors.push('Mycelium connection failed');
    }

    // Test memory statistics
    const stats = core.memory.getStats();
    if (stats.memoryCount >= 0 && stats.sbtCount >= 0) {
      results.memory.passed++;
      console.log('  ✅ Memory statistics available');
    } else {
      results.memory.failed++;
      results.memory.errors.push('Memory statistics failed');
    }

    // Test NÚCLEUS integrity
    if (stats.nucleusState && stats.consciousnessLevel) {
      results.memory.passed++;
      console.log('  ✅ NÚCLEUS integrity maintained');
    } else {
      results.memory.failed++;
      results.memory.errors.push('NÚCLEUS integrity check failed');
    }

  } catch (error) {
    results.memory.failed++;
    results.memory.errors.push(`Memory test error: ${error.message}`);
  }

  console.log('');
}

async function testAIClient(core, results) {
  console.log('🤖 Testing AI Client...');

  try {
    // Test basic completion
    const result = await core.client.complete('Test prompt');
    if (typeof result === 'string') {
      console.log('  ✅ Basic completion works');
      results.client.passed++;
    } else {
      console.log('  ❌ Basic completion failed: wrong return type');
      results.client.failed++;
    }

    // Test tone adaptation
    const toneResult = await core.client.adaptTone('professional', 'Test message');
    if (toneResult && typeof toneResult === 'string') {
      console.log('  ✅ Tone adaptation works');
      results.client.passed++;
    } else {
      console.log('  ❌ Tone adaptation failed');
      results.client.failed++;
    }

    // Test prompt generation
    const promptResult = await core.client.generatePrompt('test goal');
    if (promptResult && typeof promptResult === 'string') {
      console.log('  ✅ Prompt generation works');
      results.client.passed++;
    } else {
      console.log('  ❌ Prompt generation failed');
      results.client.failed++;
    }

    // Test performance metrics
    const metrics = await core.client.getMetrics();
    if (metrics && typeof metrics === 'object') {
      console.log('  ✅ Performance metrics available');
      results.client.passed++;
    } else {
      console.log('  ❌ Performance metrics failed');
      results.client.failed++;
    }

  } catch (error) {
    console.log(`  ❌ Client test error: ${error.message}`);
    results.client.failed++;
    results.client.errors.push(`Client test error: ${error.message}`);
  }
}

function printTestResults(results) {
  console.log('📊 Test Results Summary:');
  console.log('========================');

  const categories = ['security', 'wal', 'memory', 'client'];
  let totalPassed = 0;
  let totalFailed = 0;

  categories.forEach(category => {
    const passed = results[category].passed;
    const failed = results[category].failed;
    totalPassed += passed;
    totalFailed += failed;

    console.log(`${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);

    if (results[category].errors.length > 0) {
      console.log('  🚨 Errors:');
      results[category].errors.forEach(error => {
        console.log(`    - ${error}`);
      });
    }
    console.log('');
  });

  console.log('========================');
  console.log(`TOTAL: ✅ ${totalPassed} passed, ❌ ${totalFailed} failed`);

  if (totalFailed === 0) {
    console.log('🎉 All tests passed! Core System is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the integration test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTest()
    .then(results => {
      const totalFailed = Object.values(results).reduce((sum, cat) => sum + cat.failed, 0);
      process.exit(totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Integration test failed:', error);
      process.exit(1);
    });
}

export { runIntegrationTest };