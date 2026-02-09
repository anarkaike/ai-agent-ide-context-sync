#!/usr/bin/env node

/**
 * Teste da Versão Otimizada
 * Compara performance entre versões
 */

const AISkillsInterface = require('../index.cjs');
const OptimizedAISkills = require('./OptimizedAISkills.cjs');

class PerformanceTest {
  constructor() {
    this.results = {
      baseline: {},
      optimized: {},
      comparison: {}
    };
  }

  async runComparison() {
    console.log('🚀 INICIANDO TESTE DE PERFORMANCE COMPARATIVO\n');
    
    // Testar versão baseline
    console.log('📊 Testando versão baseline...');
    await this.testBaseline();
    
    // Testar versão otimizada
    console.log('\n⚡ Testando versão otimizada...');
    await this.testOptimized();
    
    // Comparar resultados
    console.log('\n🔍 Analisando resultados...');
    this.compareResults();
    
    // Exibir relatório final
    this.generateReport();
  }

  async testBaseline() {
    const baseline = new AISkillsInterface();
    const startTime = Date.now();
    
    await baseline.initialize();
    const initTime = Date.now() - startTime;
    
    // Testar múltiplas execuções
    const testTasks = [
      { skillName: 'ide-integration', params: { action: 'list-ides' } },
      { skillName: 'ide-integration', params: { action: 'list-ides' } },
      { skillName: 'ide-integration', params: { action: 'list-ides' } },
      { skillName: 'context-management', params: { action: 'extract', path: './', depth: 1 } },
      { skillName: 'context-management', params: { action: 'extract', path: './', depth: 1 } },
      { skillName: 'automation-workflows', params: { action: 'list' } }
    ];
    
    const executionTimes = [];
    
    for (const task of testTasks) {
      const start = Date.now();
      const skill = baseline.getSkill(task.skillName);
      await skill.execute(task.params);
      executionTimes.push(Date.now() - start);
    }
    
    this.results.baseline = {
      initializationTime: initTime,
      executionTimes,
      avgExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      totalExecutionTime: executionTimes.reduce((a, b) => a + b, 0),
      cacheHits: 0, // Sem cache
      memoryUsage: process.memoryUsage()
    };
    
    console.log(`  ✅ Baseline: Init ${initTime}ms, Avg exec ${Math.round(this.results.baseline.avgExecutionTime)}ms`);
  }

  async testOptimized() {
    const optimized = new OptimizedAISkills({
      cache: { maxSize: 100 },
      executor: { maxConcurrency: 3 },
      enableCache: true,
      enableMetrics: true,
      enableParallel: true
    });
    
    const startTime = Date.now();
    
    await optimized.initialize();
    const initTime = Date.now() - startTime;
    
    // Testar múltiplas execuções (com cache)
    const testTasks = [
      { id: 1, skillName: 'ide-integration', params: { action: 'list-ides' } },
      { id: 2, skillName: 'ide-integration', params: { action: 'list-ides' } },
      { id: 3, skillName: 'ide-integration', params: { action: 'list-ides' } },
      { id: 4, skillName: 'context-management', params: { action: 'extract', path: './', depth: 1 } },
      { id: 5, skillName: 'context-management', params: { action: 'extract', path: './', depth: 1 } },
      { id: 6, skillName: 'automation-workflows', params: { action: 'list' } }
    ];
    
    // Execução sequencial (com cache)
    const sequentialTimes = [];
    for (const task of testTasks) {
      const start = Date.now();
      await optimized.executeSkill(task.skillName, task.params);
      sequentialTimes.push(Date.now() - start);
    }
    
    // Execução paralela
    const parallelStart = Date.now();
    await optimized.executeParallel(testTasks);
    const parallelTime = Date.now() - parallelStart;
    
    const cacheMetrics = optimized.cache.getMetrics();
    const performanceReport = optimized.getPerformanceReport();
    
    this.results.optimized = {
      initializationTime: initTime,
      sequentialTimes,
      parallelTime,
      avgSequentialTime: sequentialTimes.reduce((a, b) => a + b, 0) / sequentialTimes.length,
      totalSequentialTime: sequentialTimes.reduce((a, b) => a + b, 0),
      cacheHits: parseInt(cacheMetrics.hits),
      cacheHitRate: cacheMetrics.hitRate,
      memoryUsage: process.memoryUsage(),
      metrics: performanceReport
    };
    
    console.log(`  ✅ Otimizada: Init ${initTime}ms, Seq avg ${Math.round(this.results.optimized.avgSequentialTime)}ms, Parallel ${parallelTime}ms`);
    console.log(`  🎯 Cache hit rate: ${cacheMetrics.hitRate}`);
  }

  compareResults() {
    const baseline = this.results.baseline;
    const optimized = this.results.optimized;
    
    this.results.comparison = {
      initializationImprovement: ((baseline.initializationTime - optimized.initializationTime) / baseline.initializationTime * 100).toFixed(2),
      sequentialImprovement: ((baseline.avgExecutionTime - optimized.avgSequentialTime) / baseline.avgExecutionTime * 100).toFixed(2),
      parallelSpeedup: (baseline.totalExecutionTime / optimized.parallelTime).toFixed(2),
      cacheEfficiency: optimized.cacheHitRate,
      memoryEfficiency: ((baseline.memoryUsage.heapUsed - optimized.memoryUsage.heapUsed) / baseline.memoryUsage.heapUsed * 100).toFixed(2)
    };
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO DE PERFORMANCE COMPARATIVO');
    console.log('==========================================\n');
    
    const baseline = this.results.baseline;
    const optimized = this.results.optimized;
    const comparison = this.results.comparison;
    
    console.log('📈 MÉTRICAS DE INICIALIZAÇÃO:');
    console.log(`  Baseline:     ${baseline.initializationTime}ms`);
    console.log(`  Otimizada:     ${optimized.initializationTime}ms`);
    console.log(`  Melhoria:      ${comparison.initializationImprovement}%\n`);
    
    console.log('⚡ MÉTRICAS DE EXECUÇÃO (Sequencial):');
    console.log(`  Baseline:     ${Math.round(baseline.avgExecutionTime)}ms avg`);
    console.log(`  Otimizada:     ${Math.round(optimized.avgSequentialTime)}ms avg`);
    console.log(`  Melhoria:      ${comparison.sequentialImprovement}%\n`);
    
    console.log('🚀 MÉTRICAS DE EXECUÇÃO (Paralelo):');
    console.log(`  Baseline:     ${baseline.totalExecutionTime}ms total`);
    console.log(`  Otimizada:     ${optimized.parallelTime}ms total`);
    console.log(`  Speedup:       ${comparison.parallelSpeedup}x\n`);
    
    console.log('💾 MÉTRICAS DE CACHE:');
    console.log(`  Cache Hits:    ${optimized.cacheHits}`);
    console.log(`  Hit Rate:      ${optimized.cacheHitRate}\n`);
    
    console.log('🧠 MÉTRICAS DE MEMÓRIA:');
    console.log(`  Baseline:     ${(baseline.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Otimizada:     ${(optimized.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Eficiência:    ${comparison.memoryEfficiency}%\n`);
    
    // Verificar se as otimizações foram eficazes
    const improvements = [
      parseFloat(comparison.initializationImprovement) > 0,
      parseFloat(comparison.sequentialImprovement) > 0,
      parseFloat(comparison.parallelSpeedup) > 1,
      parseFloat(comparison.cacheEfficiency) > 0
    ];
    
    const successCount = improvements.filter(Boolean).length;
    
    console.log('🎯 RESULTADO FINAL:');
    if (successCount >= 3) {
      console.log('  ✅ OTIMIZAÇÕES EFICAZES!');
      console.log('  🚀 Versão otimizada supera baseline em múltiplos aspectos');
    } else {
      console.log('  ⚠️ OTIMIZAÇÕES PARCIAIS');
      console.log('  🔧 Algumas otimizações precisam de ajuste');
    }
    
    console.log(`  📊 ${successCount}/4 otimizações bem-sucedidas`);
    
    // Detalhes adicionais
    if (optimized.metrics) {
      console.log('\n📋 MÉTRICAS ADICIONAIS:');
      console.log(`  Total Executions: ${optimized.metrics.summary.totalExecutions}`);
      console.log(`  Success Rate: ${optimized.metrics.summary.overallSuccessRate}`);
      console.log(`  Active Alerts: ${optimized.metrics.summary.activeAlerts}`);
    }
  }
}

// Executar teste
if (require.main === module) {
  const tester = new PerformanceTest();
  tester.runComparison().catch(console.error);
}

module.exports = PerformanceTest;
