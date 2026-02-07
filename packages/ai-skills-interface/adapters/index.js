/**
 * Adaptadores para diferentes IDEs e plataformas
 */

const IDEAdapter = {
  name: 'ide-adapter',
  description: 'Adaptador genérico para múltiplas IDEs',
  category: 'ide-integration',
  capabilities: ['file-management', 'context-sync', 'command-execution'],
  
  async initialize(ideType, config = {}) {
    const adapters = {
      cursor: () => require('./cursor'),
      windsurf: () => require('./windsurf'),
      claude: () => require('./claude'),
      github_copilot: () => require('./github-copilot')
    };
    
    const adapter = adapters[ideType];
    if (!adapter) {
      throw new Error(`IDE não suportada: ${ideType}`);
    }
    
    return await adapter().initialize(config);
  }
};

module.exports = IDEAdapter;
