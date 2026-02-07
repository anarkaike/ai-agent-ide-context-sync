const fs = require('fs');
const path = require('path');
const os = require('os');

class TaskManager {
    constructor() {
        this.homeDir = os.homedir();
        this.baseDir = path.join(this.homeDir, '.ai-doc', 'swarm');
        this.tasksFile = process.env.AI_DOC_SWARM_TASKS || path.join(this.baseDir, 'tasks.json');
        this.init();
    }

    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    init() {
        const dir = path.dirname(this.tasksFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.tasksFile)) {
            fs.writeFileSync(this.tasksFile, JSON.stringify([], null, 2));
        }
    }

    _loadTasks() {
        try {
            return JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    _saveTasks(tasks) {
        fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
    }

    createTask(title, description, priority = 'medium', context = {}, requiredSecurityLevel = 1, creatorId = 'system', parentId = null) {
        const tasks = this._loadTasks();
        const newTask = {
            id: this._generateId(),
            title,
            description,
            priority,
            required_security_level: requiredSecurityLevel,
            status: 'PENDING', // PENDING, IN_PROGRESS, COMPLETED, BLOCKED
            assignee: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            context,
            creator_id: creatorId,
            parent_id: parentId,
            trace_id: context.traceId || this._generateId()
        };
        tasks.push(newTask);
        this._saveTasks(tasks);
        return newTask;
    }

    deleteAllTasks() {
        this._saveTasks([]);
    }

    assignTask(taskId, agentId) {
        const tasks = this._loadTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

        tasks[taskIndex].assignee = agentId;
        tasks[taskIndex].status = 'IN_PROGRESS';
        tasks[taskIndex].updated_at = new Date().toISOString();
        
        this._saveTasks(tasks);
        return tasks[taskIndex];
    }

    updateStatus(taskId, status) {
        const tasks = this._loadTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);

        tasks[taskIndex].status = status;
        tasks[taskIndex].updated_at = new Date().toISOString();
        
        this._saveTasks(tasks);
        return tasks[taskIndex];
    }

    updateTaskFields(taskId, fields = {}) {
        const allowed = new Set(['status', 'assignee', 'priority', 'parent_id', 'trace_id']);
        const tasks = this._loadTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) throw new Error(`Task ${taskId} not found`);
        const task = tasks[taskIndex];
        Object.entries(fields).forEach(([k, v]) => {
            if (allowed.has(k)) task[k] = v;
        });
        task.updated_at = new Date().toISOString();
        tasks[taskIndex] = task;
        this._saveTasks(tasks);
        return task;
    }

    listTasks(filter = {}) {
        let tasks = this._loadTasks();
        if (filter.status) {
            tasks = tasks.filter(t => t.status === filter.status);
        }
        if (filter.assignee) {
            tasks = tasks.filter(t => t.assignee === filter.assignee);
        }
        if (filter.parent_id) {
            tasks = tasks.filter(t => t.parent_id === filter.parent_id);
        }
        if (filter.trace_id) {
            tasks = tasks.filter(t => t.trace_id === filter.trace_id);
        }
        return tasks;
    }

    getTask(taskId) {
        const tasks = this._loadTasks();
        return tasks.find(t => t.id === taskId);
    }

    listSubTasks(parentId) {
        return this.listTasks({ parent_id: parentId });
    }

    listRelatedByTrace(traceId) {
        return this.listTasks({ trace_id: traceId });
    }
}

module.exports = TaskManager;
