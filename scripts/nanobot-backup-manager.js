#!/usr/bin/env node

/**
 * Nanobot Backup Manager
 * Agente especializado em gerenciamento de backups e recuperação
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BackupManagerBot extends Nanobot {
  constructor() {
    super({
      name: 'backup-manager',
      version: '1.0.0',
      network: 'trust-network-ai-agent',
      description: 'Nanobot especializado em gerenciamento de backups e recuperação de dados'
    });
    
    // Registra capacidades
    this.addCapability('backup-creation');
    this.addCapability('backup-verification');
    this.addCapability('incremental-backup');
    this.addCapability('disaster-recovery');
    
    // Configurações de backup
    this.backupConfig = {
      schedules: {
        daily: '0 2 * * *',      // 2 AM diário
        weekly: '0 3 * * 0',     // 3 AM domingo
        monthly: '0 4 1 * *'     // 4 AM primeiro dia do mês
      },
      retention: {
        daily: 7,      // Manter 7 dias
        weekly: 4,     // Manter 4 semanas
        monthly: 12    // Manter 12 meses
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6
      },
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm'
      },
      storage: {
        local: '/var/backups/nanobot',
        remote: null  // Configurar se necessário
      }
    };
    
    this.backupHistory = [];
    this.activeBackups = new Map();
  }
  
  async initialize() {
    await super.initialize();
    await this.register('trust-network-ai-agent');
    await this.loadBackupKnowledge();
    await this.ensureBackupDirectories();
    
    this.log('Backup Manager Bot inicializado na rede de confiança');
  }
  
  async loadBackupKnowledge() {
    // Carrega conhecimento de backup compartilhado
    const backupPolicies = await this.getKnowledge('backup-policies') || {
      criticalPaths: [
        '/etc',
        '/home',
        '/var/www',
        '/opt',
        '/root/.ssh',
        '/usr/local/bin'
      ],
      excludePatterns: [
        '*.tmp',
        '*.log',
        '*.cache',
        'node_modules',
        '.git',
        '__pycache__'
      ],
      priorityFiles: [
        '/etc/passwd',
        '/etc/shadow',
        '/etc/ssh/sshd_config',
        '/etc/fstab',
        '/etc/hosts'
      ]
    };
    
    this.backupPolicies = backupPolicies;
    await this.shareKnowledge('backup-policies', backupPolicies);
  }
  
  async ensureBackupDirectories() {
    const dirs = [
      this.backupConfig.storage.local,
      `${this.backupConfig.storage.local}/daily`,
      `${this.backupConfig.storage.local}/weekly`,
      `${this.backupConfig.storage.local}/monthly`,
      `${this.backupConfig.storage.local}/incremental`
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`Diretório criado: ${dir}`);
      }
    }
  }
  
  async createBackup(type = 'daily', options = {}) {
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    
    this.log(`Iniciando backup ${type}: ${backupId}`);
    
    const backup = {
      id: backupId,
      type: type,
      timestamp: timestamp,
      status: 'running',
      config: { ...this.backupConfig, ...options },
      files: {
        total: 0,
        backedUp: 0,
        failed: 0,
        skipped: 0
      },
      size: {
        raw: 0,
        compressed: 0,
        encrypted: 0
      },
      checksum: null,
      duration: 0
    };
    
    this.activeBackups.set(backupId, backup);
    
    try {
      const startTime = Date.now();
      
      // Prepara lista de arquivos
      const fileList = await this.prepareFileList(type);
      backup.files.total = fileList.length;
      
      // Cria arquivo de backup
      const backupPath = await this.performBackup(backupId, fileList, backup);
      
      // Verifica integridade
      const verified = await this.verifyBackup(backupPath, backup);
      
      // Limpa backups antigos
      await this.cleanupOldBackups(type);
      
      backup.status = verified ? 'completed' : 'completed_with_errors';
      backup.duration = Date.now() - startTime;
      backup.path = backupPath;
      
      // Adiciona ao histórico
      this.backupHistory.push(backup);
      
      // Compartilha informações do backup
      await this.shareKnowledge('backup-completed', backup);
      
      this.log(`Backup ${backupId} concluído em ${backup.duration}ms`);
      
      return backup;
      
    } catch (error) {
      backup.status = 'failed';
      backup.error = error.message;
      
      this.error(`Backup ${backupId} falhou:`, error);
      await this.shareKnowledge('backup-failed', backup);
      
      throw error;
    } finally {
      this.activeBackups.delete(backupId);
    }
  }
  
  async prepareFileList(type) {
    const fileList = [];
    
    for (const basePath of this.backupPolicies.criticalPaths) {
      if (!fs.existsSync(basePath)) continue;
      
      try {
        const files = execSync(`find "${basePath}" -type f`, { encoding: 'utf8' });
        const fileArray = files.trim().split('\n').filter(f => f);
        
        for (const file of fileArray) {
          // Verifica padrões de exclusão
          if (this.shouldExcludeFile(file)) continue;
          
          fileList.push({
            path: file,
            relative: path.relative('/', file),
            size: fs.statSync(file).size,
            modified: fs.statSync(file).mtime
          });
        }
      } catch (error) {
        this.warn(`Erro ao listar arquivos em ${basePath}:`, error.message);
      }
    }
    
    // Se for incremental, filtra apenas arquivos modificados
    if (type === 'incremental') {
      const lastBackup = await this.getLastBackup('daily');
      if (lastBackup) {
        const cutoffTime = new Date(lastBackup.timestamp);
        return fileList.filter(f => f.modified > cutoffTime);
      }
    }
    
    return fileList;
  }
  
  shouldExcludeFile(filePath) {
    const fileName = path.basename(filePath);
    const relativePath = path.relative('/', filePath);
    
    for (const pattern of this.backupPolicies.excludePatterns) {
      if (fileName.includes(pattern) || relativePath.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }
  
  async performBackup(backupId, fileList, backup) {
    const backupDir = `${this.backupConfig.storage.local}/${backup.type}`;
    const archivePath = `${backupDir}/backup-${backupId}.tar`;
    
    // Cria arquivo temporário com lista de arquivos
    const listFile = `/tmp/backup-${backupId}.list`;
    const fileContent = fileList.map(f => f.relative).join('\n');
    fs.writeFileSync(listFile, fileContent);
    
    try {
      // Calcula tamanho total
      backup.size.raw = fileList.reduce((sum, f) => sum + f.size, 0);
      
      // Cria tarball
      let tarCmd = `tar -cf "${archivePath}" --files-from="${listFile}" -C /`;
      execSync(tarCmd, { encoding: 'utf8' });
      
      // Comprime se habilitado
      if (this.backupConfig.compression.enabled) {
        const compressedPath = `${archivePath}.${this.backupConfig.compression.algorithm}`;
        execSync(`gzip -${this.backupConfig.compression.level} "${archivePath}"`, { encoding: 'utf8' });
        archivePath = compressedPath;
      }
      
      // Obtém tamanho comprimido
      const stats = fs.statSync(archivePath);
      backup.size.compressed = stats.size;
      
      // Criptografa se habilitado
      if (this.backupConfig.encryption.enabled) {
        const encryptedPath = `${archivePath}.enc`;
        await this.encryptFile(archivePath, encryptedPath);
        fs.unlinkSync(archivePath);
        archivePath = encryptedPath;
      }
      
      // Obtém tamanho final
      const finalStats = fs.statSync(archivePath);
      backup.size.encrypted = finalStats.size;
      
      // Gera checksum
      backup.checksum = this.generateChecksum(archivePath);
      
      // Cria arquivo de metadados
      const metadata = {
        id: backupId,
        type: backup.type,
        timestamp: backup.timestamp,
        config: backup.config,
        files: backup.files,
        size: backup.size,
        checksum: backup.checksum,
        fileList: fileList.map(f => ({
          path: f.relative,
          size: f.size,
          modified: f.modified
        }))
      };
      
      const metadataPath = `${archivePath}.meta`;
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      return archivePath;
      
    } finally {
      // Limpa arquivo temporário
      if (fs.existsSync(listFile)) {
        fs.unlinkSync(listFile);
      }
    }
  }
  
  async encryptFile(inputPath, outputPath) {
    const key = crypto.randomBytes(32); // AES-256
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(this.backupConfig.encryption.algorithm, key);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      output.on('finish', () => {
        // Salva chave e IV separadamente
        fs.writeFileSync(`${outputPath}.key`, key);
        fs.writeFileSync(`${outputPath}.iv`, iv);
        resolve();
      });
      
      input.pipe(cipher).pipe(output);
    });
  }
  
  async verifyBackup(backupPath, backup) {
    try {
      // Verifica checksum
      const currentChecksum = this.generateChecksum(backupPath);
      if (currentChecksum !== backup.checksum) {
        this.error('Checksum do backup não corresponde');
        return false;
      }
      
      // Verifica se o arquivo pode ser lido
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        this.error('Arquivo de backup vazio');
        return false;
      }
      
      // Testa extração de um arquivo aleatório
      const testCmd = `tar -tf "${backupPath}" | head -1`;
      const testFile = execSync(testCmd, { encoding: 'utf8' }).trim();
      
      if (testFile) {
        this.log('Backup verificado com sucesso');
        return true;
      }
      
      return false;
    } catch (error) {
      this.error('Erro na verificação do backup:', error);
      return false;
    }
  }
  
  async restoreBackup(backupId, targetPath = '/tmp/restore') {
    this.log(`Iniciando restore do backup: ${backupId}`);
    
    const backup = this.backupHistory.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} não encontrado`);
    }
    
    if (!backup.path || !fs.existsSync(backup.path)) {
      throw new Error(`Arquivo de backup não encontrado: ${backup.path}`);
    }
    
    try {
      // Cria diretório de restore
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      // Descriptografa se necessário
      let restorePath = backup.path;
      if (backup.path.endsWith('.enc')) {
        restorePath = `${backup.path}.dec`;
        await this.decryptFile(backup.path, restorePath);
      }
      
      // Descomprime se necessário
      if (restorePath.endsWith('.gz')) {
        execSync(`gunzip -c "${restorePath}" | tar -xf - -C "${targetPath}"`, { encoding: 'utf8' });
      } else {
        execSync(`tar -xf "${restorePath}" -C "${targetPath}"`, { encoding: 'utf8' });
      }
      
      // Limpa arquivo temporário
      if (restorePath !== backup.path && fs.existsSync(restorePath)) {
        fs.unlinkSync(restorePath);
      }
      
      this.log(`Restore concluído em: ${targetPath}`);
      
      return {
        backupId: backupId,
        targetPath: targetPath,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
    } catch (error) {
      this.error('Erro no restore:', error);
      throw error;
    }
  }
  
  async decryptFile(inputPath, outputPath) {
    const key = fs.readFileSync(`${inputPath}.key`);
    const iv = fs.readFileSync(`${inputPath}.iv`);
    
    const decipher = crypto.createDecipher(this.backupConfig.encryption.algorithm, key);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      output.on('finish', resolve);
      input.pipe(decipher).pipe(output);
    });
  }
  
  async cleanupOldBackups(type) {
    const retentionDays = this.backupConfig.retention[type];
    if (!retentionDays) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const backupDir = `${this.backupConfig.storage.local}/${type}`;
    
    try {
      const files = fs.readdirSync(backupDir);
      
      for (const file of files) {
        if (!file.startsWith('backup-') || file.endsWith('.meta')) continue;
        
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          // Remove arquivo e metadados
          fs.unlinkSync(filePath);
          const metaPath = `${filePath}.meta`;
          if (fs.existsSync(metaPath)) {
            fs.unlinkSync(metaPath);
          }
          
          // Remove chave e IV se existirem
          const keyPath = `${filePath}.key`;
          const ivPath = `${filePath}.iv`;
          if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
          if (fs.existsSync(ivPath)) fs.unlinkSync(ivPath);
          
          this.log(`Backup antigo removido: ${file}`);
        }
      }
    } catch (error) {
      this.error('Erro na limpeza de backups antigos:', error);
    }
  }
  
  async listBackups(type = null) {
    const backups = type ? 
      this.backupHistory.filter(b => b.type === type) :
      this.backupHistory;
    
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  async getBackupStatus() {
    return {
      active: Array.from(this.activeBackups.values()),
      history: this.backupHistory,
      storage: await this.getStorageInfo()
    };
  }
  
  async getStorageInfo() {
    const storage = {};
    
    for (const type of ['daily', 'weekly', 'monthly', 'incremental']) {
      const dir = `${this.backupConfig.storage.local}/${type}`;
      
      try {
        const files = fs.readdirSync(dir);
        let totalSize = 0;
        
        for (const file of files) {
          if (file.startsWith('backup-')) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        }
        
        storage[type] = {
          count: files.filter(f => f.startsWith('backup-')).length,
          totalSize: totalSize,
          path: dir
        };
      } catch (error) {
        storage[type] = { count: 0, totalSize: 0, path: dir };
      }
    }
    
    return storage;
  }
  
  // Métodos auxiliares
  generateBackupId() {
    return `bkp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateChecksum(filePath) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  }
  
  async getLastBackup(type) {
    const backups = await this.listBackups(type);
    return backups.length > 0 ? backups[0] : null;
  }
  
  async run(options = {}) {
    this.log('Iniciando gerenciamento de backups...');
    
    const type = options.type || 'daily';
    const backup = await this.createBackup(type, options);
    
    const status = await this.getBackupStatus();
    
    return {
      backup: backup,
      status: status,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI interface
if (require.main === module) {
  const bot = new BackupManagerBot();
  
  bot.initialize().then(() => {
    const args = process.argv.slice(2);
    
    if (args.includes('--list')) {
      return bot.listBackups();
    } else if (args.includes('--status')) {
      return bot.getBackupStatus();
    } else if (args.includes('--restore')) {
      const backupId = args[args.indexOf('--restore') + 1];
      return bot.restoreBackup(backupId);
    } else {
      const type = args.find(arg => ['daily', 'weekly', 'monthly', 'incremental'].includes(arg)) || 'daily';
      return bot.run({ type: type });
    }
  }).then(result => {
    console.log('\n=== BACKUP MANAGER REPORT ===');
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = BackupManagerBot;
