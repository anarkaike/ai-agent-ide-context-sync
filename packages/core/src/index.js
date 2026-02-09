/**
 * AI Agent Core - Unified Intelligence Layer
 * 
 * This module provides the foundational components for the AI Agent ecosystem:
 * - Unified AIClient with security and tone management
 * - Resilient memory system with WAL rollback
 * - Security sandbox and cryptographic primitives
 * - Agent mesh network foundation
 * - Intelligent sync engine with delta compression
 * - Auto-optimization with predictive analytics
 */

export { AIClient } from './client/AIClient.js';
export { MemoryManager } from './memory/MemoryManager.js';
export { SecuritySandbox } from './security/SecuritySandbox.js';
export { WALManager } from './memory/WALManager.js';
export { ToneConfigManager } from './client/ToneConfigManager.js';

// Network Components
export { AgentMeshNetwork } from './network/AgentMeshNetwork.js';
export { ServiceDiscovery } from './network/ServiceDiscovery.js';
export { LoadBalancer } from './network/LoadBalancer.js';

// Sync Components
export { IntelligentSyncEngine } from './sync/IntelligentSyncEngine.js';
export { ConflictResolutionEngine } from './sync/ConflictResolutionEngine.js';
export { DeltaCompressionEngine } from './sync/DeltaCompressionEngine.js';

// Optimization Components
export { AutoOptimizationEngine } from './optimization/AutoOptimizationEngine.js';
export { SelfHealingSystem } from './optimization/SelfHealingSystem.js';
export { PredictiveAnalyticsEngine } from './optimization/PredictiveAnalyticsEngine.js';

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
  },
  network: {
    port: 8080,
    heartbeatInterval: 30000,
    discoveryInterval: 10000,
    healthCheckInterval: 30000
  },
  sync: {
    compressionLevel: 6,
    deltaThreshold: 1024,
    conflictResolution: 'semantic-merge',
    syncInterval: 5000,
    maxRetries: 3
  },
  optimization: {
    learningRate: 0.01,
    predictionWindow: 300000,
    optimizationInterval: 60000,
    modelUpdateInterval: 300000,
    confidenceThreshold: 0.7,
    predictionHorizon: 3600000
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
  const { AgentMeshNetwork } = await import('./network/AgentMeshNetwork.js');
  const { ServiceDiscovery } = await import('./network/ServiceDiscovery.js');
  const { LoadBalancer } = await import('./network/LoadBalancer.js');
  const { IntelligentSyncEngine } = await import('./sync/IntelligentSyncEngine.js');
  const { ConflictResolutionEngine } = await import('./sync/ConflictResolutionEngine.js');
  const { DeltaCompressionEngine } = await import('./sync/DeltaCompressionEngine.js');
  const { AutoOptimizationEngine } = await import('./optimization/AutoOptimizationEngine.js');
  const { SelfHealingSystem } = await import('./optimization/SelfHealingSystem.js');
  const { PredictiveAnalyticsEngine } = await import('./optimization/PredictiveAnalyticsEngine.js');

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

  // Initialize network components
  const network = new AgentMeshNetwork(config.network);
  const serviceDiscovery = new ServiceDiscovery(network);
  const loadBalancer = new LoadBalancer(network, config.network);

  // Initialize sync components
  const syncEngine = new IntelligentSyncEngine(config.sync);
  const conflictEngine = new ConflictResolutionEngine(config.sync);
  const compressionEngine = new DeltaCompressionEngine(config.sync);

  // Initialize optimization components
  const autoOptimization = new AutoOptimizationEngine(config.optimization);
  const selfHealing = new SelfHealingSystem(config.optimization);
  const predictiveAnalytics = new PredictiveAnalyticsEngine(config.optimization);

  return {
    client,
    memory,
    security,
    wal,
    network,
    serviceDiscovery,
    loadBalancer,
    syncEngine,
    conflictEngine,
    compressionEngine,
    autoOptimization,
    selfHealing,
    predictiveAnalytics,
    config,
    // Utility methods
    shutdown: async () => {
      await wal.close();
      await security.cleanup();
      await network.stop();
      await syncEngine.stop();
      await autoOptimization.stop();
      await selfHealing.stop();
      await predictiveAnalytics.stop();
    }
  };
}