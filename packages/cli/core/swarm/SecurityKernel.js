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
    constructor() {
        this.baseDir = path.join(os.homedir(), '.ai-doc', 'swarm', 'security');
        this.tokensFile = path.join(this.baseDir, 'tokens.json');
        
        // Definição de Níveis de Segurança
        this.LEVELS = {
            NANOBOT: 1,      // Dockerizado, Whitelist estrita, sem rede externa
            GUEST: 3,        // Acesso somente leitura a pastas específicas
            CONTRIBUTOR: 5,  // Pode editar arquivos, mas requer aprovação para execução
            OPERATOR: 8,     // Pode executar scripts, acesso total ao projeto
            OPENCLAW: 10     // ROOT, Acesso total ao sistema, Blacklist apenas
        };

        // Definição de Perfis (Arquétipos)
        this.PROFILES = {
            'nanobot': { level: 1, strategy: 'CONTAINER_ISOLATION' },
            'standard': { level: 5, strategy: 'HOST_PROCESS' },
            'openclaw': { level: 10, strategy: 'ROOT_DELEGATION' }
        };

        this.init();
    }

    init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
        if (!fs.existsSync(this.tokensFile)) {
            fs.writeFileSync(this.tokensFile, JSON.stringify({}, null, 2));
        }
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
    issueToken(agentId, level = 1) {
        const token = crypto.randomBytes(32).toString('hex');
        const data = this.loadTokens();
        
        data[token] = {
            agent_id: agentId,
            level: level,
            issued_at: Date.now(),
            expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24h
        };

        this.saveTokens(data);
        return token;
    }

    /**
     * Valida um token e retorna as credenciais.
     */
    validateToken(token) {
        const data = this.loadTokens();
        const session = data[token];

        if (!session) return { valid: false, reason: 'TOKEN_NOT_FOUND' };
        if (Date.now() > session.expires_at) return { valid: false, reason: 'TOKEN_EXPIRED' };

        return { valid: true, agentId: session.agent_id, level: session.level };
    }

    /**
     * Valida se a origem da requisição é confiável (Tailscale ou Localhost).
     * @param {string} ip - Endereço IP da requisição.
     */
    validateNetworkOrigin(ip) {
        // Normaliza IP (remove prefixo IPv6 ::ffff:)
        const normalizedIp = ip.replace(/^::ffff:/, '');
        
        // 1. Localhost é sempre confiável
        if (['127.0.0.1', '::1', 'localhost'].includes(normalizedIp)) {
            return { trusted: true, network: 'LOCAL' };
        }

        // 2. Verifica Range Tailscale (100.64.0.0/10)
        // Range: 100.64.0.0 - 100.127.255.255
        // Simplificação: verificar se começa com "100." seguido de número no range
        if (normalizedIp.startsWith('100.')) {
            const parts = normalizedIp.split('.');
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 64 && secondOctet <= 127) {
                return { trusted: true, network: 'TAILSCALE' };
            }
        }

        return { trusted: false, network: 'UNKNOWN' };
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
            return JSON.parse(fs.readFileSync(this.tokensFile, 'utf8'));
        } catch (e) { return {}; }
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
                console.warn(`🛑 [Security] Blocked untrusted origin: ${ip}`);
                return res.status(403).json({ error: 'ACCESS_DENIED', reason: 'UNTRUSTED_NETWORK' });
            }

            // 3. Validate Token (if present)
            if (token) {
                const session = this.validateToken(token);
                if (!session.valid) {
                    return res.status(401).json({ error: 'INVALID_TOKEN', reason: session.reason });
                }
                if (session.level < requiredLevel) {
                    return res.status(403).json({ error: 'INSUFFICIENT_PERMISSIONS', required: requiredLevel, current: session.level });
                }
                req.agent = { id: session.agentId, level: session.level };
            } else if (requiredLevel > 5) {
                // High security requires token
                return res.status(401).json({ error: 'MISSING_TOKEN' });
            }

            next();
        };
    }
}

module.exports = SecurityKernel;
