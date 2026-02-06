const fs = require('fs');
const path = require('path');
const SwarmRegistry = require('./Registry');
const TaskManager = require('./TaskManager');
const PatternLibrary = require('../memory/PatternLibrary');

/**
 * 🛰️ Swarm Node
 * Represents a running agent instance that participates in the Swarm.
 * Handles heartbeat, task polling, and pattern learning.
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
        this.patternLibrary = new PatternLibrary();
        
        this.status = 'IDLE';
        this.currentTask = null;
        this.trajectory = [];
        this.heartbeatInterval = null;
        this.taskPollInterval = null;
    }

    /**
     * Start the node: Begin heartbeat and task polling
     */
    start() {
        console.log(`🚀 Starting Swarm Node: ${this.config.name} (${this.config.id}) [L${this.config.security_level}]`);
        
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
        console.log(`🛑 Stopping Swarm Node: ${this.config.name}`);
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
        const myTasks = this.taskManager.listTasks({ assignee: this.config.id, status: 'PENDING' });
        
        if (myTasks.length > 0) {
            await this.acceptTask(myTasks[0]);
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
        // 1. Consult Pattern Library
        const role = this.config.roles[0] || 'Generalist';
        const patterns = this.patternLibrary.recall(role, { query: task.title });
        
        if (patterns.length > 0) {
            console.log(`🧠 [${this.config.name}] Recalled pattern: ${patterns[0].title}`);
        }

        // 2. Mock Execution Steps
        const steps = ['Analyzing...', 'Working...', 'Finalizing...'];
        
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s per step
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
        
        this.currentTask = null;
        this.trajectory = [];
        this.pulse();
    }
}

module.exports = SwarmNode;
