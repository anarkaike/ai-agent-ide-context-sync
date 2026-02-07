const DatabaseManager = require('./DatabaseManager');
const NetworkLayer = require('./NetworkLayer');

/**
 * 🐝 Swarm Registry (DB-Backed)
 * 
 * Mantém um registro global de todos os Agentes ativos via SQLite.
 */
class SwarmRegistry {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.network = new NetworkLayer();
        // Implicit init, but consumer should await operations
        this.initPromise = this.dbManager.init();
    }

    async init() {
        return this.initPromise;
    }

    /**
     * Registra ou atualiza o agente atual na rede Swarm.
     * @param {Object} agentInfo 
     */
    async registerAgent(agentInfo) {
        await this.initPromise;
        const netInfo = this.network.getNetworkInfo();

        const entry = {
            id: agentInfo.id,
            role: (agentInfo.roles || [])[0] || 'Generalist', // Use 'roles' from config or 'capabilities'
            name: agentInfo.name || 'Anonymous Drone',
            security_level: agentInfo.security_level || 5,
            status: agentInfo.status || 'ACTIVE', // SwarmNode might send status
            last_heartbeat: new Date().toISOString(),
            teams: agentInfo.teams || [], // SwarmNode sends teams
            capabilities: agentInfo.capabilities || [],
            network: {
                ip: netInfo.address,
                provider: netInfo.provider,
                secure: netInfo.is_secure
            },
            current_task: agentInfo.current_task || 'IDLE',
            trajectory: agentInfo.trajectory || []
        };

        await this.dbManager.saveAgent(entry);
        return entry;
    }

    async listAgents() {
        await this.initPromise;
        return this.dbManager.getAgents();
    }

    async findAgent(query) {
        await this.initPromise;
        const agents = await this.dbManager.getAgents();
        return agents.find(a => a.id === query || a.name.toLowerCase().includes(query.toLowerCase()));
    }
}

module.exports = SwarmRegistry;
