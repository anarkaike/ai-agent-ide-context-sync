#!/usr/bin/env node

/**
 * Nanobot Cleanup Automator
 * Agente especializado em limpeza e manutenção automatizada
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CleanupAutomator extends Nanobot {
  constructor() {
    super({
      name: 'cleanup-automator',
      version: '1.0.0',
      network: 'trust-network-ai-agent',
      description: 'Nanobot especializado em limpeza e manutenção automatizada do sistema'
    });

    // Registra capacidades
    this.addCapability('automated-cleanup');
    this.addCapability('disk-optimization');
    this.addCapability('log-management');
    this.addCapability('cache-cleanup');
    this.addCapability('temp-cleanup');

    // Configurações de limpeza
    this.cleanupConfig = {
      schedules: {
        quick: '*/30 * * * *',      // A cada 30 minutos
        daily: '0 3 * * *',         // 3 AM diário
        weekly: '0 4 * * 0',        // 4 AM domingo
        monthly: '0 5 1 * *'        // 5 AM primeiro dia do mês
      },

      // Diretórios de limpeza
      cleanupPaths: {
        temp: [
          '/tmp/*',
          '/var/tmp/*',
          '/tmp/.X*',
          '/tmp/.ICE-unix',
          '/tmp/.Test-unix'
        ],
        cache: [
          '/var/cache/*',
          '/root/.cache/*',
          '/home/*/.cache/*',
          '/var/lib/apt/lists/*'
        ],
        logs: [
          '/var/log/*.log.*',
          '/var/log/*.log.[0-9]*',
          '/var/log/*.log.old',
          '/root/.npm/_logs/*'
        ],
        packages: [
          '/var/cache/apt/archives/*.deb',
          '/root/.npm/_cacache/*'
        ],
        docker: [
          '/var/lib/docker/overlay2/*/diff/tmp/*',
          '/var/lib/docker/overlay2/*/diff/var/tmp/*',
          '/var/lib/docker/volumes/*/_data/tmp/*'
        ]
      },

      // Configurações de retenção
      retention: {
        logs: {
          maxAge: 7,        // Manter logs por 7 dias
          maxSize: '100M'   // Máximo 100MB por log
        },
        cache: {
          maxAge: 1,        // Manter cache por 1 dia
          maxSize: '1G'     // Máximo 1GB de cache
        },
        temp: {
          maxAge: 0.1,      // Manter temp por 2.4 horas
          maxSize: '500M'   // Máximo 500MB de temp
        },
        docker: {
          maxAge: 0.5,      // Manter por 12 horas
          maxSize: '2G'     // Máximo 2GB
        }
      },

      // Limites de segurança
      safety: {
        maxDiskUsage: 90,    // Alertar em 90% de uso
        criticalDiskUsage: 95, // Crítico em 95%
        protectedPaths: [
          '/etc',
          '/boot',
          '/root/.ssh',
          '/home',
          '/usr',
          '/bin',
          '/sbin',
          '/lib'
        ],
        minFreeSpace: '5G'  // Mínimo 5GB livre
      },

      // Configurações de otimização
      optimization: {
        enableAutoDefrag: false,  // Desabilitado para SSDs
        enableAutoCompaction: true,
        enableLogRotation: true,
        enableCacheCleanup: true
      }
    };

    this.cleanupHistory = [];
    this.stats = {
      totalCleaned: 0,
      lastCleanup: null,
      diskSpaceSaved: 0,
      errors: 0
    };
  }

  async initialize() {
    await super.initialize();
    await this.register('trust-network-ai-agent');
    await this.loadCleanupKnowledge();
    await this.validateSafetyConfig();

    this.log('Cleanup Automator inicializado na rede de confiança');
    this.log('Sistema de limpeza automatizada ativado');
  }

  async loadCleanupKnowledge() {
    // Carrega conhecimento de limpeza compartilhado
    const cleanupPolicies = await this.getKnowledge('cleanup-policies') || {
      priorityFiles: [
        '/var/log/auth.log',
        '/var/log/syslog',
        '/var/log/kern.log',
        '/var/log/dmesg'
      ],
      excludePatterns: [
        '*.pid',
        '*.lock',
        '*.socket',
        '/proc/*',
        '/sys/*',
        '/dev/*',
        '/run/*'
      ],
      largeFileThreshold: 100 * 1024 * 1024,  // 100MB
      cleanupBatchSize: 1000  // Arquivos por batch
    };

    this.cleanupPolicies = cleanupPolicies;
    await this.shareKnowledge('cleanup-policies', cleanupPolicies);
  }

  async validateSafetyConfig() {
    // Verifica se diretórios protegidos existem
    for (const protectedPath of this.cleanupConfig.safety.protectedPaths) {
      if (!fs.existsSync(protectedPath)) {
        this.warn(`Diretório protegido não encontrado: ${protectedPath}`);
      }
    }

    // Verifica espaço mínimo
    const diskUsage = await this.getDiskUsage();
    if (diskUsage.free < this.parseSize(this.cleanupConfig.safety.minFreeSpace)) {
      this.warn(`Espaço livre abaixo do mínimo: ${diskUsage.free} < ${this.cleanupConfig.safety.minFreeSpace}`);
    }
  }

  async performCleanup(type = 'quick') {
    const cleanupId = this.generateCleanupId();
    const startTime = Date.now();

    this.log(`Iniciando limpeza automatizada: ${cleanupId} (${type})`);

    const cleanup = {
      id: cleanupId,
      type: type,
      timestamp: new Date().toISOString(),
      status: 'running',
      diskBefore: await this.getDiskUsage(),
      operations: {
        temp: { files: 0, size: 0 },
        cache: { files: 0, size: 0 },
        logs: { files: 0, size: 0 },
        packages: { files: 0, size: 0 },
        docker: { files: 0, size: 0 }
      },
      errors: [],
      warnings: []
    };

    try {
      // Executa operações de limpeza baseadas no tipo
      switch (type) {
        case 'quick':
          await this.performQuickCleanup(cleanup);
          break;
        case 'daily':
          await this.performDailyCleanup(cleanup);
          break;
        case 'weekly':
          await this.performWeeklyCleanup(cleanup);
          break;
        case 'monthly':
          await this.performMonthlyCleanup(cleanup);
          break;
        default:
          throw new Error(`Tipo de limpeza desconhecido: ${type}`);
      }

      // Atualiza estatísticas
      cleanup.diskAfter = await this.getDiskUsage();
      cleanup.diskSaved = cleanup.diskBefore.used - cleanup.diskAfter.used;
      cleanup.duration = Date.now() - startTime;
      cleanup.status = 'completed';

      // Atualiza estatísticas globais
      this.updateGlobalStats(cleanup);

      // Compartilha resultado
      await this.shareKnowledge('cleanup-completed', cleanup);

      this.log(`Limpeza ${cleanupId} concluída:`);
      this.log(`  - Duração: ${cleanup.duration}ms`);
      this.log(`  - Espaço liberado: ${this.formatSize(cleanup.diskSaved)}`);
      this.log(`  - Arquivos removidos: ${this.getTotalFilesRemoved(cleanup)}`);

      // Alerta se espaço crítico
      if (cleanup.diskAfter.usage > this.cleanupConfig.safety.criticalDiskUsage) {
        await this.sendAlert('DISK_CRITICAL', {
          usage: cleanup.diskAfter.usage,
          free: cleanup.diskAfter.free
        });
      }

      return cleanup;

    } catch (error) {
      cleanup.status = 'failed';
      cleanup.error = error.message;
      this.stats.errors++;

      this.error(`Limpeza ${cleanupId} falhou:`, error);
      await this.shareKnowledge('cleanup-failed', cleanup);

      throw error;
    }
  }

  async performQuickCleanup(cleanup) {
    // Limpeza rápida - apenas arquivos temporários recentes
    await this.cleanupTempFiles(cleanup, { maxAge: 0.05 }); // 1.2 horas
    await this.cleanupOldLogs(cleanup, { maxAge: 1 }); // 1 dia
  }

  async performDailyCleanup(cleanup) {
    // Limpeza diária completa
    await this.cleanupTempFiles(cleanup);
    await this.cleanupCacheFiles(cleanup);
    await this.cleanupOldLogs(cleanup);
    await this.cleanupPackageCache(cleanup);

    // Otimizações leves
    if (this.cleanupConfig.optimization.enableLogRotation) {
      await this.rotateLogs(cleanup);
    }
  }

  async performWeeklyCleanup(cleanup) {
    // Limpeza semanal profunda
    await this.performDailyCleanup(cleanup);
    await this.cleanupDockerTemp(cleanup);
    await this.cleanupLargeFiles(cleanup);
    await this.cleanupOrphanedFiles(cleanup);

    // Otimizações semanais
    if (this.cleanupConfig.optimization.enableAutoCompaction) {
      await this.compactDatabases(cleanup);
    }
  }

  async performMonthlyCleanup(cleanup) {
    // Limpeza mensal completa
    await this.performWeeklyCleanup(cleanup);
    await this.cleanupSystemCache(cleanup);
    await this.cleanupOldKernels(cleanup);
    await this.cleanupApplicationCache(cleanup);

    // Manutenção profunda
    await this.performSystemMaintenance(cleanup);
  }

  async cleanupTempFiles(cleanup, options = {}) {
    const maxAge = options.maxAge || this.cleanupConfig.retention.temp.maxAge;
    const maxSize = options.maxSize || this.cleanupConfig.retention.temp.maxSize;

    this.log('Limpando arquivos temporários...');

    for (const tempPath of this.cleanupConfig.cleanupPaths.temp) {
      try {
        const result = await this.cleanupPath(tempPath, {
          maxAge: maxAge,
          maxSize: maxSize,
          pattern: '*'
        });

        cleanup.operations.temp.files += result.files;
        cleanup.operations.temp.size += result.size;

      } catch (error) {
        cleanup.errors.push(`Temp cleanup error: ${error.message}`);
      }
    }
  }

  async cleanupCacheFiles(cleanup) {
    this.log('Limpando arquivos de cache...');

    for (const cachePath of this.cleanupConfig.cleanupPaths.cache) {
      try {
        const result = await this.cleanupPath(cachePath, {
          maxAge: this.cleanupConfig.retention.cache.maxAge,
          maxSize: this.cleanupConfig.retention.cache.maxSize,
          pattern: '*'
        });

        cleanup.operations.cache.files += result.files;
        cleanup.operations.cache.size += result.size;

      } catch (error) {
        cleanup.errors.push(`Cache cleanup error: ${error.message}`);
      }
    }
  }

  async cleanupOldLogs(cleanup, options = {}) {
    const maxAge = options.maxAge || this.cleanupConfig.retention.logs.maxAge;
    const maxSize = options.maxSize || this.cleanupConfig.retention.logs.maxSize;

    this.log('Limpando logs antigos...');

    for (const logPath of this.cleanupConfig.cleanupPaths.logs) {
      try {
        // Protege logs prioritários
        if (this.cleanupPolicies.priorityFiles.includes(logPath.replace(/\*$/, ''))) {
          continue;
        }

        const result = await this.cleanupPath(logPath, {
          maxAge: maxAge,
          maxSize: maxSize,
          pattern: logPath.includes('*') ? '' : '*'
        });

        cleanup.operations.logs.files += result.files;
        cleanup.operations.logs.size += result.size;

      } catch (error) {
        cleanup.errors.push(`Log cleanup error: ${error.message}`);
      }
    }
  }

  async cleanupPackageCache(cleanup) {
    this.log('Limpando cache de pacotes...');

    // Limpa cache APT
    try {
      execSync('apt-get clean', { encoding: 'utf8' });
      cleanup.operations.packages.files += 1;
    } catch (error) {
      cleanup.errors.push(`APT cleanup error: ${error.message}`);
    }

    // Limpa cache NPM
    try {
      execSync('npm cache clean --force 2>/dev/null || true', { encoding: 'utf8' });
      cleanup.operations.packages.files += 1;
    } catch (error) {
      // Ignora erro se npm não estiver disponível
    }
  }

  async cleanupDockerTemp(cleanup) {
    this.log('Limpando arquivos temporários do Docker...');

    try {
      // Limpa containers parados
      const stoppedContainers = execSync('docker ps -aq --filter "status=exited"', { encoding: 'utf8' }).trim();
      if (stoppedContainers) {
        execSync(`docker rm ${stoppedContainers}`, { encoding: 'utf8' });
        cleanup.operations.docker.files += stoppedContainers.split('\n').length;
      }

      // Limpa imagens órfãs
      execSync('docker image prune -f', { encoding: 'utf8' });
      cleanup.operations.docker.files += 1;

      // Limpa volumes órfãos
      execSync('docker volume prune -f', { encoding: 'utf8' });
      cleanup.operations.docker.files += 1;

      // Limpa build cache
      execSync('docker builder prune -f', { encoding: 'utf8' });
      cleanup.operations.docker.files += 1;

    } catch (error) {
      cleanup.errors.push(`Docker cleanup error: ${error.message}`);
    }
  }

  async cleanupLargeFiles(cleanup) {
    this.log('Procurando e limpando arquivos grandes...');

    const threshold = this.cleanupPolicies.largeFileThreshold;

    try {
      // Encontra arquivos grandes em /tmp e /var/tmp
      const largeFiles = execSync(
        `find /tmp /var/tmp -type f -size +${threshold}c 2>/dev/null`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(f => f);

      for (const file of largeFiles) {
        try {
          const stats = fs.statSync(file);
          fs.unlinkSync(file);

          cleanup.operations.temp.files += 1;
          cleanup.operations.temp.size += stats.size;

        } catch (error) {
          // Arquivo pode ter sido removido
        }
      }

    } catch (error) {
      cleanup.errors.push(`Large files cleanup error: ${error.message}`);
    }
  }

  async cleanupOrphanedFiles(cleanup) {
    this.log('Limpando arquivos órfãos...');

    try {
      // Limpa arquivos de sessão órfãos
      const sessionFiles = execSync(
        'find /tmp -name "sess_*" -mtime +1 -delete 2>/dev/null || true',
        { encoding: 'utf8' }
      );

      // Limpa arquivos de lock órfãos
      const lockFiles = execSync(
        'find /tmp -name "*.lock" -mtime +0.1 -delete 2>/dev/null || true',
        { encoding: 'utf8' }
      );

    } catch (error) {
      cleanup.errors.push(`Orphaned files cleanup error: ${error.message}`);
    }
  }

  async rotateLogs(cleanup) {
    this.log('Rotacionando logs...');

    try {
      // Usa logrotate se disponível
      execSync('logrotate -f /etc/logrotate.conf 2>/dev/null || true', { encoding: 'utf8' });
    } catch (error) {
      // Ignora se logrotate não estiver configurado
    }
  }

  async compactDatabases(cleanup) {
    this.log('Compactando bancos de dados...');

    try {
      // Compacta bancos de dados SQLite se existirem
      const sqliteFiles = execSync(
        'find /var /home /root -name "*.db" -o -name "*.sqlite" 2>/dev/null | head -5',
        { encoding: 'utf8' }
      ).trim().split('\n').filter(f => f);

      for (const dbFile of sqliteFiles) {
        try {
          execSync(`sqlite3 "${dbFile}" "VACUUM;" 2>/dev/null || true`, { encoding: 'utf8' });
        } catch (error) {
          // Ignora erros de compactação
        }
      }

    } catch (error) {
      cleanup.errors.push(`Database compaction error: ${error.message}`);
    }
  }

  async cleanupSystemCache(cleanup) {
    this.log('Limpando cache do sistema...');

    try {
      // Limpa cache do sistema de arquivos
      execSync('sync && echo 3 > /proc/sys/vm/drop_caches', { encoding: 'utf8' });
    } catch (error) {
      cleanup.errors.push(`System cache cleanup error: ${error.message}`);
    }
  }

  async cleanupOldKernels(cleanup) {
    this.log('Removendo kernels antigos...');

    try {
      // Lista kernels instalados
      const currentKernel = execSync('uname -r', { encoding: 'utf8' }).trim();
      const installedKernels = execSync("dpkg -l | grep 'linux-image' | awk '{print $2}'", { encoding: 'utf8' }).trim().split('\n');

      // Remove kernels antigos (mantendo atual e anterior)
      const kernelsToRemove = installedKernels.filter(kernel =>
        kernel !== `linux-image-${currentKernel}` &&
        !kernel.includes(currentKernel.split('-').slice(0, -1).join('-'))
      );

      if (kernelsToRemove.length > 1) {  // Mantém pelo menos 2 kernels
        for (let i = 0; i < kernelsToRemove.length - 1; i++) {
          try {
            execSync(`apt-get remove -y ${kernelsToRemove[i]}`, { encoding: 'utf8' });
            cleanup.operations.packages.files += 1;
          } catch (error) {
            // Ignora erros de remoção
          }
        }
      }

    } catch (error) {
      cleanup.errors.push(`Kernel cleanup error: ${error.message}`);
    }
  }

  async cleanupApplicationCache(cleanup) {
    this.log('Limpando cache de aplicações...');

    try {
      // Limpa cache de aplicações comuns
      const appCaches = [
        'rm -rf /root/.thumbnails/* 2>/dev/null || true',
        'rm -rf /home/*/.thumbnails/* 2>/dev/null || true',
        'rm -rf /root/.local/share/Trash/* 2>/dev/null || true',
        'rm -rf /home/*/.local/share/Trash/* 2>/dev/null || true'
      ];

      for (const cmd of appCaches) {
        execSync(cmd, { encoding: 'utf8' });
      }

    } catch (error) {
      cleanup.errors.push(`Application cache cleanup error: ${error.message}`);
    }
  }

  async performSystemMaintenance(cleanup) {
    this.log('Executando manutenção do sistema...');

    try {
      // Atualiza lista de pacotes
      execSync('apt-get update', { encoding: 'utf8' });

      // Verifica por pacotes quebrados
      execSync('dpkg --configure -a', { encoding: 'utf8' });

      // Limpa configurações removidas
      execSync('apt-get autoremove -y', { encoding: 'utf8' });

    } catch (error) {
      cleanup.errors.push(`System maintenance error: ${error.message}`);
    }
  }

  async cleanupPath(pathPattern, options) {
    const { maxAge, maxSize, pattern } = options;
    let filesRemoved = 0;
    let sizeRemoved = 0;

    try {
      // Expande padrão e encontra arquivos
      const findCommand = this.buildFindCommand(pathPattern, maxAge, maxSize, pattern);
      const fileList = execSync(findCommand, { encoding: 'utf8' }).trim().split('\n').filter(f => f);

      // Remove arquivos em batches
      const batchSize = this.cleanupPolicies.cleanupBatchSize;
      for (let i = 0; i < fileList.length; i += batchSize) {
        const batch = fileList.slice(i, i + batchSize);

        for (const file of batch) {
          try {
            if (this.isSafeToDelete(file)) {
              const stats = fs.statSync(file);
              fs.unlinkSync(file);

              filesRemoved++;
              sizeRemoved += stats.size;
            }
          } catch (error) {
            // Arquivo pode ter sido removido ou estar em uso
          }
        }
      }

    } catch (error) {
      // Diretório pode não existir ou não ter permissão
    }

    return { files: filesRemoved, size: sizeRemoved };
  }

  buildFindCommand(pathPattern, maxAge, maxSize, pattern) {
    const maxAgeMinutes = maxAge * 24 * 60;  // Converte dias para minutos
    const maxSizeBytes = this.parseSize(maxSize);

    let command = `find ${pathPattern} -type f`;

    if (maxAge > 0) {
      command += ` -mtime +${Math.floor(maxAge)}`;
    }

    if (maxSizeBytes > 0) {
      command += ` -size +${maxSizeBytes}c`;
    }

    if (pattern && pattern !== '*') {
      command += ` -name "${pattern}"`;
    }

    command += ' 2>/dev/null';

    return command;
  }

  isSafeToDelete(filePath) {
    // Verifica se arquivo é seguro para deletar
    const absolutePath = path.resolve(filePath);

    // Não deletar arquivos em diretórios protegidos
    for (const protectedPath of this.cleanupConfig.safety.protectedPaths) {
      if (absolutePath.startsWith(protectedPath)) {
        return false;
      }
    }

    // Verifica padrões de exclusão
    const fileName = path.basename(filePath);
    for (const excludePattern of this.cleanupPolicies.excludePatterns) {
      if (fileName.includes(excludePattern.replace('*', ''))) {
        return false;
      }
    }

    return true;
  }

  async getDiskUsage() {
    try {
      const dfOutput = execSync('df -h /', { encoding: 'utf8' });
      const dfLine = dfOutput.split('\n')[1].split(/\s+/);

      const total = this.parseSize(dfLine[1]);
      const used = this.parseSize(dfLine[2]);
      const available = this.parseSize(dfLine[3]);
      const usage = (used / total) * 100;

      return {
        total: total,
        used: used,
        available: available,
        free: this.formatSize(available),
        usage: Math.round(usage * 100) / 100
      };
    } catch (error) {
      this.error('Erro ao obter uso de disco:', error);
      return {};
    }
  }

  updateGlobalStats(cleanup) {
    this.stats.totalCleaned++;
    this.stats.lastCleanup = cleanup.timestamp;
    this.stats.diskSpaceSaved += cleanup.diskSaved;

    // Compartilha estatísticas atualizadas
    this.shareKnowledge('cleanup-stats', this.stats);
  }

  getTotalFilesRemoved(cleanup) {
    return Object.values(cleanup.operations).reduce((total, op) => total + op.files, 0);
  }

  parseSize(sizeStr) {
    const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024, T: 1024 * 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?$/i);

    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] ? match[2].toUpperCase() : 'B';

    return unit === 'B' ? value : value * (units[unit] || 1);
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  async sendAlert(type, data) {
    const alert = {
      type: type,
      timestamp: new Date().toISOString(),
      agent: this.config.name,
      data: data
    };

    this.emit('cleanup:alert', alert);
    await this.shareKnowledge('cleanup-alert', alert);

    this.warn(`ALERTA DE LIMPEZA: ${type}`);
  }

  async startAutomatedCleanup() {
    this.log('Iniciando limpeza automatizada contínua...');

    // Quick cleanup a cada 30 minutos
    setInterval(async () => {
      try {
        await this.performCleanup('quick');
      } catch (error) {
        this.error('Erro na limpeza rápida:', error);
      }
    }, 30 * 60 * 1000);

    // Daily cleanup a cada 24 horas
    setInterval(async () => {
      try {
        await this.performCleanup('daily');
      } catch (error) {
        this.error('Erro na limpeza diária:', error);
      }
    }, 24 * 60 * 60 * 1000);

    // Weekly cleanup a cada 7 dias
    setInterval(async () => {
      try {
        await this.performCleanup('weekly');
      } catch (error) {
        this.error('Erro na limpeza semanal:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000);

    this.log('Sistema de limpeza automatizada iniciado');
  }

  // Métodos auxiliares
  generateCleanupId() {
    return `cleanup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async run(options = {}) {
    this.log('Iniciando Cleanup Automator...');

    if (options.automated) {
      return await this.startAutomatedCleanup();
    } else {
      const type = options.type || 'quick';
      return await this.performCleanup(type);
    }
  }
}

// CLI interface
if (require.main === module) {
  const bot = new CleanupAutomator();

  bot.initialize().then(() => {
    const args = process.argv.slice(2);

    if (args.includes('--automated')) {
      return bot.run({ automated: true });
    } else if (args.includes('--quick')) {
      return bot.run({ type: 'quick' });
    } else if (args.includes('--daily')) {
      return bot.run({ type: 'daily' });
    } else if (args.includes('--weekly')) {
      return bot.run({ type: 'weekly' });
    } else if (args.includes('--monthly')) {
      return bot.run({ type: 'monthly' });
    } else {
      // Quick cleanup por padrão
      return bot.run({ type: 'quick' });
    }
  }).then(result => {
    if (result && !process.argv.includes('--automated')) {
      console.log('\n=== CLEANUP AUTOMATOR REPORT ===');
      console.log(JSON.stringify(result, null, 2));
    }
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = CleanupAutomator;
