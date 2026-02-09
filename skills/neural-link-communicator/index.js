/**
 * Neural Link Communicator - Nanobot Skill
 * Sistema de comunicação neural entre agentes
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class NeuralLinkCommunicatorSkill {
    constructor() {
        this.name = 'neural-link-communicator';
        this.version = '1.0.0';
        this.agentId = this.generateAgentId();
        this.dbPath = '.ai-workspace/neural-link.db';
        this.logs = [];
        this.connectedAgents = new Map();
    }

    /**
     * Executa a skill
     */
    async execute(input, context = {}) {
        const { action = 'receive', message, config = {} } = input;
        
        // Configurar agente
        this.agentId = config.agent_id || this.agentId;
        this.swarmEndpoint = config.swarm_endpoint || 'http://100.104.189.106:3456';
        this.localEndpoint = config.local_endpoint || 'http://localhost:3456';
        
        this.log(`🧠 Executando Neural Link: ${action}`);
        
        try {
            // Inicializar banco de dados
            await this.initializeDatabase();
            
            let result;
            switch (action) {
                case 'send':
                    result = await this.sendMessage(message);
                    break;
                case 'receive':
                    result = await this.receiveMessages();
                    break;
                case 'sync':
                    result = await this.syncWithSwarm();
                    break;
                case 'broadcast':
                    result = await this.broadcastMessage(message);
                    break;
                case 'history':
                    result = await this.getConversationHistory();
                    break;
                case 'register':
                    result = await this.registerAgent();
                    break;
                case 'discover':
                    result = await this.discoverAgents();
                    break;
                default:
                    throw new Error(`Ação não suportada: ${action}`);
            }
            
            return {
                success: true,
                data: result,
                agent_id: this.agentId,
                logs: this.logs
            };
            
        } catch (error) {
            this.log(`❌ Erro: ${error.message}`);
            return {
                success: false,
                error: error.message,
                logs: this.logs
            };
        }
    }

    /**
     * Gera ID único do agente
     */
    generateAgentId() {
        const hostname = os.hostname();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `${hostname}_${timestamp}_${random}`;
    }

    /**
     * Inicializa banco de dados SQLite
     */
    async initializeDatabase() {
        const sqlite3 = require('sqlite3').verbose();
        
        return new Promise((resolve, reject) => {
            // Criar diretório se não existir
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Criar tabelas
                this.db.serialize(() => {
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS messages (
                            id TEXT PRIMARY KEY,
                            from_agent TEXT NOT NULL,
                            to_agent TEXT DEFAULT 'broadcast',
                            content TEXT NOT NULL,
                            type TEXT DEFAULT 'text',
                            priority TEXT DEFAULT 'medium',
                            timestamp TEXT NOT NULL,
                            received_at TEXT DEFAULT CURRENT_TIMESTAMP,
                            read BOOLEAN DEFAULT FALSE,
                            synced BOOLEAN DEFAULT FALSE
                        )
                    `);
                    
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS agents (
                            id TEXT PRIMARY KEY,
                            hostname TEXT,
                            status TEXT DEFAULT 'unknown',
                            last_seen TEXT,
                            capabilities TEXT,
                            created_at TEXT DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS sync_log (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            timestamp TEXT NOT NULL,
                            messages_synced INTEGER DEFAULT 0,
                            endpoint TEXT,
                            status TEXT,
                            error_message TEXT
                        )
                    `);
                });
                
                this.log('📦 Banco de dados neural inicializado');
                resolve();
            });
        });
    }

    /**
     * Envia mensagem para a rede
     */
    async sendMessage(messageData) {
        if (!messageData || !messageData.content) {
            throw new Error('Conteúdo da mensagem é obrigatório');
        }
        
        const message = {
            id: this.generateMessageId(),
            from_agent: this.agentId,
            to_agent: messageData.to || 'broadcast',
            content: messageData.content,
            type: messageData.type || 'text',
            priority: messageData.priority || 'medium',
            timestamp: new Date().toISOString()
        };
        
        try {
            // Salvar no banco local
            await this.saveMessage(message);
            
            // Enviar para endpoint local
            await this.sendToLocalEndpoint(message);
            
            // Enviar para swarm se não for broadcast local
            if (message.to_agent !== 'local') {
                await this.sendToSwarm(message);
            }
            
            this.log(`📤 Mensagem enviada: ${message.id} para ${message.to_agent}`);
            
            return {
                message_id: message.id,
                timestamp: message.timestamp,
                status: 'sent'
            };
            
        } catch (error) {
            this.log(`❌ Falha ao enviar mensagem: ${error.message}`);
            throw error;
        }
    }

    /**
     * Recebe mensagens pendentes
     */
    async receiveMessages() {
        try {
            // Sincronizar com swarm primeiro
            await this.syncWithSwarm();
            
            // Buscar mensagens não lidas
            const messages = await this.getUnreadMessages();
            
            // Marcar como lidas
            await this.markMessagesAsRead(messages);
            
            this.log(`📨 Recebidas ${messages.length} mensagens`);
            
            return {
                messages: messages,
                count: messages.length,
                last_sync: new Date().toISOString()
            };
            
        } catch (error) {
            this.log(`❌ Falha ao receber mensagens: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sincroniza com o swarm
     */
    async syncWithSwarm() {
        const syncStart = Date.now();
        
        try {
            // Buscar mensagens do swarm
            const swarmMessages = await this.fetchFromSwarm();
            
            // Salvar mensagens novas
            let newMessages = 0;
            for (const msg of swarmMessages) {
                if (!(await this.messageExists(msg.id))) {
                    await this.saveMessage(msg);
                    newMessages++;
                }
            }
            
            // Enviar mensagens locais não sincronizadas
            const unsynced = await this.getUnsyncedMessages();
            for (const msg of unsynced) {
                await this.sendToSwarm(msg);
                await this.markAsSynced(msg.id);
            }
            
            // Registrar sincronização
            await this.logSync({
                messages_synced: newMessages,
                endpoint: this.swarmEndpoint,
                status: 'success',
                duration: Date.now() - syncStart
            });
            
            this.log(`🔄 Sincronizado: ${newMessages} novas mensagens`);
            
            return {
                messages_received: newMessages,
                messages_sent: unsynced.length,
                duration: Date.now() - syncStart,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            await this.logSync({
                endpoint: this.swarmEndpoint,
                status: 'error',
                error_message: error.message,
                duration: Date.now() - syncStart
            });
            
            this.log(`❌ Falha na sincronização: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envia mensagem broadcast
     */
    async broadcastMessage(messageData) {
        const broadcast = {
            ...messageData,
            to: 'broadcast',
            type: 'broadcast'
        };
        
        return await this.sendMessage(broadcast);
    }

    /**
     * Obtém histórico de conversas
     */
    async getConversationHistory(limit = 50) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const messages = rows.map(row => ({
                    id: row.id,
                    from: row.from_agent,
                    to: row.to_agent,
                    content: row.content,
                    type: row.type,
                    priority: row.priority,
                    timestamp: row.timestamp,
                    read: Boolean(row.read)
                }));
                
                resolve({
                    messages: messages,
                    total: messages.length,
                    query_limit: limit
                });
            });
        });
    }

    /**
     * Registra agente na rede
     */
    async registerAgent() {
        const agent = {
            id: this.agentId,
            hostname: os.hostname(),
            status: 'online',
            capabilities: JSON.stringify({
                communication: true,
                health_monitoring: true,
                service_management: true
            }),
            last_seen: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO agents 
                (id, hostname, status, last_seen, capabilities) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [
                agent.id,
                agent.hostname,
                agent.status,
                agent.last_seen,
                agent.capabilities
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Enviar registro para swarm
                this.sendRegistrationToSwarm(agent).catch(() => {
                    // Ignorar erro no registro remoto
                });
                
                this.log(`🤖 Agente registrado: ${agent.id}`);
                
                resolve({
                    agent_id: agent.id,
                    status: 'registered',
                    timestamp: agent.last_seen
                });
            });
        });
    }

    /**
     * Descobre outros agentes na rede
     */
    async discoverAgents() {
        try {
            // Buscar agentes locais
            const localAgents = await this.getLocalAgents();
            
            // Buscar agentes do swarm
            const swarmAgents = await this.fetchAgentsFromSwarm();
            
            // Combinar e remover duplicados
            const allAgents = new Map();
            
            localAgents.forEach(agent => allAgents.set(agent.id, agent));
            swarmAgents.forEach(agent => allAgents.set(agent.id, agent));
            
            // Atualizar status baseado no last_seen
            const now = new Date();
            const agents = Array.from(allAgents.values()).map(agent => {
                const lastSeen = new Date(agent.last_seen);
                const minutesSince = (now - lastSeen) / (1000 * 60);
                
                return {
                    ...agent,
                    status: minutesSince < 5 ? 'online' : 
                           minutesSince < 30 ? 'away' : 'offline',
                    capabilities: typeof agent.capabilities === 'string' 
                        ? JSON.parse(agent.capabilities) 
                        : agent.capabilities
                };
            });
            
            this.log(`🔍 Descobertos ${agents.length} agentes na rede`);
            
            return {
                agents: agents,
                online_count: agents.filter(a => a.status === 'online').length,
                total_count: agents.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.log(`❌ Falha ao descobrir agentes: ${error.message}`);
            throw error;
        }
    }

    /**
     * Salva mensagem no banco
     */
    async saveMessage(message) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO messages 
                (id, from_agent, to_agent, content, type, priority, timestamp) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [
                message.id,
                message.from_agent,
                message.to_agent,
                message.content,
                message.type,
                message.priority,
                message.timestamp
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * Verifica se mensagem existe
     */
    async messageExists(messageId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id FROM messages WHERE id = ?',
                [messageId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(!!row);
                }
            );
        });
    }

    /**
     * Obtém mensagens não lidas
     */
    async getUnreadMessages() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE read = FALSE AND from_agent != ?
                ORDER BY timestamp ASC
            `;
            
            this.db.all(query, [this.agentId], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    /**
     * Marca mensagens como lidas
     */
    async markMessagesAsRead(messages) {
        if (messages.length === 0) return;
        
        const messageIds = messages.map(m => m.id);
        const placeholders = messageIds.map(() => '?').join(',');
        
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE messages 
                SET read = TRUE 
                WHERE id IN (${placeholders})
            `;
            
            this.db.run(query, messageIds, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * Obtém mensagens não sincronizadas
     */
    async getUnsyncedMessages() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM messages 
                WHERE synced = FALSE 
                ORDER BY timestamp ASC
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    /**
     * Marca mensagem como sincronizada
     */
    async markAsSynced(messageId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE messages SET synced = TRUE WHERE id = ?',
                [messageId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * Obtém agentes locais
     */
    async getLocalAgents() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM agents ORDER BY last_seen DESC',
                [],
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        });
    }

    /**
     * Registra log de sincronização
     */
    async logSync(syncData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sync_log 
                (timestamp, messages_synced, endpoint, status, error_message) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [
                new Date().toISOString(),
                syncData.messages_synced || 0,
                syncData.endpoint,
                syncData.status,
                syncData.error_message || null
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * Envia mensagem para endpoint local
     */
    async sendToLocalEndpoint(message) {
        try {
            await this.httpRequest(`${this.localEndpoint}/api/comms/send`, 'POST', message);
        } catch (error) {
            // Ignorar falha no endpoint local
            this.log(`⚠️ Endpoint local indisponível: ${error.message}`);
        }
    }

    /**
     * Envia mensagem para swarm
     */
    async sendToSwarm(message) {
        try {
            await this.httpRequest(`${this.swarmEndpoint}/api/comms/send`, 'POST', message);
        } catch (error) {
            this.log(`⚠️ Falha ao enviar para swarm: ${error.message}`);
            throw error;
        }
    }

    /**
     * Busca mensagens do swarm
     */
    async fetchFromSwarm() {
        try {
            const response = await this.httpRequest(`${this.swarmEndpoint}/api/comms/messages`, 'GET');
            return response.messages || [];
        } catch (error) {
            this.log(`⚠️ Falha ao buscar do swarm: ${error.message}`);
            return [];
        }
    }

    /**
     * Busca agentes do swarm
     */
    async fetchAgentsFromSwarm() {
        try {
            const response = await this.httpRequest(`${this.swarmEndpoint}/api/comms/agents`, 'GET');
            return response.agents || [];
        } catch (error) {
            this.log(`⚠️ Falha ao buscar agentes do swarm: ${error.message}`);
            return [];
        }
    }

    /**
     * Envia registro para swarm
     */
    async sendRegistrationToSwarm(agent) {
        try {
            await this.httpRequest(`${this.swarmEndpoint}/api/comms/register`, 'POST', agent);
        } catch (error) {
            // Ignorar falha no registro remoto
            this.log(`⚠️ Falha ao registrar no swarm: ${error.message}`);
        }
    }

    /**
     * Executa requisição HTTP genérica
     */
    async httpRequest(url, method = 'GET', data = null) {
        const http = require('http');
        const https = require('https');
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            };
            
            const req = client.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve(parsed);
                    } catch (e) {
                        resolve({ data: responseData });
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    /**
     * Gera ID de mensagem
     */
    generateMessageId() {
        return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Adiciona entrada ao log
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry);
    }
}

module.exports = NeuralLinkCommunicatorSkill;
