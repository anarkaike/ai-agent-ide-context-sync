class PostgresBackend {
    constructor(options = {}) {
        this.pool = options.pool;
        if (!this.pool) throw new Error('Postgres pool required');
    }

    async publish(event) {
        const id = event.id || `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
        await this.pool.query('INSERT INTO notifications (id,payload,status,created_at) VALUES ($1,$2,$3,$4)', [id, JSON.stringify(event), 'pending', Date.now()]);
        return { id };
    }

    async consume(handler) {
        const res = await this.pool.query(`
            SELECT id,payload FROM notifications
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        `);
        if (!res.rows.length) return;
        const event = JSON.parse(res.rows[0].payload);
        await handler(event);
        await this.pool.query('UPDATE notifications SET status = $1, processed_at = $2 WHERE id = $3', ['processed', Date.now(), res.rows[0].id]);
    }

    async ack(id) {
        const res = await this.pool.query('SELECT id FROM notifications WHERE id = $1 AND status = $2', [id, 'processed']);
        return { ok: res.rowCount > 0 };
    }

    async status() {
        const res = await this.pool.query('SELECT COUNT(*) AS pending FROM notifications WHERE status = $1', ['pending']);
        return { pending: parseInt(res.rows[0]?.pending || '0', 10), processed: 0 };
    }
}

module.exports = PostgresBackend;
