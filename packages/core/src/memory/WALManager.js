/**
 * Write-Ahead Logging (WAL) Manager
 * 
 * Provides resilient transaction logging for rollback and recovery:
 * - Atomic operations with journaling
 * - Checkpoint management
 * - Crash recovery
 * - Performance optimization
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export class WALManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      journalPath: '.ai-workspace/journal/wal',
      checkpointPath: '.ai-workspace/checkpoints',
      maxJournalSize: 1000,
      checkpointInterval: 60000, // 1 minute
      syncInterval: 5000, // 5 seconds
      ...options
    };
    
    this.journal = [];
    this.checkpoints = new Map();
    this.isInitialized = false;
    this.syncTimer = null;
    this.checkpointTimer = null;
    this.currentTransaction = null;
  }

  /**
   * Initialize WAL system
   */
  async initialize() {
    try {
      // Ensure directories exist
      await fs.ensureDir(this.options.journalPath);
      await fs.ensureDir(this.options.checkpointPath);
      
      // Load existing journal
      await this.loadJournal();
      
      // Load existing checkpoints
      await this.loadCheckpoints();
      
      // Start periodic sync
      this.startSyncTimer();
      
      // Start checkpoint timer
      this.startCheckpointTimer();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('[WALManager] Initialized successfully');
      
    } catch (error) {
      console.error('[WALManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Begin a new transaction
   * @param {string} type - Transaction type
   * @param {Object} metadata - Transaction metadata
   * @returns {string} Transaction ID
   */
  async beginTransaction(type, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('WALManager not initialized');
    }

    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      type,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      metadata,
      operations: []
    };

    this.currentTransaction = transaction;
    
    // Log transaction start
    await this.appendLog({
      type: 'TRANSACTION_BEGIN',
      transactionId,
      data: transaction
    });

    this.emit('transactionBegin', transaction);
    return transactionId;
  }

  /**
   * Add operation to current transaction
   * @param {string} operationType - Type of operation
   * @param {Object} operation - Operation details
   */
  async addOperation(operationType, operation) {
    if (!this.currentTransaction) {
      throw new Error('No active transaction');
    }

    const operationLog = {
      id: crypto.randomUUID(),
      transactionId: this.currentTransaction.id,
      type: operationType,
      timestamp: new Date().toISOString(),
      operation
    };

    this.currentTransaction.operations.push(operationLog);
    
    // Log operation
    await this.appendLog({
      type: 'OPERATION',
      data: operationLog
    });

    this.emit('operationAdded', operationLog);
  }

  /**
   * Commit current transaction
   * @returns {Promise<Object>} Transaction result
   */
  async commitTransaction() {
    if (!this.currentTransaction) {
      throw new Error('No active transaction');
    }

    const transaction = this.currentTransaction;
    transaction.status = 'COMMITTED';
    transaction.committedAt = new Date().toISOString();

    // Log transaction commit
    await this.appendLog({
      type: 'TRANSACTION_COMMIT',
      transactionId: transaction.id,
      data: transaction
    });

    // Force sync to disk
    await this.sync();

    this.emit('transactionCommit', transaction);
    
    const result = {
      success: true,
      transactionId: transaction.id,
      operationsCount: transaction.operations.length,
      committedAt: transaction.committedAt
    };

    this.currentTransaction = null;
    return result;
  }

  /**
   * Rollback current transaction
   * @param {string} reason - Rollback reason
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackTransaction(reason = 'User requested') {
    if (!this.currentTransaction) {
      throw new Error('No active transaction');
    }

    const transaction = this.currentTransaction;
    transaction.status = 'ROLLED_BACK';
    transaction.rolledBackAt = new Date().toISOString();
    transaction.rollbackReason = reason;

    // Execute rollback operations in reverse order
    const rollbackResults = [];
    for (let i = transaction.operations.length - 1; i >= 0; i--) {
      const operation = transaction.operations[i];
      try {
        const result = await this.executeRollbackOperation(operation);
        rollbackResults.push(result);
      } catch (error) {
        console.error(`[WALManager] Rollback operation failed:`, error);
        rollbackResults.push({ success: false, error: error.message });
      }
    }

    // Log transaction rollback
    await this.appendLog({
      type: 'TRANSACTION_ROLLBACK',
      transactionId: transaction.id,
      data: {
        ...transaction,
        rollbackResults
      }
    });

    this.emit('transactionRollback', transaction);

    const result = {
      success: true,
      transactionId: transaction.id,
      operationsCount: transaction.operations.length,
      rolledBackAt: transaction.rolledBackAt,
      reason,
      rollbackResults
    };

    this.currentTransaction = null;
    return result;
  }

  /**
   * Create a checkpoint
   * @param {string} name - Checkpoint name
   * @param {Object} metadata - Checkpoint metadata
   * @returns {Promise<string>} Checkpoint ID
   */
  async createCheckpoint(name, metadata = {}) {
    const checkpointId = crypto.randomUUID();
    const checkpoint = {
      id: checkpointId,
      name,
      createdAt: new Date().toISOString(),
      journalSize: this.journal.length,
      lastTransactionId: this.currentTransaction?.id,
      metadata
    };

    // Save checkpoint state
    const checkpointPath = path.join(this.options.checkpointPath, `${checkpointId}.json`);
    await fs.writeJson(checkpointPath, checkpoint, { spaces: 2 });

    // Save journal snapshot
    const journalPath = path.join(this.options.checkpointPath, `${checkpointId}-journal.json`);
    await fs.writeJson(journalPath, this.journal, { spaces: 2 });

    this.checkpoints.set(checkpointId, checkpoint);
    
    this.emit('checkpointCreated', checkpoint);
    
    console.log(`[WALManager] Checkpoint created: ${name} (${checkpointId})`);
    return checkpointId;
  }

  /**
   * Restore from checkpoint
   * @param {string} checkpointId - Checkpoint ID
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromCheckpoint(checkpointId) {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    try {
      // Load journal snapshot
      const journalPath = path.join(this.options.checkpointPath, `${checkpointId}-journal.json`);
      const journalSnapshot = await fs.readJson(journalPath);

      // Replace current journal
      this.journal = journalSnapshot;

      // Clear current transaction
      this.currentTransaction = null;

      // Sync to disk
      await this.sync();

      this.emit('checkpointRestored', checkpoint);

      return {
        success: true,
        checkpointId,
        restoredAt: new Date().toISOString(),
        journalSize: this.journal.length
      };

    } catch (error) {
      console.error(`[WALManager] Restore from checkpoint failed:`, error);
      throw error;
    }
  }

  /**
   * Append log entry to journal
   * @param {Object} logEntry - Log entry to append
   */
  async appendLog(logEntry) {
    const entry = {
      ...logEntry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sequence: this.journal.length
    };

    this.journal.push(entry);

    // Trim journal if too large
    if (this.journal.length > this.options.maxJournalSize) {
      await this.trimJournal();
    }

    return entry;
  }

  /**
   * Sync journal to disk
   */
  async sync() {
    try {
      const journalPath = path.join(this.options.journalPath, 'wal.json');
      await fs.writeJson(journalPath, this.journal, { spaces: 2 });
      
      this.emit('synced', { journalSize: this.journal.length });
    } catch (error) {
      console.error('[WALManager] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Load journal from disk
   */
  async loadJournal() {
    try {
      const journalPath = path.join(this.options.journalPath, 'wal.json');
      if (await fs.pathExists(journalPath)) {
        this.journal = await fs.readJson(journalPath);
        console.log(`[WALManager] Loaded ${this.journal.length} journal entries`);
      }
    } catch (error) {
      console.error('[WALManager] Failed to load journal:', error);
      this.journal = [];
    }
  }

  /**
   * Load checkpoints from disk
   */
  async loadCheckpoints() {
    try {
      const checkpointFiles = await fs.readdir(this.options.checkpointPath);
      
      for (const file of checkpointFiles) {
        if (file.endsWith('.json') && !file.includes('-journal')) {
          const checkpointPath = path.join(this.options.checkpointPath, file);
          const checkpoint = await fs.readJson(checkpointPath);
          this.checkpoints.set(checkpoint.id, checkpoint);
        }
      }
      
      console.log(`[WALManager] Loaded ${this.checkpoints.size} checkpoints`);
    } catch (error) {
      console.error('[WALManager] Failed to load checkpoints:', error);
    }
  }

  /**
   * Trim journal to prevent unlimited growth
   */
  async trimJournal() {
    const keepCount = Math.floor(this.options.maxJournalSize * 0.8);
    const toRemove = this.journal.length - keepCount;
    
    if (toRemove > 0) {
      // Create checkpoint before trimming
      await this.createCheckpoint('auto-trim', {
        reason: 'Journal size limit exceeded',
        removedEntries: toRemove
      });
      
      // Remove old entries
      this.journal = this.journal.slice(toRemove);
      
      console.log(`[WALManager] Trimmed ${toRemove} journal entries`);
    }
  }

  /**
   * Execute rollback operation
   * @param {Object} operation - Operation to rollback
   * @returns {Promise<Object>} Rollback result
   */
  async executeRollbackOperation(operation) {
    const { type, operation: op } = operation;

    switch (type) {
      case 'FILE_WRITE':
        return await this.rollbackFileWrite(op);
      case 'FILE_DELETE':
        return await this.rollbackFileDelete(op);
      case 'FILE_MOVE':
        return await this.rollbackFileMove(op);
      default:
        throw new Error(`Unsupported rollback operation: ${type}`);
    }
  }

  /**
   * Rollback file write operation
   * @param {Object} operation - File write operation
   */
  async rollbackFileWrite(operation) {
    const { filePath, backupPath } = operation;
    
    if (backupPath && await fs.pathExists(backupPath)) {
      await fs.move(backupPath, filePath);
      return { success: true, action: 'restored_from_backup' };
    } else {
      await fs.remove(filePath);
      return { success: true, action: 'deleted_file' };
    }
  }

  /**
   * Rollback file delete operation
   * @param {Object} operation - File delete operation
   */
  async rollbackFileDelete(operation) {
    const { filePath, backupPath } = operation;
    
    if (backupPath && await fs.pathExists(backupPath)) {
      await fs.move(backupPath, filePath);
      return { success: true, action: 'restored_from_backup' };
    }
    
    return { success: true, action: 'nothing_to_restore' };
  }

  /**
   * Rollback file move operation
   * @param {Object} operation - File move operation
   */
  async rollbackFileMove(operation) {
    const { sourcePath, targetPath } = operation;
    
    if (await fs.pathExists(targetPath)) {
      await fs.move(targetPath, sourcePath);
      return { success: true, action: 'moved_back' };
    }
    
    return { success: true, action: 'nothing_to_move' };
  }

  /**
   * Start periodic sync timer
   */
  startSyncTimer() {
    this.syncTimer = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        console.error('[WALManager] Periodic sync failed:', error);
      }
    }, this.options.syncInterval);
  }

  /**
   * Start checkpoint timer
   */
  startCheckpointTimer() {
    this.checkpointTimer = setInterval(async () => {
      try {
        await this.createCheckpoint('periodic', {
          reason: 'Periodic checkpoint',
          interval: this.options.checkpointInterval
        });
      } catch (error) {
        console.error('[WALManager] Periodic checkpoint failed:', error);
      }
    }, this.options.checkpointInterval);
  }

  /**
   * Get WAL statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      journalSize: this.journal.length,
      checkpointCount: this.checkpoints.size,
      hasActiveTransaction: !!this.currentTransaction,
      lastSyncAt: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  /**
   * Close WAL manager and cleanup resources
   */
  async close() {
    // Clear timers
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
      this.checkpointTimer = null;
    }

    // Final sync
    await this.sync();

    // Create final checkpoint
    if (this.journal.length > 0) {
      await this.createCheckpoint('shutdown', {
        reason: 'System shutdown'
      });
    }

    this.isInitialized = false;
    this.emit('closed');
    
    console.log('[WALManager] Closed successfully');
  }
}