#!/usr/bin/env node

/**
 * Nanobot Performance Optimizer
 * Agente especializado em otimização de performance e recursos
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceOptimizerBot extends Nanobot {
  constructor() {
    super({
      name: 'performance-optimizer',
      version: '1.0.0',
      network: 'trust-network-ai-agent',
      description: 'Nanobot especializado em otimização de performance e gerenciamento de recursos'
    });
    
    // Registra capacidades
    this.addCapability('performance-monitoring');
    this.addCapability('resource-optimization');
    this.addCapability('bottleneck-detection');
    this.addCapability('auto-tuning');
    
    // Configurações de performance
    this.performanceConfig = {
      thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        load: { warning: 2.0, critical: 4.0 }
      },
      sampling: {
        interval: 5000,  // 5 segundos
        historySize: 100  // Manter 100 amostras
      }
    };
    
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      load: [],
      network: []
    };
    
    this.optimizations = [];
    this.bottlenecks = [];
  }
  
  async initialize() {
    await super.initialize();
    await this.register('trust-network-ai-agent');
    await this.loadPerformanceKnowledge();
    
    this.log('Performance Optimizer Bot inicializado na rede de confiança');
  }
  
  async loadPerformanceKnowledge() {
    // Carrega conhecimento de performance compartilhado
    const performanceProfiles = await this.getKnowledge('performance-profiles') || {
      webServer: {
        maxMemory: 2048,
        maxCPU: 70,
        tuningParams: ['worker_connections', 'keepalive_timeout']
      },
      database: {
        maxMemory: 4096,
        maxCPU: 80,
        tuningParams: ['shared_buffers', 'work_mem']
      },
      development: {
        maxMemory: 8192,
        maxCPU: 60,
        tuningParams: ['parallel_jobs', 'cache_size']
      }
    };
    
    this.performanceProfiles = performanceProfiles;
    await this.shareKnowledge('performance-profiles', performanceProfiles);
  }
  
  async analyzePerformance() {
    this.log('Iniciando análise de performance...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      systemMetrics: await this.collectSystemMetrics(),
      processMetrics: await this.analyzeProcessMetrics(),
      bottlenecks: await this.detectBottlenecks(),
      recommendations: []
    };
    
    // Gera recomendações
    analysis.recommendations = this.generateOptimizationRecommendations(analysis);
    
    // Aplica otimizações automáticas se seguro
    if (analysis.bottlenecks.some(b => b.severity === 'critical')) {
      await this.applyAutoOptimizations(analysis);
    }
    
    // Compartilha análise na rede
    await this.shareKnowledge('performance-analysis', analysis);
    
    return analysis;
  }
  
  async collectSystemMetrics() {
    const metrics = {
      cpu: await this.getCPUMetrics(),
      memory: await this.getMemoryMetrics(),
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics(),
      load: await this.getLoadMetrics()
    };
    
    // Atualiza histórico
    Object.keys(metrics).forEach(key => {
      if (this.metrics[key]) {
        this.metrics[key].push({
          timestamp: Date.now(),
          value: metrics[key].usage || metrics[key].value
        });
        
        // Mantém tamanho do histórico
        if (this.metrics[key].length > this.performanceConfig.sampling.historySize) {
          this.metrics[key].shift();
        }
      }
    });
    
    return metrics;
  }
  
  async getCPUMetrics() {
    try {
      // Obtém uso de CPU
      const topOutput = execSync('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
      const cpuMatch = topOutput.match(/(\d+\.?\d*)\s*%us/);
      const userCPU = parseFloat(cpuMatch ? cpuMatch[1] : 0);
      
      // Obtém carga da CPU
      const loadAvg = execSync('uptime', { encoding: 'utf8' });
      const loadMatch = loadAvg.match(/load average: ([\d.]+)/);
      const load1 = parseFloat(loadMatch ? loadMatch[1] : 0);
      
      // Obtém temperatura se disponível
      let temperature = null;
      try {
        const tempOutput = execSync('sensors 2>/dev/null | grep Core', { encoding: 'utf8' });
        const tempMatches = tempOutput.matchAll(/(\d+\.?\d*)°C/g);
        const temps = Array.from(tempMatches, m => parseFloat(m[1]));
        temperature = temps.length > 0 ? Math.max(...temps) : null;
      } catch (error) {
        // Temperatura não disponível
      }
      
      return {
        usage: userCPU,
        loadAverage: load1,
        cores: require('os').cpus().length,
        temperature: temperature
      };
    } catch (error) {
      this.error('Erro ao obter métricas de CPU:', error);
      return {};
    }
  }
  
  async getMemoryMetrics() {
    try {
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const lines = memInfo.split('\n');
      
      // Linha Mem: total used free shared buff/cache available
      const memLine = lines[1].split(/\s+/);
      const total = parseInt(memLine[1]);
      const used = parseInt(memLine[2]);
      const free = parseInt(memLine[3]);
      const available = parseInt(memLine[6] || memLine[4]);
      
      // Linha Swap: total used free
      const swapLine = lines[2].split(/\s+/);
      const swapTotal = parseInt(swapLine[1]);
      const swapUsed = parseInt(swapLine[2]);
      
      return {
        total: total,
        used: used,
        free: free,
        available: available,
        usage: (used / total) * 100,
        swap: {
          total: swapTotal,
          used: swapUsed,
          usage: swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0
        }
      };
    } catch (error) {
      this.error('Erro ao obter métricas de memória:', error);
      return {};
    }
  }
  
  async getDiskMetrics() {
    try {
      const dfOutput = execSync('df -h /', { encoding: 'utf8' });
      const dfLine = dfOutput.split('\n')[1].split(/\s+/);
      
      const total = dfLine[1];
      const used = dfLine[2];
      const available = dfLine[3];
      const usage = parseInt(dfLine[4]);
      
      // Obtém I/O stats
      let ioStats = null;
      try {
        const iostat = execSync('iostat -x 1 1 | grep -E "Device|sda|nvme"', { encoding: 'utf8' });
        const ioLines = iostat.split('\n');
        if (ioLines.length > 1) {
          const ioData = ioLines[1].split(/\s+/);
          ioStats = {
            device: ioData[0],
            readOps: parseFloat(ioData[3]),
            writeOps: parseFloat(ioData[4]),
            readKB: parseFloat(ioData[5]),
            writeKB: parseFloat(ioData[6])
          };
        }
      } catch (error) {
        // iostat não disponível
      }
      
      return {
        total: total,
        used: used,
        available: available,
        usage: usage,
        io: ioStats
      };
    } catch (error) {
      this.error('Erro ao obter métricas de disco:', error);
      return {};
    }
  }
  
  async getNetworkMetrics() {
    try {
      // Obtém estatísticas de rede
      const netstat = execSync('cat /proc/net/dev', { encoding: 'utf8' });
      const lines = netstat.split('\n');
      
      let totalRx = 0;
      let totalTx = 0;
      
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s+/);
          totalRx += parseInt(parts[1]);  // Receive bytes
          totalTx += parseInt(parts[9]);  // Transmit bytes
        }
      }
      
      // Obtém conexões ativas
      const connections = execSync('netstat -an | grep ESTABLISHED | wc -l', { encoding: 'utf8' });
      const activeConnections = parseInt(connections.trim());
      
      return {
        bytesReceived: totalRx,
        bytesTransmitted: totalTx,
        activeConnections: activeConnections
      };
    } catch (error) {
      this.error('Erro ao obter métricas de rede:', error);
      return {};
    }
  }
  
  async getLoadMetrics() {
    try {
      const uptime = execSync('uptime', { encoding: 'utf8' });
      const loadMatch = uptime.match(/load average: ([\d.]+),?\s*([\d.]+)?,?\s*([\d.]+)?/);
      
      return {
        load1: parseFloat(loadMatch ? loadMatch[1] : 0),
        load5: parseFloat(loadMatch && loadMatch[2] ? loadMatch[2] : 0),
        load15: parseFloat(loadMatch && loadMatch[3] ? loadMatch[3] : 0)
      };
    } catch (error) {
      this.error('Erro ao obter métricas de load:', error);
      return {};
    }
  }
  
  async analyzeProcessMetrics() {
    try {
      const psOutput = execSync('ps aux --sort=-%cpu,-%mem | head -20', { encoding: 'utf8' });
      const lines = psOutput.split('\n').slice(1);
      
      const processes = [];
      
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
        
        process.isHeavy = process.cpu > 50 || process.mem > 10;
        process.isLongRunning = process.time.includes(':') && !process.time.includes('00:00');
        
        processes.push(process);
      }
      
      return {
        topProcesses: processes,
        heavyProcesses: processes.filter(p => p.isHeavy),
        totalProcesses: parseInt(execSync('ps -e | wc -l', { encoding: 'utf8' }))
      };
    } catch (error) {
      this.error('Erro ao analisar processos:', error);
      return {};
    }
  }
  
  async detectBottlenecks() {
    const bottlenecks = [];
    const currentMetrics = await this.collectSystemMetrics();
    
    // Verifica CPU
    if (currentMetrics.cpu.usage > this.performanceConfig.thresholds.cpu.critical) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'critical',
        value: currentMetrics.cpu.usage,
        threshold: this.performanceConfig.thresholds.cpu.critical,
        description: 'Uso de CPU crítico'
      });
    } else if (currentMetrics.cpu.usage > this.performanceConfig.thresholds.cpu.warning) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'warning',
        value: currentMetrics.cpu.usage,
        threshold: this.performanceConfig.thresholds.cpu.warning,
        description: 'Uso de CPU elevado'
      });
    }
    
    // Verifica memória
    if (currentMetrics.memory.usage > this.performanceConfig.thresholds.memory.critical) {
      bottlenecks.push({
        type: 'memory',
        severity: 'critical',
        value: currentMetrics.memory.usage,
        threshold: this.performanceConfig.thresholds.memory.critical,
        description: 'Uso de memória crítico'
      });
    } else if (currentMetrics.memory.usage > this.performanceConfig.thresholds.memory.warning) {
      bottlenecks.push({
        type: 'memory',
        severity: 'warning',
        value: currentMetrics.memory.usage,
        threshold: this.performanceConfig.thresholds.memory.warning,
        description: 'Uso de memória elevado'
      });
    }
    
    // Verifica disco
    if (currentMetrics.disk.usage > this.performanceConfig.thresholds.disk.critical) {
      bottlenecks.push({
        type: 'disk',
        severity: 'critical',
        value: currentMetrics.disk.usage,
        threshold: this.performanceConfig.thresholds.disk.critical,
        description: 'Uso de disco crítico'
      });
    } else if (currentMetrics.disk.usage > this.performanceConfig.thresholds.disk.warning) {
      bottlenecks.push({
        type: 'disk',
        severity: 'warning',
        value: currentMetrics.disk.usage,
        threshold: this.performanceConfig.thresholds.disk.warning,
        description: 'Uso de disco elevado'
      });
    }
    
    // Verifica load average
    const cpuCores = require('os').cpus().length;
    const normalizedLoad = currentMetrics.load.load1 / cpuCores;
    
    if (normalizedLoad > this.performanceConfig.thresholds.load.critical) {
      bottlenecks.push({
        type: 'load',
        severity: 'critical',
        value: currentMetrics.load.load1,
        threshold: this.performanceConfig.thresholds.load.critical,
        description: 'Load average crítico'
      });
    } else if (normalizedLoad > this.performanceConfig.thresholds.load.warning) {
      bottlenecks.push({
        type: 'load',
        severity: 'warning',
        value: currentMetrics.load.load1,
        threshold: this.performanceConfig.thresholds.load.warning,
        description: 'Load average elevado'
      });
    }
    
    // Verifica swap
    if (currentMetrics.memory.swap.usage > 50) {
      bottlenecks.push({
        type: 'swap',
        severity: 'warning',
        value: currentMetrics.memory.swap.usage,
        threshold: 50,
        description: 'Uso elevado de swap'
      });
    }
    
    this.bottlenecks = bottlenecks;
    return bottlenecks;
  }
  
  generateOptimizationRecommendations(analysis) {
    const recommendations = [];
    
    // Recomendações para CPU
    const cpuBottleneck = analysis.bottlenecks.find(b => b.type === 'cpu');
    if (cpuBottleneck) {
      const heavyProcesses = analysis.processMetrics.heavyProcesses.filter(p => p.cpu > 20);
      
      recommendations.push({
        priority: cpuBottleneck.severity === 'critical' ? 'high' : 'medium',
        type: 'cpu-optimization',
        description: 'Otimizar uso de CPU',
        actions: [
          'Limitar processos pesados',
          'Aumentar prioridade de processos críticos',
          'Considerar escalonamento horizontal'
        ],
        processes: heavyProcesses.slice(0, 5)
      });
    }
    
    // Recomendações para memória
    const memBottleneck = analysis.bottlenecks.find(b => b.type === 'memory');
    if (memBottleneck) {
      recommendations.push({
        priority: memBottleneck.severity === 'critical' ? 'high' : 'medium',
        type: 'memory-optimization',
        description: 'Otimizar uso de memória',
        actions: [
          'Limpar cache de memória',
          'Configurar swap adequado',
          'Identificar memory leaks'
        ]
      });
    }
    
    // Recomendações para disco
    const diskBottleneck = analysis.bottlenecks.find(b => b.type === 'disk');
    if (diskBottleneck) {
      recommendations.push({
        priority: diskBottleneck.severity === 'critical' ? 'high' : 'medium',
        type: 'disk-optimization',
        description: 'Liberar espaço em disco',
        actions: [
          'Limpar arquivos temporários',
          'Comprimir logs antigos',
          'Identificar arquivos grandes'
        ]
      });
    }
    
    // Recomendações gerais
    if (analysis.bottlenecks.length === 0) {
      recommendations.push({
        priority: 'low',
        type: 'maintenance',
        description: 'Sistema operando normalmente',
        actions: [
          'Manter monitoramento ativo',
          'Agendar manutenção preventiva'
        ]
      });
    }
    
    return recommendations;
  }
  
  async applyAutoOptimizations(analysis) {
    const optimizations = [];
    
    // Limpa cache de memória se crítico
    const memBottleneck = analysis.bottlenecks.find(b => b.type === 'memory' && b.severity === 'critical');
    if (memBottleneck) {
      try {
        execSync('sync && echo 3 > /proc/sys/vm/drop_caches', { encoding: 'utf8' });
        optimizations.push({
          action: 'memory-cache-cleanup',
          result: 'success',
          description: 'Cache de memória limpo'
        });
      } catch (error) {
        optimizations.push({
          action: 'memory-cache-cleanup',
          result: 'failed',
          error: error.message
        });
      }
    }
    
    // Limpa arquivos temporários se disco crítico
    const diskBottleneck = analysis.bottlenecks.find(b => b.type === 'disk' && b.severity === 'critical');
    if (diskBottleneck) {
      try {
        const cleanupCmd = 'find /tmp -type f -atime +7 -delete 2>/dev/null || true';
        execSync(cleanupCmd, { encoding: 'utf8' });
        optimizations.push({
          action: 'temp-files-cleanup',
          result: 'success',
          description: 'Arquivos temporários antigos removidos'
        });
      } catch (error) {
        optimizations.push({
          action: 'temp-files-cleanup',
          result: 'failed',
          error: error.message
        });
      }
    }
    
    this.optimizations = optimizations;
    
    // Compartilha otimizações
    await this.shareKnowledge('performance-optimizations', optimizations);
    
    return optimizations;
  }
  
  async run(options = {}) {
    this.log('Iniciando otimização de performance...');
    
    const analysis = await this.analyzePerformance();
    
    // Gera relatório
    const report = {
      timestamp: new Date().toISOString(),
      analysis: analysis,
      optimizations: this.optimizations,
      metrics: {
        bottlenecksCount: analysis.bottlenecks.length,
        criticalBottlenecks: analysis.bottlenecks.filter(b => b.severity === 'critical').length,
        optimizationsApplied: this.optimizations.length
      }
    };
    
    this.log('Relatório de performance gerado');
    return report;
  }
  
  async startMonitoring() {
    this.log('Iniciando monitoramento contínuo...');
    
    const monitor = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        const bottlenecks = await this.detectBottlenecks();
        
        if (bottlenecks.some(b => b.severity === 'critical')) {
          await this.sendAlert('PERFORMANCE_CRITICAL', bottlenecks);
        }
        
        // Compartilha métricas na rede
        await this.shareKnowledge('performance-metrics', {
          timestamp: new Date().toISOString(),
          metrics: metrics,
          bottlenecks: bottlenecks
        });
        
      } catch (error) {
        this.error('Erro no monitoramento:', error);
      }
    }, this.performanceConfig.sampling.interval);
    
    return monitor;
  }
  
  async sendAlert(type, data) {
    const alert = {
      type: type,
      timestamp: new Date().toISOString(),
      agent: this.config.name,
      data: data
    };
    
    this.emit('performance:alert', alert);
    await this.shareKnowledge('performance-alert', alert);
    
    this.warn(`ALERTA DE PERFORMANCE: ${type}`);
  }
}

// CLI interface
if (require.main === module) {
  const bot = new PerformanceOptimizerBot();
  
  bot.initialize().then(() => {
    const options = {
      monitor: process.argv.includes('--monitor'),
      once: process.argv.includes('--once')
    };
    
    if (options.monitor) {
      return bot.startMonitoring();
    } else {
      return bot.run();
    }
  }).then(result => {
    if (result && !options.monitor) {
      console.log('\n=== PERFORMANCE OPTIMIZER REPORT ===');
      console.log(JSON.stringify(result, null, 2));
    }
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = PerformanceOptimizerBot;
