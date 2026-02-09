const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

class SQLiteBackend {
    constructor(options = {}) {
        this.dbPath = options.dbPath || path.join(os.homedir(), '.ai-doc', 'queue', 'notifications.sqlite3');
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    init() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                processed_at INTEGER
            )
        `);
    }

    publish(event) {
        const id = event.id || `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO notifications (id,payload,status,created_at)
            VALUES (?,?,?,?)
        `);
        stmt.run(id, JSON.stringify(event), 'pending', Date.now());
        stmt.finalize();
        return { id };
    }

    consume(handler) {
        return new Promise((resolve) => {
            this.db.get(`
                SELECT id,payload FROM notifications
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 1
            `, (err, row) => {
                if (!row || err) {
                    return resolve();
                }
                const event = JSON.parse(row.payload);
                handler(event).then(() => {
                    this.db.run(`
                        UPDATE notifications SET status = 'processed', processed_at = ? WHERE id = ?
                    `, [Date.now(), row.id]);
                    resolve();
                });
            });
        });
    }

    ack(id) {
        return new Promise((resolve) => {
            this.db.get(`SELECT id FROM notifications WHERE id = ? AND status = 'processed'`, [id], (err, row) => {
                resolve({ ok: !!row });
            });
        });
    }

    status() {
        return new Promise((resolve) => {
            this.db.get(`SELECT COUNT(*) AS pending FROM notifications WHERE status = 'pending'`, (err, row) => {
                resolve({ pending: row?.pending || 0, processed: 0 });
            });
        });
    }
}

module.exports = SQLiteBackend;
