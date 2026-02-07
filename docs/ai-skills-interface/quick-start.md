# AI Skills Interface - Quick Start

## ⚡ Começando em 5 Minutos

### 1. Instalação
```bash
npm install -g @ai-agent-ide-context-sync/ai-skills-interface
```

### 2. Primeiro Teste
```javascript
const AISkillsInterface = require('@ai-agent-ide-context-sync/ai-skills-interface');

async function quickStart() {
  // Inicializar
  const aiSkills = new AISkillsInterface();
  await aiSkills.initialize();
  
  // Listar skills
  const skills = aiSkills.listSkills();
  console.log('Skills disponíveis:', skills.map(s => s.name));
  
  // Testar IDE integration
  const ideSkill = aiSkills.getSkill('ide-integration');
  const ides = await ideSkill.execute({ action: 'list-ides' });
  console.log('IDEs suportadas:', ides.data.length);
  
  // Testar context management
  const contextSkill = aiSkills.getSkill('context-management');
  const context = await contextSkill.execute({ 
    action: 'extract', 
    path: './', 
    depth: 1 
  });
  console.log('Arquivos analisados:', context.data.metadata.totalFiles);
}

quickStart();
```

### 3. Exemplos Práticos

#### Sync de IDEs
```javascript
const ideSkill = aiSkills.getSkill('ide-integration');
await ideSkill.execute({ action: 'sync-context', target: 'all-ides' });
```

#### Otimizar Contexto
```javascript
const contextSkill = aiSkills.getSkill('context-management');
await contextSkill.execute({ 
  action: 'optimize', 
  target: 'claude', 
  maxSize: '50KB' 
});
```

#### Criar Workflow
```javascript
const workflowSkill = aiSkills.getSkill('automation-workflows');
await workflowSkill.execute({ 
  action: 'create', 
  name: 'test-auto',
  triggers: ['manual'],
  actions: [{ type: 'command', command: 'echo "Hello AI!"' }]
});
```

## 🎯 Próximos Passos

1. Explore [README completo](./README.md)
2. Execute [testes completos](../packages/ai-skills-interface/test-comprehensive.cjs)
3. Veja [exemplos avançados](./examples.md)

## 🚀 Você está pronto!

Parabéns! Agora você pode usar skills de IA para automatizar interações com IDEs e gerenciar contexto de projetos.
