const SwarmRegistry = require('./packages/cli/core/swarm/Registry.js');
const path = require('path');

const registry = new SwarmRegistry();
const agentBPath = '/Users/junio/Documents/PROJETOS/dummy-agent-b';

registry.registerAgent({
    id: 'agent-b-python-expert',
    name: 'Agent B (Python Expert)',
    path: agentBPath,
    capabilities: ['python', 'code-review']
});

console.log('Agent B registered successfully in Swarm!');
