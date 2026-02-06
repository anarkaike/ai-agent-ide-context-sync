const fs = require('fs');
const path = require('path');

/**
 * 🔮 Existential Projector
 * 
 * Projects the agent's future trajectory based on current state, tasks, and nature (Roles).
 * "Where am I going? What are my possibilities?"
 */
class ExistentialProjector {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.tasksDir = path.join(projectPath, '.ai-workspace', 'tasks');
    }

    /**
     * Projects the immediate and mid-term trajectory.
     * @returns {Array<string>} List of future states/actions
     */
    project() {
        const trajectory = [];

        // 1. Immediate Future (Active Tasks) - Limit to 3 to show variety
        const activeTasks = this._scanTasks('active');
        if (activeTasks.length > 0) {
            trajectory.push(...activeTasks.slice(0, 3).map(t => `FINISH: ${t}`));
            if (activeTasks.length > 3) trajectory.push(`... +${activeTasks.length - 3} TASKS`);
        } else {
            trajectory.push("AWAITING_INSTRUCTION");
        }

        // 2. Mid-term Future (Pending/Backlog)
        const backlogTasks = this._scanTasks('backlog');
        if (backlogTasks.length > 0) {
             trajectory.push(...backlogTasks.map(t => `PLAN: ${t}`));
        }
        
        // 3. Inherent Path (Based on Roles)
        const identity = this._getIdentity();
        if (identity.roles && identity.roles.length > 0) {
            identity.roles.forEach(role => {
                const goal = this._getRoleGoal(role);
                if (goal) trajectory.push(`MAINTAIN: ${goal}`);
            });
        }

        return trajectory.slice(0, 5); // Limit to top 5 projections
    }

    _scanTasks(subDir) {
        const dir = path.join(this.tasksDir, subDir);
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir)
            .filter(f => f.endsWith('.md'))
            .map(f => {
                // Extract title from filename: persona--task-001-title-slug.md
                // or persona--task-id-slug.md
                const parts = f.replace('.md', '').split('--');
                let name = parts[parts.length - 1]; // "task-011-test-observability" or "slug"
                
                // Remove common prefixes
                name = name.replace(/^task-[a-zA-Z0-9]+-/, ''); 
                
                // Replace dashes with spaces and capitalize
                return name.replace(/-/g, ' ').trim();
            });
    }

    _getIdentity() {
        try {
            const p = path.join(this.projectPath, '.ai-workspace', 'identity.json');
            if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
        } catch (e) {}
        return {};
    }

    _getRoleGoal(role) {
        const goals = {
            'Architect': 'System Coherence',
            'Developer': 'Code Quality',
            'Security': 'Zero Trust',
            'Manager': 'Task Efficiency',
            'Designer': 'User Experience'
        };
        return goals[role] || `${role} Excellence`;
    }
}

module.exports = ExistentialProjector;
