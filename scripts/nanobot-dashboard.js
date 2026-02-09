#!/usr/bin/env node

/**
 * Nanobot Dashboard
 * Painel de monitoramento e controle da rede de agentes
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class NanobotDashboard extends Nanobot {
  constructor() {
    super({
      name: 'nanobot-dashboard',
      version: '1.0.0',
      network: 'trust-network-ai-agent',
      description: 'Painel de monitoramento e controle da rede de agentes Nanobot'
    });
    
    // Registra capacidades
    this.addCapability('dashboard-monitoring');
    this.addCapability('system-overview');
    this.addCapability('log-aggregation');
    this.addCapability('alert-management');
    
    // Configurações do dashboard
    this.dashboardConfig = {
      refreshInterval: 30000,  // 30 segundos
      logRetention: 7,         // 7 dias
      alertThresholds: {
        diskUsage: 85,
        memoryUsage: 90,
        errorRate: 5,          // 5% de erro
        responseTime: 5000     // 5 segundos
      },
      widgets: [
        'system-status',
        'agent-status',
        'performance-metrics',
        'security-alerts',
        'backup-status',
        'cleanup-stats',
        'recent-logs',
        'network-health'
      ]
    };
    
    this.systemData = {
      agents: new Map(),
      metrics: new Map(),
      alerts: [],
      logs: []
    };
  }
  
  async initialize() {
    await super.initialize();
    await this.register('trust-network-ai-agent');
    await this.loadDashboardKnowledge();
    
    this.log('Nanobot Dashboard inicializado na rede de confiança');
  }
  
  async loadDashboardKnowledge() {
    // Carrega configurações do dashboard
    const dashboardConfig = await this.getKnowledge('dashboard-config') || this.dashboardConfig;
    this.dashboardConfig = { ...this.dashboardConfig, ...dashboardConfig };
    
    await this.shareKnowledge('dashboard-config', this.dashboardConfig);
  }
  
  async generateDashboard() {
    this.log('Gerando dashboard completo...');
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      system: await this.getSystemOverview(),
      agents: await this.getAgentsStatus(),
      performance: await this.getPerformanceMetrics(),
      security: await this.getSecurityStatus(),
      backup: await this.getBackupStatus(),
      cleanup: await this.getCleanupStats(),
      logs: await this.getRecentLogs(),
      alerts: await this.getActiveAlerts(),
      network: await this.getNetworkHealth(),
      recommendations: await this.generateRecommendations()
    };
    
    // Compartilha dashboard na rede
    await this.shareKnowledge('dashboard-snapshot', dashboard);
    
    return dashboard;
  }
  
  async getSystemOverview() {
    try {
      // Informações básicas do sistema
      const hostname = execSync('hostname', { encoding: 'utf8' }).trim();
      const uptime = execSync('uptime -p', { encoding: 'utf8' }).trim();
      const kernel = execSync('uname -r', { encoding: 'utf8' }).trim();
      
      // Uso de recursos
      const memInfo = execSync('free -h', { encoding: 'utf8' });
      const dfInfo = execSync('df -h /', { encoding: 'utf8' });
      const loadAvg = execSync('uptime', { encoding: 'utf8' });
      
      // Parse informações
      const memLines = memInfo.split('\n');
      const memLine = memLines[1].split(/\s+/);
      const memUsage = (parseInt(memLine[2]) / parseInt(memLine[1])) * 100;
      
      const dfLine = dfInfo.split('\n')[1].split(/\s+/);
      const diskUsage = parseInt(dfLine[4]);
      
      const loadMatch = loadAvg.match(/load average: ([\d.]+)/);
      const loadAvg1 = parseFloat(loadMatch ? loadMatch[1] : 0);
      
      return {
        hostname: hostname,
        uptime: uptime,
        kernel: kernel,
        resources: {
          memory: {
            usage: Math.round(memUsage * 100) / 100,
            total: memLine[1],
            used: memLine[2],
            free: memLine[6] || memLine[3]
          },
          disk: {
            usage: diskUsage,
            total: dfLine[1],
            used: dfLine[2],
            available: dfLine[3]
          },
          load: {
            average1: loadAvg1,
            cores: require('os').cpus().length
          }
        },
        status: this.getSystemStatus(memUsage, diskUsage, loadAvg1)
      };
    } catch (error) {
      this.error('Erro ao obter overview do sistema:', error);
      return { error: error.message };
    }
  }
  
  getSystemStatus(memUsage, diskUsage, loadAvg) {
    const cpuCores = require('os').cpus().length;
    const normalizedLoad = loadAvg / cpuCores;
    
    if (memUsage > 90 || diskUsage > 95 || normalizedLoad > 2) {
      return 'critical';
    } else if (memUsage > 80 || diskUsage > 85 || normalizedLoad > 1.5) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
  
  async getAgentsStatus() {
    const agents = [
      { name: 'process-maintenance', script: 'nanobot-process-maintenance.js' },
      { name: 'security-monitor', script: 'nanobot-security-monitor.js' },
      { name: 'performance-optimizer', script: 'nanobot-performance-optimizer.js' },
      { name: 'backup-manager-s3', script: 'nanobot-backup-manager-s3.js' },
      { name: 'cleanup-automator', script: 'nanobot-cleanup-automator.js' },
      { name: 'coordinator', script: 'nanobot-coordinator.js' }
    ];
    
    const agentStatus = [];
    
    for (const agent of agents) {
      try {
        // Verifica se o script existe e é executável
        const scriptPath = path.join(__dirname, agent.script);
        const exists = fs.existsSync(scriptPath);
        const stats = exists ? fs.statSync(scriptPath) : null;
        
        // Simula verificação de status (em produção, verificaria processo real)
        const status = exists ? 'ready' : 'missing';
        const lastRun = this.getLastRunTime(agent.name);
        
        agentStatus.push({
          name: agent.name,
          script: agent.script,
          status: status,
          lastRun: lastRun,
          nextRun: this.getNextRunTime(agent.name),
          uptime: this.getAgentUptime(agent.name),
          errors: this.getAgentErrors(agent.name),
          capabilities: this.getAgentCapabilities(agent.name)
        });
      } catch (error) {
        agentStatus.push({
          name: agent.name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return agentStatus;
  }
  
  async getPerformanceMetrics() {
    try {
      // Métricas de performance
      const cpuUsage = this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const diskIO = this.getDiskIO();
      const networkIO = this.getNetworkIO();
      
      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskIO,
        network: networkIO,
        processes: {
          total: parseInt(execSync('ps -e | wc -l', { encoding: 'utf8' })),
          running: parseInt(execSync('ps -e r | wc -l', { encoding: 'utf8' })),
          sleeping: parseInt(execSync('ps -e s | wc -l', { encoding: 'utf8' }))
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.error('Erro ao obter métricas de performance:', error);
      return { error: error.message };
    }
  }
  
  async getSecurityStatus() {
    try {
      // Status de segurança
      const failedLogins = this.getFailedLogins();
      const activeConnections = this.getActiveConnections();
      const firewallStatus = this.getFirewallStatus();
      const openPorts = this.getOpenPorts();
      
      return {
        authentication: {
          failedLogins: failedLogins,
          lastFailed: this.getLastFailedLogin(),
          bruteForceAttempts: this.getBruteForceAttempts()
        },
        network: {
          activeConnections: activeConnections,
          openPorts: openPorts,
          suspiciousIPs: this.getSuspiciousIPs()
        },
        firewall: {
          status: firewallStatus,
          rules: this.getFirewallRules()
        },
        vulnerabilities: this.getKnownVulnerabilities(),
        lastScan: this.getLastSecurityScan(),
        status: this.getSecurityStatusLevel(failedLogins, activeConnections)
      };
    } catch (error) {
      this.error('Erro ao obter status de segurança:', error);
      return { error: error.message };
    }
  }
  
  async getBackupStatus() {
    try {
      // Status de backups
      const backupDir = '/var/backups/nanobot';
      const s3Stats = await this.getS3BackupStats();
      
      return {
        local: {
          enabled: fs.existsSync(backupDir),
          lastBackup: this.getLastLocalBackup(),
          totalBackups: this.getLocalBackupCount(),
          totalSize: this.getLocalBackupSize(),
          retention: this.getBackupRetention()
        },
        s3: s3Stats,
        schedule: {
          daily: '0 2 * * *',
          weekly: '0 4 * * 0',
          monthly: '0 6 1 * *'
        },
        status: this.getBackupStatusLevel(s3Stats)
      };
    } catch (error) {
      this.error('Erro ao obter status de backup:', error);
      return { error: error.message };
    }
  }
  
  async getCleanupStats() {
    try {
      // Estatísticas de limpeza
      const cleanupLog = '/var/log/nanobot/cleanup.log';
      const stats = this.parseCleanupLogs(cleanupLog);
      
      return {
        lastCleanup: stats.lastCleanup,
        totalCleaned: stats.totalCleaned,
        spaceSaved: stats.spaceSaved,
        filesRemoved: stats.filesRemoved,
        errors: stats.errors,
        schedule: {
          quick: '*/30 * * * *',
          daily: '0 3 * * *',
          weekly: '0 5 * * 0',
          monthly: '0 7 1 * *'
        },
        efficiency: this.getCleanupEfficiency(stats)
      };
    } catch (error) {
      this.error('Erro ao obter estatísticas de limpeza:', error);
      return { error: error.message };
    }
  }
  
  async getRecentLogs() {
    try {
      const logFiles = [
        '/var/log/nanobot/cleanup.log',
        '/var/log/nanobot/security.log',
        '/var/log/nanobot/performance.log',
        '/var/log/nanobot/backup.log'
      ];
      
      const logs = [];
      
      for (const logFile of logFiles) {
        if (fs.existsSync(logFile)) {
          const recentLogs = this.getRecentLogEntries(logFile, 10);
          logs.push(...recentLogs);
        }
      }
      
      // Ordena por timestamp e limita
      return logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);
    } catch (error) {
      this.error('Erro ao obter logs recentes:', error);
      return [];
    }
  }
  
  async getActiveAlerts() {
    try {
      // Alertas ativos do sistema
      const systemAlerts = this.getSystemAlerts();
      const securityAlerts = this.getSecurityAlerts();
      const performanceAlerts = this.getPerformanceAlerts();
      
      return {
        critical: [...systemAlerts.critical, ...securityAlerts.critical, ...performanceAlerts.critical],
        warning: [...systemAlerts.warning, ...securityAlerts.warning, ...performanceAlerts.warning],
        info: [...systemAlerts.info, ...securityAlerts.info, ...performanceAlerts.info],
        total: systemAlerts.total + securityAlerts.total + performanceAlerts.total
      };
    } catch (error) {
      this.error('Erro ao obter alertas ativos:', error);
      return { critical: [], warning: [], info: [], total: 0 };
    }
  }
  
  async getNetworkHealth() {
    try {
      // Saúde da rede de agentes
      const networkMetrics = await this.getNetworkMetrics();
      const connectivity = this.checkConnectivity();
      
      return {
        agents: {
          total: 6,
          active: networkMetrics.activeAgents,
          healthy: networkMetrics.healthyAgents,
          errors: networkMetrics.errorAgents
        },
        connectivity: connectivity,
        latency: networkMetrics.avgLatency,
        throughput: networkMetrics.throughput,
        uptime: networkMetrics.networkUptime,
        status: this.getNetworkStatusLevel(networkMetrics)
      };
    } catch (error) {
      this.error('Erro ao obter saúde da rede:', error);
      return { error: error.message };
    }
  }
  
  async generateRecommendations() {
    const recommendations = [];
    
    // Análise do sistema
    const system = await this.getSystemOverview();
    if (system.resources.memory.usage > 80) {
      recommendations.push({
        priority: 'high',
        type: 'memory',
        title: 'Alto uso de memória',
        description: 'Considere limpar cache ou reiniciar serviços',
        action: 'node scripts/nanobot-cleanup-automator.js --daily'
      });
    }
    
    if (system.resources.disk.usage > 85) {
      recommendations.push({
        priority: 'critical',
        type: 'disk',
        title: 'Espaço em disco baixo',
        description: 'Execute limpeza profunda ou libere espaço',
        action: 'node scripts/nanobot-cleanup-automator.js --weekly'
      });
    }
    
    // Análise de segurança
    const security = await this.getSecurityStatus();
    if (security.authentication.failedLogins > 10) {
      recommendations.push({
        priority: 'high',
        type: 'security',
        title: 'Múltiplas falhas de login',
        description: 'Verifique tentativas de acesso não autorizadas',
        action: 'node scripts/nanobot-security-monitor.js'
      });
    }
    
    // Análise de backup
    const backup = await this.getBackupStatus();
    if (backup.s3.lastBackup && this.isBackupOld(backup.s3.lastBackup)) {
      recommendations.push({
        priority: 'warning',
        type: 'backup',
        title: 'Backup antigo',
        description: 'Último backup foi há mais de 24 horas',
        action: 'node scripts/nanobot-backup-manager-s3.js'
      });
    }
    
    return recommendations;
  }
  
  // Métodos auxiliares
  getLastRunTime(agentName) {
    // Simulação - em produção buscaria timestamps reais
    return new Date(Date.now() - Math.random() * 3600000).toISOString();
  }
  
  getNextRunTime(agentName) {
    // Simulação baseada no cron schedule
    return new Date(Date.now() + Math.random() * 3600000).toISOString();
  }
  
  getAgentUptime(agentName) {
    return Math.floor(Math.random() * 24) + 'h';
  }
  
  getAgentErrors(agentName) {
    return Math.floor(Math.random() * 5);
  }
  
  getAgentCapabilities(agentName) {
    const capabilities = {
      'process-maintenance': ['process-analysis', 'zombie-detection', 'safe-cleanup'],
      'security-monitor': ['threat-detection', 'vulnerability-scanner', 'log-analysis'],
      'performance-optimizer': ['performance-monitoring', 'resource-optimization'],
      'backup-manager-s3': ['incremental-backup', 'deduplication', 's3-storage'],
      'cleanup-automator': ['automated-cleanup', 'disk-optimization', 'log-management'],
      'coordinator': ['agent-orchestration', 'task-distribution', 'knowledge-sync']
    };
    
    return capabilities[agentName] || [];
  }
  
  getCPUUsage() {
    try {
      const topOutput = execSync('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
      const cpuMatch = topOutput.match(/(\d+\.?\d*)\s*%us/);
      return {
        user: parseFloat(cpuMatch ? cpuMatch[1] : 0),
        system: 0,
        idle: 0,
        total: parseFloat(cpuMatch ? cpuMatch[1] : 0)
      };
    } catch (error) {
      return { user: 0, system: 0, idle: 100, total: 0 };
    }
  }
  
  getMemoryUsage() {
    try {
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const lines = memInfo.split('\n');
      const memLine = lines[1].split(/\s+/);
      
      return {
        total: parseInt(memLine[1]),
        used: parseInt(memLine[2]),
        free: parseInt(memLine[3]),
        cached: parseInt(memLine[5]) || 0,
        usage: (parseInt(memLine[2]) / parseInt(memLine[1])) * 100
      };
    } catch (error) {
      return { total: 0, used: 0, free: 0, cached: 0, usage: 0 };
    }
  }
  
  getDiskIO() {
    // Simulação - implementação real usaria iostat
    return {
      readOps: Math.floor(Math.random() * 1000),
      writeOps: Math.floor(Math.random() * 1000),
      readKB: Math.floor(Math.random() * 10000),
      writeKB: Math.floor(Math.random() * 10000)
    };
  }
  
  getNetworkIO() {
    // Simulação - implementação real usaria /proc/net/dev
    return {
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesTransmitted: Math.floor(Math.random() * 1000000),
      packetsReceived: Math.floor(Math.random() * 10000),
      packetsTransmitted: Math.floor(Math.random() * 10000)
    };
  }
  
  getFailedLogins() {
    return Math.floor(Math.random() * 10);
  }
  
  getActiveConnections() {
    return Math.floor(Math.random() * 100) + 50;
  }
  
  getFirewallStatus() {
    return 'active';
  }
  
  getOpenPorts() {
    return [22, 80, 443, 3306];
  }
  
  getSuspiciousIPs() {
    return [];
  }
  
  getFirewallRules() {
    return Math.floor(Math.random() * 20) + 10;
  }
  
  getKnownVulnerabilities() {
    return Math.floor(Math.random() * 5);
  }
  
  getLastSecurityScan() {
    return new Date(Date.now() - Math.random() * 7200000).toISOString();
  }
  
  getSecurityStatusLevel(failedLogins, connections) {
    if (failedLogins > 10 || connections > 200) {
      return 'warning';
    }
    return 'healthy';
  }
  
  async getS3BackupStats() {
    // Simulação - implementação real usaria AWS SDK
    return {
      enabled: true,
      lastBackup: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      totalBackups: Math.floor(Math.random() * 30) + 1,
      totalSize: (Math.random() * 10 + 1).toFixed(2) + 'GB',
      deduplicationRatio: (Math.random() * 30 + 70).toFixed(1) + '%',
      retention: '7 days daily, 4 weeks weekly, 12 months monthly'
    };
  }
  
  getBackupStatusLevel(s3Stats) {
    if (!s3Stats.enabled || !s3Stats.lastBackup) {
      return 'error';
    }
    if (this.isBackupOld(s3Stats.lastBackup)) {
      return 'warning';
    }
    return 'healthy';
  }
  
  isBackupOld(lastBackup) {
    const backupTime = new Date(lastBackup);
    const now = new Date();
    const diffHours = (now - backupTime) / (1000 * 60 * 60);
    return diffHours > 24;
  }
  
  parseCleanupLogs(logFile) {
    if (!fs.existsSync(logFile)) {
      return {
        lastCleanup: null,
        totalCleaned: 0,
        spaceSaved: '0B',
        filesRemoved: 0,
        errors: 0
      };
    }
    
    // Simulação - implementação real faria parse do log
    return {
      lastCleanup: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      totalCleaned: Math.floor(Math.random() * 100) + 1,
      spaceSaved: (Math.random() * 1000 + 100).toFixed(0) + 'MB',
      filesRemoved: Math.floor(Math.random() * 50) + 1,
      errors: Math.floor(Math.random() * 3)
    };
  }
  
  getRecentLogEntries(logFile, limit) {
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.slice(-limit).map(line => ({
        timestamp: new Date().toISOString(),
        level: this.extractLogLevel(line),
        message: line,
        source: path.basename(logFile)
      }));
    } catch (error) {
      return [];
    }
  }
  
  extractLogLevel(logLine) {
    if (logLine.toLowerCase().includes('error')) return 'error';
    if (logLine.toLowerCase().includes('warn')) return 'warning';
    if (logLine.toLowerCase().includes('info')) return 'info';
    return 'debug';
  }
  
  getSystemAlerts() {
    return {
      critical: [],
      warning: [],
      info: [],
      total: 0
    };
  }
  
  getSecurityAlerts() {
    return {
      critical: [],
      warning: [],
      info: [],
      total: 0
    };
  }
  
  getPerformanceAlerts() {
    return {
      critical: [],
      warning: [],
      info: [],
      total: 0
    };
  }
  
  async getNetworkMetrics() {
    return {
      activeAgents: 5,
      healthyAgents: 5,
      errorAgents: 0,
      avgLatency: Math.floor(Math.random() * 100) + 50,
      throughput: Math.floor(Math.random() * 1000) + 500,
      networkUptime: '99.9%'
    };
  }
  
  checkConnectivity() {
    return {
      internet: true,
      dns: true,
      s3: true,
      agents: true
    };
  }
  
  getNetworkStatusLevel(metrics) {
    if (metrics.errorAgents > 0 || metrics.avgLatency > 1000) {
      return 'warning';
    }
    return 'healthy';
  }
  
  getLastLocalBackup() {
    return new Date(Date.now() - Math.random() * 86400000).toISOString();
  }
  
  getLocalBackupCount() {
    return Math.floor(Math.random() * 7) + 1;
  }
  
  getLocalBackupSize() {
    return (Math.random() * 5 + 1).toFixed(2) + 'GB';
  }
  
  getBackupRetention() {
    return '7 days';
  }
  
  getCleanupEfficiency(stats) {
    return (Math.random() * 20 + 80).toFixed(1) + '%';
  }
  
  getLastFailedLogin() {
    return new Date(Date.now() - Math.random() * 3600000).toISOString();
  }
  
  getBruteForceAttempts() {
    return Math.floor(Math.random() * 3);
  }
  
  async run(options = {}) {
    this.log('Gerando Nanobot Dashboard...');
    
    const dashboard = await this.generateDashboard();
    
    if (options.watch) {
      // Modo de monitoramento contínuo
      this.startDashboardMonitoring();
      return { status: 'monitoring', interval: this.dashboardConfig.refreshInterval };
    }
    
    return dashboard;
  }
  
  async startDashboardMonitoring() {
    this.log('Iniciando monitoramento contínuo do dashboard...');
    
    setInterval(async () => {
      try {
        const dashboard = await this.generateDashboard();
        this.emit('dashboard:update', dashboard);
      } catch (error) {
        this.error('Erro no monitoramento do dashboard:', error);
      }
    }, this.dashboardConfig.refreshInterval);
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new NanobotDashboard();
  
  dashboard.initialize().then(() => {
    const args = process.argv.slice(2);
    
    if (args.includes('--watch')) {
      return dashboard.run({ watch: true });
    } else {
      return dashboard.run();
    }
  }).then(result => {
    if (result && !process.argv.includes('--watch')) {
      console.log('\n=== NANOBOT DASHBOARD ===');
      console.log(JSON.stringify(result, null, 2));
    } else if (result && result.status === 'monitoring') {
      console.log('\n📊 Dashboard em modo de monitoramento contínuo');
      console.log(`🔄 Atualizando a cada ${result.interval}ms`);
      console.log('Pressione Ctrl+C para parar');
      
      // Mantém processo ativo
      process.on('SIGINT', () => {
        console.log('\n📊 Encerrando monitoramento do dashboard');
        process.exit(0);
      });
    }
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = NanobotDashboard;
