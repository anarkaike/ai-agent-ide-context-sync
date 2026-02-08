const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./DatabaseManager');

// Load Workflows
let WORKFLOWS = {};
try {
    WORKFLOWS = require('./workflows.json').workflows;
} catch (e) {
    console.warn('Could not load workflows.json, using defaults.');
}

class TaskManager {
    constructor() {
        this.dbManager = new DatabaseManager();
        // Initialize implicitly, but methods should wait for it if strictly necessary.
        // For simplicity in this architecture, we assume the db is fast enough or handled.
        // Ideally, we should await this.init() in the consumer.
        this.initPromise = this.dbManager.init();
        this.contextDir = path.join(process.cwd(), '.ai-workspace/tasks');
        if (!fs.existsSync(this.contextDir)) {
            fs.mkdirSync(this.contextDir, { recursive: true });
        }
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    async init() {
        return this.initPromise;
    }

    async createTask(title, description, priority = 'medium', context = {}, requiredSecurityLevel = 1, creatorId = 'system', parentId = null) {
        await this.initPromise;
        
        // Determine Type and Template
        const type = context.type || 'feature_dev'; // Default type
        const workflow = WORKFLOWS[type] || WORKFLOWS['feature_dev'];
        
        const newTask = {
            id: this._generateId(),
            title,
            description,
            priority,
            required_security_level: requiredSecurityLevel,
            status: workflow.states[0] || 'PENDING', // Initial state from workflow
            assignee: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: { ...context, type, workflow: workflow.name }, // Store type in metadata
            creator_id: creatorId,
            parent_id: parentId,
            trace_id: context.traceId || this._generateId()
        };

        await this.dbManager.saveTask(newTask);

        // 📝 Create Context File (Markdown)
        this._createContextFile(newTask, workflow);

        return newTask;
    }

    _createContextFile(task, workflow) {
        try {
            let content = `# ${task.title}\n`;
            content += `> **ID:** ${task.id} | **Type:** ${workflow.name} | **Priority:** ${task.priority}\n\n`;
            
            // Inject Template
            let template = workflow.template || '## Details\n{description}';
            template = template.replace('{description}', task.description || '')
                               .replace('{priority}', task.priority);
            
            content += template;
            content += `\n\n---\n*Created via Swarm TaskManager at ${task.created_at}*`;

            const filePath = path.join(this.contextDir, `${task.id}.md`);
            fs.writeFileSync(filePath, content);
            console.log(`📝 [TaskManager] Context file created: ${filePath}`);
        } catch (e) {
            console.error('Failed to create context file', e);
        }
    }

    async listTasks(filter = {}) {
        await this.initPromise;
        return this.dbManager.getTasks(filter);
    }

    async getTask(id) {
        await this.initPromise;
        return this.dbManager.getTask(id);
    }

    async deleteAllTasks() {
        await this.initPromise;
        return this.dbManager.deleteAllTasks();
    }

    async assignTask(taskId, agentId) {
        await this.initPromise;
        const task = await this.dbManager.getTask(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);

        task.assignee = agentId;
        task.status = 'IN_PROGRESS';
        task.updated_at = new Date().toISOString();

        await this.dbManager.saveTask(task);
        return task;
    }

    async updateStatus(taskId, status) {
        await this.initPromise;
        const task = await this.dbManager.getTask(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);

        task.status = status;
        task.updated_at = new Date().toISOString();
        if (status === 'COMPLETED') {
            task.completed_at = new Date().toISOString();
        }

        await this.dbManager.saveTask(task);
        return task;
    }

    async updateTaskFields(taskId, fields = {}) {
        await this.initPromise;
        const allowed = new Set(['status', 'assignee', 'priority', 'parent_id', 'trace_id']);
        const validFields = {};
        
        Object.entries(fields).forEach(([k, v]) => {
            if (allowed.has(k)) validFields[k] = v;
        });

        if (Object.keys(validFields).length > 0) {
            await this.dbManager.updateTask(taskId, validFields);
        }
        
        return this.dbManager.getTask(taskId);
    }
}

module.exports = TaskManager;
