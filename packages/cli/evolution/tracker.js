/**
 * MetricsTracker - Sistema de telemetria de regras
 * 
 * Rastreia quais regras são sugeridas e aplicadas para permitir
 * evolução futura (regras pouco usadas podem ser descartadas, 
 * regras muito usadas podem virar 'always').
 */

const fs = require('fs');
const path = require('path');

class MetricsTracker {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.statsPath = path.join(this.projectRoot, '.ai-workspace', 'stats.json');
        this.stats = this.loadStats();
    }

    loadStats() {
        if (fs.existsSync(this.statsPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.statsPath, 'utf-8'));
            } catch (e) {
                return { rules: {}, sessions: 0 };
            }
        }
        return { rules: {}, sessions: 0 };
    }

    save() {
        const dir = path.dirname(this.statsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2));
    }

    /**
     * Registra uso de uma regra
     * @param {string} ruleId
     * @param {string} reason Razão da aplicação (always, manual, semantic, glob)
     */
    trackRuleUsage(ruleId, reason) {
        if (!this.stats.rules[ruleId]) {
            this.stats.rules[ruleId] = {
                suggestions: 0,
                byReasons: {}
            };
        }

        const ruleStats = this.stats.rules[ruleId];
        ruleStats.suggestions++;
        ruleStats.byReasons[reason] = (ruleStats.byReasons[reason] || 0) + 1;

        // Save async/debounced in production, sync here for reliability
        this.save();
    }

    /**
     * Retorna regras mais populares
     */
    getMostPopularRules(limit = 5) {
        return Object.entries(this.stats.rules)
            .sort((a, b) => b[1].suggestions - a[1].suggestions)
            .slice(0, limit)
            .map(([id, stats]) => ({ id, ...stats }));
    }
}

module.exports = MetricsTracker;
