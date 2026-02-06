const fs = require('fs');
const path = require('path');
const os = require('os');
const NetworkLayer = require('./NetworkLayer');

/**
 * 🐝 Swarm Registry (A Lista Telefônica dos Agentes)
 * 
 * Mantém um registro global de todos os Agentes ativos nesta máquina.
 * Permite que o Agente do Projeto A encontre o Agente do Projeto B.
 */
class SwarmRegistry {
    constructor() {
        this.homeDir = os.homedir();
        this.baseDir = path.join(this.homeDir, '.ai-doc', 'swarm');
        this.registryFile = process.env.AI_DOC_SWARM_REGISTRY || path.join(this.baseDir, 'registry.json');
        
        this.network = new NetworkLayer();
        this.init();
    }

    init() {
        // If custom registry path is provided, ensure its directory exists
        const dir = path.dirname(this.registryFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.registryFile)) {
            fs.writeFileSync(this.registryFile, JSON.stringify([], null, 2));
        }
    }

    /**
     * Registra ou atualiza o agente atual na rede Swarm.
     * @param {Object} agentInfo 
     */
    registerAgent(agentInfo) {
        const registry = this.listAgents();
        const existingIndex = registry.findIndex(a => a.path === agentInfo.path);
        
        const netInfo = this.network.getNetworkInfo();

        const entry = {
            id: agentInfo.id || path.basename(agentInfo.path),
            name: agentInfo.name || 'Anonymous Drone',
            path: agentInfo.path,
            last_seen: new Date().toISOString(),
            capabilities: agentInfo.capabilities || ['general-purpose'],
            network: {
                ip: netInfo.address,
                provider: netInfo.provider,
                secure: netInfo.is_secure
            },
            security_level: agentInfo.security_level || 5, // Default to Standard
            current_task: agentInfo.current_task || 'IDLE',
            trajectory: agentInfo.trajectory || [] // Future plans
        };

        if (existingIndex >= 0) {
            registry[existingIndex] = { ...registry[existingIndex], ...entry };
        } else {
            registry.push(entry);
        }

        this.saveRegistry(registry);
        return entry;
    }

    listAgents() {
        try {
            return JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    findAgent(query) {
        const agents = this.listAgents();
        // Busca por ID exato ou match parcial no nome
        return agents.find(a => a.id === query || a.name.toLowerCase().includes(query.toLowerCase()));
    }

    saveRegistry(data) {
        fs.writeFileSync(this.registryFile, JSON.stringify(data, null, 2));
    }
}

module.exports = SwarmRegistry;