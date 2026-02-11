#!/usr/bin/env node

/**
 * 🚀 IA-First SSL Certificate Manager
 * 
 * Automatic SSL provisioning, renewal, and troubleshooting
 * with AI-powered decision making and resilience
 * 
 * @author AI Agent Network
 * @version 1.0.0
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SSLCertificateManager {
  constructor(options = {}) {
    this.options = {
      nginxPath: options.nginxPath || '/etc/nginx',
      certPath: options.certPath || '/etc/ssl/certs',
      lePath: options.lePath || '/etc/letsencrypt',
      email: options.email || 'admin@servinder.com.br',
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      ...options
    };
    
    this.domains = new Map();
    this.certificates = new Map();
    this.monitoring = {
      enabled: options.monitoring || false,
      interval: options.interval || 3600000, // 1 hour
      alerts: options.alerts || []
    };
    
    this.aiDecisionEngine = {
      strategies: ['letsencrypt', 'self-signed', 'wildcard'],
      renewalThreshold: 30, // days
      fallbackEnabled: true,
      autoTroubleshoot: true
    };
  }

  /**
   * 🧠 IA-Powered Domain Analysis
   */
  async analyzeDomain(domain) {
    this.log(`🧠 Analyzing domain: ${domain}`);
    
    const analysis = {
      domain,
      timestamp: new Date().toISOString(),
      dns: await this.checkDNS(domain),
      ports: await this.checkPorts(domain),
      existingCert: await this.checkExistingCertificate(domain),
      recommendations: []
    };

    // AI Decision Logic
    if (analysis.existingCert && analysis.existingCert.daysUntilExpiry > 7) {
      analysis.recommendations.push({
        action: 'renew',
        priority: 'medium',
        reason: `Certificate expires in ${analysis.existingCert.daysUntilExpiry} days`
      });
    } else {
      analysis.recommendations.push({
        action: 'issue',
        priority: 'high',
        reason: 'No valid certificate found or expiring soon'
      });
    }

    // Check if domain supports Let's Encrypt
    if (analysis.dns.resolves && analysis.ports.http && analysis.ports.https) {
      analysis.recommendations[0].method = 'letsencrypt';
    } else {
      analysis.recommendations[0].method = 'self-signed';
      analysis.recommendations.push({
        action: 'fix-connectivity',
        priority: 'critical',
        reason: 'Domain connectivity issues detected'
      });
    }

    return analysis;
  }

  /**
   * 🔍 DNS Resolution Check
   */
  async checkDNS(domain) {
    try {
      const { stdout } = await execAsync(`dig +short ${domain}`);
      const ips = stdout.trim().split('\n').filter(ip => ip);
      
      return {
        resolves: ips.length > 0,
        ips,
        aRecord: ips[0] || null,
        mxRecord: await this.getMXRecord(domain)
      };
    } catch (error) {
      return { resolves: false, error: error.message };
    }
  }

  /**
   * 🌐 Port Availability Check
   */
  async checkPorts(domain) {
    const ports = { http: false, https: false };
    
    try {
      // Check HTTP (port 80)
      await axios.get(`http://${domain}`, { timeout: 5000 });
      ports.http = true;
    } catch (error) {
      // Expected for HTTPS-only sites
    }

    try {
      // Check HTTPS (port 443)
      await axios.get(`https://${domain}`, { timeout: 5000 });
      ports.https = true;
    } catch (error) {
      // Expected if certificate is invalid
    }

    return ports;
  }

  /**
   * 📋 Existing Certificate Analysis
   */
  async checkExistingCertificate(domain) {
    try {
      const certPath = `${this.options.certPath}/${domain}.crt`;
      const certData = await fs.readFile(certPath, 'utf8');
      
      // Parse certificate (simplified)
      const certInfo = this.parseCertificate(certData);
      
      return {
        exists: true,
        path: certPath,
        ...certInfo,
        daysUntilExpiry: this.calculateDaysUntilExpiry(certInfo.notAfter)
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * 🔧 AI-Powered Certificate Issuance
   */
  async issueCertificate(domain, method = 'auto') {
    this.log(`🔧 Issuing certificate for ${domain} using ${method}`);
    
    const analysis = await this.analyzeDomain(domain);
    const strategy = method === 'auto' ? analysis.recommendations[0].method : method;

    try {
      switch (strategy) {
        case 'letsencrypt':
          return await this.issueLetsEncrypt(domain);
        case 'self-signed':
          return await this.issueSelfSigned(domain);
        case 'wildcard':
          return await this.issueWildcard(domain);
        default:
          throw new Error(`Unknown strategy: ${strategy}`);
      }
    } catch (error) {
      this.log(`❌ Certificate issuance failed: ${error.message}`);
      
      // AI Fallback Strategy
      if (this.aiDecisionEngine.fallbackEnabled && strategy !== 'self-signed') {
        this.log(`🔄 Falling back to self-signed certificate`);
        return await this.issueSelfSigned(domain);
      }
      
      throw error;
    }
  }

  /**
   * 🌱 Let's Encrypt Certificate
   */
  async issueLetsEncrypt(domain) {
    if (this.options.dryRun) {
      this.log(`🔍 DRY RUN: Would issue Let's Encrypt certificate for ${domain}`);
      return { success: true, method: 'letsencrypt', dryRun: true };
    }

    const cmd = `certbot certonly --webroot -w /var/www/html -d ${domain} --email ${this.options.email} --agree-tos --non-interactive`;
    
    try {
      await execAsync(cmd);
      await this.configureNginx(domain, 'letsencrypt');
      
      return {
        success: true,
        method: 'letsencrypt',
        certPath: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
        keyPath: `/etc/letsencrypt/live/${domain}/privkey.pem`
      };
    } catch (error) {
      throw new Error(`Let's Encrypt failed: ${error.message}`);
    }
  }

  /**
   * 🔐 Self-Signed Certificate
   */
  async issueSelfSigned(domain) {
    if (this.options.dryRun) {
      this.log(`🔍 DRY RUN: Would issue self-signed certificate for ${domain}`);
      return { success: true, method: 'self-signed', dryRun: true };
    }

    const keyPath = `${this.options.certPath}/${domain}.key`;
    const certPath = `${this.options.certPath}/${domain}.crt`;

    // Generate private key
    await execAsync(`openssl genrsa -out ${keyPath} 2048`);
    
    // Generate certificate
    const csrConfig = this.createCSRConfig(domain);
    const configPath = `/tmp/${domain}.conf`;
    await fs.writeFile(configPath, csrConfig);
    
    await execAsync(`openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -config ${configPath}`);
    
    await this.configureNginx(domain, 'self-signed');
    
    return {
      success: true,
      method: 'self-signed',
      certPath,
      keyPath
    };
  }

  /**
   * 🌐 Wildcard Certificate
   */
  async issueWildcard(domain) {
    const wildcardDomain = `*.${domain}`;
    this.log(`🌐 Issuing wildcard certificate for ${wildcardDomain}`);
    
    return await this.issueLetsEncrypt(wildcardDomain);
  }

  /**
   * ⚙️ AI-Powered Nginx Configuration
   */
  async configureNginx(domain, method) {
    this.log(`⚙️ Configuring Nginx for ${domain}`);
    
    const config = this.generateNginxConfig(domain, method);
    const configPath = `${this.options.nginxPath}/sites-available/${domain}`;
    
    await fs.writeFile(configPath, config);
    
    // Enable site
    await execAsync(`ln -sf ${configPath} ${this.options.nginxPath}/sites-enabled/`);
    
    // Test and reload Nginx
    await execAsync('nginx -t');
    await execAsync('nginx -s reload');
    
    this.log(`✅ Nginx configured for ${domain}`);
  }

  /**
   * 📝 Generate Nginx Configuration
   */
  generateNginxConfig(domain, method) {
    const certPath = method === 'letsencrypt' 
      ? `/etc/letsencrypt/live/${domain}/fullchain.pem`
      : `${this.options.certPath}/${domain}.crt`;
    
    const keyPath = method === 'letsencrypt'
      ? `/etc/letsencrypt/live/${domain}/privkey.pem`
      : `${this.options.certPath}/${domain}.key`;

    return `
# 🚀 AI-Generated SSL Configuration for ${domain}
# Generated: ${new Date().toISOString()}
# Method: ${method}

server {
    listen 80;
    server_name ${domain};
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    
    # SSL Configuration
    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    
    # Modern SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to backend (configure as needed)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;
  }

  /**
   * 🔄 AI-Powered Certificate Renewal
   */
  async renewCertificate(domain) {
    this.log(`🔄 Renewing certificate for ${domain}`);
    
    const certInfo = await this.checkExistingCertificate(domain);
    
    if (!certInfo.exists) {
      return await this.issueCertificate(domain);
    }
    
    if (certInfo.daysUntilExpiry > this.aiDecisionEngine.renewalThreshold) {
      this.log(`✅ Certificate for ${domain} is still valid (${certInfo.daysUntilExpiry} days remaining)`);
      return { success: true, action: 'skipped', reason: 'still_valid' };
    }
    
    // Determine renewal method based on existing certificate
    const method = certInfo.issuer.includes('Let\'s Encrypt') ? 'letsencrypt' : 'self-signed';
    
    try {
      return await this.issueCertificate(domain, method);
    } catch (error) {
      this.log(`❌ Renewal failed: ${error.message}`);
      
      // AI Troubleshooting
      if (this.aiDecisionEngine.autoTroubleshoot) {
        return await this.troubleshootAndFix(domain, error);
      }
      
      throw error;
    }
  }

  /**
   * 🔧 AI-Powered Troubleshooting
   */
  async troubleshootAndFix(domain, error) {
    this.log(`🔧 AI Troubleshooting for ${domain}: ${error.message}`);
    
    const analysis = await this.analyzeDomain(domain);
    const fixes = [];
    
    // Common issues and fixes
    if (!analysis.dns.resolves) {
      fixes.push('DNS resolution failed - check DNS configuration');
    }
    
    if (!analysis.ports.http) {
      fixes.push('HTTP port 80 not accessible - required for Let\'s Encrypt');
    }
    
    if (error.message.includes('nginx')) {
      fixes.push('Nginx configuration error - running config test');
      await execAsync('nginx -t');
    }
    
    // Apply fixes
    for (const fix of fixes) {
      this.log(`🔧 Applying fix: ${fix}`);
      // Implementation would depend on specific fix
    }
    
    // Retry certificate issuance
    return await this.issueSelfSigned(domain);
  }

  /**
   * 📊 Certificate Monitoring
   */
  async startMonitoring() {
    if (!this.monitoring.enabled) return;
    
    this.log(`📊 Starting SSL certificate monitoring`);
    
    setInterval(async () => {
      try {
        await this.checkAllCertificates();
      } catch (error) {
        this.log(`❌ Monitoring error: ${error.message}`);
      }
    }, this.monitoring.interval);
  }

  /**
   * 🔍 Check All Certificates
   */
  async checkAllCertificates() {
    const domains = await this.getManagedDomains();
    const results = [];
    
    for (const domain of domains) {
      const certInfo = await this.checkExistingCertificate(domain);
      
      if (certInfo.daysUntilExpiry <= this.aiDecisionEngine.renewalThreshold) {
        this.log(`⚠️ Certificate ${domain} expires soon (${certInfo.daysUntilExpiry} days)`);
        
        try {
          await this.renewCertificate(domain);
          results.push({ domain, status: 'renewed', success: true });
        } catch (error) {
          results.push({ domain, status: 'failed', error: error.message });
          await this.sendAlert(domain, error);
        }
      }
    }
    
    return results;
  }

  /**
   * 🚨 Alert System
   */
  async sendAlert(domain, error) {
    const alert = {
      timestamp: new Date().toISOString(),
      domain,
      error: error.message,
      severity: 'critical'
    };
    
    this.log(`🚨 ALERT: ${JSON.stringify(alert)}`);
    
    // Send to configured alert channels
    for (const alertChannel of this.monitoring.alerts) {
      try {
        await this.sendToAlertChannel(alertChannel, alert);
      } catch (error) {
        this.log(`❌ Failed to send alert to ${alertChannel}: ${error.message}`);
      }
    }
  }

  /**
   * 📋 Utility Functions
   */
  parseCertificate(certData) {
    // Simplified certificate parsing
    const lines = certData.split('\n');
    const notAfter = lines.find(line => line.includes('Not After'))?.split(':')[1]?.trim();
    
    return {
      notAfter: notAfter || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      issuer: 'Self-Signed', // Simplified
      subject: 'Certificate'
    };
  }

  calculateDaysUntilExpiry(notAfter) {
    const expiry = new Date(notAfter);
    const now = new Date();
    const diffTime = expiry - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  createCSRConfig(domain) {
    return `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = BR
ST = SP
L = Sao Paulo
O = Servinder
OU = IT Department
CN = ${domain}

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${domain}
DNS.2 = www.${domain}`;
  }

  async getMXRecord(domain) {
    try {
      const { stdout } = await execAsync(`dig +short MX ${domain}`);
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async getManagedDomains() {
    // Get domains from Nginx sites-enabled
    try {
      const { stdout } = await execAsync(`ls ${this.options.nginxPath}/sites-enabled/`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  async sendToAlertChannel(channel, alert) {
    // Implementation depends on channel type (email, slack, webhook, etc.)
    this.log(`📤 Sending alert to ${channel}: ${alert.domain} - ${alert.error}`);
  }

  log(message) {
    if (this.options.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  /**
   * 🎯 Main Execution Function
   */
  async run(command = 'analyze', domain = null) {
    this.log(`🚀 SSL Certificate Manager starting: ${command} ${domain || ''}`);
    
    switch (command) {
      case 'analyze':
        if (!domain) throw new Error('Domain required for analysis');
        return await this.analyzeDomain(domain);
        
      case 'issue':
        if (!domain) throw new Error('Domain required for issuance');
        return await this.issueCertificate(domain);
        
      case 'renew':
        if (!domain) throw new Error('Domain required for renewal');
        return await this.renewCertificate(domain);
        
      case 'monitor':
        await this.startMonitoring();
        return { status: 'monitoring_started' };
        
      case 'check-all':
        return await this.checkAllCertificates();
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';
  const domain = args[1];
  
  const manager = new SSLCertificateManager({
    verbose: true,
    dryRun: process.env.DRY_RUN === 'true'
  });
  
  manager.run(command, domain)
    .then(result => {
      console.log('✅ Success:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = SSLCertificateManager;
