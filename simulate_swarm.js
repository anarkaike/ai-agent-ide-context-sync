const SwarmNode = require('./packages/cli/core/swarm/SwarmNode');

// 1. Prime Agent (The Boss)
const prime = new SwarmNode({
    id: 'prime-orchestrator-001',
    name: 'Prime Agent',
    security_level: 10,
    roles: ['Architect', 'Orchestrator', 'Security Sentinel'],
    teams: ['Core-System', 'Security-Ops']
});

// 2. Security Sentinel (Dedicated Security)
const sentinel = new SwarmNode({
    id: 'sec-sentinel-alpha',
    name: 'Iron Wall',
    security_level: 9,
    roles: ['Security Sentinel', 'Auditor'],
    teams: ['Security-Ops']
});

// 3. Senior Dev (Worker)
const dev = new SwarmNode({
    id: 'dev-builder-x86',
    name: 'Code Weaver',
    security_level: 5,
    roles: ['Developer', 'Refactorer'],
    teams: ['Feature-Squad-A']
});

// 4. Nanobot (Restricted)
const nano = new SwarmNode({
    id: 'nano-cleaner-v1',
    name: 'Log Cleaner',
    security_level: 1,
    roles: ['Janitor'],
    teams: ['Maintenance']
});

console.log('🌌 Starting Swarm Simulation...');
console.log('Press Ctrl+C to stop');

// Start all agents
prime.start();
setTimeout(() => sentinel.start(), 1000);
setTimeout(() => dev.start(), 2000);
setTimeout(() => nano.start(), 3000);

// Keep alive
setInterval(() => {}, 1000);
