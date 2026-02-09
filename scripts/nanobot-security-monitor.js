#!/usr/bin/env node

/**
 * Nanobot Security Monitor
 * Agente especializado em monitoramento de segurança
 * https://github.com/nanobot-ai/nanobot
 */

const { Nanobot } = require('./nanobot-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityMonitorBot extends Nanobot {
  constructor() {
    super({
      name: 'security-monitor',
      version: '1.0.0',
      network: 'trust-network-ai-agent',
      description: 'Nanobot especializado em monitoramento de segurança e detecção de ameaças'
    });

    // Registra capacidades
    this.addCapability('threat-detection');
    this.addCapability('vulnerability-scanner');
    this.addCapability('log-analysis');
    this.addCapability('security-audit');

    // Configurações de segurança
    this.securityConfig = {
      logPaths: [
        '/var/log/auth.log',
        '/var/log/secure',
        '/var/log/kern.log',
        '/var/log/syslog'
      ],
      threatPatterns: [
        /failed login/i,
        /authentication failure/i,
        /invalid user/i,
        /brute force/i,
        /port scan/i,
        /malware/i,
        /intrusion/i
      ],
      criticalFiles: [
        '/etc/passwd',
        '/etc/shadow',
        '/etc/sudoers',
        '/etc/ssh/sshd_config'
      ]
    };

    this.alerts = [];
    this.vulnerabilities = [];
  }

  async initialize() {
    await super.initialize();
    await this.register('trust-network-ai-agent');
    await this.loadSecurityKnowledge();

    this.log('Security Monitor Bot inicializado na rede de confiança');
  }

  async loadSecurityKnowledge() {
    // Carrega conhecimento de segurança compartilhado
    const securityPolicies = await this.getKnowledge('security-policies') || {
      maxFailedLogins: 5,
      suspiciousPorts: [22, 23, 80, 443, 3389],
      malwareSignatures: ['trojan', 'backdoor', 'rootkit'],
      alertThresholds: {
        cpuUsage: 90,
        memoryUsage: 95,
        diskUsage: 90
      }
    };

    this.securityPolicies = securityPolicies;
    await this.shareKnowledge('security-policies', securityPolicies);
  }

  async performSecurityScan() {
    this.log('Iniciando varredura de segurança...');

    const scan = {
      timestamp: new Date().toISOString(),
      systemIntegrity: await this.checkSystemIntegrity(),
      networkConnections: await this.analyzeNetworkConnections(),
      authenticationLogs: await this.analyzeAuthLogs(),
      vulnerabilities: await this.scanVulnerabilities(),
      resourceUsage: await this.checkResourceUsage()
    };

    // Analisa resultados
    const threats = await this.detectThreats(scan);

    const report = {
      scan: scan,
      threats: threats,
      alerts: this.alerts,
      recommendations: this.generateSecurityRecommendations(scan, threats)
    };

    // Compartilha relatório na rede
    await this.shareKnowledge('security-scan', report);

    return report;
  }

  async checkSystemIntegrity() {
    const integrity = {
      criticalFiles: {},
      setuidFiles: [],
      suspiciousProcesses: []
    };

    // Verifica arquivos críticos
    for (const file of this.securityConfig.criticalFiles) {
      try {
        const stats = fs.statSync(file);
        const checksum = execSync(`md5sum ${file}`, { encoding: 'utf8' }).split(' ')[0];

        integrity.criticalFiles[file] = {
          exists: true,
          permissions: stats.mode.toString(8),
          owner: stats.uid,
          size: stats.size,
          checksum: checksum,
          modified: stats.mtime
        };
      } catch (error) {
        integrity.criticalFiles[file] = {
          exists: false,
          error: error.message
        };
      }
    }

    // Verifica arquivos SUID
    try {
      const suidFiles = execSync('find / -type f -perm -4000 2>/dev/null', { encoding: 'utf8' });
      integrity.setuidFiles = suidFiles.trim().split('\n').filter(f => f);
    } catch (error) {
      // Ignora erros
    }

    // Detecta processos suspeitos
    try {
      const processes = execSync('ps aux', { encoding: 'utf8' });
      const lines = processes.split('\n');

      for (const line of lines) {
        if (this.isSuspiciousProcess(line)) {
          integrity.suspiciousProcesses.push(line.trim());
        }
      }
    } catch (error) {
      // Ignora erros
    }

    return integrity;
  }

  async analyzeNetworkConnections() {
    try {
      // Tenta diferentes comandos para analisar conexões
      let connections;
      try {
        connections = execSync('netstat -tuln', { encoding: 'utf8' });
      } catch (error) {
        // Fallback para ss se netstat não estiver disponível
        try {
          connections = execSync('ss -tuln', { encoding: 'utf8' });
        } catch (ssError) {
          // Fallback para /proc/net/tcp
          try {
            const tcp = execSync('cat /proc/net/tcp', { encoding: 'utf8' });
            const udp = execSync('cat /proc/net/udp', { encoding: 'utf8' });
            connections = tcp + '\n' + udp;
          } catch (procError) {
            this.warn('Não foi possível obter informações de conexões de rede');
            return {
              listeningPorts: [],
              establishedConnections: [],
              suspiciousPorts: [],
              error: 'Comandos de rede não disponíveis'
            };
          }
        }
      }

      const lines = connections.split('\n');

      const analysis = {
        listeningPorts: [],
        establishedConnections: [],
        suspiciousPorts: []
      };

      for (const line of lines) {
        if (line.includes('LISTEN') || line.includes('tcp') || line.includes('udp')) {
          const parts = line.trim().split(/\s+/);
          let address, port;

          // Parse baseado no formato da saída
          if (line.includes('LISTEN')) {
            // Formato netstat/ss
            if (parts.length >= 4) {
              address = parts[3];
              port = parseInt(address.split(':').pop());
            }
          } else {
            // Formato /proc/net
            if (parts.length >= 2) {
              const addrPort = parts[1];
              const hexPort = parseInt(addrPort.split(':')[1], 16);
              port = hexPort;
              address = `0.0.0.0:${port}`;
            }
          }

          if (port && !isNaN(port)) {
            const protocol = parts[0] || 'tcp';

            analysis.listeningPorts.push({
              address: address,
              port: port,
              protocol: protocol
            });

            // Verifica portas suspeitas
            if (this.securityPolicies.suspiciousPorts.includes(port)) {
              analysis.suspiciousPorts.push({
                address: address,
                port: port,
                risk: 'high'
              });
            }
          }
        }
      }

      return analysis;
    } catch (error) {
      this.error('Erro ao analisar conexões de rede:', error);
      return {
        listeningPorts: [],
        establishedConnections: [],
        suspiciousPorts: [],
        error: error.message
      };
    }
  }

  async analyzeAuthLogs() {
    const analysis = {
      failedLogins: [],
      suspiciousIPs: new Map(),
      bruteForceAttempts: []
    };

    for (const logPath of this.securityConfig.logPaths) {
      try {
        if (fs.existsSync(logPath)) {
          const logs = execSync(`tail -100 ${logPath}`, { encoding: 'utf8' });
          const lines = logs.split('\n');

          for (const line of lines) {
            // Detecta falhas de login
            for (const pattern of this.securityConfig.threatPatterns) {
              if (pattern.test(line)) {
                const ip = this.extractIP(line);
                if (ip) {
                  const count = analysis.suspiciousIPs.get(ip) || 0;
                  analysis.suspiciousIPs.set(ip, count + 1);

                  if (count >= this.securityPolicies.maxFailedLogins) {
                    analysis.bruteForceAttempts.push({
                      ip: ip,
                      attempts: count + 1,
                      log: line.trim()
                    });
                  }
                }

                analysis.failedLogins.push({
                  timestamp: this.extractTimestamp(line),
                  message: line.trim()
                });
              }
            }
          }
        }
      } catch (error) {
        // Ignora erros de acesso aos logs
      }
    }

    // Converte Map para array
    analysis.suspiciousIPs = Array.from(analysis.suspiciousIPs.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count);

    return analysis;
  }

  async scanVulnerabilities() {
    const vulnerabilities = [];

    // Verifica atualizações de segurança
    try {
      const updates = execSync('apt list --upgradable 2>/dev/null | grep -i security', { encoding: 'utf8' });
      if (updates.trim()) {
        vulnerabilities.push({
          type: 'security-updates',
          severity: 'medium',
          description: 'Atualizações de segurança disponíveis',
          details: updates.trim()
        });
      }
    } catch (error) {
      // Ignora erros
    }

    // Verifica configurações inseguras
    try {
      // Verifica SSH root login
      const sshConfig = fs.readFileSync('/etc/ssh/sshd_config', 'utf8');
      if (sshConfig.includes('PermitRootLogin yes')) {
        vulnerabilities.push({
          type: 'ssh-config',
          severity: 'high',
          description: 'SSH permite login root',
          recommendation: 'Desabilitar PermitRootLogin'
        });
      }
    } catch (error) {
      // Ignora erros
    }

    // Verifica permissões de arquivos sensíveis
    try {
      const shadowPerms = fs.statSync('/etc/shadow');
      if (shadowPerms.mode.toString(8) !== '640') {
        vulnerabilities.push({
          type: 'file-permissions',
          severity: 'high',
          description: 'Permissões incorretas em /etc/shadow',
          recommendation: 'Corrigir para 640'
        });
      }
    } catch (error) {
      // Ignora erros
    }

    return vulnerabilities;
  }

  async checkResourceUsage() {
    try {
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const diskInfo = execSync('df -h /', { encoding: 'utf8' });
      const loadAvg = execSync('uptime', { encoding: 'utf8' });

      // Parse memory usage
      const memLines = memInfo.split('\n');
      const memTotal = parseInt(memLines[1].split(/\s+/)[1]);
      const memUsed = parseInt(memLines[1].split(/\s+/)[2]);
      const memUsage = (memUsed / memTotal) * 100;

      // Parse disk usage
      const diskLine = diskInfo.split('\n')[1];
      const diskUsage = parseInt(diskLine.split(/\s+/)[4]);

      // Parse load average
      const loadMatch = loadAvg.match(/load average: ([\d.]+)/);
      const loadAvg1 = parseFloat(loadMatch ? loadMatch[1] : 0);

      return {
        memoryUsage: memUsage,
        diskUsage: diskUsage,
        loadAverage: loadAvg1,
        alerts: []
      };
    } catch (error) {
      this.error('Erro ao verificar uso de recursos:', error);
      return {};
    }
  }

  async detectThreats(scan) {
    const threats = [];

    // Verifica se scan e scan.networkConnections existem
    if (!scan || !scan.networkConnections) {
      this.warn('Dados de scan incompletos, pulando detecção de ameaças');
      return threats;
    }

    // Analisa integridade do sistema
    if (scan.systemIntegrity && scan.systemIntegrity.suspiciousProcesses &&
      scan.systemIntegrity.suspiciousProcesses.length > 0) {
      threats.push({
        type: 'suspicious-process',
        severity: 'medium',
        count: scan.systemIntegrity.suspiciousProcesses.length,
        details: scan.systemIntegrity.suspiciousProcesses
      });
    }

    // Analisa tentativas de brute force
    if (scan.authenticationLogs && scan.authenticationLogs.bruteForceAttempts &&
      scan.authenticationLogs.bruteForceAttempts.length > 0) {
      threats.push({
        type: 'brute-force',
        severity: 'high',
        count: scan.authenticationLogs.bruteForceAttempts.length,
        details: scan.authenticationLogs.bruteForceAttempts
      });
    }

    // Analisa portas suspeitas
    if (scan.networkConnections && scan.networkConnections.suspiciousPorts &&
      scan.networkConnections.suspiciousPorts.length > 0) {
      threats.push({
        type: 'suspicious-ports',
        severity: 'medium',
        count: scan.networkConnections.suspiciousPorts.length,
        details: scan.networkConnections.suspiciousPorts
      });
    }

    // Analisa vulnerabilidades críticas
    if (scan.vulnerabilities && Array.isArray(scan.vulnerabilities)) {
      const criticalVulns = scan.vulnerabilities.filter(v => v.severity === 'high');
      if (criticalVulns.length > 0) {
        threats.push({
          type: 'critical-vulnerabilities',
          severity: 'critical',
          count: criticalVulns.length,
          details: criticalVulns
        });
      }
    }

    // Analisa uso de recursos
    if (scan.resourceUsage) {
      if (scan.resourceUsage.memoryUsage > this.securityPolicies.alertThresholds.memoryUsage) {
        threats.push({
          type: 'high-memory-usage',
          severity: 'medium',
          value: scan.resourceUsage.memoryUsage
        });
      }

      if (scan.resourceUsage.diskUsage > this.securityPolicies.alertThresholds.diskUsage) {
        threats.push({
          type: 'high-disk-usage',
          severity: 'medium',
          value: scan.resourceUsage.diskUsage
        });
      }
    }

    return threats;
  }

  generateSecurityRecommendations(scan, threats) {
    const recommendations = [];

    if (threats.find(t => t.type === 'brute-force')) {
      recommendations.push({
        priority: 'high',
        action: 'block-suspicious-ips',
        description: 'Bloquear IPs com tentativas de brute force'
      });
    }

    if (threats.find(t => t.type === 'critical-vulnerabilities')) {
      recommendations.push({
        priority: 'critical',
        action: 'patch-vulnerabilities',
        description: 'Aplicar patches de segurança críticos'
      });
    }

    if (scan.systemIntegrity.suspiciousProcesses.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'investigate-processes',
        description: 'Investigar processos suspeitos'
      });
    }

    if (scan.networkConnections.suspiciousPorts.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'review-firewall',
        description: 'Revisar regras de firewall'
      });
    }

    return recommendations;
  }

  // Métodos auxiliares
  isSuspiciousProcess(processLine) {
    const suspiciousPatterns = [
      /nc -l/,            // Netcat listener
      /python.*shell/,    // Python shell
      /bash -i/,          // Interactive bash
      /telnet/,           // Telnet
      /wget.*sh/,         // Download and execute script
      /curl.*sh/,         // Download and execute script
      /\/tmp\/.*\.sh/,    // Scripts in /tmp
      /\/dev\/shm/        // Executables in shared memory
    ];

    return suspiciousPatterns.some(pattern => pattern.test(processLine));
  }

  extractIP(logLine) {
    const ipMatch = logLine.match(/(\d{1,3}\.){3}\d{1,3}/);
    return ipMatch ? ipMatch[0] : null;
  }

  extractTimestamp(logLine) {
    const timestampMatch = logLine.match(/(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
    return timestampMatch ? timestampMatch[1] : null;
  }

  async run(options = {}) {
    this.log('Iniciando monitoramento de segurança...');

    const report = await this.performSecurityScan();

    // Gera alertas para ameaças críticas
    const criticalThreats = report.threats.filter(t => t.severity === 'critical');
    if (criticalThreats.length > 0) {
      await this.sendAlert('SECURITY_CRITICAL', criticalThreats);
    }

    this.log('Relatório de segurança gerado');
    return report;
  }

  async sendAlert(type, data) {
    const alert = {
      type: type,
      timestamp: new Date().toISOString(),
      agent: this.config.name,
      data: data
    };

    this.alerts.push(alert);
    this.emit('security:alert', alert);

    // Compartilha alerta na rede
    await this.shareKnowledge('security-alert', alert);

    this.warn(`ALERTA DE SEGURANÇA: ${type}`);
  }
}

// CLI interface
if (require.main === module) {
  const bot = new SecurityMonitorBot();

  bot.initialize().then(() => {
    return bot.run();
  }).then(report => {
    console.log('\n=== SECURITY MONITOR REPORT ===');
    console.log(JSON.stringify(report, null, 2));
  }).catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });
}

module.exports = SecurityMonitorBot;
