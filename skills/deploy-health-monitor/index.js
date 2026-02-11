#!/usr/bin/env node

/**
 * Deploy Health Monitor - Skill de diagnóstico automatizado
 * Verifica saúde de ambientes de deploy com diagnóstico preciso
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeployHealthMonitor {
  constructor(options = {}) {
    this.environments = options.environments || [
      'https://alphaclinics.servinder.com.br',
      'https://hmg.alphaclinics.servinder.com.br',
      'https://dev.alphaclinics.servinder.com.br'
    ];
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 3;
    this.verbose = options.verbose || false;
    this.results = [];
  }

  async checkEnvironment(url) {
    const result = {
      url,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: {}
    };

    try {
      // 1. DNS Resolution
      result.checks.dns = await this.checkDNS(url);
      
      // 2. Network Connectivity
      result.checks.connectivity = await this.checkConnectivity(url);
      
      // 3. HTTP Status
      result.checks.http = await this.checkHTTP(url);
      
      // 4. SSL Certificate (se HTTPS)
      if (url.startsWith('https://')) {
        result.checks.ssl = await this.checkSSL(url);
      }
      
      // 5. Response Content Analysis
      result.checks.content = await this.checkContent(url);
      
      // 6. Port Scanning
      result.checks.ports = await this.checkPorts(url);
      
      // Determinar status geral
      result.status = this.determineStatus(result.checks);
      
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      this.log(`❌ Erro ao verificar ${url}: ${error.message}`);
    }

    return result;
  }

  async checkDNS(url) {
    const hostname = new URL(url).hostname;
    
    try {
      const { stdout } = execSync(`nslookup ${hostname}`, { encoding: 'utf8' });
      
      return {
        status: 'success',
        hostname,
        ip: this.extractIP(stdout),
        details: stdout.trim()
      };
    } catch (error) {
      return {
        status: 'error',
        hostname,
        error: error.message
      };
    }
  }

  async checkConnectivity(url) {
    const hostname = new URL(url).hostname;
    
    try {
      const { stdout } = execSync(`ping -c 3 ${hostname}`, { encoding: 'utf8' });
      
      return {
        status: 'success',
        reachable: true,
        stats: this.parsePingStats(stdout),
        details: stdout.trim()
      };
    } catch (error) {
      return {
        status: 'error',
        reachable: false,
        error: error.message
      };
    }
  }

  async checkHTTP(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https://') ? https : http;
      
      const req = protocol.request(url, { timeout: this.timeout }, (res) => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          status: 'success',
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          responseTime,
          headers: res.headers,
          server: res.headers['server'] || 'unknown'
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 'error',
          error: error.message,
          responseTime: Date.now() - startTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'timeout',
          error: 'Request timeout',
          responseTime: Date.now() - startTime
        });
      });

      req.end();
    });
  }

  async checkSSL(url) {
    const hostname = new URL(url).hostname;
    
    try {
      const { stdout } = execSync(
        `echo | openssl s_client -servername ${hostname} -connect ${hostname}:443 2>/dev/null | openssl x509 -noout -dates`,
        { encoding: 'utf8' }
      );
      
      const dates = this.parseSSLDates(stdout);
      
      return {
        status: 'success',
        valid: true,
        ...dates,
        details: stdout.trim()
      };
    } catch (error) {
      return {
        status: 'error',
        valid: false,
        error: error.message
      };
    }
  }

  async checkContent(url) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https://') ? https : http;
      
      const req = protocol.request(url, { timeout: this.timeout }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const analysis = this.analyzeContent(data, res.statusCode);
          
          resolve({
            status: 'success',
            contentLength: data.length,
            contentType: res.headers['content-type'] || 'unknown',
            ...analysis
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 'error',
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'timeout',
          error: 'Content request timeout'
        });
      });

      req.end();
    });
  }

  async checkPorts(url) {
    const hostname = new URL(url).hostname;
    const ports = [80, 443, 8080, 3000];
    const results = {};
    
    for (const port of ports) {
      try {
        const { stdout } = execSync(
          `nc -zvw3 ${hostname} ${port} 2>&1`,
          { encoding: 'utf8' }
        );
        
        results[port] = {
          open: stdout.includes('succeeded'),
          details: stdout.trim()
        };
      } catch (error) {
        results[port] = {
          open: false,
          details: error.message
        };
      }
    }
    
    return {
      status: 'success',
      ports: results
    };
  }

  analyzeContent(content, statusCode) {
    const analysis = {
      isHTML: false,
      hasError: false,
      errorType: null,
      framework: null,
      title: null
    };

    if (content.includes('<html')) {
      analysis.isHTML = true;
      
      // Detectar erros comuns
      if (content.includes('502 Bad Gateway')) {
        analysis.hasError = true;
        analysis.errorType = '502_bad_gateway';
      } else if (content.includes('503 Service Unavailable')) {
        analysis.hasError = true;
        analysis.errorType = '503_service_unavailable';
      } else if (content.includes('404 Not Found')) {
        analysis.hasError = true;
        analysis.errorType = '404_not_found';
      } else if (content.includes('500 Internal Server Error')) {
        analysis.hasError = true;
        analysis.errorType = '500_internal_error';
      }
      
      // Detectar frameworks
      if (content.includes('react') || content.includes('React')) {
        analysis.framework = 'react';
      } else if (content.includes('vue') || content.includes('Vue')) {
        analysis.framework = 'vue';
      } else if (content.includes('angular') || content.includes('Angular')) {
        analysis.framework = 'angular';
      } else if (content.includes('laravel') || content.includes('Laravel')) {
        analysis.framework = 'laravel';
      }
      
      // Extrair título
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        analysis.title = titleMatch[1];
      }
    }

    return analysis;
  }

  determineStatus(checks) {
    // Se algum check crítico falhar, marcar como down
    if (checks.http?.statusCode >= 500) {
      return 'critical';
    }
    
    if (checks.http?.statusCode >= 400) {
      return 'warning';
    }
    
    if (checks.dns?.status === 'error' || checks.connectivity?.status === 'error') {
      return 'critical';
    }
    
    if (checks.ssl?.status === 'error') {
      return 'warning';
    }
    
    // Verificar se todos os checks estão OK
    const allChecks = Object.values(checks);
    const successChecks = allChecks.filter(check => check.status === 'success');
    
    if (successChecks.length === allChecks.length) {
      return 'healthy';
    }
    
    return 'degraded';
  }

  extractIP(nslookupOutput) {
    const match = nslookupOutput.match(/Address: (.+)/);
    return match ? match[1].trim() : 'unknown';
  }

  parsePingStats(pingOutput) {
    const lines = pingOutput.split('\n');
    const statsLine = lines.find(line => line.includes('ping statistics'));
    
    if (!statsLine) return null;
    
    const packetMatch = pingOutput.match(/(\d+) packets transmitted, (\d+) received, (\d+)% packet loss/);
    const rttMatch = pingOutput.match(/rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
    
    return {
      packets: {
        transmitted: packetMatch ? parseInt(packetMatch[1]) : 0,
        received: packetMatch ? parseInt(packetMatch[2]) : 0,
        lossPercent: packetMatch ? parseInt(packetMatch[3]) : 0
      },
      rtt: rttMatch ? {
        min: parseFloat(rttMatch[1]),
        avg: parseFloat(rttMatch[2]),
        max: parseFloat(rttMatch[3]),
        mdev: parseFloat(rttMatch[4])
      } : null
    };
  }

  parseSSLDates(sslOutput) {
    const notBeforeMatch = sslOutput.match(/notBefore=(.+)/);
    const notAfterMatch = sslOutput.match(/notAfter=(.+)/);
    
    return {
      notBefore: notBeforeMatch ? notBeforeMatch[1].trim() : null,
      notAfter: notAfterMatch ? notAfterMatch[1].trim() : null,
      daysUntilExpiry: this.calculateDaysUntilExpiry(notAfterMatch ? notAfterMatch[1] : null)
    };
  }

  calculateDaysUntilExpiry(notAfter) {
    if (!notAfter) return null;
    
    try {
      const expiry = new Date(notAfter);
      const now = new Date();
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return null;
    }
  }

  async runAllChecks() {
    this.log('🔍 Iniciando verificação de saúde dos ambientes...');
    
    for (const url of this.environments) {
      this.log(`\n📡 Verificando ${url}...`);
      const result = await this.checkEnvironment(url);
      this.results.push(result);
      this.displayResult(result);
    }
    
    this.displaySummary();
    return this.results;
  }

  displayResult(result) {
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      degraded: '🟡',
      critical: '❌',
      error: '💥',
      unknown: '❓'
    };
    
    console.log(`\n${statusEmoji[result.status]} ${result.url}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    if (result.checks.dns) {
      console.log(`   DNS: ${result.checks.dns.status} (${result.checks.dns.ip || 'N/A'})`);
    }
    
    if (result.checks.http) {
      console.log(`   HTTP: ${result.checks.http.statusCode} (${result.checks.http.responseTime}ms)`);
    }
    
    if (result.checks.content?.hasError) {
      console.log(`   Erro: ${result.checks.content.errorType}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  displaySummary() {
    const summary = {
      healthy: 0,
      warning: 0,
      degraded: 0,
      critical: 0,
      error: 0,
      unknown: 0
    };
    
    this.results.forEach(result => {
      summary[result.status]++;
    });
    
    console.log('\n📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(50));
    console.log(`✅ Healthy: ${summary.healthy}`);
    console.log(`⚠️ Warning: ${summary.warning}`);
    console.log(`🟡 Degraded: ${summary.degraded}`);
    console.log(`❌ Critical: ${summary.critical}`);
    console.log(`💥 Error: ${summary.error}`);
    console.log(`❓ Unknown: ${summary.unknown}`);
    
    // Gerar recomendações
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('\n💡 RECOMENDAÇÕES AUTOMÁTICAS');
    console.log('='.repeat(50));
    
    const criticalIssues = this.results.filter(r => r.status === 'critical' || r.status === 'error');
    const warningIssues = this.results.filter(r => r.status === 'warning');
    
    if (criticalIssues.length > 0) {
      console.log('🚨 ISSUES CRÍTICOS DETECTADOS:');
      criticalIssues.forEach(result => {
        console.log(`   • ${result.url}: ${this.getCriticalRecommendation(result)}`);
      });
    }
    
    if (warningIssues.length > 0) {
      console.log('⚠️ ISSUES DE AVISO:');
      warningIssues.forEach(result => {
        console.log(`   • ${result.url}: ${this.getWarningRecommendation(result)}`);
      });
    }
    
    if (criticalIssues.length === 0 && warningIssues.length === 0) {
      console.log('🎉 Todos os ambientes estão funcionando normalmente!');
    }
    
    // Salvar relatório detalhado
    this.saveDetailedReport();
  }

  getCriticalRecommendation(result) {
    if (result.checks.http?.statusCode === 502) {
      return '502 Bad Gateway - Verificar se o application server está rodando';
    }
    
    if (result.checks.dns?.status === 'error') {
      return 'DNS Error - Verificar configuração de DNS';
    }
    
    if (result.checks.connectivity?.status === 'error') {
      return 'Connectivity Error - Verificar firewall/rede';
    }
    
    return 'Investigar logs do servidor e aplicação';
  }

  getWarningRecommendation(result) {
    if (result.checks.ssl?.status === 'error') {
      return 'SSL Certificate Issue - Renovar certificado';
    }
    
    if (result.checks.http?.statusCode >= 400) {
      return `HTTP ${result.checks.http.statusCode} - Verificar configuração da aplicação`;
    }
    
    return 'Monitorar ambiente de perto';
  }

  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        healthy: this.results.filter(r => r.status === 'healthy').length,
        warning: this.results.filter(r => r.status === 'warning').length,
        degraded: this.results.filter(r => r.status === 'degraded').length,
        critical: this.results.filter(r => r.status === 'critical').length,
        error: this.results.filter(r => r.status === 'error').length
      },
      environments: this.results
    };
    
    const reportPath = path.join(__dirname, `health-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    timeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1]) || 10000,
    retries: parseInt(args.find(arg => arg.startsWith('--retries='))?.split('=')[1]) || 3
  };
  
  // Custom environments
  const envIndex = args.findIndex(arg => arg === '--environments');
  if (envIndex !== -1 && args[envIndex + 1]) {
    options.environments = args[envIndex + 1].split(',');
  }
  
  const monitor = new DeployHealthMonitor(options);
  
  monitor.runAllChecks()
    .then(() => {
      console.log('\n✅ Verificação concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante verificação:', error.message);
      process.exit(1);
    });
}

module.exports = DeployHealthMonitor;
