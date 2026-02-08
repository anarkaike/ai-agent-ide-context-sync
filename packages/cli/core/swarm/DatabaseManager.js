const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor(baseDir) {
        this.baseDir = baseDir || path.join(process.cwd(), '.ai-workspace');
        this.dbPath = path.join(this.baseDir, 'swarm.db');
        this.db = null;
    }

    async init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ [DB] Connection error:', err.message);
                    reject(err);
                } else {
                    console.log('📦 [DB] Connected to SQLite persistence layer.');
                    this._createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async _createTables() {
        const schemas = [
            `CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                status TEXT,
                priority TEXT,
                assignee TEXT,
                creator_id TEXT,
                parent_id TEXT,
                trace_id TEXT,
                required_security_level INTEGER,
                created_at TEXT,
                updated_at TEXT,
                completed_at TEXT,
                metadata TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                role TEXT,
                name TEXT,
                security_level INTEGER,
                status TEXT,
                last_heartbeat TEXT,
                teams TEXT,
                capabilities TEXT,
                network_ip TEXT,
                current_task TEXT,
                trajectory TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS patterns (
                id TEXT PRIMARY KEY,
                title TEXT,
                problem TEXT,
                solution TEXT,
                tags TEXT,
                author TEXT,
                usage_count INTEGER,
                timestamp TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS security_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                severity TEXT,
                action TEXT,
                agent_role TEXT,
                resource TEXT,
                details TEXT,
                ip TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS network_topology (
                id TEXT PRIMARY KEY,
                source TEXT,
                target TEXT,
                weight INTEGER,
                last_interaction TEXT,
                type TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS network_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                source TEXT,
                target TEXT,
                type TEXT,
                status TEXT,
                reason TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS team_events (
                id TEXT PRIMARY KEY,
                team TEXT,
                content TEXT,
                author TEXT,
                timestamp TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS communications (
                id TEXT PRIMARY KEY,
                from_agent TEXT,
                to_agent TEXT,
                content TEXT,
                type TEXT,
                timestamp TEXT,
                read INTEGER
            )`
        ];

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                let completed = 0;
                schemas.forEach(sql => {
                    this.db.run(sql, (err) => {
                        if (err) {
                            console.error('❌ [DB] Schema error:', err.message);
                            reject(err);
                        }
                        completed++;
                        if (completed === schemas.length) resolve();
                    });
                });
            });
        });
    }

    // --- Generic Helpers ---

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // --- Task Methods ---

    async saveTask(task) {
        const sql = `INSERT OR REPLACE INTO tasks (
            id, title, description, status, priority, assignee, 
            creator_id, parent_id, trace_id, required_security_level,
            created_at, updated_at, completed_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            task.id, task.title, task.description, task.status, task.priority, task.assignee,
            task.creator_id, task.parent_id, task.trace_id, task.required_security_level,
            task.created_at, task.updated_at, task.completed_at, JSON.stringify(task.metadata || {})
        ];

        return this.run(sql, params);
    }

    async updateTask(id, fields) {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;

        let setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => {
            const v = fields[k];
            return typeof v === 'object' ? JSON.stringify(v) : v;
        });

        // Add updated_at if not present
        if (!keys.includes('updated_at')) {
      setClause += ', updated_at = ?';
      values.push(new Date().toISOString());
    }

    const sql = `UPDATE tasks SET ${setClause} WHERE id = ?`;
    values.push(id);

        return this.run(sql, values);
    }

    async getTask(id) {
        const row = await this.get('SELECT * FROM tasks WHERE id = ?', [id]);
        if (row) row.metadata = JSON.parse(row.metadata || '{}');
        return row;
    }

    async getTasks(filter = {}) {
        let sql = 'SELECT * FROM tasks';
        const params = [];
        const conditions = [];

        if (filter.status) {
            conditions.push('status = ?');
            params.push(filter.status);
        }
        if (filter.assignee) {
            conditions.push('assignee = ?');
            params.push(filter.assignee);
        }
        if (filter.parent_id) {
            conditions.push('parent_id = ?');
            params.push(filter.parent_id);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        const rows = await this.all(sql, params);
        return rows.map(r => ({ ...r, metadata: JSON.parse(r.metadata || '{}') }));
    }

    async deleteTask(id) {
        return this.run('DELETE FROM tasks WHERE id = ?', [id]);
    }

    async deleteAllTasks() {
        return this.run('DELETE FROM tasks');
    }

    // --- Agent Methods ---

    async saveAgent(agent) {
        const sql = `INSERT OR REPLACE INTO agents (
            id, role, name, security_level, status, last_heartbeat, 
            teams, capabilities, network_ip, current_task, trajectory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            agent.id,
            agent.role || 'Generalist',
            agent.name,
            agent.security_level,
            agent.status || 'IDLE',
            agent.last_heartbeat || new Date().toISOString(),
            JSON.stringify(agent.teams || []),
            JSON.stringify(agent.capabilities || []),
            JSON.stringify(agent.network || {}),
            agent.current_task || 'IDLE',
            JSON.stringify(agent.trajectory || [])
        ];

        return this.run(sql, params);
    }

    async getAgents() {
        const rows = await this.all('SELECT * FROM agents');
        return rows.map(r => ({
            ...r,
            teams: JSON.parse(r.teams || '[]'),
            capabilities: JSON.parse(r.capabilities || '[]'),
            network: JSON.parse(r.network_ip || '{}'),
            trajectory: JSON.parse(r.trajectory || '[]')
        }));
    }

    async getAgent(id) {
        const row = await this.get('SELECT * FROM agents WHERE id = ?', [id]);
        if (row) {
            row.teams = JSON.parse(row.teams || '[]');
            row.capabilities = JSON.parse(row.capabilities || '[]');
            row.network = JSON.parse(row.network_ip || '{}');
            row.trajectory = JSON.parse(row.trajectory || '[]');
        }
        return row;
    }

    // --- Pattern Methods ---

    async savePattern(pattern) {
        const sql = `INSERT OR REPLACE INTO patterns (
            id, title, problem, solution, tags, author, usage_count, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            pattern.id, pattern.title, pattern.problem, pattern.solution,
            JSON.stringify(pattern.tags || []),
            pattern.author,
            pattern.usage_count || 0,
            pattern.timestamp || new Date().toISOString()
        ];

        return this.run(sql, params);
    }

    async getPatterns(tag = null) {
        let sql = 'SELECT * FROM patterns';
        const params = [];
        if (tag) {
            sql += ' WHERE tags LIKE ?';
            params.push(`%${tag}%`);
        }
        const rows = await this.all(sql, params);
        return rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }));
    }

    // --- Security Methods ---

    async logSecurityEvent(event) {
        const sql = `INSERT INTO security_logs (
            id, timestamp, severity, action, agent_role, resource, details, ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            event.id || Date.now().toString(36),
            event.timestamp || new Date().toISOString(),
            event.severity,
            event.action,
            event.agent_role,
            event.resource,
            event.details,
            event.ip
        ];

        return this.run(sql, params);
    }

    async getSecurityLogs(limit = 100) {
        return this.all('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
    }

    // --- Topology Methods ---

    async recordInteraction(source, target, type = 'P2P') {
        const id = `${source}-${target}`;
        const existing = await this.get('SELECT * FROM network_topology WHERE id = ?', [id]);

        if (existing) {
            return this.run(
                'UPDATE network_topology SET weight = weight + 1, last_interaction = ? WHERE id = ?',
                [new Date().toISOString(), id]
            );
        } else {
            return this.run(
                'INSERT INTO network_topology (id, source, target, weight, last_interaction, type) VALUES (?, ?, ?, ?, ?, ?)',
                [id, source, target, 1, new Date().toISOString(), type]
            );
        }
    }

    async getTopology() {
        return this.all('SELECT * FROM network_topology');
    }

    async logNetworkEvent(log) {
        return this.run(
            'INSERT INTO network_logs (id, timestamp, source, target, type, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                log.id || Date.now().toString(36),
                new Date(log.timestamp).toISOString(),
                log.from, // Mapped from 'from' to 'source'
                log.to,   // Mapped from 'to' to 'target'
                log.type,
                log.status,
                log.reason
            ]
        );
    }

    async getNetworkLogs(limit = 100) {
        const rows = await this.all('SELECT * FROM network_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
        return rows.map(r => ({
            ...r,
            from: r.source, // Map back to 'from' for compatibility
            to: r.target    // Map back to 'to' for compatibility
        }));
    }

    // --- Team Memory Methods ---

    async saveTeamEvent(event) {
        const sql = `INSERT INTO team_events (
            id, team, content, author, timestamp
        ) VALUES (?, ?, ?, ?, ?)`;

        const params = [
            event.id || Date.now().toString(36),
            event.team,
            event.content,
            event.author || 'unknown',
            event.timestamp || new Date().toISOString()
        ];

        return this.run(sql, params);
    }

    async getTeamEvents(team, limit = 50) {
        return this.all('SELECT * FROM team_events WHERE team = ? ORDER BY timestamp DESC LIMIT ?', [team, limit]);
    }

    // --- Communication Methods ---

    async saveMessage(msg) {
        const sql = `INSERT INTO communications (
            id, from_agent, to_agent, content, type, timestamp, read
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        return this.run(sql, [
            msg.id, msg.from, msg.to, msg.content, msg.type, msg.timestamp, msg.read ? 1 : 0
        ]);
    }

    async getMessages(limit = 100) {
        return this.all('SELECT * FROM communications ORDER BY timestamp DESC LIMIT ?', [limit]);
    }
}

module.exports = DatabaseManager;