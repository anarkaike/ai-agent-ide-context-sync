class MySQLBackend {
    constructor(options = {}) {
        this.pool = options.pool;
        if (!this.pool) throw new Error('MySQL pool required');
    }

    async publish(event) {
        const id = event.id || `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
        await this.pool.execute('INSERT INTO notifications (id,payload,status,created_at) VALUES (?,?,?,?)', [id, JSON.stringify(event), 'pending', Date.now()]);
        return { id };
    }

    async consume(handler) {
        const [rows] = await this.pool.execute(`
            SELECT id,payload FROM notifications
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        `);
        if (!rows.length) return;
        const event = JSON.parse(rows[0].payload);
        await handler(event);
        await this.pool.execute('UPDATE notifications SET status = ?, processed_at = ? WHERE id = ?', ['processed', Date.now(), rows[0].id]);
    }

    async ack(id) {
        const [rows] = await this.pool.execute('SELECT id FROM notifications WHERE id = ? AND status = ?', [id, 'processed']);
        return { ok: rows.length > 0 };
    }

    async status() {
        const [rows] = await this.pool.execute('SELECT COUNT(*) AS pending FROM notifications WHERE status = ?', ['pending']);
        return { pending: rows[0]?.pending || 0, processed: 0 };
    }
}

module.exports = MySQLBackend;
