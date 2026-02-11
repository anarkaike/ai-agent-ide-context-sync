const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class WhatsAppWebMultideviceManager {
  constructor(options = {}) {
    this.binaryPath = options.binaryPath || './whatsapp';
    this.baseURL = options.baseURL || 'http://localhost:3000';
    this.auth = options.auth || null;
    this.debug = options.debug || false;
    this.process = null;
    this.isRunning = false;
  }

  /**
   * Executa comando WhatsApp
   */
  async execute(args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const cmd = spawn(this.binaryPath, args, {
        stdio: options.quiet ? 'pipe' : 'inherit',
        env: process.env,
        cwd: options.cwd || process.cwd()
      });

      let stdout = '';
      let stderr = '';

      if (options.captureOutput) {
        cmd.stdout.on('data', (data) => {
          stdout += data.toString();
          if (this.debug) console.log('WhatsApp stdout:', data.toString().trim());
        });

        cmd.stderr.on('data', (data) => {
          stderr += data.toString();
          if (this.debug) console.log('WhatsApp stderr:', data.toString().trim());
        });
      }

      cmd.on('close', (code) => {
        if (code === 0) {
          resolve({ 
            success: true, 
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        } else {
          reject(new Error(`WhatsApp command failed with exit code ${code}: ${stderr}`));
        }
      });

      cmd.on('error', (error) => {
        reject(new Error(`Failed to execute WhatsApp: ${error.message}`));
      });
    });
  }

  /**
   * Iniciar servidor REST API
   */
  async startRESTServer(options = {}) {
    const args = ['rest'];
    
    // Server flags
    if (options.host) args.push('-H', options.host);
    if (options.port) args.push('-p', options.port);
    if (options.basePath) args.push('--base-path', options.basePath);
    if (options.basicAuth) args.push('-b', options.basicAuth);
    if (options.trustedProxies) args.push('--trusted-proxies', options.trustedProxies);
    
    // Feature flags
    if (options.accountValidation !== undefined) args.push('--account-validation', options.accountValidation);
    if (options.autoDownloadMedia !== undefined) args.push('--auto-download-media', options.autoDownloadMedia);
    if (options.autoMarkRead !== undefined) args.push('--auto-mark-read', options.autoMarkRead);
    if (options.autoRejectCall !== undefined) args.push('--auto-reject-call', options.autoRejectCall);
    if (options.autoreply) args.push('--autoreply', options.autoreply);
    
    // Database flags
    if (options.dbUri) args.push('--db-uri', options.dbUri);
    if (options.dbKeysUri) args.push('--db-keys-uri', options.dbKeysUri);
    
    // Chatwoot flags
    if (options.chatwootEnabled !== undefined) args.push('--chatwoot-enabled', options.chatwootEnabled);
    if (options.chatwootDeviceId) args.push('--chatwoot-device-id', options.chatwootDeviceId);
    if (options.chatwootImportMessages !== undefined) args.push('--chatwoot-import-messages', options.chatwootImportMessages);
    if (options.chatwootDaysLimitImportMessages) args.push('--chatwoot-days-limit-import-messages', options.chatwootDaysLimitImportMessages);
    
    // Webhook flags
    if (options.webhook) args.push('-w', options.webhook);
    if (options.webhookEvents) args.push('--webhook-events', options.webhookEvents);
    if (options.webhookSecret) args.push('--webhook-secret', options.webhookSecret);
    if (options.webhookInsecureSkipVerify !== undefined) args.push('--webhook-insecure-skip-verify', options.webhookInsecureSkipVerify);
    
    // System flags
    if (options.os) args.push('--os', options.os);
    if (options.debug) args.push('-d', 'true');

    return new Promise((resolve, reject) => {
      this.process = spawn(this.binaryPath, args, {
        stdio: 'inherit',
        env: process.env
      });

      this.process.on('close', (code) => {
        this.isRunning = false;
        if (code === 0) {
          resolve({ success: true, message: 'Server stopped gracefully' });
        } else {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      this.process.on('error', (error) => {
        this.isRunning = false;
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Wait a moment and check if server is responsive
      setTimeout(async () => {
        try {
          await this.checkConnection();
          this.isRunning = true;
          resolve({ 
            success: true, 
            message: 'Server started successfully',
            pid: this.process.pid,
            url: this.baseURL
          });
        } catch (e) {
          // Server might still be starting, give more time
          setTimeout(async () => {
            try {
              await this.checkConnection();
              this.isRunning = true;
              resolve({ 
                success: true, 
                message: 'Server started successfully',
                pid: this.process.pid,
                url: this.baseURL
              });
            } catch (e) {
              reject(new Error('Server started but not responding'));
            }
          }, 5000);
        }
      }, 3000);
    });
  }

  /**
   * Iniciar servidor MCP
   */
  async startMCPServer(options = {}) {
    const args = ['mcp'];
    
    // Add common flags
    if (options.debug) args.push('-d', 'true');
    if (options.dbUri) args.push('--db-uri', options.dbUri);
    if (options.dbKeysUri) args.push('--db-keys-uri', options.dbKeysUri);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Verificar conexão com API
   */
  async checkConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/status`, {
        timeout: 5000,
        auth: this.auth
      });
      return { connected: true, status: response.data };
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Obter QR Code para conexão
   */
  async getQRCode() {
    try {
      const response = await axios.get(`${this.baseURL}/qr`, {
        timeout: 10000,
        auth: this.auth,
        responseType: 'arraybuffer'
      });
      
      return {
        success: true,
        qrCode: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      throw new Error(`Failed to get QR code: ${error.message}`);
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(receiver, message) {
    try {
      const response = await axios.post(`${this.baseURL}/sendMessage`, {
        receiver: receiver,
        message: message
      }, {
        timeout: 10000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Enviar mídia
   */
  async sendMedia(receiver, mediaPath, caption = '') {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('receiver', receiver);
      form.append('file', fs.createReadStream(mediaPath));
      if (caption) form.append('caption', caption);

      const response = await axios.post(`${this.baseURL}/sendMedia`, form, {
        timeout: 30000,
        auth: this.auth,
        headers: form.getHeaders()
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to send media: ${error.message}`);
    }
  }

  /**
   * Enviar localização
   */
  async sendLocation(receiver, latitude, longitude, name = '', address = '') {
    try {
      const response = await axios.post(`${this.baseURL}/sendLocation`, {
        receiver: receiver,
        latitude: latitude,
        longitude: longitude,
        name: name,
        address: address
      }, {
        timeout: 10000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to send location: ${error.message}`);
    }
  }

  /**
   * Enviar contato
   */
  async sendContact(receiver, name, phoneNumber) {
    try {
      const response = await axios.post(`${this.baseURL}/sendContact`, {
        receiver: receiver,
        name: name,
        phoneNumber: phoneNumber
      }, {
        timeout: 10000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to send contact: ${error.message}`);
    }
  }

  /**
   * Criar grupo
   */
  async createGroup(groupName, participantJids) {
    try {
      const response = await axios.post(`${this.baseURL}/createGroup`, {
        groupName: groupName,
        participantJids: participantJids
      }, {
        timeout: 15000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Adicionar participantes ao grupo
   */
  async addParticipants(groupJid, participantJids) {
    try {
      const response = await axios.post(`${this.baseURL}/addParticipants`, {
        groupJid: groupJid,
        participantJids: participantJids
      }, {
        timeout: 15000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to add participants: ${error.message}`);
    }
  }

  /**
   * Remover participantes do grupo
   */
  async removeParticipants(groupJid, participantJids) {
    try {
      const response = await axios.post(`${this.baseURL}/removeParticipants`, {
        groupJid: groupJid,
        participantJids: participantJids
      }, {
        timeout: 15000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to remove participants: ${error.message}`);
    }
  }

  /**
   * Promover participantes a admin
   */
  async promoteParticipants(groupJid, participantJids) {
    try {
      const response = await axios.post(`${this.baseURL}/promoteParticipants`, {
        groupJid: groupJid,
        participantJids: participantJids
      }, {
        timeout: 15000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to promote participants: ${error.message}`);
    }
  }

  /**
   * Rebaixar participantes
   */
  async demoteParticipants(groupJid, participantJids) {
    try {
      const response = await axios.post(`${this.baseURL}/demoteParticipants`, {
        groupJid: groupJid,
        participantJids: participantJids
      }, {
        timeout: 15000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to demote participants: ${error.message}`);
    }
  }

  /**
   * Obter informações do grupo
   */
  async getGroupInfo(groupJid) {
    try {
      const response = await axios.get(`${this.baseURL}/groupInfo/${groupJid}`, {
        timeout: 10000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to get group info: ${error.message}`);
    }
  }

  /**
   * Sair do grupo
   */
  async leaveGroup(groupJid) {
    try {
      const response = await axios.post(`${this.baseURL}/leaveGroup`, {
        groupJid: groupJid
      }, {
        timeout: 10000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to leave group: ${error.message}`);
    }
  }

  /**
   * Logout do WhatsApp
   */
  async logout() {
    try {
      const response = await axios.post(`${this.baseURL}/logout`, {}, {
        timeout: 10000,
        auth: this.auth
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  }

  /**
   * Parar servidor
   */
  async stopServer() {
    if (this.process && this.isRunning) {
      this.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      return new Promise((resolve) => {
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
          this.isRunning = false;
          resolve({ success: true, message: 'Server stopped' });
        }, 5000);
      });
    }
    
    return { success: true, message: 'Server not running' };
  }

  /**
   * Workflow: Iniciar com integração Chatwoot
   */
  async startWithChatwoot(chatwootOptions = {}) {
    const options = {
      host: '0.0.0.0',
      port: '3000',
      chatwootEnabled: 'true',
      chatwootDeviceId: chatwootOptions.deviceId || 'whatsapp-device-01',
      chatwootImportMessages: 'true',
      chatwootDaysLimitImportMessages: chatwootOptions.daysLimit || '7',
      webhook: chatwootOptions.webhookUrl,
      webhookSecret: chatwootOptions.webhookSecret || 'secret',
      debug: true,
      ...chatwootOptions
    };

    return this.startRESTServer(options);
  }

  /**
   * Workflow: Setup de produção
   */
  async startProduction(productionOptions = {}) {
    const options = {
      host: '127.0.0.1',
      port: productionOptions.port || '8080',
      basicAuth: productionOptions.basicAuth,
      trustedProxies: productionOptions.trustedProxies || '127.0.0.1/32',
      webhookSecret: productionOptions.webhookSecret || 'production-secret',
      accountValidation: 'true',
      autoDownloadMedia: 'false',
      debug: false,
      ...productionOptions
    };

    return this.startRESTServer(options);
  }

  /**
   * Verificar saúde da skill
   */
  async healthCheck() {
    try {
      // Check binary
      const fs = require('fs');
      if (!fs.existsSync(this.binaryPath)) {
        return { healthy: false, error: 'WhatsApp binary not found' };
      }

      // Check server
      if (this.isRunning) {
        try {
          const status = await this.checkConnection();
          return { 
            healthy: true, 
            server_running: true,
            connection_status: status,
            pid: this.process ? this.process.pid : null
          };
        } catch (e) {
          return { 
            healthy: false, 
            server_running: true,
            error: 'Server running but not responding',
            pid: this.process ? this.process.pid : null
          };
        }
      }

      return { 
        healthy: true, 
        server_running: false,
        message: 'Ready to start'
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

module.exports = WhatsAppWebMultideviceManager;
