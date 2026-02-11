const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const archiver = require('archiver');
const tar = require('tar');
const AWS = require('aws-sdk');

class BackupManager {
  constructor(options = {}) {
    this.config = {
      backupDir: options.backupDir || '/var/backups/ai-agent',
      sources: options.sources || this.getDefaultSources(),
      storage: options.storage || {
        local: {
          enabled: true,
          path: '/var/backups/ai-agent'
        },
        s3: {
          enabled: false,
          bucket: 'ai-agent-backups',
          region: 'us-east-1',
          accessKeyId: options.s3AccessKeyId || process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: options.s3SecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY
        }
      },
      encryption: {
        enabled: options.encryption !== false,
        algorithm: 'aes-256-gcm',
        key: options.encryptionKey || this.generateEncryptionKey()
      },
      compression: {
        enabled: options.compression !== false,
        level: options.compressionLevel || 6
      },
      retention: {
        full: options.fullRetention || 28, // days
        incremental: options.incrementalRetention || 7 // days
      },
      scheduling: {
        enabled: options.scheduling !== false,
        fullBackupInterval: options.fullBackupInterval || '0 2 * * 0', // Sunday 2 AM
        incrementalBackupInterval: options.incrementalBackupInterval || '0 3 * * 1-6' // Mon-Sat 3 AM
      },
      ...options
    };

    this.backupCatalog = [];
    this.isRunning = false;
    this.currentBackup = null;

    // Initialize S3 if enabled
    if (this.config.storage.s3.enabled) {
      this.s3 = new AWS.S3({
        accessKeyId: this.config.storage.s3.accessKeyId,
        secretAccessKey: this.config.storage.s3.secretAccessKey,
        region: this.config.storage.s3.region
      });
    }

    // Load backup catalog
    this.loadBackupCatalog();
  }

  /**
   * Obtém fontes de backup padrão
   */
  getDefaultSources() {
    return [
      {
        name: 'agent_workspace',
        path: '/root/projects/dev/ai-agent-ide-context-sync',
        priority: 'critical',
        exclude: ['node_modules', '.git', 'dist', 'coverage', '*.tmp']
      },
      {
        name: 'agent_config',
        path: '/root/.ai-agent',
        priority: 'critical',
        exclude: []
      },
      {
        name: 'agent_memory',
        path: '/root/.ai-workspace',
        priority: 'critical',
        exclude: ['cache', 'temp']
      },
      {
        name: 'system_config',
        path: '/etc/ai-agent',
        priority: 'high',
        exclude: []
      }
    ];
  }

  /**
   * Inicia serviço de backup
   */
  async start() {
    if (this.isRunning) {
      return { success: false, message: 'Backup service already running' };
    }

    console.log('💾 Starting Backup Manager...');
    
    // Create backup directory
    await fs.ensureDir(this.config.backupDir);
    
    // Validate backup sources
    const validation = await this.validateBackupSources();
    if (!validation.valid) {
      return { success: false, message: 'Backup sources validation failed', errors: validation.errors };
    }

    this.isRunning = true;

    // Start scheduling if enabled
    if (this.config.scheduling.enabled) {
      this.startScheduling();
    }

    return { 
      success: true, 
      message: 'Backup service started',
      sources: this.config.sources.length,
      storage: Object.keys(this.config.storage).filter(key => this.config.storage[key].enabled)
    };
  }

  /**
   * Para serviço de backup
   */
  async stop() {
    this.isRunning = false;
    
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }

    console.log('⏹️ Backup service stopped');
    return { success: true, message: 'Backup service stopped' };
  }

  /**
   * Executa backup completo
   */
  async createFullBackup(options = {}) {
    const backupId = this.generateBackupId('full');
    const backupPath = path.join(this.config.backupDir, `${backupId}.tar.gz`);
    
    console.log(`🔄 Creating full backup: ${backupId}`);
    
    this.currentBackup = {
      id: backupId,
      type: 'full',
      status: 'running',
      startTime: new Date(),
      sources: this.config.sources.map(s => s.name)
    };

    try {
      // Create backup archive
      await this.createBackupArchive(backupPath, this.config.sources);
      
      // Compress if enabled
      if (this.config.compression.enabled) {
        await this.compressBackup(backupPath);
      }

      // Encrypt if enabled
      if (this.config.encryption.enabled) {
        await this.encryptBackup(backupPath);
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(backupPath);
      
      // Upload to storage backends
      const uploadResults = await this.uploadToStorage(backupPath, backupId);

      // Update backup catalog
      this.currentBackup.status = 'completed';
      this.currentBackup.endTime = new Date();
      this.currentBackup.size = await fs.stat(backupPath).then(stat => stat.size);
      this.currentBackup.checksum = checksum;
      this.currentBackup.storage = uploadResults;

      this.backupCatalog.push(this.currentBackup);
      await this.saveBackupCatalog();

      // Cleanup old backups
      await this.cleanupOldBackups('full');

      console.log(`✅ Full backup completed: ${backupId}`);
      
      return {
        success: true,
        backup: this.currentBackup,
        message: 'Full backup created successfully'
      };

    } catch (error) {
      this.currentBackup.status = 'failed';
      this.currentBackup.error = error.message;
      this.currentBackup.endTime = new Date();

      console.error(`❌ Full backup failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        backup: this.currentBackup
      };
    } finally {
      this.currentBackup = null;
    }
  }

  /**
   * Executa backup incremental
   */
  async createIncrementalBackup(options = {}) {
    const lastFullBackup = this.backupCatalog
      .filter(b => b.type === 'full' && b.status === 'completed')
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

    if (!lastFullBackup) {
      throw new Error('No full backup found for incremental backup');
    }

    const backupId = this.generateBackupId('incremental');
    const backupPath = path.join(this.config.backupDir, `${backupId}.tar.gz`);
    
    console.log(`🔄 Creating incremental backup: ${backupId}`);
    
    this.currentBackup = {
      id: backupId,
      type: 'incremental',
      baseBackup: lastFullBackup.id,
      status: 'running',
      startTime: new Date(),
      sources: this.config.sources.map(s => s.name)
    };

    try {
      // Find changed files since last backup
      const changedFiles = await this.findChangedFiles(lastFullBackup.endTime);
      
      if (changedFiles.length === 0) {
        console.log('No changes detected, skipping incremental backup');
        return {
          success: true,
          backup: { ...this.currentBackup, status: 'skipped', message: 'No changes detected' }
        };
      }

      // Create backup archive with changed files only
      await this.createBackupArchive(backupPath, this.config.sources, changedFiles);
      
      // Compress if enabled
      if (this.config.compression.enabled) {
        await this.compressBackup(backupPath);
      }

      // Encrypt if enabled
      if (this.config.encryption.enabled) {
        await this.encryptBackup(backupPath);
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(backupPath);
      
      // Upload to storage backends
      const uploadResults = await this.uploadToStorage(backupPath, backupId);

      // Update backup catalog
      this.currentBackup.status = 'completed';
      this.currentBackup.endTime = new Date();
      this.currentBackup.size = await fs.stat(backupPath).then(stat => stat.size);
      this.currentBackup.checksum = checksum;
      this.currentBackup.storage = uploadResults;
      this.currentBackup.changedFiles = changedFiles.length;

      this.backupCatalog.push(this.currentBackup);
      await this.saveBackupCatalog();

      // Cleanup old incremental backups
      await this.cleanupOldBackups('incremental');

      console.log(`✅ Incremental backup completed: ${backupId} (${changedFiles.length} files)`);
      
      return {
        success: true,
        backup: this.currentBackup,
        message: 'Incremental backup created successfully'
      };

    } catch (error) {
      this.currentBackup.status = 'failed';
      this.currentBackup.error = error.message;
      this.currentBackup.endTime = new Date();

      console.error(`❌ Incremental backup failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        backup: this.currentBackup
      };
    } finally {
      this.currentBackup = null;
    }
  }

  /**
   * Restaura backup
   */
  async restoreBackup(backupId, targetPath, options = {}) {
    const backup = this.backupCatalog.find(b => b.id === backupId);
    
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup ${backupId} is not completed`);
    }

    console.log(`🔄 Restoring backup: ${backupId} to ${targetPath}`);
    
    try {
      // Download backup from storage
      const backupPath = await this.downloadFromStorage(backupId);
      
      // Decrypt if needed
      if (this.config.encryption.enabled && backupPath.endsWith('.enc')) {
        await this.decryptBackup(backupPath);
      }

      // Extract backup
      await this.extractBackup(backupPath, targetPath);
      
      console.log(`✅ Backup restored successfully: ${backupId}`);
      
      return {
        success: true,
        message: 'Backup restored successfully',
        backupId: backupId,
        targetPath: targetPath
      };

    } catch (error) {
      console.error(`❌ Backup restore failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista backups disponíveis
   */
  listBackups(type = null, limit = 50) {
    let backups = this.backupCatalog;
    
    if (type) {
      backups = backups.filter(b => b.type === type);
    }
    
    return backups
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit)
      .map(backup => ({
        id: backup.id,
        type: backup.type,
        status: backup.status,
        startTime: backup.startTime,
        endTime: backup.endTime,
        size: backup.size,
        sources: backup.sources,
        storage: backup.storage ? Object.keys(backup.storage) : []
      }));
  }

  /**
   * Verifica integridade dos backups
   */
  async verifyBackups() {
    const results = {
      total: this.backupCatalog.length,
      verified: 0,
      failed: 0,
      errors: []
    };

    console.log('🔍 Verifying backup integrity...');

    for (const backup of this.backupCatalog) {
      if (backup.status !== 'completed') continue;

      try {
        // Verify checksum
        const backupPath = await this.downloadFromStorage(backup.id);
        const currentChecksum = await this.calculateChecksum(backupPath);
        
        if (currentChecksum !== backup.checksum) {
          throw new Error('Checksum mismatch');
        }

        results.verified++;
        console.log(`✅ Backup verified: ${backup.id}`);

      } catch (error) {
        results.failed++;
        results.errors.push({
          backupId: backup.id,
          error: error.message
        });
        console.log(`❌ Backup verification failed: ${backup.id} - ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Obtém métricas de backup
   */
  getBackupMetrics() {
    const completedBackups = this.backupCatalog.filter(b => b.status === 'completed');
    const failedBackups = this.backupCatalog.filter(b => b.status === 'failed');
    
    const totalSize = completedBackups.reduce((sum, b) => sum + (b.size || 0), 0);
    const avgBackupTime = completedBackups.length > 0 
      ? completedBackups.reduce((sum, b) => {
          const duration = new Date(b.endTime) - new Date(b.startTime);
          return sum + duration;
        }, 0) / completedBackups.length
      : 0;

    return {
      totalBackups: this.backupCatalog.length,
      completedBackups: completedBackups.length,
      failedBackups: failedBackups.length,
      successRate: completedBackups.length > 0 
        ? (completedBackups.length / this.backupCatalog.length) * 100 
        : 0,
      totalSize: totalSize,
      averageBackupTime: Math.round(avgBackupTime / 1000), // seconds
      lastBackup: completedBackups.length > 0 
        ? completedBackups[completedBackups.length - 1].startTime 
        : null,
      currentBackup: this.currentBackup,
      storageUsage: this.getStorageUsage()
    };
  }

  /**
   * Cria arquivo de backup
   */
  async createBackupArchive(backupPath, sources, changedFiles = null) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('tar', { gzip: false });

      output.on('close', () => resolve());
      archive.on('error', reject);

      archive.pipe(output);

      for (const source of sources) {
        if (!fs.existsSync(source.path)) {
          console.warn(`Source path not found: ${source.path}`);
          continue;
        }

        const filesToAdd = changedFiles 
          ? changedFiles.filter(file => file.startsWith(source.path))
          : null;

        if (filesToAdd && filesToAdd.length > 0) {
          // Add only changed files
          for (const file of filesToAdd) {
            const relativePath = path.relative(source.path, file);
            archive.file(file, { name: path.join(source.name, relativePath) });
          }
        } else {
          // Add entire source
          archive.directory(source.path, source.name, {
            exclude: source.exclude || []
          });
        }
      }

      archive.finalize();
    });
  }

  /**
   * Comprime backup
   */
  async compressBackup(filePath) {
    const compressedPath = `${filePath}.gz`;
    
    return new Promise((resolve, reject) => {
      const gzip = spawn('gzip', ['-c', filePath]);
      const output = fs.createWriteStream(compressedPath);
      
      gzip.stdout.pipe(output);
      
      gzip.on('close', (code) => {
        if (code === 0) {
          fs.remove(filePath).then(() => resolve(compressedPath));
        } else {
          reject(new Error('Gzip compression failed'));
        }
      });
    });
  }

  /**
   * Criptografa backup
   */
  async encryptBackup(filePath) {
    const encryptedPath = `${filePath}.enc`;
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(encryptedPath);
    
    const cipher = crypto.createCipher(this.config.encryption.algorithm, this.config.encryption.key);
    
    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output);
      
      output.on('finish', () => {
        fs.remove(filePath).then(() => resolve(encryptedPath));
      });
      
      cipher.on('error', reject);
    });
  }

  /**
   * Descriptografa backup
   */
  async decryptBackup(filePath) {
    const decryptedPath = filePath.replace('.enc', '');
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(decryptedPath);
    
    const decipher = crypto.createDecipher(this.config.encryption.algorithm, this.config.encryption.key);
    
    return new Promise((resolve, reject) => {
      input.pipe(decipher).pipe(output);
      
      output.on('finish', () => {
        resolve(decryptedPath);
      });
      
      decipher.on('error', reject);
    });
  }

  /**
   * Extrai backup
   */
  async extractBackup(backupPath, targetPath) {
    await fs.ensureDir(targetPath);
    
    return tar.extract({
      file: backupPath,
      cwd: targetPath
    });
  }

  /**
   * Encontra arquivos alterados desde timestamp
   */
  async findChangedFiles(since) {
    const changedFiles = [];
    const sinceTime = new Date(since).getTime() / 1000;

    for (const source of this.config.sources) {
      if (!fs.existsSync(source.path)) continue;

      const files = await this.getAllFiles(source.path, source.exclude || []);
      
      for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.mtime.getTime() / 1000 > sinceTime) {
          changedFiles.push(file);
        }
      }
    }

    return [...new Set(changedFiles)]; // Remove duplicates
  }

  /**
   * Obtém todos os arquivos recursivamente
   */
  async getAllFiles(dirPath, exclude = []) {
    const files = [];
    
    async function traverse(currentPath) {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          if (!exclude.includes(item)) {
            await traverse(fullPath);
          }
        } else {
          files.push(fullPath);
        }
      }
    }
    
    await traverse(dirPath);
    return files;
  }

  /**
   * Faz upload para storage backends
   */
  async uploadToStorage(filePath, backupId) {
    const results = {};

    // Local storage (just move file to final location)
    if (this.config.storage.local.enabled) {
      const finalPath = path.join(this.config.storage.local.path, path.basename(filePath));
      await fs.move(filePath, finalPath);
      results.local = finalPath;
    }

    // S3 storage
    if (this.config.storage.s3.enabled && this.s3) {
      try {
        const fileStream = fs.createReadStream(filePath);
        const uploadParams = {
          Bucket: this.config.storage.s3.bucket,
          Key: `backups/${backupId}`,
          Body: fileStream,
          ServerSideEncryption: 'AES256'
        };

        const uploadResult = await this.s3.upload(uploadParams).promise();
        results.s3 = uploadResult.Location;
        
        // Clean up local file if S3 upload successful
        if (this.config.storage.local.enabled) {
          await fs.remove(filePath);
        }
      } catch (error) {
        console.error('S3 upload failed:', error.message);
      }
    }

    return results;
  }

  /**
   * Baixa backup do storage
   */
  async downloadFromStorage(backupId) {
    const downloadPath = path.join(this.config.backupDir, `${backupId}.temp`);

    // Try S3 first
    if (this.config.storage.s3.enabled && this.s3) {
      try {
        const getObjectParams = {
          Bucket: this.config.storage.s3.bucket,
          Key: `backups/${backupId}`
        };

        const fileStream = fs.createWriteStream(downloadPath);
        const s3Stream = this.s3.getObject(getObjectParams).createReadStream();
        
        await new Promise((resolve, reject) => {
          s3Stream.pipe(fileStream);
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
          s3Stream.on('error', reject);
        });

        return downloadPath;
      } catch (error) {
        console.warn('S3 download failed, trying local storage');
      }
    }

    // Fallback to local storage
    if (this.config.storage.local.enabled) {
      const localPath = path.join(this.config.storage.local.path, `${backupId}.tar.gz`);
      if (await fs.pathExists(localPath)) {
        await fs.copy(localPath, downloadPath);
        return downloadPath;
      }
    }

    throw new Error(`Backup ${backupId} not found in any storage backend`);
  }

  /**
   * Limpa backups antigos
   */
  async cleanupOldBackups(type) {
    const retentionDays = type === 'full' 
      ? this.config.retention.full 
      : this.config.retention.incremental;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = this.backupCatalog.filter(b => 
      b.type === type && 
      b.status === 'completed' && 
      new Date(b.endTime) < cutoffDate
    );

    for (const backup of oldBackups) {
      try {
        // Remove from S3
        if (this.config.storage.s3.enabled && this.s3 && backup.storage?.s3) {
          await this.s3.deleteObject({
            Bucket: this.config.storage.s3.bucket,
            Key: `backups/${backup.id}`
          }).promise();
        }

        // Remove from local storage
        if (this.config.storage.local.enabled) {
          const localPath = path.join(this.config.storage.local.path, `${backup.id}.tar.gz`);
          await fs.remove(localPath);
        }

        // Remove from catalog
        const index = this.backupCatalog.findIndex(b => b.id === backup.id);
        if (index > -1) {
          this.backupCatalog.splice(index, 1);
        }

        console.log(`🗑️ Cleaned up old backup: ${backup.id}`);
      } catch (error) {
        console.error(`Failed to cleanup backup ${backup.id}:`, error.message);
      }
    }

    await this.saveBackupCatalog();
  }

  /**
   * Valida fontes de backup
   */
  async validateBackupSources() {
    const errors = [];

    for (const source of this.config.sources) {
      if (!await fs.pathExists(source.path)) {
        errors.push(`Source path does not exist: ${source.path}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Calcula checksum de arquivo
   */
  async calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Obtém uso de storage
   */
  getStorageUsage() {
    const usage = {};

    if (this.config.storage.local.enabled) {
      try {
        const stats = fs.statSync(this.config.storage.local.path);
        usage.local = {
          path: this.config.storage.local.path,
          available: true
        };
      } catch (error) {
        usage.local = {
          path: this.config.storage.local.path,
          available: false,
          error: error.message
        };
      }
    }

    return usage;
  }

  /**
   * Gera ID de backup
   */
  generateBackupId(type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}-backup-${timestamp}`;
  }

  /**
   * Gera chave de criptografia
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Carrega catálogo de backups
   */
  async loadBackupCatalog() {
    const catalogPath = path.join(this.config.backupDir, 'backup-catalog.json');
    
    try {
      if (await fs.pathExists(catalogPath)) {
        const catalog = await fs.readJson(catalogPath);
        this.backupCatalog = catalog || [];
      }
    } catch (error) {
      console.warn('Failed to load backup catalog, starting fresh');
      this.backupCatalog = [];
    }
  }

  /**
   * Salva catálogo de backups
   */
  async saveBackupCatalog() {
    const catalogPath = path.join(this.config.backupDir, 'backup-catalog.json');
    await fs.writeJson(catalogPath, this.backupCatalog, { spaces: 2 });
  }

  /**
   * Inicia agendamento
   */
  startScheduling() {
    // Simple scheduling implementation
    // In production, you would use a proper cron library
    console.log('📅 Backup scheduling enabled');
    
    // Check every minute if scheduled backups should run
    this.scheduleTimer = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday
      
      // Full backup on Sunday at 2 AM
      if (day === 0 && hour === 2 && now.getMinutes() === 0) {
        await this.createFullBackup();
      }
      
      // Incremental backup Monday-Saturday at 3 AM
      if (day >= 1 && day <= 6 && hour === 3 && now.getMinutes() === 0) {
        await this.createIncrementalBackup();
      }
    }, 60000); // Check every minute
  }
}

module.exports = BackupManager;
