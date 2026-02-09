/**
 * AI Agent Core - Unified Intelligence Layer
 * 
 * This module provides the foundational components for the AI Agent ecosystem:
 * - Unified AIClient with security and tone management
 * - Resilient memory system with WAL rollback
 * - Security sandbox and cryptographic primitives
 * - Agent mesh network foundation
 */

export { AIClient } from './client/AIClient.js';
export { MemoryManager } from './memory/MemoryManager.js';
export { SecuritySandbox } from './security/SecuritySandbox.js';
export { WALManager } from './memory/WALManager.js';
export { ToneConfigManager } from './client/ToneConfigManager.js';

// Core configuration
export const CoreConfig = {
  version: '1.0.0',
  defaultTimeout: 30000,
  maxRetries: 3,
  security: {
    enableSandbox: true,
    enableEncryption: true,
    enableSigning: true
  },
  memory: {
    enableWAL: true,
    checkpointInterval: 60000, // 1 minute
    maxJournalSize: 1000
  }
};

/**
 * Initialize Core System
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Initialized core components
 */
export async function initializeCore(options = {}) {
  const config = { ...CoreConfig, ...options };

  // Import classes dynamically to avoid circular dependencies
  const { SecuritySandbox } = await import('./security/SecuritySandbox.js');
  const { WALManager } = await import('./memory/WALManager.js');
  const { MemoryManager } = await import('./memory/MemoryManager.js');
  const { ToneConfigManager } = await import('./client/ToneConfigManager.js');
  const { AIClient } = await import('./client/AIClient.js');

  // Initialize security first
  const security = new SecuritySandbox(config.security);
  await security.initialize();

  // Initialize memory with WAL
  const wal = new WALManager(config.memory);
  await wal.initialize();

  const memory = new MemoryManager(wal);
  await memory.initialize();

  // Initialize client with tone management
  const toneManager = new ToneConfigManager();
  const client = new AIClient(toneManager, security);

  return {
    client,
    memory,
    security,
    wal,
    config,
    // Utility methods
    shutdown: async () => {
      await wal.close();
      await security.cleanup();
    }
  };
}