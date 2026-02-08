const FileBackend = require('./backends/file');
const RedisBackend = require('./backends/redis');
const SQLiteBackend = require('./backends/sqlite');
const MySQLBackend = require('./backends/mysql');
const PostgresBackend = require('./backends/postgres');
const crypto = require('crypto');
const ChannelRegistry = require('./channel-registry');

const ADAPTERS = {
    file: FileBackend,
    redis: RedisBackend,
    sqlite: SQLiteBackend,
    mysql: MySQLBackend,
    postgres: PostgresBackend
};

class NotificationBus {
    constructor(options = {}) {
        this.backendName = (process.env.NOTIFY_BACKEND || 'file').toLowerCase();
        const Adapter = ADAPTERS[this.backendName] || FileBackend;
        this.adapter = new Adapter(options.adapterOptions || {});
        this.secret = process.env.NOTIFY_SECRET || 'ai-doc-secret';
        this.registry = new ChannelRegistry(options.channelOptions || {});
    }

    publish(event) {
        const channel = event.channel;
        const resolvedChannel =
            channel || this.registry.resolveChannel(event) || this.registry.config.fallback?.channel;
        const resolved = {
            ...event,
            timestamp: event.timestamp || Date.now(),
            id: event.id || crypto.randomBytes(8).toString('hex'),
            channel: resolvedChannel
        };
        resolved.signature = this.signature(resolved);
        return this.adapter.publish(resolved);
    }

    consume(handler) {
        return this.adapter.consume(async event => {
            if (!this.verify(event)) {
                return { handled: false };
            }
            return handler(event);
        });
    }

    ack(id) {
        return this.adapter.ack(id);
    }

    status() {
        return this.adapter.status();
    }

    signature(payload) {
        const { id, agentId, status, timestamp } = payload;
        const data = [id, agentId, status, timestamp].join('|');
        return crypto.createHmac('sha256', this.secret).update(data).digest('hex');
    }

    verify(payload) {
        if (!payload.signature) return false;
        const expected = this.signature(payload);
        return expected === payload.signature;
    }
}

module.exports = new NotificationBus();
