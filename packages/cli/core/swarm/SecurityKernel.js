const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 🔐 SecurityKernel
 * Gerencia níveis de autorização, perfis de segurança e autenticação.
 * Baseado no modelo de Níveis 1-10 (Nanobot -> OpenClaw).
 */
class SecurityKernel {
    constructor(dbManager = null) {
        this.baseDir = path.join(os.homedir(), '.ai-doc', 'swarm', 'security');
        this.tokensFile = path.join(this.baseDir, 'tokens.json');
        this.dbManager = dbManager; // Optional persistence layer
        this.secretFile = path.join(this.baseDir, 'kernel.key');
        this.tokenLifetimeMs = 60 * 60 * 1000; // 1 hour window by default
        
        // Definição de Níveis de Segurança
        this.LEVELS = {
            NANOBOT: 1,      // Dockerizado, Whitelist estrita, sem rede externa
            GUEST: 3,        // Acesso somente leitura a pastas específicas
            CONTRIBUTOR: 5,  // Pode editar arquivos, mas requer aprovação para execução
            OPERATOR: 8,     // Pode executar scripts, acesso total ao projeto
            OPENCLAW: 10     // ROOT, Acesso total ao sistema, Blacklist apenas
        };

        // Network Policy Configuration
        this.NETWORK_POLICY = {
            TRUSTED_RANGES: [
                '127.0.0.0/8',      // Localhost
                '100.64.0.0/10'     // Tailscale CGNAT
            ],
            TRUSTED_IPS: [
                '::1',
                'localhost'
            ],
            // MagicDNS domains or specific hosts
            TRUSTED_DOMAINS: [
                '.ts.net',          // Tailscale MagicDNS
                '.local'
            ]
        };

        // Definição de Perfis (Arquétipos)
        this.PROFILES = {
            'nanobot': { level: 1, strategy: 'CONTAINER_ISOLATION' },
            'standard': { level: 5, strategy: 'HOST_PROCESS' },
            'openclaw': { level: 10, strategy: 'ROOT_DELEGATION' }
        };

        // Definição de Políticas de Ação por Role (RBAC)
        this.ACTION_POLICIES = {
            'Architect': ['CREATE_TASK', 'READ_MEMORY', 'READ_LOGS', 'PLAN_ARCHITECTURE'],
            'Orchestrator': ['ASSIGN_TASK', 'READ_MEMORY', 'READ_LOGS', 'MANAGE_TEAMS'],
            'Security Sentinel': ['BLOCK_IP', 'AUDIT_LOGS', 'READ_MEMORY', 'WRITE_MEMORY', 'EXECUTE_COMMAND', 'MANAGE_TOKENS'],
            'Memory Keeper': ['READ_MEMORY', 'WRITE_MEMORY', 'ORGANIZE_PATTERNS'],
            'Pattern Analyst': ['READ_MEMORY', 'WRITE_PATTERNS', 'ANALYZE_DATA'],
            'Code Weaver': ['READ_CODE', 'WRITE_CODE', 'RUN_TESTS'],
            'Iron Wall': ['BLOCK_TRAFFIC', 'MONITOR_NETWORK', 'AUDIT_SECURITY']
        };

        this.securityLogs = []; // In-memory security logs
        this.init();
    }

    /**
     * Registra um evento de segurança.
     */
    async logSecurityEvent(event) {
        const logEntry = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: new Date().toISOString(),
            ...event
        };
        this.securityLogs.unshift(logEntry);
        // Manter apenas os últimos 1000 logs
        if (this.securityLogs.length > 1000) this.securityLogs.pop();
        
        // 1. Persistir no Banco de Dados (SQLite) se disponível
        if (this.dbManager && typeof this.dbManager.logSecurityEvent === 'function') {
            try {
                // Mapear para schema do DB
                const dbEvent = {
                    id: logEntry.id,
                    timestamp: logEntry.timestamp,
                    severity: logEntry.severity || 'INFO',
                    action: logEntry.type || logEntry.action || 'UNKNOWN',
                    agent_role: logEntry.agentRole || 'system',
                    resource: logEntry.resource || 'network',
                    details: logEntry.details || logEntry.reason || JSON.stringify(logEntry),
                    ip: logEntry.ip || '0.0.0.0'
                };
                await this.dbManager.logSecurityEvent(dbEvent);
            } catch (e) {
                console.error('❌ [Security] Failed to persist log:', e);
            }
        }

        // 2. Persistir em arquivo se crítico (Fallback)
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
            try {
                fs.appendFileSync(path.join(this.baseDir, 'security.log'), JSON.stringify(logEntry) + '\n');
            } catch (e) { /* ignore */ }
        }
        return logEntry;
    }

    getSecurityLogs(limit = 50) {
        return this.securityLogs.slice(0, limit);
    }

    /**
     * Valida se um Agente pode executar uma Tarefa.
     * @param {Object} agentConfig 
     * @param {Object} task 
     */
    validateTaskExecution(agentConfig, task) {
        // 1. Validação de Nível de Segurança
        const agentLevel = agentConfig.security_level || 1;
        const requiredLevel = task.required_security_level || 1;

        if (agentLevel < requiredLevel) {
            this.logSecurityEvent({
                type: 'TASK_REJECTED',
                severity: 'MEDIUM',
                agentId: agentConfig.id,
                agentName: agentConfig.name,
                taskTitle: task.title,
                reason: `Insufficient Security Level (Agent: ${agentLevel} < Task: ${requiredLevel})`
            });
            return { allowed: false, reason: 'INSUFFICIENT_SECURITY_LEVEL' };
        }

        // 2. Validação de Role (Opcional, mas recomendado)
        // Se a tarefa exige um Role específico (não implementado ainda no TaskManager, mas previsto)
        // ...

        return { allowed: true };
    }

    /**
     * Valida se um Role tem permissão para uma Ação.
     */
    validateAction(agentRole, actionType) {
        // 1. Roles Superiores (OpenClaw like)
        if (['Prime Agent', 'System Admin'].includes(agentRole)) return { allowed: true, reason: 'SUPER_USER' };

        // 2. Verifica Política Explícita
        const allowedActions = this.ACTION_POLICIES[agentRole] || [];
        
        // 3. Permissões Genéricas
        if (allowedActions.includes('*')) return { allowed: true, reason: 'WILDCARD_PERMISSION' };
        if (allowedActions.includes(actionType)) return { allowed: true, reason: 'POLICY_ALLOWED' };

        // 4. Bloqueio Default
        this.logSecurityEvent({
            type: 'ACTION_BLOCKED',
            severity: 'MEDIUM',
            agentRole,
            action: actionType,
            reason: 'POLICY_VIOLATION'
        });

        return { allowed: false, reason: `ROLE_${agentRole}_CANNOT_${actionType}` };
    }

    init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
        if (!fs.existsSync(this.tokensFile)) {
            fs.writeFileSync(this.tokensFile, JSON.stringify({}, null, 2));
        }
        this.masterSecret = this.loadOrCreateSecret();
    }

    /**
     * Verifica se um nível solicitado é permitido para o nível atual do agente.
     */
    canExecute(agentLevel, requiredLevel) {
        return agentLevel >= requiredLevel;
    }

    /**
     * Gera um Token de Acesso para um agente com validade.
     */
    issueToken(agentId, level = 1, options = {}) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const data = this.loadTokens();

        data[tokenHash] = {
            tokenHash,
            agent_id: agentId,
            level: level,
            issued_at: Date.now(),
            expires_at: Date.now() + this.tokenLifetimeMs,
            bound_ip: options.boundIp || null,
            bound_network: options.boundNetwork || null,
            origin: options.origin || 'kernel',
            metadata: options.metadata || null,
            context: options.context || null
        };

        this.saveTokens(data);
        return token;
    }

    /**
     * Valida um token e retorna as credenciais.
     */
    validateToken(token, options = {}) {
        const data = this.loadTokens();
        const tokenHash = this.hashToken(token);
        let session = data[tokenHash];

        if (!session) {
            const rawKey = Object.keys(data).find(key => data[key].token === token);
            if (rawKey) {
                session = { ...data[rawKey] };
                session.tokenHash = this.hashToken(token);
                delete session.token;
                delete data[rawKey];
                data[session.tokenHash] = session;
                this.saveTokens(data);
            }
        }

        if (!session) return { valid: false, reason: 'TOKEN_NOT_FOUND' };
        if (Date.now() > session.expires_at) return { valid: false, reason: 'TOKEN_EXPIRED' };

        if (session.bound_ip) {
            if (!options.boundIp) {
                return { valid: false, reason: 'BOUND_IP_REQUIRED' };
            }
            if (options.boundIp !== session.bound_ip) {
                return { valid: false, reason: 'BOUND_IP_MISMATCH' };
            }
        }

        if (session.bound_network) {
            if (!options.boundNetwork) {
                return { valid: false, reason: 'BOUND_NETWORK_REQUIRED' };
            }
            if (options.boundNetwork !== session.bound_network) {
                return { valid: false, reason: 'BOUND_NETWORK_MISMATCH' };
            }
        }

        return { valid: true, agentId: session.agent_id, level: session.level };
    }

    /**
     * Valida se a origem da requisição é confiável (Tailscale ou Localhost).
     * @param {string} ip - Endereço IP da requisição.
     * @returns {Object} { trusted: boolean, network: string, trustLevel: number }
     */
    validateNetworkOrigin(ip) {
        if (!ip) return { trusted: false, network: 'UNKNOWN', trustLevel: 0 };
        
        // Normaliza IP (remove prefixo IPv6 ::ffff:)
        const normalizedIp = ip.replace(/^::ffff:/, '');
        
        // 1. Check Explicit IPs (Whitelist)
        if (this.NETWORK_POLICY.TRUSTED_IPS.includes(normalizedIp)) {
             return { trusted: true, network: 'LOCAL', trustLevel: 10 };
        }

        // 2. Check Localhost Range (127.0.0.0/8)
        if (normalizedIp.startsWith('127.')) {
            return { trusted: true, network: 'LOCAL', trustLevel: 10 };
        }

        // 3. Check Tailscale Range (100.64.0.0/10)
        // Range: 100.64.0.0 - 100.127.255.255
        if (normalizedIp.startsWith('100.')) {
            const parts = normalizedIp.split('.');
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 64 && secondOctet <= 127) {
                return { trusted: true, network: 'TAILSCALE', trustLevel: 5 };
            }
        }

        // 4. Rede Externa / Desconhecida (Nível 0 - Zero Trust)
        // Log attempt? Only if verbose.
        return { trusted: false, network: 'UNKNOWN', trustLevel: 0 };
    }

    /**
     * Valida comunicação entre dois agentes.
     * Regras:
     * 1. Agentes do mesmo time podem se comunicar.
     * 2. Agentes de nível superior podem contactar nível inferior (Comando).
     * 3. Nível inferior para superior requer permissão (Solicitação) - Por enquanto liberado se mesmo time.
     */
    validateCommunication(sourceAgent, targetAgent) {
        // Se um deles não existe ou dados inválidos
        if (!sourceAgent || !targetAgent) return { allowed: false, reason: 'INVALID_AGENTS' };

        // 1. Check Teams intersection
        const commonTeams = sourceAgent.teams.filter(t => targetAgent.teams.includes(t));
        if (commonTeams.length > 0) {
            return { allowed: true, reason: `SAME_TEAM:${commonTeams[0]}` };
        }

        // 2. Network Security Policy (Tailscale/Localhost Enforcement)
        // Agentes Críticos (Level >= 8) só aceitam comandos de redes seguras
        if (targetAgent.security_level >= 8) {
            const sourceIP = sourceAgent.network?.ip || '0.0.0.0';
            const originCheck = this.validateNetworkOrigin(sourceIP);
            
            if (!originCheck.trusted) {
                return { allowed: false, reason: `UNSECURE_NETWORK_ORIGIN:${sourceIP}` };
            }
        }

        // 3. Hierarquia (Superior -> Inferior)
        if (sourceAgent.security_level >= targetAgent.security_level) {
            return { allowed: true, reason: 'HIERARCHY_COMMAND' };
        }

        // 4. Bloqueio Default (Zero Trust)
        return { allowed: false, reason: 'NO_TRUST_RELATIONSHIP' };
    }

    loadTokens() {
        try {
            const raw = JSON.parse(fs.readFileSync(this.tokensFile, 'utf8'));
            const normalized = {};
            let mutated = false;

            for (const key of Object.keys(raw)) {
                const item = { ...raw[key] };
                if (item.tokenHash) {
                    normalized[item.tokenHash] = item;
                    continue;
                }
                if (item.token) {
                    const hash = this.hashToken(item.token);
                    item.tokenHash = hash;
                    delete item.token;
                    normalized[hash] = item;
                    mutated = true;
                    continue;
                }
                normalized[key] = item;
            }

            const pruned = this.pruneExpiredTokens(normalized);
            if (pruned.modified) {
                this.saveTokens(pruned.data);
                return pruned.data;
            }
            if (mutated) {
                this.saveTokens(normalized);
            }

            return normalized;
        } catch (e) { return {}; }
    }

    pruneExpiredTokens(tokens = {}) {
        const now = Date.now();
        let modified = false;
        for (const key of Object.keys(tokens)) {
            const session = tokens[key];
            if (session.expires_at && session.expires_at < now) {
                delete tokens[key];
                modified = true;
            }
        }
        return { data: tokens, modified };
    }

    hashToken(token) {
        if (!this.masterSecret) {
            this.masterSecret = this.loadOrCreateSecret();
        }
        return crypto
            .createHmac('sha256', this.masterSecret)
            .update(token)
            .digest('hex');
    }

    loadOrCreateSecret() {
        try {
            if (fs.existsSync(this.secretFile)) {
                return fs.readFileSync(this.secretFile, 'utf8');
            }
            const secret = crypto.randomBytes(32).toString('hex');
            fs.writeFileSync(this.secretFile, secret, { mode: 0o600 });
            return secret;
        } catch (e) {
            console.error('Falha ao gerar o segredo do kernel:', e.message);
            return crypto.randomBytes(32).toString('hex');
        }
    }

    saveTokens(data) {
        fs.writeFileSync(this.tokensFile, JSON.stringify(data, null, 2));
    }

    /**
     * Determina o perfil de segurança baseado no nome ou config.
     */
    resolveProfile(agentType) {
        return this.PROFILES[agentType?.toLowerCase()] || this.PROFILES['standard'];
    }

    /**
     * Express Middleware to enforce Security Levels on API Routes
     */
    middleware(requiredLevel = 1) {
        return (req, res, next) => {
            // 1. Identify Agent/User (via Header or IP)
            const token = req.headers['x-swarm-token'];
            const ip = req.ip || req.connection.remoteAddress;

            // 2. Validate Origin (Tailscale/Localhost)
            const originCheck = this.validateNetworkOrigin(ip);
            
            // Critical Operations require Trusted Network
            if (requiredLevel >= 8 && !originCheck.trusted) {
                const msg = `🛑 [Security] Blocked untrusted origin: ${ip}`;
                console.warn(msg);
                this.logSecurityEvent({
                    type: 'NETWORK_BLOCK',
                    severity: 'HIGH',
                    ip,
                    reason: 'UNTRUSTED_NETWORK',
                    details: msg
                });
                return res.status(403).json({ error: 'ACCESS_DENIED', reason: 'UNTRUSTED_NETWORK' });
            }

            // 3. Validate Token (if present)
            if (token) {
                const session = this.validateToken(token);
                if (!session.valid) {
                    this.logSecurityEvent({
                        type: 'AUTH_FAIL',
                        severity: 'MEDIUM',
                        ip,
                        token: token.substring(0, 8) + '...',
                        reason: session.reason
                    });
                    return res.status(401).json({ error: 'INVALID_TOKEN', reason: session.reason });
                }
                if (session.level < requiredLevel) {
                    this.logSecurityEvent({
                        type: 'AUTH_FAIL',
                        severity: 'LOW',
                        agentId: session.agentId,
                        required: requiredLevel,
                        current: session.level,
                        reason: 'INSUFFICIENT_PERMISSIONS'
                    });
                    return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', required: requiredLevel, current: session.level });
                }
                req.agent = { id: session.agentId, level: session.level };
            } else if (requiredLevel > 5) {
                // High security requires token
                this.logSecurityEvent({
                    type: 'AUTH_FAIL',
                    severity: 'MEDIUM',
                    ip,
                    reason: 'MISSING_TOKEN'
                });
                return res.status(401).json({ error: 'MISSING_TOKEN' });
            }

            next();
        };
    }
}

module.exports = SecurityKernel;
