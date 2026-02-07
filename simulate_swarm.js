const SwarmNode = require('./packages/cli/core/swarm/SwarmNode');
const TaskManager = require('./packages/cli/core/swarm/TaskManager');

// 1. Prime Agent (The Boss)
const prime = new SwarmNode({
    id: 'prime-orchestrator-001',
    name: 'Prime Agent',
    security_level: 10,
    roles: ['Architect', 'Orchestrator', 'Security Sentinel'],
    teams: ['Core-System', 'Security-Ops'],
    network: { secure: true, ip: '100.64.0.1', provider: 'Tailscale' }
});

// 2. Security Sentinel (Dedicated Security)
const sentinel = new SwarmNode({
    id: 'sec-sentinel-alpha',
    name: 'Iron Wall',
    security_level: 9,
    roles: ['Security Sentinel', 'Auditor'],
    teams: ['Security-Ops'],
    network: { secure: true, ip: '100.64.0.2', provider: 'Tailscale' }
});

// 3. Senior Dev (Worker)
const dev = new SwarmNode({
    id: 'dev-builder-x86',
    name: 'Code Weaver',
    security_level: 5,
    roles: ['Developer', 'Refactorer'],
    teams: ['Feature-Squad-A'],
    network: { secure: true, ip: '100.64.0.3', provider: 'Tailscale' }
});

// 4. Nanobot (Restricted) - Public Network (Untrusted)
const nano = new SwarmNode({
    id: 'nano-cleaner-v1',
    name: 'Log Cleaner',
    security_level: 1,
    roles: ['Janitor'],
    teams: ['Maintenance'],
    network: { secure: false, ip: '192.168.1.50', provider: 'Public' }
});

const taskManager = new TaskManager();

// 🧹 Cleanup on Start
console.log('🧹 Cleaning up old tasks...');
taskManager.deleteAllTasks();

console.log('🌌 Starting Swarm Simulation...');
console.log('Press Ctrl+C to stop');

// Start all agents
prime.start();
setTimeout(() => sentinel.start(), 1000);
setTimeout(() => dev.start(), 2000);
setTimeout(() => nano.start(), 3000);

// Task Generator (The Architect)
const tasks = [
    { title: 'Update Kernel Security', level: 10, role: 'Security Sentinel' },
    { title: 'Refactor Auth Module', level: 5, role: 'Refactorer' },
    { title: 'Clean Logs', level: 1, role: 'Janitor' },
    { title: 'Audit Firewall Rules', level: 9, role: 'Auditor' },
    { title: 'Optimize Database Queries', level: 5, role: 'Developer' },
    { title: 'Rotate API Keys', level: 10, role: 'Security Sentinel' },
    { title: 'Archive Old Backups', level: 1, role: 'Janitor' },
    { title: 'Review PR #42', level: 5, role: 'Developer' },
    { title: 'Monitor Security Logs', level: 9, role: 'Security Sentinel' },
    { title: 'Deploy to Production', level: 10, role: 'Architect' },
    { title: 'Complex: Disaster Recovery Plan', level: 10, role: 'Architect' },
    { title: 'Chain: Trace Intrusion Vector', level: 9, role: 'Security Sentinel' },
    { title: 'Complex: Refactor Legacy Core', level: 5, role: 'Refactorer' }
];

const agents = [prime, sentinel, dev, nano];

function assignRandomTask() {
    // 🚦 Traffic Control: Don't overload the system
    const activeTasks = taskManager.listTasks({ status: 'PENDING' });
    if (activeTasks.length > 20) {
        console.log('⏳ [Architect] Task queue full, waiting...');
        return;
    }

    const taskDef = tasks[Math.floor(Math.random() * tasks.length)];
    
    // Simulate "Chain of Command"
    let creator = prime; // Default creator
    let parentTask = null;

    // 🕸️ Scenario: Sub-task creation (Traceability)
    if (taskDef.title.startsWith('Complex:')) {
        // 1. Create Parent Task
        parentTask = taskManager.createTask(
            taskDef.title, 
            `Strategic Initiative: ${taskDef.title}`, 
            'high', 
            { origin: 'Simulation', type: 'EPIC' }, 
            taskDef.level,
            prime.config.id
        );
        console.log(`🏗️ [Architect] Created EPIC Task: "${taskDef.title}"`);

        // 2. Assign Parent Task
        const architectAgents = agents.filter(a => a.config.roles.includes('Architect'));
        if (architectAgents.length > 0) {
            taskManager.assignTask(parentTask.id, architectAgents[0].config.id);
        }

        // 3. Create Sub-task immediately
        const subTaskTitle = `Impl: ${taskDef.title.replace('Complex: ', '')}`;
        const subTask = taskManager.createTask(
            subTaskTitle, 
            `Implementation phase for ${parentTask.title}`, 
            'medium', 
            { origin: 'Simulation', type: 'SUBTASK' }, 
            Math.max(1, taskDef.level - 2), // Lower security for implementation
            architectAgents[0].config.id, // Created by the Architect
            parentTask.id // Link to parent
        );
        console.log(`  ↳ 🔗 Created Sub-task: "${subTaskTitle}" (Parent: ${parentTask.id.substr(0,8)}...)`);
        
        // Let the logic below assign the subtask
        taskDef.title = subTaskTitle; // Hack to use assignment logic below
        // But we need to use the actual task object we just created
        // So we skip the creation part below
        
        // Find suitable agent for subtask
        const suitableAgents = agents.filter(a => a.config.security_level >= subTask.required_security_level && a.status === 'IDLE');
        if (suitableAgents.length > 0) {
            const agent = suitableAgents[Math.floor(Math.random() * suitableAgents.length)];
            console.log(`  ↳ 🎲 Assigning Sub-task to ${agent.config.name}`);
            taskManager.assignTask(subTask.id, agent.config.id);
        }
        return; // Done for this cycle
    }

    // Normal Task Creation
    // 🎲 Randomize Creator sometimes (Sentinel assigns to Dev)
    if (taskDef.role === 'Developer' && Math.random() > 0.7) {
        creator = sentinel;
    }

    const task = taskManager.createTask(
        taskDef.title, 
        `Generated by Simulation context: ${Date.now()}`, 
        'medium', 
        { origin: 'Simulation' }, 
        taskDef.level,
        creator.config.id
    );
    
    // Find suitable agent
    const suitableAgents = agents.filter(a => a.config.security_level >= taskDef.level && a.status === 'IDLE');
    
    if (suitableAgents.length > 0) {
        const agent = suitableAgents[Math.floor(Math.random() * suitableAgents.length)];
        console.log(`🎲 [Architect] Assigning "${taskDef.title}" to ${agent.config.name} (Creator: ${creator.config.name})`);
        taskManager.assignTask(task.id, agent.config.id);
    } else {
        console.log(`⏳ [Architect] No suitable/idle agent for "${taskDef.title}" (L${taskDef.level})`);
    }
}

// Generate a task every 8 seconds
setInterval(assignRandomTask, 8000);

// Simulate P2P Communication every 5 seconds
function simulateCommunication() {
    const sender = agents[Math.floor(Math.random() * agents.length)];
    const receiver = agents[Math.floor(Math.random() * agents.length)];

    if (sender === receiver) return;

    const types = ['COMMAND', 'REQUEST', 'ALERT', 'PING'];
    const type = types[Math.floor(Math.random() * types.length)];
    const payloads = [
        'Check system status',
        'Requesting access token',
        'Intrusion detected on port 80',
        'Heartbeat check',
        'Syncing context data',
        'Deploying patch'
    ];
    const payload = payloads[Math.floor(Math.random() * payloads.length)];

    console.log(`📡 [Sim] ${sender.config.name} -> ${receiver.config.name} [${type}]`);
    sender.sendMessage(receiver.config.id, type, payload);
}

setInterval(simulateCommunication, 5000);

// Keep alive
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Simulation...');
    prime.stop();
    sentinel.stop();
    dev.stop();
    nano.stop();
    process.exit();
});
