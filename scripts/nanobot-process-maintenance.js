#!/usr/bin/env node

/**
 * Nanobot DevOps Process Maintenance
 * Implementação usando biblioteca Nanobot oficial
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProcessMaintenanceBot extends Nanobot {
  constructor() {
    super({
      name: 'process-maintenance',
      version: '1.0.0',
      network: 'trust-network-ai-agent',
      description: 'Nanobot especializado em manutenção de processos e limpeza segura'
    });

    // Registra capacidades
    this.addCapability('process-analysis');
    this.addCapability('zombie-detection');
    this.addCapability('safe-cleanup');
    this.addCapability('resource-monitoring');

    // Configura modo seguro
    this.safetyMode = true;
    this.dryRun = true;
  }

  async initialize() {
    await super.initialize();

    // Registra na rede de confiança
    await this.register('trust-network-ai-agent');

    // Carrega conhecimento sobre processos críticos
    await this.loadCriticalProcessKnowledge();

    this.log('Nanobot de manutenção inicializado na rede de confiança');
  }

  async loadCriticalProcessKnowledge() {
    // Carrega conhecimento compartilhado sobre processos críticos
    this.criticalProcesses = {
      system: ['systemd', 'kernel', 'dockerd', 'containerd'],
      development: ['windsurf', 'node', 'npm', 'python3'],
      databases: ['mysql', 'postgres', 'redis', 'elasticsearch']
    };

    // Compartilha conhecimento na rede
    await this.shareKnowledge('critical-processes', this.criticalProcesses);
  }

  async analyzeSystem() {
    this.log('Iniciando análise do sistema...');

    const analysis = {
      timestamp: new Date().toISOString(),
      processes: await this.getProcessList(),
      zombies: await this.detectZombies(),
      resources: await this.getResourceUsage()
    };

    // Compartilha análise na rede
    await this.shareKnowledge('system-analysis', analysis);

    return analysis;
  }

  async getProcessList() {
    try {
      const output = execSync('ps aux', { encoding: 'utf8' });
      const processes = [];

      const lines = output.split('\n').slice(1);
      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.trim().split(/\s+/);
        if (parts.length < 11) continue;

        const process = {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          mem: parseFloat(parts[3]),
          vsz: parseInt(parts[4]),
          rss: parseInt(parts[5]),
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          cmd: parts.slice(10).join(' ')
        };

        process.isZombie = process.stat.includes('Z');
        process.isCritical = this.isCriticalProcess(process.cmd);

        processes.push(process);
      }

      return processes;
    } catch (error) {
      this.error('Erro ao obter lista de processos:', error);
      return [];
    }
  }

  async detectZombies() {
    const processes = await this.getProcessList();
    const zombies = processes.filter(p => p.isZombie);

    // Agrupa zombies por pai
    const zombieGroups = {};
    for (const zombie of zombies) {
      const parent = processes.find(p => p.pid === zombie.ppid);
      if (parent) {
        if (!zombieGroups[parent.pid]) {
          zombieGroups[parent.pid] = {
            parent: parent,
            zombies: []
          };
        }
        zombieGroups[parent.pid].zombies.push(zombie);
      }
    }

    return zombieGroups;
  }

  async getResourceUsage() {
    try {
      const memInfo = execSync('free -h', { encoding: 'utf8' });
      const loadAvg = execSync('uptime', { encoding: 'utf8' });

      return {
        memory: memInfo,
        load: loadAvg.split('load average:')[1].trim()
      };
    } catch (error) {
      this.error('Erro ao obter uso de recursos:', error);
      return {};
    }
  }

  isCriticalProcess(cmd) {
    const cmdLower = cmd.toLowerCase();
    for (const category of Object.values(this.criticalProcesses)) {
      for (const critical of category) {
        if (cmdLower.includes(critical)) {
          return true;
        }
      }
    }
    return false;
  }

  async cleanupZombies() {
    this.log('Iniciando limpeza de processos zombies...');

    const zombieGroups = await this.detectZombies();
    const results = {
      groupsFound: Object.keys(zombieGroups).length,
      groupsCleaned: 0,
      zombiesCleaned: 0,
      errors: []
    };

    for (const [ppid, group] of Object.entries(zombieGroups)) {
      try {
        // Verifica se pai é crítico
        if (group.parent.isCritical) {
          this.warn(`Processo pai ${ppid} é crítico, pulando limpeza`);
          continue;
        }

        this.log(`Limpando grupo de zombies: pai ${ppid} (${group.zombies.length} zombies)`);

        if (!this.dryRun) {
          // Mata processo pai para limpar zombies
          execSync(`kill -9 ${ppid}`, { encoding: 'utf8' });
          results.groupsCleaned++;
          results.zombiesCleaned += group.zombies.length;
        } else {
          this.log(`[DRY RUN] Mataria processo ${ppid} para limpar ${group.zombies.length} zombies`);
        }

      } catch (error) {
        results.errors.push(`Erro ao limpar grupo ${ppid}: ${error.message}`);
      }
    }

    // Compartilha resultados na rede
    await this.shareKnowledge('cleanup-results', results);

    return results;
  }

  async generateReport() {
    const analysis = await this.analyzeSystem();
    const cleanup = await this.cleanupZombies();

    const report = {
      timestamp: new Date().toISOString(),
      nanobot: this.name,
      version: this.version,
      analysis: {
        totalProcesses: analysis.processes.length,
        zombieProcesses: Object.keys(analysis.zombies).length,
        criticalProcesses: analysis.processes.filter(p => p.isCritical).length
      },
      cleanup: cleanup,
      recommendations: this.generateRecommendations(analysis)
    };

    // Salva relatório
    const reportPath = '/tmp/nanobot-maintenance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Compartilha relatório na rede
    await this.shareKnowledge('maintenance-report', report);

    return report;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    if (Object.keys(analysis.zombies).length > 0) {
      recommendations.push(`Limpar ${Object.keys(analysis.zombies).length} grupos de processos zombies`);
    }

    const highCpu = analysis.processes.filter(p => p.cpu > 20 && !p.isCritical);
    if (highCpu.length > 0) {
      recommendations.push(`Investigar ${highCpu.length} processos com alto consumo de CPU`);
    }

    const highMem = analysis.processes.filter(p => p.mem > 10 && !p.isCritical);
    if (highMem.length > 0) {
      recommendations.push(`Investigar ${highMem.length} processos com alto consumo de memória`);
    }

    return recommendations;
  }

  async run(options = {}) {
    this.dryRun = options.dryRun !== false;

    this.log(`Iniciando manutenção (dry-run: ${this.dryRun})`);

    const report = await this.generateReport();

    this.log('Relatório gerado:', report);
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const bot = new ProcessMaintenanceBot();

  bot.initialize().then(() => {
    const options = {
      dryRun: process.argv.includes('--dry-run'),
      execute: process.argv.includes('--execute')
    };

    return bot.run(options);
  }).then(report => {
    console.log('\n=== NANOBOT MAINTENANCE REPORT ===');
    console.log(JSON.stringify(report, null, 2));
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = ProcessMaintenanceBot;
