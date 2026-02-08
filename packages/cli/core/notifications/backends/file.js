const fs = require('fs');
const path = require('path');
const os = require('os');

class FileBackend {
    constructor(options = {}) {
        this.queueDir = options.queueDir || path.join(os.homedir(), '.ai-doc', 'queue', 'notifications');
        this.logFile = path.join(this.queueDir, 'notifications.log');
        this.pendingDir = path.join(this.queueDir, 'pending');
        this.processedDir = path.join(this.queueDir, 'processed');
        this.ensure();
    }

    ensure() {
        [this.queueDir, this.pendingDir, this.processedDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
            }
        });
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '', { mode: 0o600 });
        }
    }

    async publish(event) {
        const record = JSON.stringify(event);
        fs.appendFileSync(this.logFile, record + os.EOL);
        const id = event.id || `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
        const pendingPath = path.join(this.pendingDir, `${event.timestamp || Date.now()}-${id}.json`);
        fs.writeFileSync(pendingPath, record, 'utf-8');
        return { id };
    }

    async consume(handler) {
        const files = fs.readdirSync(this.pendingDir).filter(f => f.endsWith('.json')).sort();
        for (const file of files) {
            const filePath = path.join(this.pendingDir, file);
            const raw = fs.readFileSync(filePath, 'utf-8');
            let event;
            try {
                event = JSON.parse(raw);
            } catch (err) {
                fs.unlinkSync(filePath);
                continue;
            }
            const result = await handler(event);
            if (result && result.handled) {
                const dest = path.join(this.processedDir, file);
                fs.renameSync(filePath, dest);
            }
        }
    }

    async ack(id) {
        const regex = new RegExp(id);
        const files = fs.readdirSync(this.processedDir).filter(f => regex.test(f));
        if (files.length) {
            return { ok: true };
        }
        return { ok: false };
    }

    async status() {
        const pending = fs.readdirSync(this.pendingDir).length;
        const processed = fs.readdirSync(this.processedDir).length;
        return { pending, processed };
    }
}

module.exports = FileBackend;
