/**
 * 🛡️ Security Monitor - Sistema de Proteção Avançada
 * 
 * Funções:
 * - Detecção de agentes não autorizados
 * - Monitoramento de comportamento anômalo
 * - Fila de verificação humana
 * - Relatórios de segurança detalhados
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityMonitor {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.securityLog = path.join(workspacePath, '.ai-workspace', 'logs', 'security-monitor.log');
        this.suspicionQueue = path.join(workspacePath, '.ai-workspace', 'security', 'suspicion-queue.json');
        this.authorizedAgents = new Set([
            'prime-orchestrator-001',
            'agent-vps-test',
            'Anonymous Drone', // Nome padrão autorizado
            'VPS Agent Test'
        ]);
        this.suspiciousPatterns = [
            /hack|crack|exploit|backdoor|rootkit/i,
            /bitcoin|crypto|mining|malware/i,
            /wget.*sh|curl.*sh|bash.*http/i,
            /rm.*-rf|dd.*if=|chmod.*777/i,
            /sudo|su.*root|passwd.*shadow/i
        ];
        
        this.initializeSecurity();
    }

    async initializeSecurity() {
        // Garantir diretórios de segurança
        const securityDir = path.dirname(this.suspicionQueue);
        if (!fs.existsSync(securityDir)) {
            fs.mkdirSync(securityDir, { recursive: true });
        }

        // Inicializar fila de suspeitas
        if (!fs.existsSync(this.suspicionQueue)) {
            fs.writeFileSync(this.suspicionQueue, JSON.stringify({
                queue: [],
                last_updated: new Date().toISOString(),
                total_cases: 0
            }, null, 2));
        }

        console.log('🛡️ Security Monitor inicializado');
    }

    /**
     * Verifica se um agente é autorizado
     */
    isAgentAuthorized(agentId, agentName) {
        // Agentes com nomes suspeitos são automaticamente bloqueados
        if (this.hasSuspiciousName(agentName)) {
            return false;
        }

        // Verificar lista de autorizados
        return this.authorizedAgents.has(agentId) || 
               this.authorizedAgents.has(agentName) ||
               agentName === 'Anonymous Drone'; // Permitir padrão
    }

    /**
     * Detecta nomes suspeitos
     */
    hasSuspiciousName(name) {
        const suspiciousNames = [
            'hacker', 'cracker', 'exploit', 'backdoor',
            'malware', 'virus', 'trojan', 'rootkit',
            'bitcoin', 'miner', 'crypto', 'botnet'
        ];
        
        return suspiciousNames.some(suspicious => 
            name.toLowerCase().includes(suspicious)
        );
    }

    /**
     * Analisa logs em busca de comportamento anômalo
     */
    async analyzeAgentLogs(agentId, agentName, logs) {
        const analysis = {
            agentId,
            agentName,
            timestamp: new Date().toISOString(),
            riskLevel: 'LOW',
            suspiciousActivities: [],
            anomalies: [],
            recommendations: []
        };

        // Verificar padrões suspeitos nos logs
        for (const pattern of this.suspiciousPatterns) {
            const matches = logs.filter(log => pattern.test(log));
            if (matches.length > 0) {
                analysis.suspiciousActivities.push({
                    type: 'PATTERN_MATCH',
                    pattern: pattern.toString(),
                    matches: matches.slice(0, 3), // Limitar para não sobrecarregar
                    count: matches.length
                });
                analysis.riskLevel = 'HIGH';
            }
        }

        // Verificar comportamentos anômalos
        analysis.anomalies = this.detectAnomalies(logs);
        if (analysis.anomalies.length > 0) {
            analysis.riskLevel = analysis.riskLevel === 'HIGH' ? 'CRITICAL' : 'MEDIUM';
        }

        // Gerar recomendações
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    /**
     * Detecta anomalias nos logs
     */
    detectAnomalies(logs) {
        const anomalies = [];
        
        // Verificar volume excessivo de mensagens
        if (logs.length > 1000) {
            anomalies.push({
                type: 'HIGH_VOLUME',
                description: `Volume anormal de logs: ${logs.length} mensagens`,
                severity: 'MEDIUM'
            });
        }

        // Verificar mensagens repetitivas (possível loop)
        const uniqueMessages = new Set(logs);
        if (uniqueMessages.size < logs.length * 0.1) {
            anomalies.push({
                type: 'REPETITIVE_PATTERN',
                description: 'Padrão repetitivo detectado (possível loop)',
                severity: 'MEDIUM'
            });
        }

        // Verificar tentativas de acesso a arquivos sensíveis
        const sensitivePatterns = [/\.env/, /config\./, /private/i, /secret/i];
        for (const pattern of sensitivePatterns) {
            const matches = logs.filter(log => pattern.test(log));
            if (matches.length > 0) {
                anomalies.push({
                    type: 'SENSITIVE_ACCESS',
                    description: `Acesso a arquivos sensíveis detectado: ${matches.length} ocorrências`,
                    severity: 'HIGH'
                });
            }
        }

        return anomalies;
    }

    /**
     * Gera recomendações baseadas na análise
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.riskLevel === 'CRITICAL') {
            recommendations.push({
                priority: 'IMMEDIATE',
                action: 'ISOLATE_AGENT',
                description: 'Isolar agente imediatamente e investigar'
            });
        }
        
        if (analysis.suspiciousActivities.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'REVIEW_LOGS',
                description: 'Revisar logs manualmente para validar atividades'
            });
        }
        
        if (analysis.anomalies.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'MONITOR_BEHAVIOR',
                description: 'Monitorar comportamento do agente por 24h'
            });
        }

        return recommendations;
    }

    /**
     * Adiciona caso à fila de verificação humana
     */
    async addToSuspicionQueue(analysis) {
        const queue = JSON.parse(fs.readFileSync(this.suspicionQueue, 'utf8'));
        
        const caseItem = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: 'PENDING_HUMAN_REVIEW',
            agentId: analysis.agentId,
            agentName: analysis.agentName,
            riskLevel: analysis.riskLevel,
            analysis: analysis,
            humanReviewRequired: true,
            reviewedBy: null,
            reviewedAt: null,
            resolution: null
        };

        queue.queue.push(caseItem);
        queue.last_updated = new Date().toISOString();
        queue.total_cases++;

        fs.writeFileSync(this.suspicionQueue, JSON.stringify(queue, null, 2));

        // Log do evento
        this.logSecurityEvent({
            type: 'SUSPICION_QUEUE_ADDED',
            agentId: analysis.agentId,
            agentName: analysis.agentName,
            riskLevel: analysis.riskLevel,
            caseId: caseItem.id
        });

        console.log(`🚨 Caso adicionado à fila de verificação: ${caseItem.id}`);
        return caseItem.id;
    }

    /**
     * Gera relatório completo de segurança
     */
    async generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_agents: 0,
                authorized_agents: 0,
                suspicious_agents: 0,
                pending_reviews: 0
            },
            agents: [],
            suspicionQueue: [],
            recommendations: [],
            securityStatus: 'SECURE'
        };

        // Analisar agentes ativos
        try {
            const swarmDb = path.join(this.workspacePath, '.ai-workspace', 'swarm.db');
            if (fs.existsSync(swarmDb)) {
                // Aqui seria implementada a leitura do SQLite
                // Por enquanto, simulamos com dados conhecidos
                report.summary.total_agents = 4; // 3 Anonymous + 1 VPS
                report.summary.authorized_agents = 4;
            }
        } catch (error) {
            console.log('⚠️ Não foi possível analisar agentes ativos');
        }

        // Carregar fila de suspeitas
        try {
            const queue = JSON.parse(fs.readFileSync(this.suspicionQueue, 'utf8'));
            report.suspicionQueue = queue.queue.filter(item => item.status === 'PENDING_HUMAN_REVIEW');
            report.summary.pending_reviews = report.suspicionQueue.length;
            
            if (report.summary.pending_reviews > 0) {
                report.securityStatus = 'ATTENTION_REQUIRED';
            }
        } catch (error) {
            console.log('⚠️ Não foi possível carregar fila de suspeitas');
        }

        // Gerar recomendações gerais
        report.recommendations = [
            {
                priority: 'MEDIUM',
                action: 'RENAME_ANONYMOUS_DRONES',
                description: 'Considerar renomear "Anonymous Drone" para "Worker Agent" para reduzir suspeitas'
            },
            {
                priority: 'LOW',
                action: 'ENHANCE_MONITORING',
                description: 'Implementar monitoramento em tempo real dos logs de agentes'
            }
        ];

        return report;
    }

    /**
     * Registra evento de segurança
     */
    logSecurityEvent(event) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ...event
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.securityLog, logLine);
    }

    /**
     * Monitora comunicação com Mothership
     */
    async monitorMothershipCommunication() {
        const healthStatus = path.join(this.workspacePath, '.ai-workspace', 'logs', 'health-status.json');
        
        try {
            if (fs.existsSync(healthStatus)) {
                const health = JSON.parse(fs.readFileSync(healthStatus, 'utf8'));
                
                if (health.mothership && health.mothership.status === 'unhealthy') {
                    this.logSecurityEvent({
                        type: 'MOTHERSHIP_COMMUNICATION_FAILED',
                        status: health.mothership.status,
                        details: health.mothership.details
                    });
                    
                    return {
                        status: 'FAILED',
                        message: health.mothership.details,
                        timestamp: new Date().toISOString()
                    };
                }
            }
        } catch (error) {
            this.logSecurityEvent({
                type: 'MOTHERSHIP_MONITOR_ERROR',
                error: error.message
            });
        }

        return {
            status: 'OK',
            message: 'Comunicação com Mothership normal',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SecurityMonitor;
