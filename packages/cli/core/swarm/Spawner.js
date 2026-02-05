const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const TrustSystem = require('./TrustSystem');
const SwarmRegistry = require('./Registry');

/**
 * 🥚 Agent Spawner
 * Cria sub-agentes temporários (ou persistentes) para tarefas específicas.
 */
class AgentSpawner {
    constructor() {
        this.trust = new TrustSystem();
        this.swarm = new SwarmRegistry();
    }

    /**
     * Cria um novo sub-agente.
     * @param {string} role - Papel do sub-agente (ex: 'junior-dev', 'qa-tester')
     * @param {string} task - Descrição da tarefa inicial
     */
    async spawn(role, task) {
        const id = `sub-agent-${Date.now()}`;
        const name = `Sub-Agent (${role})`;
        
        // Define path for sub-agent
        const homeDir = os.homedir();
        const spawnDir = path.join(homeDir, '.ai-doc', 'spawned_agents', id);

        console.log(`🥚 Incubando novo agente em: ${spawnDir}`);
        
        // 1. Create Directory
        fs.mkdirSync(spawnDir, { recursive: true });

        // 2. Init Agent (Minimal)
        // We will assume the CLI is globally available or link it
        // For this demo, we use the current project's CLI path
        const cliPath = path.resolve(__dirname, '../../cli/ai-doc.js');
        
        return new Promise((resolve, reject) => {
            // Initialize workspace
            cp.exec(`node "${cliPath}" init`, { cwd: spawnDir }, (err, stdout, stderr) => {
                if (err) return reject(err);

                // 3. Register in Swarm (as Sub-Agent)
                this.swarm.registerAgent({
                    id: id,
                    name: name,
                    path: spawnDir,
                    capabilities: [role, 'sub-agent']
                });

                // 4. Establish Trust Bond (Parent -> Child)
                // We trust our own child 100% initially
                this.trust.establishBond(id, name, 'SUB_AGENT');

                console.log(`🐣 ${name} nasceu com sucesso!`);
                resolve({ id, path: spawnDir });
            });
        });
    }
}

module.exports = AgentSpawner;
