const fs = require('fs');
const path = require('path');
const SwarmRegistry = require('./Registry');
const TaskManager = require('./TaskManager');
const SwarmMemory = require('../memory/SwarmMemory');
const SwarmNetwork = require('./SwarmNetwork');

/**
 * 🛰️ Swarm Node
 * Represents a running agent instance that participates in the Swarm.
 * Handles heartbeat, task polling, pattern learning, and P2P communication.
 */
class SwarmNode {
    constructor(config) {
        this.config = {
            id: config.id || `agent-${Date.now().toString(36)}`,
            name: config.name || 'Anonymous Drone',
            path: config.path || process.cwd(),
            security_level: config.security_level || 5,
            roles: config.roles || ['Generalist'],
            teams: config.teams || ['Freelancers'],
            ...config
        };

        this.registry = new SwarmRegistry();
        this.taskManager = new TaskManager();
        this.memory = new SwarmMemory(this.config.path);
        this.network = SwarmNetwork;
        
        this.status = 'IDLE';
        this.currentTask = null;
        this.trajectory = [];
        this.heartbeatInterval = null;
        this.taskPollInterval = null;
    }

    /**
     * Start the node: Begin heartbeat, task polling, and connect to network
     */
    start() {
        console.log(`🚀 Starting Swarm Node: ${this.config.name} (${this.config.id}) [L${this.config.security_level}]`);
        
        // Connect to Network
        this.network.connect(this);

        // Initial registration
        this.pulse();

        // Heartbeat (every 5s)
        this.heartbeatInterval = setInterval(() => this.pulse(), 5000);

        // Task Polling (every 3s)
        this.taskPollInterval = setInterval(() => this.checkTasks(), 3000);

        return this;
    }

    /**
     * Stop the node
     */
    stop() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.taskPollInterval) clearInterval(this.taskPollInterval);
        this.network.disconnect(this.config.id);
        console.log(`🛑 Stopping Swarm Node: ${this.config.name}`);
    }

    /**
     * Send a secure message to another agent
     */
    async sendMessage(targetId, type, payload) {
        return await this.network.send(this.config.id, targetId, type, payload);
    }

    /**
     * Receive a message from the network
     */
    receiveMessage(msg) {
        console.log(`📨 [${this.config.name}] Received ${msg.type} from ${msg.from}:`, msg.payload);
        // React to messages (e.g., requests, alerts)
        if (msg.type === 'ALERT') {
            this.trajectory.push(`⚠️ ALERT: ${msg.payload}`);
            this.pulse();
        }
    }

    /**
     * Send heartbeat to Registry
     */
    pulse() {
        const caps = [
            ...this.config.roles.map(r => `ROLE:${r}`),
            ...this.config.teams.map(t => `TEAM:${t}`)
        ];

        const info = {
            id: this.config.id,
            name: this.config.name,
            path: this.config.path,
            security_level: this.config.security_level,
            capabilities: caps,
            current_task: this.currentTask ? this.currentTask.title : 'IDLE',
            trajectory: this.trajectory
        };

        this.registry.registerAgent(info);
    }

    /**
     * Check for assigned tasks or pick up pending ones
     */
    async checkTasks() {
        // 1. Check if I'm already busy
        if (this.currentTask) return;

        // 2. Get my tasks (assigned directly to me)
        const myTasks = this.taskManager.listTasks({ assignee: this.config.id });
        const pendingOrInProgress = myTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
        
        if (pendingOrInProgress.length > 0) {
            // Prioritize IN_PROGRESS (maybe I crashed and restarting?)
            const next = pendingOrInProgress.find(t => t.status === 'IN_PROGRESS') || pendingOrInProgress[0];
            await this.acceptTask(next);
            return;
        }

        // 3. (Optional) Pick up unassigned tasks matching my security level/role
        // For now, only explicit assignment
    }

    /**
     * Accept and "execute" a task
     */
    async acceptTask(task) {
        console.log(`⚡ [${this.config.name}] Accepting task: ${task.title}`);
        
        // Security Check (Redundant if assignment logic is safe, but good practice)
        if (this.config.security_level < (task.required_security_level || 1)) {
            console.log(`🚫 [${this.config.name}] Security Violation! Level ${this.config.security_level} < ${task.required_security_level}`);
            return;
        }

        this.currentTask = task;
        this.taskManager.updateStatus(task.id, 'IN_PROGRESS');
        
        // Update trajectory
        this.trajectory = ['Analyzing Requirements', 'Consulting Patterns', 'Executing', 'Verifying'];
        this.pulse(); // Update status immediately

        // Simulate work
        await this.simulateWork(task);
    }

    async simulateWork(task) {
        // 1. Consult Swarm Memory
        const role = this.config.roles[0] || 'Generalist';
        const teams = this.config.teams;
        
        const context = this.memory.recall(role, teams, task.title);
        
        if (context.patterns.length > 0) {
            console.log(`🧠 [${this.config.name}] Recalled pattern: ${context.patterns[0].title}`);
        }

        // 2. Mock Execution Steps based on complexity
        let steps = ['Analyzing...', 'Working...', 'Finalizing...'];
        
        if (task.title.includes('Complex') || task.title.includes('Chain') || (task.required_security_level || 0) >= 9) {
            steps = ['Hypothesizing Strategy...', 'Simulating Outcomes...', 'Refining Solution...', 'Executing Core Logic...', 'Verifying Integrity...'];
        }

        this.trajectory = [...steps];
        this.pulse();

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s per step
            
            // Broadcast progress (Report to Prime)
            if (this.network && this.config.id !== 'prime-orchestrator-001') {
                // Occasionally report progress
                if (Math.random() > 0.5) {
                    this.sendMessage('prime-orchestrator-001', 'REPORT', `${step} [${task.title.substring(0, 15)}...]`);
                }
            }

            this.trajectory.shift(); // Remove current step
            this.pulse();
        }

        // 3. Complete
        this.completeTask();
    }

    completeTask() {
        if (!this.currentTask) return;
        
        console.log(`✅ [${this.config.name}] Completed task: ${this.currentTask.title}`);
        this.taskManager.updateStatus(this.currentTask.id, 'COMPLETED');
        
        // 🧠 Memory Persistence: Learn from the task
        const role = this.config.roles[0] || 'Generalist';
        const team = this.config.teams[0] || 'Freelancers';
        
        try {
            const solution = `Executed ${this.currentTask.title} using security protocol L${this.config.security_level}.`;
            
            this.memory.learnPattern(role, {
                title: `Auto-Pattern: ${this.currentTask.title}`,
                description: this.currentTask.description,
                result: solution,
                tags: [role, 'simulation', `sec-${this.config.security_level}`],
                assignee: this.config.name
            });

            this.memory.recordTeamEvent(team, `Agent ${this.config.name} completed task: ${this.currentTask.title}`, this.config.name);
            
            // console.log(`🧠 [${this.config.name}] Learned new pattern for ${role}`);
        } catch (e) {
            console.error(`❌ Memory Error: ${e.message}`);
        }

        this.currentTask = null;
        this.trajectory = [];
        this.pulse();
    }
}

module.exports = SwarmNode;
