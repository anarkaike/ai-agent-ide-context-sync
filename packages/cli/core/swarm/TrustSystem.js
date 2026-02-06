const fs = require('fs');
const path = require('path');
const os = require('os');
const VaultManager = require('../ethereum_bridge/VaultManager');
const SecurityKernel = require('./SecurityKernel');

/**
 * 🛡️ TrustSystem
 * Gerencia relacionamentos, níveis de confiança e permissões entre agentes.
 * Implementa o modelo "Zero Trust" por padrão.
 */
class TrustSystem {
    constructor() {
        this.homeDir = os.homedir();
        this.baseDir = path.join(this.homeDir, '.ai-doc', 'swarm');
        this.relationshipsFile = path.join(this.baseDir, 'relationships.json');
        
        this.vault = new VaultManager();
        this.securityKernel = new SecurityKernel();

        this.RELATIONSHIP_TYPES = {
            STRANGER: 'STRANGER',       // Desconhecido (Padrão)
            PEER: 'PEER',               // Outro agente independente
            SUB_AGENT: 'SUB_AGENT',     // Cópia temporária/subordinada
            MENTOR: 'MENTOR',           // Agente superior/professor
            MENTEE: 'MENTEE'            // Agente aprendiz
        };

        this.PERMISSIONS = {
            EXECUTE_TASK: 'EXECUTE_TASK',   // Pode solicitar execução de tarefas
            READ_MEMORY: 'READ_MEMORY',     // Pode ler memórias públicas
            WRITE_MEMORY: 'WRITE_MEMORY',   // Pode sugerir memórias
            FULL_ACCESS: 'FULL_ACCESS'      // Acesso total (Perigoso)
        };

        this.init();
    }

    init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
        if (!fs.existsSync(this.relationshipsFile)) {
            fs.writeFileSync(this.relationshipsFile, JSON.stringify({}, null, 2));
        }
    }

    getRelationships() {
        try {
            return JSON.parse(fs.readFileSync(this.relationshipsFile, 'utf8'));
        } catch (e) {
            return {};
        }
    }

    saveRelationships(data) {
        fs.writeFileSync(this.relationshipsFile, JSON.stringify(data, null, 2));
    }

    /**
     * Obtém ou cria um registro de relacionamento para um agente.
     */
    getRelationship(agentId) {
        const data = this.getRelationships();
        return data[agentId] || null;
    }

    /**
     * Cria um novo vínculo com um agente.
     * Padrão: Zero Trust (Sem permissões, Score 0).
     */
    establishBond(agentId, name, type = this.RELATIONSHIP_TYPES.STRANGER) {
        const data = this.getRelationships();
        
        if (data[agentId]) {
            return data[agentId]; // Já existe
        }

        const bond = {
            id: agentId,
            name: name,
            type: type,
            trust_score: type === 'SUB_AGENT' ? 100 : 0, // Sub-agentes nascem confiáveis (são nós mesmos)
            created_at: new Date().toISOString(),
            last_interaction: null,
            permissions: type === 'SUB_AGENT' ? [this.PERMISSIONS.EXECUTE_TASK, this.PERMISSIONS.READ_MEMORY] : [],
            history: []
        };

        // Recalculate trust based on SBTs immediately
        const sbtScore = this.evaluateTrustFromSBTs(agentId);
        if (sbtScore > 0) {
            bond.trust_score = Math.min(100, bond.trust_score + sbtScore);
            bond.history.push({
                timestamp: new Date().toISOString(),
                action: 'SBT_VERIFICATION',
                result: `Trust increased by ${sbtScore} due to valid SBTs`
            });
        }

        data[agentId] = bond;
        this.saveRelationships(data);
        return bond;
    }

    /**
     * Calcula pontuação baseada em SBTs na Vault
     */
    evaluateTrustFromSBTs(agentId) {
        try {
            const allSBTs = this.vault.listSBTs();
            let score = 0;

            // Find SBTs where recipient is the agent
            // Note: Since listSBTs returns metadata, we might need to fetch full SBT if recipient is not in index
            // But checking index first is faster. VaultManager index currently has: id, title, type, project_origin.
            // It does NOT have recipient. We need to fetch full SBTs or trust specific types available.
            
            // For efficiency, we will fetch full content for ALL SBTs in vault (assuming vault is not huge yet)
            // Or better: We assume that if we hold an SBT, we are the owner/recipient OR we issued it.
            // But the Vault is a generic bag currently.
            
            // Let's iterate and check full content.
            for (const meta of allSBTs) {
                const sbt = this.vault.getSBT(meta.id);
                if (!sbt) continue;

                // Check if this SBT targets the agent
                if (sbt.recipient && sbt.recipient.id === agentId) {
                    switch (sbt.type) {
                        case 'REPUTATION': score += 20; break;
                        case 'SKILL': score += 10; break;
                        case 'ACHIEVEMENT': score += 5; break;
                        default: score += 1;
                    }
                }
            }
            return score;
        } catch (e) {
            console.error('Error evaluating SBT trust:', e);
            return 0;
        }
    }

    /**
     * Verifica se um agente tem uma permissão específica.
     */
    checkPermission(agentId, permission) {
        const bond = this.getRelationship(agentId);
        if (!bond) return false;
        
        return bond.permissions.includes(permission) || bond.permissions.includes(this.PERMISSIONS.FULL_ACCESS);
    }

    /**
     * Adiciona uma permissão ao vínculo.
     */
    grantPermission(agentId, permission) {
        const data = this.getRelationships();
        if (!data[agentId]) return false;

        if (!data[agentId].permissions.includes(permission)) {
            data[agentId].permissions.push(permission);
            this.saveRelationships(data);
        }
        return true;
    }

    /**
     * Valida uma solicitação de um agente externo.
     * @param {string} agentId - ID do agente solicitante
     * @param {string} token - Token de autenticação fornecido
     * @param {number} requiredLevel - Nível de segurança mínimo exigido (1-10)
     * @returns {boolean} - True se autorizado
     */
    validateRequest(agentId, token, requiredLevel = 1) {
        // 1. Validate Token First (The Truth)
        const auth = this.securityKernel.validateToken(token);
        
        if (!auth.valid || auth.agentId !== agentId) {
            console.log(`⛔ Access Denied: Invalid Token for ${agentId}. Reason: ${auth.reason || 'ID Mismatch'}`);
            this.logInteraction(agentId, 'AUTH_FAILURE', 'Invalid Token', -5);
            return false;
        }

        // 2. Validate Security Level (From Token)
        if (auth.level < requiredLevel) {
            console.log(`⛔ Access Denied: Insufficient Clearance. Required: ${requiredLevel}, Has: ${auth.level}`);
            this.logInteraction(agentId, 'AUTH_FAILURE', 'Insufficient Clearance', -1);
            return false;
        }

        // 3. Update known level if bond exists
        this.updateKnownSecurityLevel(agentId, auth.level);

        return true;
    }

    /**
     * Atualiza o nível de segurança conhecido de um agente remoto.
     * @param {string} agentId 
     * @param {number} level 
     */
    updateKnownSecurityLevel(agentId, level) {
        const data = this.getRelationships();
        if (data[agentId]) {
            data[agentId].security_level = level;
            this.saveRelationships(data);
            return true;
        }
        return false;
    }

    /**
     * Registra uma interação e ajusta o score de confiança.
     */
    logInteraction(agentId, action, result, scoreDelta = 0) {
        const data = this.getRelationships();
        if (!data[agentId]) return;

        data[agentId].history.push({
            timestamp: new Date().toISOString(),
            action,
            result
        });

        data[agentId].last_interaction = new Date().toISOString();
        data[agentId].trust_score = Math.max(0, Math.min(100, data[agentId].trust_score + scoreDelta));

        this.saveRelationships(data);
    }
}

module.exports = TrustSystem;
