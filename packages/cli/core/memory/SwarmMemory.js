const DatabaseManager = require('../swarm/DatabaseManager');

/**
 * 🧠 SwarmMemory
 * Unified entry point for Agent Memory Persistence.
 * Combines Pattern Learning (Skills) and Team Context (Episodic/Semantic).
 * Now backed by SQLite via DatabaseManager.
 */
class SwarmMemory {
    constructor(projectPath = process.cwd()) {
        this.dbManager = new DatabaseManager(path.join(projectPath, '.ai-workspace'));
        // Initialize implicitly
        this.initPromise = this.dbManager.init();
    }

    async init() {
        return this.initPromise;
    }

    /**
     * Learn a new pattern from a successful task completion.
     */
    async learnPattern(role, taskData) {
        await this.initPromise;
        
        const pattern = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            title: taskData.title,
            problem: taskData.description || "",
            solution: taskData.result,
            tags: taskData.tags || [],
            author: taskData.assignee || 'unknown',
            usage_count: 0,
            timestamp: new Date().toISOString()
        };

        try {
            await this.dbManager.savePattern(pattern);
            return pattern;
        } catch (e) {
            console.error('❌ [Memory] Failed to learn pattern:', e);
            return null;
        }
    }

    /**
     * Record a team event or decision.
     */
    async recordTeamEvent(team, content, author) {
        await this.initPromise;
        
        const event = {
            team,
            content,
            author,
            timestamp: new Date().toISOString()
        };

        try {
            return await this.dbManager.saveTeamEvent(event);
        } catch (e) {
            console.error('❌ [Memory] Failed to record team event:', e);
            return null;
        }
    }

    /**
     * Recall relevant information for a task.
     */
    async recall(role, teams, query) {
        await this.initPromise;
        
        // Fetch all patterns (we might want to filter by role/tag in DB later)
        // For now, get all and filter in memory if needed, or update DBManager to filter by role
        // DBManager.getPatterns takes a 'tag' argument.
        
        let patterns = [];
        try {
            // Try to find by role as a tag, or just get all
            const rolePatterns = await this.dbManager.getPatterns(role); 
            // Also search by query if possible? DatabaseManager.getPatterns only supports tag filter.
            // Let's just return what we have for the role.
            patterns = rolePatterns;
            
            // If query is provided, perform simple client-side filtering (fuzzy match)
            if (query && patterns.length > 0) {
                const q = query.toLowerCase();
                patterns = patterns.filter(p => 
                    p.title.toLowerCase().includes(q) || 
                    p.problem.toLowerCase().includes(q) ||
                    (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
                );
            }
        } catch (e) {
            console.error('❌ [Memory] Failed to recall patterns:', e);
        }

        let teamContext = [];
        if (teams && Array.isArray(teams)) {
            for (const team of teams) {
                try {
                    const recent = await this.dbManager.getTeamEvents(team, 5);
                    teamContext.push({ team, entries: recent });
                } catch (e) {
                    console.error(`❌ [Memory] Failed to recall team context for ${team}:`, e);
                }
            }
        }

        return {
            patterns: patterns,
            teamContext: teamContext
        };
    }
}

// Helper for path if not imported
const path = require('path');

module.exports = SwarmMemory;