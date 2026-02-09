#!/usr/bin/env node

/**
 * Nanobot Backup Manager S3
 * Agente especializado em backup incremental com deduplicação e storage S3
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const AWS = require('aws-sdk');

class BackupManagerS3 extends Nanobot {
  constructor() {
    super({
      name: 'backup-manager-s3',
      version: '2.0.0',
      network: 'trust-network-ai-agent',
      description: 'Nanobot especializado em backup incremental com deduplicação e storage S3'
    });
    
    // Registra capacidades
    this.addCapability('incremental-backup');
    this.addCapability('deduplication');
    this.addCapability('s3-storage');
    this.addCapability('block-level-backup');
    
    // Configurações de backup S3
    this.backupConfig = {
      // Configuração S3 (Contabo)
      s3: {
        endpoint: 'https://eu2.contabostorage.com',  // Endpoint Contabo
        accessKeyId: process.env.CONTABO_ACCESS_KEY || '',
        secretAccessKey: process.env.CONTABO_SECRET_KEY || '',
        region: 'eu-central-1',
        bucket: 'ai-agent-backups'
      },
      
      // Configurações de backup
      schedules: {
        daily: '0 2 * * *',      // 2 AM diário
        weekly: '0 3 * * 0',     // 3 AM domingo
        monthly: '0 4 1 * *'     // 4 AM primeiro dia do mês
      },
      
      // Configurações de deduplicação
      deduplication: {
        enabled: true,
        blockSize: 4096,         // 4KB blocks
        algorithm: 'sha256',
        compressionLevel: 6
      },
      
      // Configurações de retenção
      retention: {
        daily: 7,      // Manter 7 dias
        weekly: 4,     // Manter 4 semanas
        monthly: 12    // Manter 12 meses
      },
      
      // Configurações de otimização
      optimization: {
        parallelUploads: 4,
        multipartThreshold: 100 * 1024 * 1024,  // 100MB
        maxRetries: 3
      }
    };
    
    this.backupHistory = [];
    this.blockIndex = new Map(); // Índice de blocos para deduplicação
    this.s3Client = null;
  }
  
  async initialize() {
    await super.initialize();
    await this.register('trust-network-ai-agent');
    await this.initializeS3();
    await this.loadBackupKnowledge();
    await this.loadBlockIndex();
    
    this.log('Backup Manager S3 inicializado na rede de confiança');
    this.log(`Storage S3: ${this.backupConfig.s3.bucket}`);
  }
  
  async initializeS3() {
    try {
      this.s3Client = new AWS.S3({
        endpoint: this.backupConfig.s3.endpoint,
        accessKeyId: this.backupConfig.s3.accessKeyId,
        secretAccessKey: this.backupConfig.s3.secretAccessKey,
        region: this.backupConfig.s3.region,
        s3ForcePathStyle: true,
        signatureVersion: 'v4'
      });
      
      // Testa conexão
      await this.s3Client.headBucket({ Bucket: this.backupConfig.s3.bucket }).promise();
      this.log('Conexão S3 estabelecida com sucesso');
      
    } catch (error) {
      if (error.code === 'NoSuchBucket') {
        // Cria bucket se não existir
        await this.s3Client.createBucket({ 
          Bucket: this.backupConfig.s3.bucket 
        }).promise();
        this.log(`Bucket S3 criado: ${this.backupConfig.s3.bucket}`);
      } else {
        this.error('Erro ao inicializar S3:', error);
        throw error;
      }
    }
  }
  
  async loadBackupKnowledge() {
    // Carrega conhecimento de backup compartilhado
    const backupPolicies = await this.getKnowledge('backup-policies-s3') || {
      criticalPaths: [
        '/etc',
        '/home',
        '/var/www',
        '/opt',
        '/root/.ssh',
        '/usr/local/bin',
        '/var/lib',
        '/var/log'
      ],
      excludePatterns: [
        '*.tmp',
        '*.log',
        '*.cache',
        'node_modules',
        '.git',
        '__pycache__',
        '*.pid',
        '*.lock',
        '/var/cache',
        '/tmp/*'
      ],
      priorityFiles: [
        '/etc/passwd',
        '/etc/shadow',
        '/etc/ssh/sshd_config',
        '/etc/fstab',
        '/etc/hosts'
      ],
      maxFileSize: 100 * 1024 * 1024  // 100MB por arquivo
    };
    
    this.backupPolicies = backupPolicies;
    await this.shareKnowledge('backup-policies-s3', backupPolicies);
  }
  
  async loadBlockIndex() {
    try {
      // Carrega índice de blocos do S3
      const response = await this.s3Client.getObject({
        Bucket: this.backupConfig.s3.bucket,
        Key: 'block-index.json'
      }).promise();
      
      this.blockIndex = new Map(JSON.parse(response.Body.toString()));
      this.log(`Índice de blocos carregado: ${this.blockIndex.size} blocos`);
      
    } catch (error) {
      if (error.code !== 'NoSuchKey') {
        this.warn('Erro ao carregar índice de blocos:', error.message);
      }
      this.log('Iniciando com índice de blocos vazio');
    }
  }
  
  async saveBlockIndex() {
    try {
      const indexData = JSON.stringify(Array.from(this.blockIndex.entries()));
      
      await this.s3Client.putObject({
        Bucket: this.backupConfig.s3.bucket,
        Key: 'block-index.json',
        Body: indexData,
        ContentType: 'application/json'
      }).promise();
      
      this.log(`Índice de blocos salvo: ${this.blockIndex.size} blocos`);
      
    } catch (error) {
      this.error('Erro ao salvar índice de blocos:', error);
    }
  }
  
  async createBackup(type = 'daily', options = {}) {
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    
    this.log(`Iniciando backup incremental S3: ${backupId}`);
    
    const backup = {
      id: backupId,
      type: type,
      timestamp: timestamp,
      status: 'running',
      config: { ...this.backupConfig, ...options },
      files: {
        total: 0,
        new: 0,
        changed: 0,
        unchanged: 0,
        skipped: 0
      },
      blocks: {
        total: 0,
        new: 0,
        deduplicated: 0
      },
      size: {
        raw: 0,
        compressed: 0,
        deduplicated: 0,
        uploaded: 0
      },
      duration: 0
    };
    
    try {
      const startTime = Date.now();
      
      // Prepara lista de arquivos
      const fileList = await this.prepareFileList(type);
      backup.files.total = fileList.length;
      
      // Processa arquivos com deduplicação
      const backupData = await this.processFilesWithDeduplication(fileList, backup);
      
      // Salva metadados do backup
      await this.saveBackupMetadata(backupId, backup, backupData);
      
      // Limpa backups antigos
      await this.cleanupOldBackups(type);
      
      // Salva índice de blocos atualizado
      await this.saveBlockIndex();
      
      backup.status = 'completed';
      backup.duration = Date.now() - startTime;
      
      // Adiciona ao histórico
      this.backupHistory.push(backup);
      
      // Compartilha informações do backup
      await this.shareKnowledge('backup-completed-s3', backup);
      
      this.log(`Backup S3 ${backupId} concluído:`);
      this.log(`  - Arquivos: ${backup.files.new} novos, ${backup.files.changed} alterados`);
      this.log(`  - Blocos: ${backup.blocks.new} novos, ${backup.blocks.deduplicated} deduplicados`);
      this.log(`  - Economia: ${((1 - backup.size.deduplicated / backup.size.raw) * 100).toFixed(1)}%`);
      
      return backup;
      
    } catch (error) {
      backup.status = 'failed';
      backup.error = error.message;
      
      this.error(`Backup S3 ${backupId} falhou:`, error);
      await this.shareKnowledge('backup-failed-s3', backup);
      
      throw error;
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
          
          try {
            const stats = fs.statSync(file);
            
            // Verifica tamanho máximo
            if (stats.size > this.backupPolicies.maxFileSize) {
              this.warn(`Arquivo muito grande, pulando: ${file}`);
              continue;
            }
            
            fileList.push({
              path: file,
              relative: path.relative('/', file),
              size: stats.size,
              modified: stats.mtime,
              checksum: this.calculateFileChecksum(file)
            });
          } catch (statError) {
            // Arquivo pode ter sido deletado
            continue;
          }
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
  
  calculateFileChecksum(filePath) {
    try {
      const hash = crypto.createHash('sha256');
      const data = fs.readFileSync(filePath);
      hash.update(data);
      return hash.digest('hex');
    } catch (error) {
      return null;
    }
  }
  
  async processFilesWithDeduplication(fileList, backup) {
    const backupData = {
      files: [],
      blocks: new Map()
    };
    
    for (const file of fileList) {
      try {
        const fileData = await this.processFile(file, backupData, backup);
        backupData.files.push(fileData);
        
        // Atualiza contadores
        if (fileData.status === 'new') {
          backup.files.new++;
        } else if (fileData.status === 'changed') {
          backup.files.changed++;
        } else {
          backup.files.unchanged++;
        }
        
        backup.size.raw += file.size;
        
      } catch (error) {
        this.warn(`Erro ao processar arquivo ${file.path}:`, error.message);
        backup.files.skipped++;
      }
    }
    
    return backupData;
  }
  
  async processFile(file, backupData, backup) {
    const fileChecksum = file.checksum;
    
    // Verifica se arquivo já existe no backup
    const existingFile = await this.findFileInHistory(file.relative, fileChecksum);
    
    if (existingFile) {
      return {
        path: file.relative,
        status: 'unchanged',
        checksum: fileChecksum,
        blocks: existingFile.blocks
      };
    }
    
    // Processa arquivo em blocos
    const blocks = await this.processFileBlocks(file, backupData, backup);
    
    return {
      path: file.relative,
      status: existingFile ? 'changed' : 'new',
      checksum: fileChecksum,
      size: file.size,
      modified: file.modified,
      blocks: blocks
    };
  }
  
  async processFileBlocks(file, backupData, backup) {
    const blocks = [];
    const blockSize = this.backupConfig.deduplication.blockSize;
    
    try {
      const fileData = fs.readFileSync(file.path);
      
      for (let offset = 0; offset < fileData.length; offset += blockSize) {
        const blockData = fileData.slice(offset, Math.min(offset + blockSize, fileData.length));
        const blockChecksum = crypto.createHash('sha256').update(blockData).digest('hex');
        
        let blockId;
        
        // Verifica se bloco já existe (deduplicação)
        if (this.blockIndex.has(blockChecksum)) {
          blockId = this.blockIndex.get(blockChecksum);
          backup.blocks.deduplicated++;
        } else {
          // Novo bloco - comprime e faz upload
          const compressed = zlib.gzipSync(blockData, { 
            level: this.backupConfig.deduplication.compressionLevel 
          });
          
          blockId = `block-${blockChecksum}`;
          
          await this.uploadBlock(blockId, compressed);
          
          this.blockIndex.set(blockChecksum, blockId);
          backup.blocks.new++;
        }
        
        blocks.push({
          checksum: blockChecksum,
          id: blockId,
          offset: offset,
          size: blockData.length
        });
        
        backup.blocks.total++;
      }
      
      return blocks;
      
    } catch (error) {
      this.error(`Erro ao processar blocos do arquivo ${file.path}:`, error);
      throw error;
    }
  }
  
  async uploadBlock(blockId, data) {
    const key = `blocks/${blockId}`;
    
    try {
      await this.s3Client.upload({
        Bucket: this.backupConfig.s3.bucket,
        Key: key,
        Body: data,
        ContentType: 'application/octet-stream',
        StorageClass: 'STANDARD_IA'  // Infrequent Access para economizar
      }).promise();
      
    } catch (error) {
      this.error(`Erro ao fazer upload do bloco ${blockId}:`, error);
      throw error;
    }
  }
  
  async saveBackupMetadata(backupId, backup, backupData) {
    const metadata = {
      id: backupId,
      type: backup.type,
      timestamp: backup.timestamp,
      config: backup.config,
      files: backup.files,
      blocks: backup.blocks,
      size: backup.size,
      fileData: backupData.files.map(f => ({
        path: f.path,
        status: f.status,
        checksum: f.checksum,
        size: f.size,
        modified: f.modified,
        blocks: f.blocks
      }))
    };
    
    const key = `backups/${backup.type}/${backupId}.json`;
    
    try {
      await this.s3Client.putObject({
        Bucket: this.backupConfig.s3.bucket,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        StorageClass: 'STANDARD_IA'
      }).promise();
      
      this.log(`Metadados do backup salvos: ${key}`);
      
    } catch (error) {
      this.error('Erro ao salvar metadados do backup:', error);
      throw error;
    }
  }
  
  async findFileInHistory(relativePath, checksum) {
    // Busca arquivo no histórico de backups
    for (const backup of this.backupHistory.reverse()) {
      // Aqui poderíamos buscar metadados do S3
      // Por simplicidade, retornamos null
    }
    return null;
  }
  
  async cleanupOldBackups(type) {
    const retentionDays = this.backupConfig.retention[type];
    if (!retentionDays) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    try {
      // Lista backups no S3
      const response = await this.s3Client.listObjectsV2({
        Bucket: this.backupConfig.s3.bucket,
        Prefix: `backups/${type}/`
      }).promise();
      
      for (const object of response.Contents || []) {
        if (object.LastModified < cutoffDate) {
          await this.s3Client.deleteObject({
            Bucket: this.backupConfig.s3.bucket,
            Key: object.Key
          }).promise();
          
          this.log(`Backup antigo removido: ${object.Key}`);
        }
      }
      
    } catch (error) {
      this.error('Erro na limpeza de backups antigos:', error);
    }
  }
  
  async getStorageStats() {
    try {
      const response = await this.s3Client.listObjectsV2({
        Bucket: this.backupConfig.s3.bucket
      }).promise();
      
      let totalSize = 0;
      let blockCount = 0;
      let backupCount = 0;
      
      for (const object of response.Contents || []) {
        totalSize += object.Size;
        
        if (object.Key.startsWith('blocks/')) {
          blockCount++;
        } else if (object.Key.startsWith('backups/')) {
          backupCount++;
        }
      }
      
      return {
        totalSize: totalSize,
        totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
        blockCount: blockCount,
        backupCount: backupCount,
        deduplicationRatio: this.blockIndex.size > 0 ? 
          ((blockCount / this.blockIndex.size) * 100).toFixed(1) : 0
      };
      
    } catch (error) {
      this.error('Erro ao obter estatísticas de storage:', error);
      return {};
    }
  }
  
  async restoreBackup(backupId, targetPath = '/tmp/restore-s3') {
    this.log(`Iniciando restore do backup S3: ${backupId}`);
    
    try {
      // Baixa metadados do backup
      const key = `backups/daily/${backupId}.json`;
      const response = await this.s3Client.getObject({
        Bucket: this.backupConfig.s3.bucket,
        Key: key
      }).promise();
      
      const backupMetadata = JSON.parse(response.Body.toString());
      
      // Cria diretório de restore
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      // Restaura arquivos
      for (const file of backupMetadata.fileData) {
        await this.restoreFile(file, targetPath);
      }
      
      this.log(`Restore concluído em: ${targetPath}`);
      
      return {
        backupId: backupId,
        targetPath: targetPath,
        filesRestored: backupMetadata.fileData.length,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
    } catch (error) {
      this.error('Erro no restore:', error);
      throw error;
    }
  }
  
  async restoreFile(fileData, targetPath) {
    const filePath = path.join(targetPath, fileData.path);
    const dirPath = path.dirname(filePath);
    
    // Cria diretório
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Baixa e monta blocos do arquivo
    const blocks = [];
    
    for (const block of fileData.blocks) {
      const blockKey = `blocks/${block.id}`;
      const response = await this.s3Client.getObject({
        Bucket: this.backupConfig.s3.bucket,
        Key: blockKey
      }).promise();
      
      const decompressed = zlib.gunzipSync(response.Body);
      blocks.push({
        data: decompressed,
        offset: block.offset
      });
    }
    
    // Monta arquivo
    blocks.sort((a, b) => a.offset - b.offset);
    const fileData = Buffer.concat(blocks.map(b => b.data));
    
    fs.writeFileSync(filePath, fileData);
  }
  
  async run(options = {}) {
    this.log('Iniciando gerenciamento de backup S3...');
    
    const type = options.type || 'daily';
    const backup = await this.createBackup(type, options);
    
    const storageStats = await this.getStorageStats();
    
    return {
      backup: backup,
      storage: storageStats,
      timestamp: new Date().toISOString()
    };
  }
  
  // Métodos auxiliares
  generateBackupId() {
    return `bkp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  async getLastBackup(type) {
    try {
      const response = await this.s3Client.listObjectsV2({
        Bucket: this.backupConfig.s3.bucket,
        Prefix: `backups/${type}/`,
        MaxKeys: 1
      }).promise();
      
      if (response.Contents && response.Contents.length > 0) {
        const latestObject = response.Contents[0];
        const backupId = path.basename(latestObject.Key, '.json');
        
        return {
          id: backupId,
          timestamp: latestObject.LastModified.toISOString()
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

// CLI interface
if (require.main === module) {
  const bot = new BackupManagerS3();
  
  bot.initialize().then(() => {
    const args = process.argv.slice(2);
    
    if (args.includes('--stats')) {
      return bot.getStorageStats();
    } else if (args.includes('--restore')) {
      const backupId = args[args.indexOf('--restore') + 1];
      return bot.restoreBackup(backupId);
    } else {
      const type = args.find(arg => ['daily', 'weekly', 'monthly', 'incremental'].includes(arg)) || 'daily';
      return bot.run({ type: type });
    }
  }).then(result => {
    console.log('\n=== BACKUP MANAGER S3 REPORT ===');
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = BackupManagerS3;
