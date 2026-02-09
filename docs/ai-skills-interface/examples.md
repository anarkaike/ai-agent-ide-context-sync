# AI Skills Interface - Exemplos Práticos

## 🎯 Exemplos do Mundo Real

### Exemplo 1: Setup Automático de Projeto

```javascript
const AISkillsInterface = require('@ai-agent-ide-context-sync/ai-skills-interface');

async function setupProject(projectPath, preferredIDE) {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  console.log('🚀 Configurando projeto:', projectPath);
  
  // 1. Analisar estrutura do projeto
  const ideSkill = aiSkills.getSkill('ide-integration');
  const structure = await ideSkill.execute({ 
    action: 'analyze-structure', 
    path: projectPath 
  });
  
  console.log('📁 Estrutura analisada:', structure.data.totalFiles, 'arquivos');
  
  // 2. Configurar IDE preferida
  const setup = await ideSkill.execute({ 
    action: 'setup-ide', 
    ide: preferredIDE,
    config: {
      tabSize: 2,
      wordWrap: true,
      autoSave: true
    }
  });
  
  console.log('⚙️ IDE configurada:', preferredIDE);
  
  // 3. Extrair e otimizar contexto
  const contextSkill = aiSkills.getSkill('context-management');
  const context = await contextSkill.execute({ 
    action: 'extract', 
    path: projectPath, 
    depth: 3 
  });
  
  const optimized = await contextSkill.execute({ 
    action: 'optimize', 
    target: preferredIDE === 'cursor' ? 'cursor' : 'claude',
    maxSize: '100KB' 
  });
  
  console.log('🧠 Contexto otimizado para', preferredIDE);
  
  // 4. Criar workflow de desenvolvimento
  const workflowSkill = aiSkills.getSkill('automation-workflows');
  const devWorkflow = await workflowSkill.execute({ 
    action: 'create', 
    name: 'dev-workflow',
    triggers: ['git-push'],
    actions: [
      { type: 'npm', npm: 'test', critical: true },
      { type: 'npm', npm: 'lint', critical: false },
      { type: 'npm', npm: 'build', critical: false }
    ]
  });
  
  console.log('⚡ Workflow de desenvolvimento criado');
  
  return {
    success: true,
    project: projectPath,
    ide: preferredIDE,
    filesAnalyzed: structure.data.totalFiles,
    contextOptimized: true,
    workflowCreated: true
  };
}

// Uso
setupProject('./my-project', 'cursor');
```

### Exemplo 2: Sincronização Multi-IDE

```javascript
async function syncMultiIDE(projectPath) {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  const ideSkill = aiSkills.getSkill('ide-integration');
  
  // Sincronizar contexto entre todas as IDEs
  const syncResult = await ideSkill.execute({ 
    action: 'sync-context', 
    target: 'all-ides' 
  });
  
  console.log('🔄 Contexto sincronizado para todas as IDEs');
  
  // Verificar status de cada IDE
  const ides = await ideSkill.execute({ action: 'list-ides' });
  
  for (const ide of ides.data) {
    const setup = await ideSkill.execute({ 
      action: 'setup-ide', 
      ide: ide.name,
      config: { syncEnabled: true }
    });
    console.log(`✅ ${ide.displayName} configurada para sync`);
  }
  
  return { syncedIDEs: ides.data.length, status: 'success' };
}

// Uso
syncMultiIDE('./current-project');
```

### Exemplo 3: Workflow de CI/CD Inteligente

```javascript
async function setupCIWorkflow(projectPath, deploymentTarget) {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  const workflowSkill = aiSkills.getSkill('automation-workflows');
  
  // Workflow completo de CI/CD
  const ciWorkflow = await workflowSkill.execute({ 
    action: 'create', 
    name: 'ci-cd-pipeline',
    triggers: ['git-push'],
    actions: [
      // 1. Testes automatizados
      { 
        type: 'npm', 
        npm: 'test', 
        critical: true,
        timeout: 300000
      },
      
      // 2. Análise de código
      { 
        type: 'command', 
        command: 'npm run lint', 
        critical: false 
      },
      
      // 3. Build do projeto
      { 
        type: 'npm', 
        npm: 'build', 
        critical: true 
      },
      
      // 4. Otimizar contexto para produção
      { 
        type: 'script', 
        script: './scripts/optimize-context.js',
        critical: false 
      },
      
      // 5. Deploy
      { 
        type: 'command', 
        command: `npm run deploy:${deploymentTarget}`, 
        critical: true 
      },
      
      // 6. Notificação
      { 
        type: 'api', 
        api: {
          method: 'POST',
          url: 'https://api.slack.com/webhook',
          data: { message: 'Deploy realizado com sucesso!' }
        },
        critical: false 
      }
    ]
  });
  
  console.log('🚀 Workflow CI/CD configurado');
  
  // Agendar execução
  await workflowSkill.execute({ 
    action: 'schedule', 
    workflow: 'ci-cd-pipeline',
    schedule: '0 2 * * *' // Todos os dias às 2h
  });
  
  return { workflow: 'ci-cd-pipeline', deploymentTarget, scheduled: true };
}

// Uso
setupCIWorkflow('./my-app', 'production');
```

### Exemplo 4: Análise e Otimização de Contexto

```javascript
async function analyzeAndOptimizeContext(projectPath, aiTypes) {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  const contextSkill = aiSkills.getSkill('context-management');
  
  console.log('🔍 Analisando contexto para múltiplas IAs...');
  
  // Extrair contexto completo
  const fullContext = await contextSkill.execute({ 
    action: 'extract', 
    path: projectPath, 
    depth: 4 
  });
  
  const results = {};
  
  // Otimizar para cada tipo de IA
  for (const aiType of aiTypes) {
    const optimized = await contextSkill.execute({ 
      action: 'optimize', 
      target: aiType,
      maxSize: aiType === 'claude' ? '200KB' : '50KB'
    });
    
    results[aiType] = {
      maxTokens: optimized.data.maxTokens,
      prioritySections: optimized.data.prioritySections,
      compressionLevel: optimized.data.compressionLevel
    };
    
    console.log(`🧠 Contexto otimizado para ${aiType}:`, optimized.data.maxTokens, 'tokens');
  }
  
  // Sincronizar contextos otimizados
  for (const aiType of aiTypes) {
    await contextSkill.execute({ 
      action: 'persist', 
      path: `${projectPath}/.ai-context/${aiType}-optimized.json`
    });
  }
  
  return {
    totalFiles: fullContext.data.metadata.totalFiles,
    optimizedFor: aiTypes,
    results
  };
}

// Uso
analyzeAndOptimizeContext('./project', ['claude', 'cursor', 'github_copilot']);
```

### Exemplo 5: Monitoramento e Manutenção

```javascript
async function monitorSkillsHealth() {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  console.log('🔍 Verificando saúde das skills...');
  
  // Validar todas as skills
  const validation = aiSkills.validateSkills();
  
  if (validation.invalid.length > 0) {
    console.log('⚠️ Skills com problemas:');
    validation.invalid.forEach(issue => {
      console.log(`  ❌ ${issue.name}: ${issue.error}`);
    });
  }
  
  // Testar cada skill
  const healthCheck = {};
  
  // Test IDE Integration
  try {
    const ideSkill = aiSkills.getSkill('ide-integration');
    const test = await ideSkill.execute({ action: 'list-ides' });
    healthCheck.ideIntegration = test.success;
  } catch (error) {
    healthCheck.ideIntegration = false;
  }
  
  // Test Context Management
  try {
    const contextSkill = aiSkills.getSkill('context-management');
    const test = await contextSkill.execute({ 
      action: 'extract', 
      path: './', 
      depth: 1 
    });
    healthCheck.contextManagement = test.success;
  } catch (error) {
    healthCheck.contextManagement = false;
  }
  
  // Test Automation Workflows
  try {
    const workflowSkill = aiSkills.getSkill('automation-workflows');
    const test = await workflowSkill.execute({ action: 'list' });
    healthCheck.automationWorkflows = test.success;
  } catch (error) {
    healthCheck.automationWorkflows = false;
  }
  
  const healthySkills = Object.values(healthCheck).filter(Boolean).length;
  const totalSkills = Object.keys(healthCheck).length;
  
  console.log(`📊 Saúde das skills: ${healthySkills}/${totalSkills} funcionando`);
  
  return {
    validation,
    healthCheck,
    healthySkills,
    totalSkills,
    status: healthySkills === totalSkills ? 'healthy' : 'needs-attention'
  };
}

// Uso
monitorSkillsHealth();
```

## 🎯 Dicas Avançadas

### 1. Combinar Skills
```javascript
// Combinar IDE setup com context optimization
async function smartIDESetup(projectPath, ideType) {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  // Setup IDE
  const ideSkill = aiSkills.getSkill('ide-integration');
  await ideSkill.execute({ 
    action: 'setup-ide', 
    ide: ideType 
  });
  
  // Otimizar contexto para a IDE específica
  const contextSkill = aiSkills.getSkill('context-management');
  await contextSkill.execute({ 
    action: 'optimize', 
    target: ideType,
    maxSize: '100KB' 
  });
  
  // Criar workflow personalizado
  const workflowSkill = aiSkills.getSkill('automation-workflows');
  await workflowSkill.execute({ 
    action: 'create', 
    name: `${ideType}-workflow`,
    triggers: ['file-change'],
    actions: [
      { type: 'command', command: `npm run ${ideType}-format` },
      { type: 'command', command: `npm run ${ideType}-lint` }
    ]
  });
}
```

### 2. Tratamento de Erros
```javascript
async function robustSkillExecution(skillName, action, params) {
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  try {
    const skill = aiSkills.getSkill(skillName);
    const result = await skill.execute({ action, ...params });
    
    if (!result.success) {
      console.error(`Skill ${skillName} falhou:`, result.message);
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error(`Erro ao executar skill ${skillName}:`, error.message);
    return null;
  }
}
```

## 🚀 Experimente!

Use estes exemplos como base para suas próprias implementações. As skills são altamente configuráveis e podem ser combinadas para criar soluções complexas.
