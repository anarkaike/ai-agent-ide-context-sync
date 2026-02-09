# AI Skills Interface - Guia Rápido

## 🚀 Visão Geral

AI Skills Interface transforma toda a interação do pacote `ai-agent-ide-context-sync` em skills aprendíveis por IAs.

## 📦 Instalação

```bash
npm install -g @ai-agent-ide-context-sync/ai-skills-interface
```

## 🎯 Inicialização Rápida

```javascript
const AISkillsInterface = require('@ai-agent-ide-context-sync/ai-skills-interface');

// Inicializar interface
const aiSkills = new AISkillsInterface();
await aiSkills.initialize();

// Listar skills disponíveis
const skills = aiSkills.listSkills();
console.log('Skills:', skills);
```

## 🤖 Skills Disponíveis

### 1. IDE Integration Skill
**Descrição:** Integração e automação com múltiplas IDEs

**Capacidades:**
- Context synchronization entre IDEs
- Project structure analysis
- Multi-IDE compatibility
- Automated IDE setup

**Exemplo de Uso:**
```javascript
const ideSkill = aiSkills.getSkill('ide-integration');

// Listar IDEs suportadas
const ides = await ideSkill.execute({ action: 'list-ides' });

// Analisar estrutura do projeto
const structure = await ideSkill.execute({ 
  action: 'analyze-structure', 
  path: './src' 
});

// Configurar IDE específica
const setup = await ideSkill.execute({ 
  action: 'setup-ide', 
  ide: 'cursor',
  config: { tabSize: 4 }
});
```

### 2. Context Management Skill
**Descrição:** Gerenciamento avançado de contexto para IAs

**Capacidades:**
- Context extraction e optimization
- Context synchronization
- Context filtering e persistence
- AI-specific optimization

**Exemplo de Uso:**
```javascript
const contextSkill = aiSkills.getSkill('context-management');

// Extrair contexto do projeto
const context = await contextSkill.execute({ 
  action: 'extract', 
  path: './', 
  depth: 3 
});

// Otimizar para IA específica
const optimized = await contextSkill.execute({ 
  action: 'optimize', 
  target: 'claude',
  maxSize: '100KB' 
});

// Sincronizar entre ambientes
const synced = await contextSkill.execute({ 
  action: 'sync', 
  from: 'dev', 
  to: 'prod' 
});
```

### 3. Automation Workflows Skill
**Descrição:** Criação e execução de workflows de automação

**Capacidades:**
- Workflow creation e execution
- Workflow scheduling
- Trigger management
- Action chaining

**Exemplo de Uso:**
```javascript
const workflowSkill = aiSkills.getSkill('automation-workflows');

// Criar workflow automatizado
const workflow = await workflowSkill.execute({ 
  action: 'create', 
  name: 'auto-build',
  triggers: ['git-push'],
  actions: [
    { type: 'npm', npm: 'test', critical: true },
    { type: 'npm', npm: 'build', critical: false },
    { type: 'command', command: 'deploy.sh', critical: false }
  ]
});

// Executar workflow manualmente
const result = await workflowSkill.execute({ 
  action: 'execute', 
  workflow: 'auto-build' 
});

// Listar todos os workflows
const workflows = await workflowSkill.execute({ action: 'list' });
```

## 🔧 IDEs Suportadas

- **Cursor** - IDE com foco em IA e produtividade
- **Windsurf** - IDE moderna e extensível
- **Claude IDE** - IDE baseada no Claude AI
- **GitHub Copilot** - Integração com GitHub Copilot
- **Trae** - IDE com suporte a traços
- **Gemini** - IDE com integração Google AI

## 📊 Métricas e Monitoramento

```javascript
// Validar todas as skills
const validation = aiSkills.validateSkills();
console.log(`Skills válidas: ${validation.valid.length}/${validation.total}`);

// Exportar skills para JSON
const exportPath = await aiSkills.exportSkills('json');
console.log(`Exportado para: ${exportPath}`);

// Obter resumo das skills
const summary = aiSkills.getSkillsSummary();
console.log('Resumo:', summary);
```

## 🚀 Exemplos Práticos

### Exemplo 1: Sincronizar Contexto entre IDEs
```javascript
const ideSkill = aiSkills.getSkill('ide-integration');
await ideSkill.execute({ 
  action: 'sync-context', 
  target: 'all-ides' 
});
```

### Exemplo 2: Otimizar Contexto para Claude
```javascript
const contextSkill = aiSkills.getSkill('context-management');
await contextSkill.execute({ 
  action: 'optimize', 
  target: 'claude', 
  maxSize: '100KB' 
});
```

### Exemplo 3: Workflow de Build Automático
```javascript
const workflowSkill = aiSkills.getSkill('automation-workflows');
await workflowSkill.execute({ 
  action: 'create', 
  name: 'build-and-deploy',
  triggers: ['git-push'],
  actions: [
    { type: 'npm', npm: 'test' },
    { type: 'npm', npm: 'build' },
    { type: 'command', command: 'npm run deploy' }
  ]
});
```

## 🧪 Testes

Execute o teste completo para validar funcionamento:

```bash
cd packages/ai-skills-interface
node test-comprehensive.cjs
```

## 📚 Documentação Adicional

- [IDE Integration Details](./ide-integration.md)
- [Context Management Guide](./context-management.md)
- [Automation Workflows](./automation-workflows.md)
- [API Reference](./api-reference.md)

## 🤝 Contribuição

1. Crie nova skill no diretório `skills/`
2. Adicione testes correspondentes
3. Execute build e validação
4. Faça commit das mudanças

## 📄 Licença

MIT License - Veja arquivo LICENSE para detalhes.
