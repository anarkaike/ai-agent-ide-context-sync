const fs = require('fs');
const path = require('path');
const os = require('os');

class ApprovalLogger {
    constructor() {
        this.logDir = path.join(os.homedir(), '.ai-doc', 'logs');
        this.logFile = path.join(this.logDir, 'approvals.log');
        this.ensure();
    }

    ensure() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true, mode: 0o700 });
        }
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, '', { mode: 0o600 });
        }
    }

    logDecision(entry = {}) {
        const payload = {
            timestamp: new Date().toISOString(),
            level: entry.level || 'INFO',
            action: entry.action || 'inspect',
            agentId: entry.agentId || null,
            reason: entry.reason || null,
            score: typeof entry.score === 'number' ? entry.score : null,
            threats: entry.threats || [],
            context: entry.context || null,
            meta: entry.meta || {}
        };

        const line = JSON.stringify(payload);
        fs.appendFileSync(this.logFile, line + os.EOL, { encoding: 'utf8' });
    }

    readEntries(limit = 200) {
        if (!fs.existsSync(this.logFile)) return [];
        const raw = fs.readFileSync(this.logFile, 'utf8');
        if (!raw.trim()) return [];
        const lines = raw.split(/\r?\n/).filter(Boolean);
        const parsed = [];

        for (let i = 0; i < lines.length; i += 1) {
            try {
                parsed.push(JSON.parse(lines[i]));
            } catch (e) {
                // Ignore malformed lines but keep going
            }
        }

        if (limit && parsed.length > limit) {
            return parsed.slice(-limit);
        }

        return parsed;
    }

    getLogFilePath() {
        return this.logFile;
    }
}

module.exports = new ApprovalLogger();
