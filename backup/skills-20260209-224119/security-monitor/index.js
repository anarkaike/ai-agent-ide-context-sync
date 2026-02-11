const { spawn, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const os = require('os');

class SecurityMonitor {
  constructor(options = {}) {
    this.config = {
      monitoringInterval: options.monitoringInterval || 30000,
      logLevel: options.logLevel || 'info',
      alertThresholds: {
        cpuThreshold: options.cpuThreshold || 90,
        memoryThreshold: options.memoryThreshold || 85,
        networkThreshold: options.networkThreshold || 1000
      },
      alerting: {
        enabled: options.alerting !== false,
        channels: options.channels || ['console', 'log'],
        webhookUrl: options.webhookUrl || null
      },
      ...options
    };
    
    this.isMonitoring = false;
    this.monitoringTimer = null;
    this.securityEvents = [];
    this.systemBaseline = null;
    this.threatDatabase = new Set();
    
    // Initialize threat intelligence
    this.initializeThreatDatabase();
  }

  /**
   * Inicia monitoramento de segurança
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      return { success: false, message: 'Monitoring already running' };
    }

    console.log('🛡️ Starting Security Monitor...');
    
    // Establish system baseline
    await this.establishBaseline();
    
    this.isMonitoring = true;
    this.monitoringTimer = setInterval(() => {
      this.performSecurityCheck();
    }, this.config.monitoringInterval);

    // Initial security check
    await this.performSecurityCheck();

    return { 
      success: true, 
      message: 'Security monitoring started',
      interval: this.config.monitoringInterval 
    };
  }

  /**
   * Para monitoramento
   */
  async stopMonitoring() {
    if (!this.isMonitoring) {
      return { success: false, message: 'Monitoring not running' };
    }

    this.isMonitoring = false;
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    console.log('⏹️ Security monitoring stopped');
    return { success: true, message: 'Security monitoring stopped' };
  }

  /**
   * Estabelece baseline do sistema para detecção de anomalias
   */
  async establishBaseline() {
    console.log('📊 Establishing system baseline...');
    
    this.systemBaseline = {
      processes: await this.getProcessSnapshot(),
      networkConnections: await this.getNetworkSnapshot(),
      systemInfo: await this.getSystemInfo(),
      fileHashes: await this.getCriticalFileHashes(),
      timestamp: new Date().toISOString()
    };

    return this.systemBaseline;
  }

  /**
   * Executa verificação completa de segurança
   */
  async performSecurityCheck() {
    try {
      const results = {
        timestamp: new Date().toISOString(),
        checks: {},
        alerts: [],
        overallStatus: 'secure'
      };

      // Process monitoring
      results.checks.processes = await this.monitorProcesses();
      
      // Network security
      results.checks.network = await this.monitorNetworkSecurity();
      
      // File integrity
      results.checks.fileIntegrity = await this.checkFileIntegrity();
      
      // Authentication events
      results.checks.authEvents = await this.monitorAuthEvents();
      
      // System logs
      results.checks.systemLogs = await this.analyzeSecurityLogs();
      
      // Resource usage
      results.checks.resources = await this.monitorResourceUsage();

      // Collect alerts
      Object.values(results.checks).forEach(check => {
        if (check.alerts) {
          results.alerts.push(...check.alerts);
        }
      });

      // Determine overall status
      if (results.alerts.some(alert => alert.severity === 'critical')) {
        results.overallStatus = 'critical';
      } else if (results.alerts.some(alert => alert.severity === 'high')) {
        results.overallStatus = 'warning';
      }

      // Store security event
      this.securityEvents.push(results);
      
      // Keep only last 100 events
      if (this.securityEvents.length > 100) {
        this.securityEvents = this.securityEvents.slice(-100);
      }

      // Send alerts if needed
      if (results.alerts.length > 0 && this.config.alerting.enabled) {
        await this.sendAlerts(results.alerts);
      }

      return results;

    } catch (error) {
      console.error('Security check failed:', error.message);
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        overallStatus: 'error'
      };
    }
  }

  /**
   * Monitora processos em busca de atividades suspeitas
   */
  async monitorProcesses() {
    const result = {
      status: 'normal',
      alerts: [],
      suspiciousProcesses: [],
      resourceAnomalies: []
    };

    try {
      const currentProcesses = await this.getProcessSnapshot();
      
      for (const process of currentProcesses) {
        // Check for high CPU usage
        if (process.cpu > this.config.alertThresholds.cpuThreshold) {
          result.resourceAnomalies.push({
            type: 'high_cpu',
            pid: process.pid,
            name: process.name,
            cpu: process.cpu,
            timestamp: new Date().toISOString()
          });

          result.alerts.push({
            severity: 'medium',
            type: 'resource_anomaly',
            message: `High CPU usage detected: ${process.name} (${process.cpu}%)`,
            details: process
          });
        }

        // Check for high memory usage
        if (process.memory > this.config.alertThresholds.memoryThreshold) {
          result.resourceAnomalies.push({
            type: 'high_memory',
            pid: process.pid,
            name: process.name,
            memory: process.memory,
            timestamp: new Date().toISOString()
          });

          result.alerts.push({
            severity: 'medium',
            type: 'resource_anomaly',
            message: `High memory usage detected: ${process.name} (${process.memory}%)`,
            details: process
          });
        }

        // Check for suspicious process names
        const suspiciousNames = ['backdoor', 'malware', 'trojan', 'rootkit', 'keylog'];
        if (suspiciousNames.some(name => process.name.toLowerCase().includes(name))) {
          result.suspiciousProcesses.push(process);
          
          result.alerts.push({
            severity: 'critical',
            type: 'suspicious_process',
            message: `Suspicious process detected: ${process.name}`,
            details: process
          });
        }

        // Check for network connections by unusual processes
        if (process.connections && process.connections.length > 0) {
          const unusualConnections = process.connections.filter(conn => 
            this.threatDatabase.has(conn.remoteAddress) || 
            conn.remotePort < 1024 && process.name !== 'systemd'
          );

          if (unusualConnections.length > 0) {
            result.alerts.push({
              severity: 'high',
              type: 'suspicious_network_activity',
              message: `Process ${process.name} has unusual network connections`,
              details: { process, connections: unusualConnections }
            });
          }
        }
      }

      if (result.alerts.length > 0) {
        result.status = 'alert';
      }

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Monitora segurança de rede
   */
  async monitorNetworkSecurity() {
    const result = {
      status: 'normal',
      alerts: [],
      connections: [],
      suspiciousActivity: []
    };

    try {
      const connections = await this.getNetworkConnections();
      result.connections = connections;

      // Check for suspicious connections
      for (const conn of connections) {
        // Check for connections to known malicious IPs
        if (this.threatDatabase.has(conn.remoteAddress)) {
          result.suspiciousActivity.push({
            type: 'malicious_ip',
            connection: conn,
            timestamp: new Date().toISOString()
          });

          result.alerts.push({
            severity: 'critical',
            type: 'malicious_connection',
            message: `Connection to known malicious IP: ${conn.remoteAddress}`,
            details: conn
          });
        }

        // Check for unusual ports
        const commonPorts = [22, 80, 443, 25, 53, 110, 143, 993, 995];
        if (!commonPorts.includes(conn.localPort) && conn.state === 'LISTEN') {
          result.suspiciousActivity.push({
            type: 'unusual_port',
            connection: conn,
            timestamp: new Date().toISOString()
          });

          result.alerts.push({
            severity: 'medium',
            type: 'unusual_port_listening',
            message: `Unusual port listening: ${conn.localPort}`,
            details: conn
          });
        }
      }

      // Check for port scanning patterns
      const portScanDetected = await this.detectPortScanning(connections);
      if (portScanDetected) {
        result.alerts.push({
          severity: 'high',
          type: 'port_scanning',
          message: 'Port scanning activity detected',
          details: portScanDetected
        });
      }

      if (result.alerts.length > 0) {
        result.status = 'alert';
      }

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Verifica integridade de arquivos críticos
   */
  async checkFileIntegrity() {
    const result = {
      status: 'normal',
      alerts: [],
      modifiedFiles: [],
      newFiles: [],
      deletedFiles: []
    };

    try {
      const currentHashes = await this.getCriticalFileHashes();
      
      if (!this.systemBaseline) {
        return result; // No baseline to compare
      }

      const baselineHashes = this.systemBaseline.fileHashes;

      // Check for modified files
      for (const [filePath, currentHash] of Object.entries(currentHashes)) {
        if (baselineHashes[filePath]) {
          if (baselineHashes[filePath] !== currentHash) {
            result.modifiedFiles.push({
              path: filePath,
              oldHash: baselineHashes[filePath],
              newHash: currentHash,
              timestamp: new Date().toISOString()
            });

            result.alerts.push({
              severity: 'high',
              type: 'file_integrity_violation',
              message: `Critical file modified: ${filePath}`,
              details: { path: filePath, hashChanged: true }
            });
          }
        } else {
          result.newFiles.push({
            path: filePath,
            hash: currentHash,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Check for deleted files
      for (const filePath of Object.keys(baselineHashes)) {
        if (!currentHashes[filePath]) {
          result.deletedFiles.push({
            path: filePath,
            timestamp: new Date().toISOString()
          });

          result.alerts.push({
            severity: 'high',
            type: 'file_integrity_violation',
            message: `Critical file deleted: ${filePath}`,
            details: { path: filePath, deleted: true }
          });
        }
      }

      if (result.alerts.length > 0) {
        result.status = 'alert';
      }

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Monitora eventos de autenticação
   */
  async monitorAuthEvents() {
    const result = {
      status: 'normal',
      alerts: [],
      failedLogins: [],
      successfulLogins: [],
      privilegeEscalation: []
    };

    try {
      const authLogs = await this.getAuthLogs();
      
      for (const log of authLogs) {
        if (log.type === 'failed_login') {
          result.failedLogins.push(log);
          
          // Check for brute force patterns
          const recentFailures = authLogs.filter(l => 
            l.type === 'failed_login' && 
            l.username === log.username &&
            new Date(l.timestamp) > new Date(Date.now() - 300000) // Last 5 minutes
          );

          if (recentFailures.length >= 3) {
            result.alerts.push({
              severity: 'high',
              type: 'brute_force_attack',
              message: `Brute force attack detected for user: ${log.username}`,
              details: { attempts: recentFailures.length, user: log.username }
            });
          }
        }

        if (log.type === 'sudo' && log.success) {
          result.privilegeEscalation.push(log);
          
          result.alerts.push({
            severity: 'medium',
            type: 'privilege_escalation',
            message: `Privilege escalation: ${log.username} used sudo`,
            details: log
          });
        }
      }

      if (result.alerts.length > 0) {
        result.status = 'alert';
      }

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Analisa logs de segurança
   */
  async analyzeSecurityLogs() {
    const result = {
      status: 'normal',
      alerts: [],
      analyzedLogs: [],
      patterns: []
    };

    try {
      const securityLogs = await this.getSecurityLogs();
      
      // Analyze for common attack patterns
      const attackPatterns = [
        /SQL injection/i,
        /XSS/i,
        /directory traversal/i,
        /buffer overflow/i,
        /denial of service/i
      ];

      for (const log of securityLogs) {
        result.analyzedLogs.push(log);

        for (const pattern of attackPatterns) {
          if (pattern.test(log.message)) {
            result.patterns.push({
              type: 'attack_pattern',
              pattern: pattern.source,
              log: log,
              timestamp: new Date().toISOString()
            });

            result.alerts.push({
              severity: 'high',
              type: 'security_pattern_detected',
              message: `Attack pattern detected: ${pattern.source}`,
              details: log
            });
          }
        }
      }

      if (result.alerts.length > 0) {
        result.status = 'alert';
      }

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Monitora uso de recursos
   */
  async monitorResourceUsage() {
    const result = {
      status: 'normal',
      alerts: [],
      metrics: {}
    };

    try {
      const metrics = await this.getSystemMetrics();
      result.metrics = metrics;

      // Check disk usage
      if (metrics.diskUsage > 90) {
        result.alerts.push({
          severity: 'medium',
          type: 'high_disk_usage',
          message: `High disk usage: ${metrics.diskUsage}%`,
          details: metrics
        });
      }

      // Check load average
      if (metrics.loadAverage > os.cpus().length * 2) {
        result.alerts.push({
          severity: 'high',
          type: 'high_load_average',
          message: `High load average: ${metrics.loadAverage}`,
          details: metrics
        });
      }

      if (result.alerts.length > 0) {
        result.status = 'alert';
      }

      return result;

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Obtém snapshot dos processos
   */
  async getProcessSnapshot() {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32' ? 
        'tasklist /fo csv' : 
        'ps aux --sort=-%cpu,-%mem';

      exec(cmd, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const processes = this.parseProcessList(stdout);
        resolve(processes);
      });
    });
  }

  /**
   * Obtém conexões de rede
   */
  async getNetworkConnections() {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32' ? 
        'netstat -an' : 
        'netstat -tuln';

      exec(cmd, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const connections = this.parseNetworkConnections(stdout);
        resolve(connections);
      });
    });
  }

  /**
   * Obtém hashes de arquivos críticos
   */
  async getCriticalFileHashes() {
    const criticalPaths = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/hosts',
      '/etc/ssh/sshd_config',
      '/etc/sudoers'
    ];

    const hashes = {};
    
    for (const filePath of criticalPaths) {
      try {
        if (await fs.pathExists(filePath)) {
          const content = await fs.readFile(filePath);
          hashes[filePath] = crypto.createHash('sha256').update(content).digest('hex');
        }
      } catch (error) {
        // File might not be accessible, skip
        continue;
      }
    }

    return hashes;
  }

  /**
   * Obtém logs de autenticação
   */
  async getAuthLogs() {
    const logs = [];
    
    try {
      const authLog = '/var/log/auth.log';
      if (await fs.pathExists(authLog)) {
        const content = await fs.readFile(authLog, 'utf8');
        const lines = content.split('\n').slice(-1000); // Last 1000 lines
        
        for (const line of lines) {
          if (line.includes('Failed password') || line.includes('Accepted password') || line.includes('sudo')) {
            logs.push({
              timestamp: line.split(' ')[0] + ' ' + line.split(' ')[1] + ' ' + line.split(' ')[2],
              type: line.includes('Failed') ? 'failed_login' : 
                    line.includes('Accepted') ? 'successful_login' : 'sudo',
              message: line,
              username: this.extractUsername(line)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error reading auth logs:', error.message);
    }

    return logs;
  }

  /**
   * Obtém logs de segurança
   */
  async getSecurityLogs() {
    const logs = [];
    
    try {
      const securityLogs = [
        '/var/log/syslog',
        '/var/log/kern.log',
        '/var/log/messages'
      ];

      for (const logFile of securityLogs) {
        if (await fs.pathExists(logFile)) {
          const content = await fs.readFile(logFile, 'utf8');
          const lines = content.split('\n').slice(-500); // Last 500 lines
          
          for (const line of lines) {
            if (line.toLowerCase().includes('security') || 
                line.toLowerCase().includes('attack') ||
                line.toLowerCase().includes('intrusion')) {
              logs.push({
                timestamp: new Date().toISOString(),
                file: logFile,
                message: line
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading security logs:', error.message);
    }

    return logs;
  }

  /**
   * Obtém métricas do sistema
   */
  async getSystemMetrics() {
    const metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      loadAverage: 0
    };

    try {
      // CPU usage
      const cpuUsage = await this.getCPUUsage();
      metrics.cpuUsage = cpuUsage;

      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      metrics.memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

      // Load average
      metrics.loadAverage = os.loadavg()[0];

      // Disk usage
      const diskUsage = await this.getDiskUsage();
      metrics.diskUsage = diskUsage;

    } catch (error) {
      console.error('Error getting system metrics:', error.message);
    }

    return metrics;
  }

  /**
   * Obtém informações do sistema
   */
  async getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().length,
      networkInterfaces: os.networkInterfaces()
    };
  }

  /**
   * Inicializa banco de dados de ameaças
   */
  initializeThreatDatabase() {
    // Add some known malicious IPs (in real implementation, this would be updated from threat intelligence feeds)
    const maliciousIPs = [
      '192.168.1.100', // Example
      '10.0.0.50'      // Example
    ];

    maliciousIPs.forEach(ip => this.threatDatabase.add(ip));
  }

  /**
   * Envia alertas
   */
  async sendAlerts(alerts) {
    for (const alert of alerts) {
      // Console output
      if (this.config.alerting.channels.includes('console')) {
        const emoji = alert.severity === 'critical' ? '🚨' : 
                     alert.severity === 'high' ? '⚠️' : 
                     alert.severity === 'medium' ? '⚡' : 'ℹ️';
        console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.message}`);
      }

      // Log file
      if (this.config.alerting.channels.includes('log')) {
        const logEntry = `[${new Date().toISOString()}] [${alert.severity.toUpperCase()}] ${alert.message}\n`;
        await fs.appendFile('/var/log/security-monitor.log', logEntry);
      }

      // Webhook
      if (this.config.alerting.channels.includes('webhook') && this.config.alerting.webhookUrl) {
        try {
          await axios.post(this.config.alerting.webhookUrl, {
            alert: alert,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to send webhook alert:', error.message);
        }
      }
    }
  }

  /**
   * Gera relatório de segurança
   */
  async generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEvents: this.securityEvents.length,
        criticalAlerts: 0,
        highAlerts: 0,
        mediumAlerts: 0,
        lowAlerts: 0
      },
      trends: {},
      recommendations: []
    };

    // Count alerts by severity
    this.securityEvents.forEach(event => {
      if (event.alerts) {
        event.alerts.forEach(alert => {
          switch (alert.severity) {
            case 'critical':
              report.summary.criticalAlerts++;
              break;
            case 'high':
              report.summary.highAlerts++;
              break;
            case 'medium':
              report.summary.mediumAlerts++;
              break;
            case 'low':
              report.summary.lowAlerts++;
              break;
          }
        });
      }
    });

    // Generate recommendations
    if (report.summary.criticalAlerts > 0) {
      report.recommendations.push('Immediate investigation required for critical security events');
    }
    if (report.summary.highAlerts > 5) {
      report.recommendations.push('Consider implementing additional security controls');
    }

    return report;
  }

  // Helper methods
  parseProcessList(output) {
    const lines = output.split('\n').slice(1);
    const processes = [];

    for (const line of lines) {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/);
        processes.push({
          pid: parseInt(parts[1]),
          name: parts[10] || 'unknown',
          cpu: parseFloat(parts[2]) || 0,
          memory: parseFloat(parts[3]) || 0
        });
      }
    }

    return processes.slice(0, 50); // Top 50 processes
  }

  parseNetworkConnections(output) {
    const lines = output.split('\n');
    const connections = [];

    for (const line of lines) {
      if (line.includes('LISTEN') || line.includes('ESTABLISHED')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          connections.push({
            protocol: parts[0],
            localAddress: parts[3],
            localPort: parseInt(parts[3].split(':')[1]) || 0,
            remoteAddress: parts[4],
            remotePort: parseInt(parts[4].split(':')[1]) || 0,
            state: parts[5] || 'UNKNOWN'
          });
        }
      }
    }

    return connections;
  }

  extractUsername(logLine) {
    const match = logLine.match(/for (\w+)/);
    return match ? match[1] : 'unknown';
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 100);
    });
  }

  cpuAverage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    };
  }

  async getDiskUsage() {
    return new Promise((resolve) => {
      exec('df -h /', (error, stdout) => {
        if (error) {
          resolve(0);
          return;
        }

        const lines = stdout.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          const usage = parts[4].replace('%', '');
          resolve(parseInt(usage));
        } else {
          resolve(0);
        }
      });
    });
  }

  async detectPortScanning(connections) {
    // Simple port scanning detection
    const recentConnections = connections.filter(conn => 
      new Date(conn.timestamp) > new Date(Date.now() - 60000) // Last minute
    );

    if (recentConnections.length > 50) {
      return {
        type: 'potential_port_scan',
        connections: recentConnections.length,
        sourceIPs: [...new Set(recentConnections.map(c => c.remoteAddress))]
      };
    }

    return null;
  }
}

module.exports = SecurityMonitor;
