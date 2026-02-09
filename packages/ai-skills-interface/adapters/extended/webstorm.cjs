module.exports = {
  name: 'webstorm',
  displayName: 'WebStorm',
  description: 'WebStorm integration adapter',
  version: '1.0.0',
  capabilities: ['sync', 'setup', 'analyze', 'configure'],
  setup: async (config = {}) => {
    return { success: true, ide: 'webstorm', configured: true };
  },
  analyze: async (path) => {
    return { success: true, files: [], structure: {} };
  },
  sync: async (data) => {
    return { success: true, synced: true };
  }
};
