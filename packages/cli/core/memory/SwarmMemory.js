const PatternLibrary = require('./PatternLibrary');
const TeamMemory = require('./TeamMemory');

/**
 * 🧠 SwarmMemory
 * Unified entry point for Agent Memory Persistence.
 * Combines Pattern Learning (Skills) and Team Context (Episodic/Semantic).
 */
class SwarmMemory {
    constructor(projectPath = process.cwd()) {
        this.patterns = new PatternLibrary(projectPath);
        this.teams = new TeamMemory(projectPath);
    }

    /**
     * Learn a new pattern from a successful task completion.
     */
    learnPattern(role, taskData) {
        return this.patterns.learn(role, {
            title: taskData.title,
            problem: taskData.description,
            solution: taskData.result,
            tags: taskData.tags || [],
            author: taskData.assignee
        });
    }

    /**
     * Record a team event or decision.
     */
    recordTeamEvent(team, content, author) {
        return this.teams.addEntry(team, content, author);
    }

    /**
     * Recall relevant information for a task.
     */
    recall(role, teams, query) {
        const patternMatches = this.patterns.recall(role, { query });
        
        let teamContext = [];
        if (teams && Array.isArray(teams)) {
            teams.forEach(team => {
                const recent = this.teams.getRecentEntries(team, 5);
                teamContext.push({ team, entries: recent });
            });
        }

        return {
            patterns: patternMatches,
            teamContext: teamContext
        };
    }
}

module.exports = SwarmMemory;
