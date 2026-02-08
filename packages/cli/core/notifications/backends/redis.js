class RedisBackend {
    constructor(options = {}) {
        this.client = options.client;
        this.queueKey = options.queueKey || 'notifications:queue';
        if (!this.client) throw new Error('Redis client is required');
    }

    async publish(event) {
        const id = event.id || `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
        await this.client.lpush(this.queueKey, JSON.stringify({ ...event, id }));
        return { id };
    }

    async consume(handler) {
        const payload = await this.client.rpop(this.queueKey);
        if (!payload) return;
        const event = JSON.parse(payload);
        await handler(event);
    }

    async ack(id) {
        return { ok: true };
    }

    async status() {
        const pending = await this.client.llen(this.queueKey);
        return { pending, processed: 0 };
    }
}

module.exports = RedisBackend;
