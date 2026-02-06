const fs = require('fs');
const path = require('path');

class TeamMemory {
    constructor(projectPath) {
        this.baseDir = path.join(projectPath, '.ai-workspace', 'memory', 'teams');
        this.init();
    }

    init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    getTeamPath(team) {
        return path.join(this.baseDir, `${team.toLowerCase()}.json`);
    }

    load(team) {
        const p = this.getTeamPath(team);
        if (fs.existsSync(p)) {
            try {
                return JSON.parse(fs.readFileSync(p, 'utf8'));
            } catch (e) {
                return { entries: [] };
            }
        }
        return { entries: [] };
    }

    save(team, data) {
        const p = this.getTeamPath(team);
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
    }

    addEntry(team, content, author = 'unknown') {
        const data = this.load(team);
        const entry = {
            id: Date.now().toString(36),
            timestamp: new Date().toISOString(),
            author,
            content
        };
        data.entries = data.entries || [];
        data.entries.push(entry);
        
        // Keep last 50 entries
        if (data.entries.length > 50) {
            data.entries = data.entries.slice(-50);
        }
        
        this.save(team, data);
        return entry;
    }

    getRecentEntries(team, limit = 3) {
        const data = this.load(team);
        return (data.entries || []).slice(-limit).reverse();
    }
}

module.exports = TeamMemory;
