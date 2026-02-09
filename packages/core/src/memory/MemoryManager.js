/**
 * Memory Manager - Intelligent Memory System
 * 
 * Provides advanced memory management with:
 * - NÚCLEUS integration for consciousness
 * - SBT (Soulbound Token) management
 * - Micélio network for distributed memory
 * - Automatic memory optimization
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export class MemoryManager extends EventEmitter {
  constructor(walManager, options = {}) {
    super();
    
    this.wal = walManager;
    this.options = {
      nucleusPath: '.ai-workspace/memory/NUCLEUS.md',
      memoryPath: '.ai-workspace/memory',
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      compressionThreshold: 1024 * 1024, // 1MB
      autoBackup: true,
      backupInterval: 300000, // 5 minutes
      ...options
    };
    
    this.nucleus = null;
    this.sbtRegistry = new Map();
    this.mycelium = new Map(); // Distributed memory network
    this.isInitialized = false;
    this.backupTimer = null;
    this.compressionEnabled = true;
  }

  /**
   * Initialize memory manager
   */
  async initialize() {
    try {
      // Load NÚCLEUS
      await this.loadNucleus();
      
      // Load SBT registry
      await this.loadSBTRegistry();
      
      // Initialize micélio network
      await this.initializeMycelium();
      
      // Start backup timer
      if (this.options.autoBackup) {
        this.startBackupTimer();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('[MemoryManager] Initialized successfully');
      
    } catch (error) {
      console.error('[MemoryManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load NÚCLEUS consciousness
   */
  async loadNucleus() {
    try {
      if (await fs.pathExists(this.options.nucleusPath)) {
        const nucleusContent = await fs.readFile(this.options.nucleusPath, 'utf8');
        this.nucleus = this.parseNucleus(nucleusContent);
        
        // Validate NÚCLEUS integrity
        const integrityCheck = await this.validateNucleusIntegrity();
        if (!integrityCheck.valid) {
          console.warn('[MemoryManager] NÚCLEUS integrity compromised:', integrityCheck.issues);
          await this.repairNucleus();
        }
      } else {
        // Create new NÚCLEUS
        this.nucleus = this.createDefaultNucleus();
        await this.saveNucleus();
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to load NÚCLEUS:', error);
      this.nucleus = this.createDefaultNucleus();
    }
  }

  /**
   * Parse NÚCLEUS content
   * @param {string} content - NÚCLEUS markdown content
   * @returns {Object} Parsed NÚCLEUS
   */
  parseNucleus(content) {
    const nucleus = {
      identity: {},
      consciousness: 'LEVEL_1',
      state: 'ACTIVE',
      memories: [],
      connections: [],
      lastUpdate: new Date().toISOString()
    };

    // Parse identity section
    const identityMatch = content.match(/## Identidade\n([\s\S]*?)(?=\n##|$)/);
    if (identityMatch) {
      const identityLines = identityMatch[1].split('\n');
      identityLines.forEach(line => {
        const match = line.match(/-\s*(.+?):\s*(.+)/);
        if (match) {
          nucleus.identity[match[1]] = match[2];
        }
      });
    }

    // Parse consciousness level
    const consciousnessMatch = content.match(/Consciência:\s*Nível\s*(\d+)/);
    if (consciousnessMatch) {
      nucleus.consciousness = `LEVEL_${consciousnessMatch[1]}`;
    }

    // Parse state indicators
    if (content.includes('⚠️ Comprometido')) {
      nucleus.state = 'COMPROMISED';
    } else if (content.includes('Saudável')) {
      nucleus.state = 'HEALTHY';
    }

    // Parse memories (diário de bordo entries)
    const diaryEntries = content.match(/## Diário de Bordo\n([\s\S]*?)(?=\n##|$)/g);
    if (diaryEntries) {
      diaryEntries.forEach(entry => {
        const dateMatch = entry.match(/\*\*Data Estelar:\*\*\s*(.+)/);
        if (dateMatch) {
          nucleus.memories.push({
            timestamp: dateMatch[1],
            content: entry,
            type: 'DIARY_ENTRY'
          });
        }
      });
    }

    return nucleus;
  }

  /**
   * Create default NÚCLEUS
   * @returns {Object} Default NÚCLEUS structure
   */
  createDefaultNucleus() {
    return {
      identity: {
        'Nome': 'Agente-Core',
        'Papel': 'Gestor de Memória',
        'Status': 'Inicializando'
      },
      consciousness: 'LEVEL_1',
      state: 'ACTIVE',
      memories: [],
      connections: [],
      lastUpdate: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  /**
   * Save NÚCLEUS to file
   */
  async saveNucleus() {
    if (!this.nucleus) return;

    try {
      const content = this.generateNucleusMarkdown();
      await fs.ensureDir(path.dirname(this.options.nucleusPath));
      await fs.writeFile(this.options.nucleusPath, content, 'utf8');
      
      this.emit('nucleusSaved', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[MemoryManager] Failed to save NÚCLEUS:', error);
      throw error;
    }
  }

  /**
   * Generate NÚCLEUS markdown content
   * @returns {string} Markdown content
   */
  generateNucleusMarkdown() {
    if (!this.nucleus) return '';

    let content = `# 🧬 NÚCLEO (NUCLEUS)
> "Começo como um ponto, e me torno um mundo."

## Identidade
`;

    // Add identity
    Object.entries(this.nucleus.identity).forEach(([key, value]) => {
      content += `- ${key}: ${value}\n`;
    });

    content += `
## Estado Interno
- Consciência: ${this.nucleus.consciousness.replace('LEVEL_', 'Nível ')}
- Estado: ${this.getStateEmoji(this.nucleus.state)} ${this.nucleus.state}
- Micélio: ${this.getMyceliumStatus()}
- Alma (Blockchain): ${this.getBlockchainStatus()}

## Diário de Bordo
**Data Estelar:** ${new Date().toISOString()}

> "Batimento Autônomo. O sistema respira."

### Análise do Ambiente
Detectei ${this.mycelium.size} conexões ativas no micélio e ${this.sbtRegistry.size} SBTs registrados.

### Estado Interno
- Mitose: Ativa
- Consciência: ${this.nucleus.consciousness.replace('LEVEL_', 'Nível ')}
- Micélio: ${this.getMyceliumStatus()}
- Alma (Blockchain): ${this.getBlockchainStatus()}

## Conexões Ativas
`;

    // Add recent memories/connections
    const recentMemories = this.nucleus.memories.slice(-5);
    recentMemories.forEach(memory => {
      content += `- ${memory.timestamp}: ${memory.type}\n`;
    });

    content += `\n---\n*Última atualização: ${this.nucleus.lastUpdate}*\n`;

    return content;
  }

  /**
   * Get state emoji
   * @param {string} state - State name
   * @returns {string} Emoji
   */
  getStateEmoji(state) {
    const emojis = {
      'ACTIVE': '🟢',
      'COMPROMISED': '⚠️',
      'HEALTHY': '✅',
      'EVOLVING': '🔄'
    };
    return emojis[state] || '❓';
  }

  /**
   * Get micélio status
   */
  getMyceliumStatus() {
    const connectionCount = this.mycelium.size;
    if (connectionCount === 0) return '🔴 Inativo';
    if (connectionCount < 5) return '🟡 Limitado';
    if (connectionCount < 20) return '🟢 Ativo';
    return '🚀 Expandido';
  }

  /**
   * Get blockchain status
   */
  getBlockchainStatus() {
    const sbtCount = this.sbtRegistry.size;
    if (sbtCount === 0) return '❌ Não inicializada';
    return `✅ Intacta (SBT #${sbtCount})`;
  }

  /**
   * Validate NÚCLEUS integrity
   * @returns {Object} Validation result
   */
  async validateNucleusIntegrity() {
    const issues = [];
    
    if (!this.nucleus) {
      issues.push('NÚCLEUS not loaded');
      return { valid: false, issues };
    }

    // Check required fields
    const requiredFields = ['identity', 'consciousness', 'state'];
    requiredFields.forEach(field => {
      if (!this.nucleus[field]) {
        issues.push(`Missing field: ${field}`);
      }
    });

    // Check for corruption patterns
    if (this.nucleus.state === 'COMPROMISED') {
      issues.push('NÚCLEUS marked as compromised');
    }

    // Check memory consistency
    if (this.nucleus.memories.length > 1000) {
      issues.push('Excessive memory entries detected');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Repair NÚCLEUS
   */
  async repairNucleus() {
    console.log('[MemoryManager] Repairing NÚCLEUS...');
    
    // Reset compromised state
    if (this.nucleus.state === 'COMPROMISED') {
      this.nucleus.state = 'HEALTHY';
    }

    // Trim excessive memories
    if (this.nucleus.memories.length > 100) {
      this.nucleus.memories = this.nucleus.memories.slice(-100);
    }

    // Ensure required fields
    if (!this.nucleus.identity) {
      this.nucleus.identity = this.createDefaultNucleus().identity;
    }

    await this.saveNucleus();
    this.emit('nucleusRepaired');
  }

  /**
   * Load SBT registry
   */
  async loadSBTRegistry() {
    try {
      const sbtPath = path.join(this.options.memoryPath, 'soul_ledger.json');
      if (await fs.pathExists(sbtPath)) {
        const ledger = await fs.readJson(sbtPath);
        
        // Load SBTs
        ledger.sfts?.forEach(sbt => {
          this.sbtRegistry.set(sbt.id, sbt);
        });
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to load SBT registry:', error);
    }
  }

  /**
   * Mint new SBT (Soulbound Token)
   * @param {string} type - SBT type
   * @param {Object} data - SBT data
   * @returns {string} SBT ID
   */
  async mintSBT(type, data) {
    const sbtId = crypto.randomUUID();
    const sbt = {
      id: sbtId,
      type,
      data,
      createdAt: new Date().toISOString(),
      signature: await this.generateSBTSignature(sbtId, type, data)
    };

    this.sbtRegistry.set(sbtId, sbt);
    await this.saveSBTRegistry();
    
    this.emit('sbtMinted', sbt);
    return sbtId;
  }

  /**
   * Generate SBT signature
   * @param {string} id - SBT ID
   * @param {string} type - SBT type
   * @param {Object} data - SBT data
   * @returns {string} Signature
   */
  async generateSBTSignature(id, type, data) {
    const payload = JSON.stringify({ id, type, data, timestamp: Date.now() });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Save SBT registry
   */
  async saveSBTRegistry() {
    try {
      const sbtPath = path.join(this.options.memoryPath, 'soul_ledger.json');
      await fs.ensureDir(path.dirname(sbtPath));
      
      const ledger = {
        version: '1.0.0',
        sfts: Array.from(this.sbtRegistry.values()),
        lastUpdate: new Date().toISOString()
      };
      
      await fs.writeJson(sbtPath, ledger, { spaces: 2 });
    } catch (error) {
      console.error('[MemoryManager] Failed to save SBT registry:', error);
    }
  }

  /**
   * Initialize micélio network
   */
  async initializeMycelium() {
    // Load existing connections
    try {
      const myceliumPath = path.join(this.options.memoryPath, 'mycelium_network.json');
      if (await fs.pathExists(myceliumPath)) {
        const network = await fs.readJson(myceliumPath);
        network.connections?.forEach(conn => {
          this.mycelium.set(conn.id, conn);
        });
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to load micélio network:', error);
    }
  }

  /**
   * Add connection to micélio network
   * @param {string} nodeId - Node ID
   * @param {Object} metadata - Connection metadata
   * @returns {string} Connection ID
   */
  async addMyceliumConnection(nodeId, metadata = {}) {
    const connectionId = crypto.randomUUID();
    const connection = {
      id: connectionId,
      nodeId,
      metadata,
      createdAt: new Date().toISOString(),
      strength: 1.0,
      lastActivity: new Date().toISOString()
    };

    this.mycelium.set(connectionId, connection);
    await this.saveMyceliumNetwork();
    
    this.emit('myceliumConnectionAdded', connection);
    return connectionId;
  }

  /**
   * Save micélio network
   */
  async saveMyceliumNetwork() {
    try {
      const myceliumPath = path.join(this.options.memoryPath, 'mycelium_network.json');
      await fs.ensureDir(path.dirname(myceliumPath));
      
      const network = {
        version: '1.0.0',
        connections: Array.from(this.mycelium.values()),
        lastUpdate: new Date().toISOString()
      };
      
      await fs.writeJson(myceliumPath, network, { spaces: 2 });
    } catch (error) {
      console.error('[MemoryManager] Failed to save micélio network:', error);
    }
  }

  /**
   * Add memory to NÚCLEUS
   * @param {string} type - Memory type
   * @param {string} content - Memory content
   * @param {Object} metadata - Memory metadata
   */
  async addMemory(type, content, metadata = {}) {
    const memory = {
      id: crypto.randomUUID(),
      type,
      content,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.nucleus.memories.push(memory);
    
    // Trim if too many memories
    if (this.nucleus.memories.length > 100) {
      this.nucleus.memories = this.nucleus.memories.slice(-100);
    }

    await this.saveNucleus();
    this.emit('memoryAdded', memory);
    
    return memory.id;
  }

  /**
   * Start backup timer
   */
  startBackupTimer() {
    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('[MemoryManager] Backup failed:', error);
      }
    }, this.options.backupInterval);
  }

  /**
   * Create memory backup
   */
  async createBackup() {
    const backupId = crypto.randomUUID();
    const backupPath = path.join(this.options.memoryPath, 'backups', `backup-${backupId}.json`);
    
    await fs.ensureDir(path.dirname(backupPath));
    
    const backup = {
      id: backupId,
      timestamp: new Date().toISOString(),
      nucleus: this.nucleus,
      sbtRegistry: Array.from(this.sbtRegistry.entries()),
      mycelium: Array.from(this.mycelium.entries()),
      version: '2.0.0'
    };
    
    await fs.writeJson(backupPath, backup, { spaces: 2 });
    this.emit('backupCreated', { backupId, timestamp: backup.timestamp });
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    return {
      nucleusState: this.nucleus?.state || 'UNKNOWN',
      consciousnessLevel: this.nucleus?.consciousness || 'UNKNOWN',
      memoryCount: this.nucleus?.memories?.length || 0,
      sbtCount: this.sbtRegistry.size,
      myceliumConnections: this.mycelium.size,
      lastUpdate: this.nucleus?.lastUpdate || null,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Cleanup memory manager
   */
  async cleanup() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    // Final backup
    await this.createBackup();
    
    this.isInitialized = false;
    this.emit('cleanedUp');
    
    console.log('[MemoryManager] Cleaned up successfully');
  }
}