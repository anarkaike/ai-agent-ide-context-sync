module.exports = {
  name: 'neovim',
  displayName: 'Neovim',
  description: 'Neovim integration adapter',
  version: '1.0.0',
  capabilities: ['sync', 'setup', 'analyze', 'configure'],
  setup: async (config = {}) => {
    return { success: true, ide: 'neovim', configured: true };
  },
  analyze: async (path) => {
    return { success: true, files: [], structure: {} };
  },
  sync: async (data) => {
    return { success: true, synced: true };
  }
};
