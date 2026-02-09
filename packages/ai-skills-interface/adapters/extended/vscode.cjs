module.exports = {
  name: 'vscode',
  displayName: 'Visual Studio Code',
  description: 'VSCode integration adapter',
  version: '1.0.0',
  capabilities: ['sync', 'setup', 'analyze', 'configure'],
  setup: async (config = {}) => {
    return { success: true, ide: 'vscode', configured: true };
  },
  analyze: async (path) => {
    return { success: true, files: [], structure: {} };
  },
  sync: async (data) => {
    return { success: true, synced: true };
  }
};
