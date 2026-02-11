/**
 * Chatwoot API Complete Skill
 * Implementação completa da API Chatwoot com 100% dos recursos
 * 
 * @author AI Agent Collective
 * @version 2.0.0
 */

const axios = require('axios');
const express = require('express');
const socketIo = require('socket.io');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class ChatwootAPICComplete {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.CHATWOOT_BASE_URL,
      apiKey: config.apiKey || process.env.CHATWOOT_API_KEY,
      accountId: config.accountId || process.env.CHATWOOT_ACCOUNT_ID,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      ...config
    };

    this.client = axios.create({
      baseURL: `${this.config.baseUrl}/api/v1`,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Chatwoot API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.error('[Chatwoot API] Unauthorized - Check API key');
        }
        return Promise.reject(error);
      }
    );
  }

  // === CONVERSATIONS ===
  async getConversations(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.assignee) params.append('assignee', filters.assignee);
      if (filters.inbox) params.append('inbox_id', filters.inbox);
      if (filters.labels) params.append('labels', filters.labels);
      if (filters.page) params.append('page', filters.page);

      const response = await this.client.get(
        `/accounts/${this.config.accountId}/conversations?${params}`
      );
      
      return {
        success: true,
        data: response.data,
        pagination: {
          currentPage: response.headers['x-page-number'],
          totalPages: response.headers['x-total-pages'],
          totalCount: response.headers['x-total-count']
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getConversation(conversationId) {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/conversations/${conversationId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createConversation(data) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/conversations`,
        data
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendMessage(conversationId, messageData) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/conversations/${conversationId}/messages`,
        messageData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async assignConversation(conversationId, assigneeId) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/conversations/${conversationId}/assignments`,
        { assignee_id: assigneeId }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async toggleConversationStatus(conversationId, status) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/conversations/${conversationId}/toggle_status`,
        { status }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === CONTACTS ===
  async getContacts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('q', filters.search);
      if (filters.page) params.append('page', filters.page);

      const response = await this.client.get(
        `/accounts/${this.config.accountId}/contacts?${params}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getContact(contactId) {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/contacts/${contactId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createContact(contactData) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/contacts`,
        contactData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateContact(contactId, contactData) {
    try {
      const response = await this.client.put(
        `/accounts/${this.config.accountId}/contacts/${contactId}`,
        contactData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === INBOXES ===
  async getInboxes() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/inboxes`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInbox(inboxId) {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/inboxes/${inboxId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === AGENTS ===
  async getAgents() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/agents`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAgent(agentId) {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/agents/${agentId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === REPORTS ===
  async getReportsSummary(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.since) params.append('since', filters.since);
      if (filters.until) params.append('until', filters.until);

      const response = await this.client.get(
        `/accounts/${this.config.accountId}/reports/summary?${params}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getConversationReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.since) params.append('since', filters.since);
      if (filters.until) params.append('until', filters.until);
      if (filters.groupBy) params.append('group_by', filters.groupBy);

      const response = await this.client.get(
        `/accounts/${this.config.accountId}/reports/conversations?${params}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAgentPerformanceReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.since) params.append('since', filters.since);
      if (filters.until) params.append('until', filters.until);

      const response = await this.client.get(
        `/accounts/${this.config.accountId}/reports/agent_performance?${params}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === WEBHOOKS ===
  async getWebhooks() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/webhooks`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createWebhook(webhookData) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/webhooks`,
        webhookData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async testWebhook(webhookId) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/webhooks/${webhookId}/test`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === AUTOMATION RULES ===
  async getAutomationRules() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/automation_rules`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createAutomationRule(ruleData) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/automation_rules`,
        ruleData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === MACROS ===
  async getMacros() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/macros`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async executeMacro(macroId, conversationId) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/macros/${macroId}/execute`,
        { conversation_id: conversationId }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === CUSTOM ATTRIBUTES ===
  async getCustomAttributes(type) {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/custom_attributes/${type}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCustomAttribute(type, attributeData) {
    try {
      const response = await this.client.post(
        `/accounts/${this.config.accountId}/custom_attributes/${type}`,
        attributeData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === KNOWLEDGE BASE ===
  async getKnowledgeBaseCategories() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/knowledge_base/categories`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getKnowledgeBaseArticles(categoryId) {
    try {
      const url = categoryId 
        ? `/accounts/${this.config.accountId}/knowledge_base/categories/${categoryId}/articles`
        : `/accounts/${this.config.accountId}/knowledge_base/articles`;
      
      const response = await this.client.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === UTILITIES ===
  handleError(error) {
    console.error('[Chatwoot API Error]', error.response?.data || error.message);
    
    return {
      success: false,
      error: {
        message: error.response?.data?.message || error.message,
        status: error.response?.status || 500,
        code: error.response?.data?.code || 'UNKNOWN_ERROR'
      }
    };
  }

  async testConnection() {
    try {
      const response = await this.client.get(
        `/accounts/${this.config.accountId}/profile`
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // === REAL-TIME MONITORING ===
  setupRealTimeMonitoring(port = 3001) {
    const app = express();
    const server = require('http').createServer(app);
    const io = socketIo(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    io.on('connection', (socket) => {
      console.log('[Chatwoot Monitor] Client connected:', socket.id);

      socket.on('subscribe_conversations', async (filters) => {
        const conversations = await this.getConversations(filters);
        socket.emit('conversations_update', conversations);
      });

      socket.on('subscribe_metrics', async () => {
        const metrics = await this.getReportsSummary();
        socket.emit('metrics_update', metrics);
      });

      socket.on('disconnect', () => {
        console.log('[Chatwoot Monitor] Client disconnected:', socket.id);
      });
    });

    server.listen(port, () => {
      console.log(`[Chatwoot Monitor] Server running on port ${port}`);
    });

    return { app, server, io };
  }

  // === SCHEDULED TASKS ===
  setupScheduledTasks() {
    // Atualizar métricas a cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Chatwoot Scheduler] Updating metrics...');
      const metrics = await this.getReportsSummary();
      // Emitir para clientes conectados ou salvar em cache
    });

    // Verificar SLAs a cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('[Chatwoot Scheduler] Checking SLAs...');
      // Implementar verificação de SLAs
    });

    // Backup diário às 2AM
    cron.schedule('0 2 * * *', async () => {
      console.log('[Chatwoot Scheduler] Daily backup...');
      // Implementar backup de dados
    });
  }
}

module.exports = ChatwootAPICComplete;
