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
}

module.exports = SecurityKernel;
