const fs = require('fs');
const path = require('path');
const os = require('os');

class NeuralLink {
    constructor(dbManager) {
        this.dbManager = dbManager;
        // Use project-local path for Git synchronization
        this.filePath = path.join(process.cwd(), '.ai-workspace', 'communication', 'neural_link.json');
        this.init();
    }

    init() {
        if (!fs.existsSync(this.filePath)) {
            try {
                const dir = path.dirname(this.filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(this.filePath, '[]', 'utf8');
            } catch (e) {
                console.error('❌ [NeuralLink] Failed to init file:', e.message);
            }
        }
    }

    async sync() {
        try {
            if (!fs.existsSync(this.filePath)) return;

            const fileContent = fs.readFileSync(this.filePath, 'utf8');
            let externalMessages = [];
            try {
                externalMessages = JSON.parse(fileContent);
            } catch (e) {
                console.warn('⚠️ [NeuralLink] Corrupt JSON, resetting if empty', e.message);
                return;
            }

            if (!Array.isArray(externalMessages)) return;

            let newCount = 0;
            for (const msg of externalMessages) {
                // Check if exists in DB
                const exists = await this.dbManager.get('SELECT id FROM communications WHERE id = ?', [msg.id]);
                if (!exists) {
                    await this.dbManager.saveMessage({
                        id: msg.id,
                        from: msg.from || msg.name || 'Unknown',
                        to: msg.to || 'broadcast',
                        content: msg.content,
                        type: msg.type || 'text',
                        timestamp: msg.timestamp || new Date().toISOString(),
                        read: false
                    });
                    newCount++;
                }
            }

            if (newCount > 0) {
                console.log(`📡 [NeuralLink] Synced ${newCount} new messages from shared bus.`);
            }
        } catch (e) {
            console.error('❌ [NeuralLink] Sync error:', e.message);
        }
    }

    async sendMessage(msg) {
        // 1. Save to DB first
        await this.dbManager.saveMessage(msg);

        // 2. Append to shared file
        try {
            let messages = [];
            if (fs.existsSync(this.filePath)) {
                const content = fs.readFileSync(this.filePath, 'utf8');
                try {
                    messages = JSON.parse(content);
                } catch (e) {}
            }

            // Add new message
            messages.push({
                id: msg.id,
                timestamp: msg.timestamp,
                from: msg.from,
                name: msg.from, // Compatibility
                to: msg.to,
                content: msg.content,
                type: msg.type
            });

            // Optional: Trim log if too big (keep last 50)
            if (messages.length > 50) {
                messages = messages.slice(-50);
            }

            fs.writeFileSync(this.filePath, JSON.stringify(messages, null, 2), 'utf8');
            console.log(`📤 [NeuralLink] Message transmitted to shared bus: ${msg.id}`);
        } catch (e) {
            console.error('❌ [NeuralLink] Failed to write to shared bus:', e.message);
        }
    }
}

module.exports = NeuralLink;
