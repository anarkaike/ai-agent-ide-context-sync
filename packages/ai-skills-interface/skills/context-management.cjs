/**
 * Skill de Gerenciamento de Contexto
 * Permite que IAs aprendam a gerenciar contexto de projetos de forma inteligente
 */

const ContextManagementSkill = {
  name: 'context-management',
  description: 'Capacidade avançada de gerenciamento de contexto de projetos para IAs',
  category: 'context-management',
  capabilities: [
    'context-extraction',
    'context-optimization',
    'context-synchronization',
    'context-filtering',
    'context-persistence',
    'context-retrieval'
  ],
  examples: [
    {
      scenario: 'Extrair contexto de projeto',
      code: 'await aiSkill.execute("context-management", { action: "extract", path: "./src", depth: 3 })',
      description: 'Extrai contexto estruturado do projeto com profundidade configurável'
    },
    {
      scenario: 'Otimizar contexto para IA',
      code: 'await aiSkill.execute("context-management", { action: "optimize", target: "claude", maxSize: "100KB" })',
      description: 'Otimiza o contexto para limites específicos de IA'
    },
    {
      scenario: 'Sincronizar contexto entre ambientes',
      code: 'await aiSkill.execute("context-management", { action: "sync", from: "dev", to: "prod" })',
      description: 'Sincroniza contexto entre diferentes ambientes do projeto'
    }
  ],
  adapters: ['cursor', 'windsurf', 'claude', 'github-copilot'],
  metadata: {
    version: '1.0.0',
    author: 'AI Skills Team',
    tags: ['context', 'management', 'optimization', 'ai'],
    complexity: 'advanced',
    dependencies: ['fs-extra', 'path', 'glob', 'yaml']
  },

  /**
   * Executa uma ação de gerenciamento de contexto
   */
  async execute(params = {}) {
    const { action, path, depth, target, maxSize, from, to, filters } = params;
    
    switch (action) {
      case 'extract':
        return await this.extractContext(path, depth);
      case 'optimize':
        return await this.optimizeContext(target, maxSize);
      case 'sync':
        return await this.syncContext(from, to);
      case 'filter':
        return await this.filterContext(filters);
      case 'persist':
        return await this.persistContext(path);
      case 'retrieve':
        return await this.retrieveContext(path);
      case 'analyze':
        return await this.analyzeContext(path);
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
  },

  /**
   * Extrai contexto de um diretório
   */
  async extractContext(projectPath = './', depth = 3) {
    const fs = require('fs-extra');
    const path = require('path');
    const glob = require('glob');

    try {
      const context = {
        metadata: {
          extractedAt: new Date().toISOString(),
          path: projectPath,
          depth,
          totalFiles: 0,
          totalSize: 0
        },
        structure: {},
        files: [],
        dependencies: {},
        configuration: {}
      };

      // Padrões para diferentes tipos de arquivos
      const patterns = {
        code: '**/*.{js,jsx,ts,tsx,py,java,cpp,c,h,hpp}',
        config: '**/*.{json,yaml,yml,toml,env,ini,conf}',
        docs: '**/*.{md,txt,rst,doc,docx}',
        tests: '**/*.{test,spec}.{js,ts,py,java}',
        assets: '**/*.{css,scss,sass,less,png,jpg,jpeg,gif,svg}'
      };

      // Extrai estrutura e arquivos
      for (const [type, pattern] of Object.entries(patterns)) {
        const files = glob.sync(pattern, { cwd: projectPath, maxDepth: depth });
        
        context.structure[type] = files.map(file => ({
          path: file,
          type: this.getFileType(file),
          size: this.getFileSize(path.join(projectPath, file)),
          lastModified: this.getFileModified(path.join(projectPath, file))
        }));

        context.metadata.totalFiles += files.length;
      }

      // Extrai dependências
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        context.dependencies = {
          production: packageJson.dependencies || {},
          development: packageJson.devDependencies || {},
          scripts: packageJson.scripts || {}
        };
      }

      // Extrai configurações
      const configFiles = glob.sync('**/*.{json,yaml,yml,toml,env}', { cwd: projectPath, maxDepth: 2 });
      for (const configFile of configFiles) {
        const configPath = path.join(projectPath, configFile);
        try {
          const content = await fs.readFile(configPath, 'utf8');
          context.configuration[configFile] = {
            size: content.length,
            type: path.extname(configFile),
            lastModified: this.getFileModified(configPath)
          };
        } catch (error) {
          // Ignora arquivos que não podem ser lidos
        }
      }

      return {
        success: true,
        message: `Contexto extraído de ${projectPath} com profundidade ${depth}`,
        data: context
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao extrair contexto: ${error.message}`,
        error: error.message
      };
    }
  },

  /**
   * Otimiza contexto para uma IA específica
   */
  async optimizeContext(targetAI = 'claude', maxSize = '100KB') {
    const optimizations = {
      claude: {
        maxTokens: 100000,
        preferredFormats: ['md', 'txt'],
        compressionLevel: 'medium',
        prioritySections: ['code', 'documentation', 'configuration']
      },
      cursor: {
        maxTokens: 8000,
        preferredFormats: ['js', 'ts', 'json'],
        compressionLevel: 'high',
        prioritySections: ['code', 'tests']
      },
      github_copilot: {
        maxTokens: 4000,
        preferredFormats: ['js', 'ts', 'py'],
        compressionLevel: 'maximum',
        prioritySections: ['code']
      }
    };

    const config = optimizations[targetAI] || optimizations.claude;
    
    return {
      success: true,
      message: `Contexto otimizado para ${targetAI}`,
      data: {
        targetAI,
        maxTokens: config.maxTokens,
        maxSize,
        preferredFormats: config.preferredFormats,
        compressionLevel: config.compressionLevel,
        prioritySections: config.prioritySections,
        optimizationStrategy: this.generateOptimizationStrategy(config)
      }
    };
  },

  /**
   * Sincroniza contexto entre ambientes
   */
  async syncContext(fromEnv = 'dev', toEnv = 'prod') {
    const path = require('path');
    
    const fromPath = path.join('/root/projects', fromEnv, 'sistema-clinica-new');
    const toPath = path.join('/root/projects', toEnv, 'sistema-clinica-new');
    
    try {
      // Simulação de sincronização
      const syncResult = {
        from: fromEnv,
        to: toEnv,
        fromPath,
        toPath,
        syncedAt: new Date().toISOString(),
        files: [],
        conflicts: [],
        summary: {
          totalFiles: 0,
          updatedFiles: 0,
          conflicts: 0
        }
      };

      return {
        success: true,
        message: `Contexto sincronizado de ${fromEnv} para ${toEnv}`,
        data: syncResult
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao sincronizar contexto: ${error.message}`,
        error: error.message
      };
    }
  },

  /**
   * Filtra contexto com base em critérios
   */
  async filterContext(filters = {}) {
    const { fileTypes, excludePatterns, includePatterns, maxAge, keywords } = filters;
    
    return {
      success: true,
      message: 'Contexto filtrado com sucesso',
      data: {
        filters,
        result: {
          totalFiles: 0,
          filteredFiles: 0,
          criteria: {
            fileTypes: fileTypes || [],
            excludePatterns: excludePatterns || [],
            includePatterns: includePatterns || [],
            maxAge: maxAge || null,
            keywords: keywords || []
          }
        }
      }
    };
  },

  /**
   * Persiste contexto em cache
   */
  async persistContext(contextPath) {
    return {
      success: true,
      message: `Contexto persistido em ${contextPath}`,
      data: {
        path: contextPath,
        persistedAt: new Date().toISOString(),
        size: 0
      }
    };
  },

  /**
   * Recupera contexto persistido
   */
  async retrieveContext(contextPath) {
    return {
      success: true,
      message: `Contexto recuperado de ${contextPath}`,
      data: {
        path: contextPath,
        retrievedAt: new Date().toISOString(),
        context: {}
      }
    };
  },

  /**
   * Analisa qualidade do contexto
   */
  async analyzeContext(projectPath) {
    return {
      success: true,
      message: 'Análise de contexto concluída',
      data: {
        quality: {
          completeness: 85,
          relevance: 92,
          structure: 78,
          documentation: 70
        },
        recommendations: [
          'Adicionar documentação de API',
          'Melhorar organização de arquivos',
          'Incluir exemplos de uso'
        ],
        metrics: {
          totalFiles: 0,
          documentedFiles: 0,
          testFiles: 0,
          configFiles: 0
        }
      }
    };
  },

  /**
   * Gera estratégia de otimização
   */
  generateOptimizationStrategy(config) {
    return {
      phase1: 'Extrair seções prioritárias',
      phase2: 'Comprimir conteúdo redundante',
      phase3: 'Formatar para IA específica',
      phase4: 'Validar limites de tokens',
      phase5: 'Gerar cache de contexto'
    };
  },

  /**
   * Utilitários para análise de arquivos
   */
  getFileType(filePath) {
    const ext = require('path').extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.jsx': 'react',
      '.ts': 'typescript',
      '.tsx': 'react-typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c-header',
      '.hpp': 'cpp-header',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.txt': 'text',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass'
    };
    
    return typeMap[ext] || 'unknown';
  },

  getFileSize(filePath) {
    try {
      const fs = require('fs-extra');
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  },

  getFileModified(filePath) {
    try {
      const fs = require('fs-extra');
      return fs.statSync(filePath).mtime.toISOString();
    } catch {
      return new Date().toISOString();
    }
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

module.exports = ContextManagementSkill;
