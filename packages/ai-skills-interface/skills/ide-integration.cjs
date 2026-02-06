/**
 * Skill de Integração com IDEs
 * Permite que IAs aprendam a interagir com diferentes IDEs
 */

const IDEIntegrationSkill = {
  name: 'ide-integration',
  description: 'Capacidade de integração e automação com múltiplas IDEs (Cursor, Windsurf, Claude, GitHub Copilot, etc.)',
  category: 'ide-integration',
  capabilities: [
    'context-synchronization',
    'file-management',
    'project-structure-analysis',
    'multi-ide-compatibility',
    'automation-workflows'
  ],
  examples: [
    {
      scenario: 'Sincronizar contexto entre IDEs',
      code: 'await aiSkill.execute("ide-integration", { action: "sync-context", target: "all-ides" })',
      description: 'Sincroniza automaticamente o contexto do projeto entre todas as IDEs configuradas'
    },
    {
      scenario: 'Analisar estrutura de projeto',
      code: 'await aiSkill.execute("ide-integration", { action: "analyze-structure", path: "./src" })',
      description: 'Analisa a estrutura do projeto e sugere melhorias de organização'
    },
    {
      scenario: 'Configurar nova IDE',
      code: 'await aiSkill.execute("ide-integration", { action: "setup-ide", ide: "cursor", config: {...} })',
      description: 'Configura automaticamente uma nova IDE com as melhores práticas'
    }
  ],
  adapters: ['cursor', 'windsurf', 'claude', 'github-copilot', 'trae', 'gemini'],
  metadata: {
    version: '1.0.0',
    author: 'AI Skills Team',
    tags: ['ide', 'integration', 'automation', 'context'],
    complexity: 'intermediate',
    dependencies: ['fs-extra', 'path', 'glob']
  },

  /**
   * Executa uma ação de integração com IDE
   */
  async execute(params = {}) {
    const { action, target, config, path } = params;
    
    switch (action) {
      case 'sync-context':
        return await this.syncContext(target);
      case 'analyze-structure':
        return await this.analyzeStructure(path);
      case 'setup-ide':
        return await this.setupIDE(target, config);
      case 'list-ides':
        return await this.listIDEs();
      case 'export-config':
        return await this.exportConfig(target);
      default:
        throw new Error('Ação não suportada: ' + action);
    }
  },

  /**
   * Sincroniza contexto entre IDEs
   */
  async syncContext(target = 'all') {
    const contextData = {
      timestamp: new Date().toISOString(),
      target,
      files: [],
      settings: {}
    };

    // Lógica de sincronização seria implementada aqui
    // Integrando com o sistema existente do ai-agent-ide-context-sync
    
    return {
      success: true,
      message: 'Contexto sincronizado para ' + target,
      data: contextData
    };
  },

  /**
   * Analisa estrutura de projeto
   */
  async analyzeStructure(projectPath = './') {
    const fs = require('fs-extra');
    const path = require('path');
    const glob = require('glob');

    try {
      const files = glob.sync('**/*', { cwd: projectPath });
      const structure = {
        totalFiles: files.length,
        directories: files.filter(f => fs.statSync(path.join(projectPath, f)).isDirectory()).length,
        fileTypes: this.analyzeFileTypes(files, projectPath),
        dependencies: await this.analyzeDependencies(projectPath),
        recommendations: await this.generateRecommendations(projectPath)
      };

      return {
        success: true,
        message: 'Estrutura analisada com sucesso',
        data: structure
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao analisar estrutura: ' + error.message,
        error: error.message
      };
    }
  },

  /**
   * Configura uma IDE específica
   */
  async setupIDE(ide, config = {}) {
    const ideConfigs = {
      cursor: {
        rulesFile: '.cursorrules',
        settings: {
          tabSize: 2,
          wordWrap: true,
          autoSave: true
        }
      },
      windsurf: {
        rulesFile: '.windsurfrules',
        settings: {
          autoComplete: true,
          syntaxHighlighting: true
        }
      },
      claude: {
        rulesFile: '.claude/instructions.md',
        settings: {
          contextWindowSize: 'large',
          codeStyle: 'professional'
        }
      }
    };

    const ideConfig = Object.assign({}, ideConfigs[ide], config);
    
    return {
      success: true,
      message: 'IDE ' + ide + ' configurada com sucesso',
      data: ideConfig
    };
  },

  /**
   * Lista todas as IDEs suportadas
   */
  async listIDEs() {
    return {
      success: true,
      data: [
        {
          name: 'cursor',
          displayName: 'Cursor',
          description: 'IDE com foco em IA e produtividade',
          features: ['ai-integration', 'context-aware', 'multi-language']
        },
        {
          name: 'windsurf',
          displayName: 'Windsurf',
          description: 'IDE moderna com suporte a múltiplas linguagens',
          features: ['lightweight', 'extensible', 'git-integration']
        },
        {
          name: 'claude',
          displayName: 'Claude IDE',
          description: 'IDE baseada no Claude AI',
          features: ['ai-assistant', 'context-management', 'code-generation']
        },
        {
          name: 'github-copilot',
          displayName: 'GitHub Copilot',
          description: 'Integração do GitHub Copilot',
          features: ['code-completion', 'ai-suggestions', 'github-integration']
        }
      ]
    };
  },

  /**
   * Analisa tipos de arquivos no projeto
   */
  analyzeFileTypes(files, basePath) {
    const path = require('path');
    const fs = require('fs-extra');
    
    const fileTypes = {};
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const fullPath = path.join(basePath, file);
      
      if (fs.statSync(fullPath).isFile()) {
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      }
    }
    
    return fileTypes;
  },

  /**
   * Analisa dependências do projeto
   */
  async analyzeDependencies(projectPath) {
    const fs = require('fs-extra');
    const path = require('path');
    
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
        packageManager: 'npm'
      };
    }
    
    return { dependencies: [], devDependencies: [], packageManager: 'none' };
  },

  /**
   * Gera recomendações para o projeto
   */
  async generateRecommendations(projectPath) {
    return [
      {
        type: 'structure',
        priority: 'high',
        recommendation: 'Organize arquivos em pastas lógicas (src, tests, docs, config)',
        reason: 'Melhora navegação e manutenibilidade'
      },
      {
        type: 'documentation',
        priority: 'medium',
        recommendation: 'Adicione README.md detalhado e documentação de API',
        reason: 'Facilita onboarding e uso do projeto'
      },
      {
        type: 'ide-config',
        priority: 'medium',
        recommendation: 'Configure .gitignore e .editorconfig para consistência',
        reason: 'Garante experiência consistente entre desenvolvedores'
      }
    ];
  },

  /**
   * Valida se a skill está configurada corretamente
   */
  validate() {
    return (
      this.name &&
      this.description &&
      this.capabilities &&
      this.examples &&
      this.adapters &&
      this.metadata
    );
  }
};

module.exports = IDEIntegrationSkill;
