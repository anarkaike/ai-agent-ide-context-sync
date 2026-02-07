#!/usr/bin/env node

/**
 * Teste Comprehensivo das AI Skills Interface
 * Testa todas as skills em cenários reais
 */

const AISkillsInterface = require('./index.cjs');

class SkillsTester {
  constructor() {
    this.aiSkills = new AISkillsInterface();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES COMPREHENSIVOS DAS SKILLS...\n');
    
    try {
      // 1. Inicialização
      await this.testInitialization();
      
      // 2. Teste IDE Integration
      await this.testIDEIntegration();
      
      // 3. Teste Context Management
      await this.testContextManagement();
      
      // 4. Teste Automation Workflows
      await this.testAutomationWorkflows();
      
      // 5. Teste Exportação
      await this.testExportSkills();
      
      // 6. Relatório Final
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro nos testes:', error.message);
    }
  }

  async testInitialization() {
    console.log('🔧 Teste 1: Inicialização da Interface');
    
    try {
      const summary = await this.aiSkills.initialize();
      
      this.addResult('Inicialização', true, {
        totalSkills: summary.total,
        skills: summary.skills,
        categories: Object.keys(summary.categories)
      });
      
      console.log('  ✅ Interface inicializada com sucesso');
      console.log(`  📊 ${summary.total} skills carregadas`);
      
    } catch (error) {
      this.addResult('Inicialização', false, { error: error.message });
      console.log('  ❌ Falha na inicialização');
    }
  }

  async testIDEIntegration() {
    console.log('\n🎯 Teste 2: IDE Integration Skill');
    
    try {
      const skill = this.aiSkills.getSkill('ide-integration');
      
      // Teste 1: Listar IDEs
      const listResult = await skill.execute({ action: 'list-ides' });
      this.addResult('IDE List', listResult.success, {
        count: listResult.data?.length || 0,
        ides: listResult.data?.map(ide => ide.name) || []
      });
      console.log(`  ✅ Listar IDEs: ${listResult.data?.length || 0} IDEs encontradas`);
      
      // Teste 2: Analisar estrutura
      const analyzeResult = await skill.execute({ 
        action: 'analyze-structure', 
        path: '/root/projects/ai-agent-ide-context-sync' 
      });
      this.addResult('Analyze Structure', analyzeResult.success, {
        totalFiles: analyzeResult.data?.totalFiles || 0,
        directories: analyzeResult.data?.directories || 0
      });
      console.log(`  ✅ Analisar estrutura: ${analyzeResult.data?.totalFiles || 0} arquivos`);
      
      // Teste 3: Setup IDE
      const setupResult = await skill.execute({ 
        action: 'setup-ide', 
        ide: 'cursor',
        config: { tabSize: 4 }
      });
      this.addResult('Setup IDE', setupResult.success, {
        ide: 'cursor',
        configured: setupResult.success
      });
      console.log(`  ✅ Setup IDE: Cursor configurado`);
      
    } catch (error) {
      this.addResult('IDE Integration', false, { error: error.message });
      console.log('  ❌ Falha nos testes de IDE Integration');
    }
  }

  async testContextManagement() {
    console.log('\n📊 Teste 3: Context Management Skill');
    
    try {
      const skill = this.aiSkills.getSkill('context-management');
      
      // Teste 1: Extrair contexto
      const extractResult = await skill.execute({ 
        action: 'extract', 
        path: '/root/projects/ai-agent-ide-context-sync',
        depth: 2 
      });
      this.addResult('Extract Context', extractResult.success, {
        path: '/root/projects/ai-agent-ide-context-sync',
        depth: 2,
        totalFiles: extractResult.data?.metadata?.totalFiles || 0
      });
      console.log(`  ✅ Extrair contexto: ${extractResult.data?.metadata?.totalFiles || 0} arquivos`);
      
      // Teste 2: Otimizar contexto
      const optimizeResult = await skill.execute({ 
        action: 'optimize', 
        target: 'claude',
        maxSize: '100KB' 
      });
      this.addResult('Optimize Context', optimizeResult.success, {
        target: 'claude',
        maxSize: '100KB',
        maxTokens: optimizeResult.data?.maxTokens || 0
      });
      console.log(`  ✅ Otimizar contexto: ${optimizeResult.data?.maxTokens || 0} tokens`);
      
      // Teste 3: Sincronizar contexto
      const syncResult = await skill.execute({ 
        action: 'sync', 
        from: 'dev', 
        to: 'prod' 
      });
      this.addResult('Sync Context', syncResult.success, {
        from: 'dev',
        to: 'prod'
      });
      console.log(`  ✅ Sincronizar contexto: dev → prod`);
      
    } catch (error) {
      this.addResult('Context Management', false, { error: error.message });
      console.log('  ❌ Falha nos testes de Context Management');
    }
  }

  async testAutomationWorkflows() {
    console.log('\n⚡ Teste 4: Automation Workflows Skill');
    
    try {
      const skill = this.aiSkills.getSkill('automation-workflows');
      
      // Teste 1: Criar workflow
      const createResult = await skill.execute({ 
        action: 'create', 
        name: 'test-workflow',
        triggers: ['manual'],
        actions: [
          { type: 'command', command: 'echo "Test workflow"', critical: false }
        ]
      });
      this.addResult('Create Workflow', createResult.success, {
        name: 'test-workflow',
        triggers: 1,
        actions: 1
      });
      console.log(`  ✅ Criar workflow: test-workflow`);
      
      // Teste 2: Executar workflow
      const executeResult = await skill.execute({ 
        action: 'execute', 
        workflow: 'test-workflow',
        params: {}
      });
      this.addResult('Execute Workflow', executeResult.success, {
        workflow: 'test-workflow',
        status: executeResult.data?.status || 'unknown'
      });
      console.log(`  ✅ Executar workflow: ${executeResult.data?.status || 'unknown'}`);
      
      // Teste 3: Listar workflows
      const listResult = await skill.execute({ action: 'list' });
      this.addResult('List Workflows', listResult.success, {
        total: listResult.data?.total || 0
      });
      console.log(`  ✅ Listar workflows: ${listResult.data?.total || 0} workflows`);
      
    } catch (error) {
      this.addResult('Automation Workflows', false, { error: error.message });
      console.log('  ❌ Falha nos testes de Automation Workflows');
    }
  }

  async testExportSkills() {
    console.log('\n�� Teste 5: Exportação de Skills');
    
    try {
      // Teste exportação JSON
      const jsonPath = await this.aiSkills.exportSkills('json');
      this.addResult('Export JSON', true, { path: jsonPath });
      console.log(`  ✅ Exportar JSON: ${jsonPath}`);
      
      // Teste validação
      const validation = this.aiSkills.validateSkills();
      this.addResult('Validate Skills', validation.invalid.length === 0, {
        valid: validation.valid.length,
        invalid: validation.invalid.length,
        total: validation.total
      });
      console.log(`  ✅ Validar skills: ${validation.valid.length}/${validation.total} válidas`);
      
    } catch (error) {
      this.addResult('Export Skills', false, { error: error.message });
      console.log('  ❌ Falha na exportação');
    }
  }

  addResult(testName, success, data) {
    this.testResults.push({
      test: testName,
      success,
      data,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL DE TESTES');
    console.log('================================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`\n📈 Resumo:`);
    console.log(`  ✅ Passaram: ${passedTests}/${totalTests}`);
    console.log(`  ❌ Falharam: ${failedTests}/${totalTests}`);
    console.log(`  📊 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 Detalhes:`);
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.test}`);
      if (!result.success && result.data.error) {
        console.log(`    Erro: ${result.data.error}`);
      }
    });
    
    if (failedTests === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! SKILLS 100% FUNCIONAIS!');
    } else {
      console.log(`\n⚠️ ${failedTests} teste(s) falharam. Revisar necessário.`);
    }
  }
}

// Executar testes
if (require.main === module) {
  const tester = new SkillsTester();
  tester.runAllTests();
}

module.exports = SkillsTester;
