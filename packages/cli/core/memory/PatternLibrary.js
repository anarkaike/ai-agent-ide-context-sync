const fs = require('fs');
const path = require('path');

class PatternLibrary {
    constructor(projectPath = process.cwd()) {
        this.baseDir = path.join(projectPath, '.ai-workspace', 'memory', 'patterns');
        this.init();
    }

    init() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    _getFilePath(role) {
        // Sanitize role name to be safe for filesystem
        const safeRole = role.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        return path.join(this.baseDir, `${safeRole}.json`);
    }

    _loadPatterns(role) {
        const filePath = this._getFilePath(role);
        if (!fs.existsSync(filePath)) {
            return { patterns: [] };
        }
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(`Error loading patterns for role ${role}:`, error);
            return { patterns: [] };
        }
    }

    _savePatterns(role, data) {
        const filePath = this._getFilePath(role);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    /**
     * Learn a new pattern for a specific role
     * @param {string} role - The role associated with this pattern (e.g., 'Architect')
     * @param {object} data - { title, problem, solution, tags, author }
     */
    learn(role, data) {
        if (!role || !data.title || !data.solution) {
            throw new Error("Missing required fields: role, title, solution");
        }

        const store = this._loadPatterns(role);
        
        const newPattern = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            title: data.title,
            problem: data.problem || "",
            solution: data.solution,
            tags: data.tags || [],
            author: data.author || 'unknown',
            usageCount: 0,
            ...data // allow extra fields
        };

        store.patterns.push(newPattern);
        this._savePatterns(role, store);
        
        return newPattern;
    }

    /**
     * Find patterns for a role, optionally filtered by context/tags
     * @param {string} role - The role to search patterns for
     * @param {object} options - { query, tags, limit }
     */
    recall(role, options = {}) {
        const store = this._loadPatterns(role);
        let results = store.patterns;

        // Filter by tags (AND logic)
        if (options.tags && options.tags.length > 0) {
            results = results.filter(p => 
                options.tags.every(t => p.tags.includes(t))
            );
        }

        // Simple text search (mock semantic search)
        if (options.query) {
            const q = options.query.toLowerCase();
            results = results.filter(p => {
                const titleMatch = (p.title || "").toLowerCase().includes(q);
                const problemMatch = (p.problem || "").toLowerCase().includes(q);
                const tagMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
                
                // Inverse match: Query contains pattern keywords (better for Task Title search)
                // If query is long (like a sentence), check if pattern title/tags are IN the query
                const queryContainsTitle = p.title ? q.includes(p.title.toLowerCase()) : false;
                const queryContainsTag = p.tags ? p.tags.some(t => q.includes(t.toLowerCase())) : false;

                return titleMatch || problemMatch || tagMatch || queryContainsTitle || queryContainsTag;
            });
        }

        // Sort by usage (popularity)
        results.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    /**
     * Increment usage counter for a pattern
     */
    markUsed(role, patternId) {
        const store = this._loadPatterns(role);
        const pattern = store.patterns.find(p => p.id === patternId);
        if (pattern) {
            pattern.usageCount = (pattern.usageCount || 0) + 1;
            this._savePatterns(role, store);
            return true;
        }
        return false;
    }
}

module.exports = PatternLibrary;
