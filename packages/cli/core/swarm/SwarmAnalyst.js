const DatabaseManager = require('./DatabaseManager');

class SwarmAnalyst {
    constructor(dbManager) {
        this.db = dbManager;
    }

    async generateReport() {
        const logs = await this.db.all('SELECT * FROM network_logs ORDER BY timestamp DESC LIMIT 100');
        const agents = await this.db.all('SELECT * FROM agents');
        const tasks = await this.db.all('SELECT * FROM tasks');

        const report = {
            timestamp: new Date().toISOString(),
            metrics: {
                total_logs: logs.length,
                blocked: 0,
                delivered: 0,
                security_incidents: 0
            },
            insights: [],
            recommendations: []
        };

        // 1. Analyze Traffic
        const blockReasons = {};
        const offenderCounts = {};

        logs.forEach(log => {
            if (log.status === 'BLOCKED') {
                report.metrics.blocked++;
                
                // Count reasons
                const reason = log.reason || 'UNKNOWN';
                blockReasons[reason] = (blockReasons[reason] || 0) + 1;

                // Count offenders
                const source = log.source || 'unknown';
                offenderCounts[source] = (offenderCounts[source] || 0) + 1;
            } else {
                report.metrics.delivered++;
            }
        });

        // 2. Generate Insights
        if (report.metrics.blocked > 0) {
            const percentage = ((report.metrics.blocked / report.metrics.total_logs) * 100).toFixed(1);
            report.insights.push({
                type: 'CRITICAL',
                message: `Taxa de bloqueio elevada detectada: ${percentage}% das comunicações recentes foram bloqueadas.`
            });

            // Top Reason
            const topReason = Object.entries(blockReasons).sort((a,b) => b[1] - a[1])[0];
            if (topReason) {
                report.insights.push({
                    type: 'WARNING',
                    message: `Principal causa de bloqueio: ${topReason[0]} (${topReason[1]} ocorrências).`
                });

                if (topReason[0].includes('UNSECURE_NETWORK_ORIGIN')) {
                    report.recommendations.push({
                        action: 'FIX_NETWORK',
                        details: 'Agentes estão operando fora da rede Tailscale segura (100.x.x.x). Verifique configurações de rede dos nós.'
                    });
                }
                if (topReason[0].includes('INSUFFICIENT_SECURITY_LEVEL')) {
                    report.recommendations.push({
                        action: 'AUDIT_ROLES',
                        details: 'Tentativas de acesso não autorizado a recursos de nível superior. Revise as permissões dos agentes.'
                    });
                }
            }

            // Top Offender
            const topOffender = Object.entries(offenderCounts).sort((a,b) => b[1] - a[1])[0];
            if (topOffender) {
                const agentName = agents.find(a => a.id === topOffender[0])?.name || topOffender[0];
                report.insights.push({
                    type: 'WARNING',
                    message: `Agente com mais violações: ${agentName} (${topOffender[0]}).`
                });
            }
        } else {
            report.insights.push({
                type: 'SUCCESS',
                message: 'Fluxo de rede estável. Nenhuma violação de segurança recente detectada.'
            });
        }

        // 3. Analyze Tasks
        const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED').length;
        report.metrics.pending_tasks = pendingTasks;
        
        if (pendingTasks > 10) {
            report.insights.push({
                type: 'INFO',
                message: `Alta carga de trabalho: ${pendingTasks} tarefas pendentes. Considere instanciar mais agentes.`
            });
        }

        return report;
    }
}

module.exports = SwarmAnalyst;
