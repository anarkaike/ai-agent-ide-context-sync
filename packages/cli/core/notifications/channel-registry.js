const fs = require('fs');
const path = require('path');
const os = require('os');

class ChannelRegistry {
    constructor(options = {}) {
        this.configPath =
            options.configPath ||
            path.join(os.homedir(), '.ai-doc', 'notifications', 'channels.json');
        const defaultsPath = options.defaultChannelsPath || path.join(__dirname, 'default-channels.json');
        this.defaultChannels = options.defaultChannels || require(defaultsPath);
        this.load();
    }

    ensureDir() {
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
    }

    load() {
        this.ensureDir();
        if (!fs.existsSync(this.configPath)) {
            const skeleton = {
                channels: this.defaultChannels,
                preferences: {},
                fallback: { channel: 'whatsapp' }
            };
            fs.writeFileSync(this.configPath, JSON.stringify(skeleton, null, 2), 'utf-8');
            this.config = skeleton;
            return;
        }

        try {
            const raw = fs.readFileSync(this.configPath, 'utf-8');
            this.config = JSON.parse(raw);
        } catch (err) {
            this.config = {
                channels: this.defaultChannels,
                preferences: {},
                fallback: { channel: 'whatsapp' }
            };
        }
    }

    reload() {
        this.load();
    }

    getChannelConfig(channelId) {
        return (this.config.channels || {})[channelId];
    }

    getPreference(agentId) {
        const prefs = this.config.preferences || {};
        return prefs[agentId] || prefs['default'];
    }

    resolveChannel(event) {
        const explicit = event.channel;
        if (explicit && this.getChannelConfig(explicit)) {
            return explicit;
        }
        const preference = this.getPreference(event.agentId);
        if (preference && this.getChannelConfig(preference)) {
            return preference;
        }
        return (this.config.fallback || {}).channel;
    }
}

module.exports = ChannelRegistry;
