const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ChatwootCLIManager {
  constructor(options = {}) {
    this.binaryPath = options.binaryPath || 'chatwoot';
    this.configDir = path.join(os.homedir(), '.chatwoot');
    this.configFile = path.join(this.configDir, 'config.yaml');
    this.debug = options.debug || false;
  }

  /**
   * Executa comando chatwoot com parsing de saída
   */
  async execute(args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const cmd = spawn(this.binaryPath, args, {
        stdio: options.quiet ? 'pipe' : 'inherit',
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      if (options.captureOutput) {
        cmd.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        cmd.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      cmd.on('close', (code) => {
        if (code === 0) {
          let result = { success: true, exitCode: code };
          
          if (options.captureOutput) {
            result.stdout = stdout.trim();
            result.stderr = stderr.trim();
            
            // Parse JSON se solicitado
            if (args.includes('-o json') && stdout.trim()) {
              try {
                result.data = JSON.parse(stdout.trim());
              } catch (e) {
                result.data = stdout.trim();
              }
            }
          }
          
          resolve(result);
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });

      cmd.on('error', (error) => {
        reject(new Error(`Failed to execute chatwoot: ${error.message}`));
      });
    });
  }

  /**
   * Autenticação com Chatwoot
   */
  async authenticate(credentials) {
    const { baseUrl, apiKey, accountId } = credentials;
    
    // Validar credenciais básicas
    if (!baseUrl || !apiKey || !accountId) {
      throw new Error('Missing required credentials: baseUrl, apiKey, accountId');
    }

    // Verificar se já está autenticado
    try {
      const status = await this.getAuthStatus();
      if (status.success && status.data) {
        return { success: true, message: 'Already authenticated' };
      }
    } catch (e) {
      // Continuar com autenticação
    }

    // Criar config manualmente (interativo não funciona em script)
    const config = {
      base_url: baseUrl,
      api_key: apiKey,
      account_id: parseInt(accountId)
    };

    // Criar diretório se não existir
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Escrever config
    const yaml = require('js-yaml');
    fs.writeFileSync(this.configFile, yaml.dump(config));
    fs.chmodSync(this.configFile, '600'); // Permissões seguras

    // Verificar autenticação
    try {
      const status = await this.getAuthStatus();
      if (status.success) {
        return { success: true, message: 'Authentication successful' };
      } else {
        throw new Error('Authentication verification failed');
      }
    } catch (e) {
      // Limpar config se falhou
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
      }
      throw e;
    }
  }

  /**
   * Verificar status da autenticação
   */
  async getAuthStatus() {
    return this.execute(['auth', 'status'], { captureOutput: true });
  }

  /**
   * Logout
   */
  async logout() {
    return this.execute(['auth', 'logout']);
  }

  /**
   * Listar conversas
   */
  async listConversations(options = {}) {
    const args = ['conversation', 'list'];
    
    if (options.status) args.push('-s', options.status);
    if (options.assignee) args.push('--assignee', options.assignee);
    if (options.inbox) args.push('--inbox', options.inbox);
    if (options.labels) args.push('-l', options.labels);
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);
    if (options.quiet) args.push('-q');

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Ver detalhes da conversa
   */
  async viewConversation(conversationId, options = {}) {
    const args = ['conversation', 'view', conversationId];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Listar mensagens da conversa
   */
  async listMessages(conversationId, options = {}) {
    const args = ['message', 'list', conversationId];
    
    if (options.before) args.push('--before', options.before);
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Listar contatos
   */
  async listContacts(options = {}) {
    const args = ['contact', 'list'];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Ver detalhes do contato
   */
  async viewContact(contactId, options = {}) {
    const args = ['contact', 'view', contactId];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Buscar contatos
   */
  async searchContacts(query, options = {}) {
    const args = ['contact', 'search', query];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Listar inboxes
   */
  async listInboxes(options = {}) {
    const args = ['inbox', 'list'];
    
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Ver detalhes do inbox
   */
  async viewInbox(inboxId, options = {}) {
    const args = ['inbox', 'view', inboxId];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Listar agentes
   */
  async listAgents(options = {}) {
    const args = ['agent', 'list'];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Ver perfil
   */
  async getProfile(options = {}) {
    const args = ['profile'];
    
    if (options.output) args.push('-o', options.output);
    if (options.account) args.push('-a', options.account);

    return this.execute(args, { captureOutput: true });
  }

  /**
   * Workflow: Resumo diário do suporte
   */
  async getDailySupportSummary() {
    try {
      const authStatus = await this.getAuthStatus();
      const openConversations = await this.listConversations({ status: 'open', output: 'json' });
      const resolvedConversations = await this.listConversations({ status: 'resolved', output: 'json' });
      const agents = await this.listAgents({ output: 'json' });

      return {
        timestamp: new Date().toISOString(),
        auth: authStatus.data,
        open_conversations: openConversations.data ? openConversations.data.length : 0,
        resolved_conversations: resolvedConversations.data ? resolvedConversations.data.length : 0,
        total_agents: agents.data ? agents.data.length : 0,
        details: {
          open: openConversations.data,
          resolved: resolvedConversations.data,
          agents: agents.data
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate daily summary: ${error.message}`);
    }
  }

  /**
   * Workflow: Exportar conversas para CSV
   */
  async exportToCSV(outputDir = './exports') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    try {
      // Exportar conversas
      const conversationsResult = await this.listConversations({ output: 'csv' });
      fs.writeFileSync(`${outputDir}/conversations_${timestamp}.csv`, conversationsResult.stdout);

      // Exportar contatos
      const contactsResult = await this.listContacts({ output: 'csv' });
      fs.writeFileSync(`${outputDir}/contacts_${timestamp}.csv`, contactsResult.stdout);

      // Exportar agentes
      const agentsResult = await this.listAgents({ output: 'csv' });
      fs.writeFileSync(`${outputDir}/agents_${timestamp}.csv`, agentsResult.stdout);

      return {
        success: true,
        files: [
          `conversations_${timestamp}.csv`,
          `contacts_${timestamp}.csv`,
          `agents_${timestamp}.csv`
        ],
        directory: outputDir
      };
    } catch (error) {
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Workflow: Monitorar conversas não atribuídas
   */
  async getUnassignedConversations() {
    try {
      const allConversations = await this.listConversations({ 
        assignee: 'all', 
        output: 'json' 
      });

      if (!allConversations.data) {
        return { unassigned: [], count: 0 };
      }

      const unassigned = allConversations.data.filter(conv => !conv.assignee);

      return {
        count: unassigned.length,
        unassigned: unassigned,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get unassigned conversations: ${error.message}`);
    }
  }

  /**
   * Verificar saúde da skill
   */
  async healthCheck() {
    try {
      // Verificar se binário existe
      const which = require('child_process').spawnSync('which', ['chatwoot']);
      if (which.status !== 0) {
        return { healthy: false, error: 'chatwoot binary not found' };
      }

      // Verificar autenticação
      const authStatus = await this.getAuthStatus();
      
      return {
        healthy: true,
        authenticated: authStatus.success,
        binary_path: this.binaryPath,
        config_exists: fs.existsSync(this.configFile)
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

module.exports = ChatwootCLIManager;
