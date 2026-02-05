const fs = require('fs');
const path = require('path');
const os = require('os');

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

        data[agentId] = bond;
        this.saveRelationships(data);
        return bond;
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
