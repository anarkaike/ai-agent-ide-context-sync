
const SwarmNode = require('./SwarmNode');

console.log('🌌 Initializing Swarm Simulation...');

const agents = [
    new SwarmNode({
        id: 'agent-architect-01',
        name: 'Prime Architect',
        roles: ['Chief Architect'],
        teams: ['Core', 'Leadership'],
        security_level: 9,
        network: { ip: '127.0.0.1' }
    }),
    new SwarmNode({
        id: 'agent-secops-01',
        name: 'Sentinel One',
        roles: ['Security Analyst'],
        teams: ['SecOps'],
        security_level: 10,
        network: { ip: '127.0.0.1' }
    }),
    new SwarmNode({
        id: 'agent-dev-01',
        name: 'Code Weaver',
        roles: ['Senior Developer'],
        teams: ['Core'],
        security_level: 5,
        network: { ip: '127.0.0.1' }
    }),
    // Add a rogue agent to test protection events
    new SwarmNode({
        id: 'agent-rogue-01',
        name: 'Unknown Entity',
        roles: ['Intruder'],
        teams: ['External'],
        security_level: 1,
        network: { ip: '192.168.1.666' } // Untrusted IP
    })
];

// Start Agents
agents.forEach(a => a.start());

// Trigger immediate test alert (Allowed)
setTimeout(() => {
    agents[0].sendMessage('agent-secops-01', 'ALERT', 'Simulation Start Security Test');
}, 5000);

// Trigger blocked event (Protection Test)
setTimeout(() => {
    agents[3].sendMessage('agent-secops-01', 'ATTACK', 'Unauthorized Access Attempt');
}, 8000);

// Simulation Loop
setInterval(() => {
    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
    
    // Random Task Assignment
    if (Math.random() > 0.7) {
        randomAgent.currentTask = {
            id: `task-${Date.now()}`,
            title: `Fixing bug #${Math.floor(Math.random() * 1000)}`,
            priority: 'HIGH'
        };
        randomAgent.pulse(); // Update status
    } else if (Math.random() > 0.8) {
        randomAgent.currentTask = null; // IDLE
        randomAgent.pulse();
    }

    // Random Security Event (Internal)
    if (Math.random() > 0.9) {
        randomAgent.sendMessage('agent-secops-01', 'ALERT', 'Suspicious pattern detected in module X');
    }

}, 2000);

// Keep alive
console.log('🤖 Swarm Simulation Active. Press Ctrl+C to stop.');
process.stdin.resume();
