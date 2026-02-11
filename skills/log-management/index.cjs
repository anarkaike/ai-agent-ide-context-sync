#!/usr/bin/env node

/**
 * Log Management Skill - Versão Simplificada (Zero Dependencies)
 * 
 * Funcionalidades:
 * - Query de logs via Docker API
 * - Detecção inteligente de erros
 * - Análise de containers
 * - Alertas simples
 * - Status monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LogManager {
    constructor(config = {}) {
        this.config = {
            logDir: config.logDir || '/tmp/ai-agent-logs',
            alertThreshold: config.alertThreshold || 5,
            retentionDays: config.retentionDays || 7,
            ...config
        };

        this.alertHistory = [];
        this.errorPatterns = new Map();
        this.init();
    }

    init() {
        // Criar diretório de logs
        if (!fs.existsSync(this.config.logDir)) {
            fs.mkdirSync(this.config.logDir, { recursive: true });
        }
        
        console.log('🔍 Log Management Skill - Inicializada');
        console.log(`📁 Diretório de logs: ${this.config.logDir}`);
    }

    /**
     * Obter logs de containers Docker
     */
    async getContainerLogs(containerName, lines = 100) {
        try {
            const command = `docker logs --tail ${lines} --timestamps ${containerName} 2>&1`;
            const output = execSync(command, { encoding: 'utf8' });
            
            const logs = output.split('\n')
                .filter(line => line.trim())
                .map(line => this.parseLogLine(line, containerName));

            return {
                success: true,
                container: containerName,
                total: logs.length,
                logs: logs,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                container: containerName
            };
        }
    }

    /**
     * Parse de linha de log
     */
    parseLogLine(line, source) {
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/);
        const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
        const message = timestampMatch ? line.substring(timestampMatch[0].length).trim() : line;
        
        return {
            timestamp: timestamp,
            source: source,
            message: message,
            level: this.extractLogLevel(message),
            severity: this.determineSeverity(message)
        };
    }

    /**
     * Extrair nível de log
     */
    extractLogLevel(message) {
        const msg = message.toLowerCase();
        if (msg.includes('error') || msg.includes('err')) return 'error';
        if (msg.includes('warn') || msg.includes('warning')) return 'warn';
        if (msg.includes('info')) return 'info';
        if (msg.includes('debug')) return 'debug';
        if (msg.includes('fatal')) return 'fatal';
        return 'unknown';
    }

    /**
     * Determinar severidade
     */
    determineSeverity(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('fatal') || msg.includes('panic') || msg.includes('segmentation fault')) {
            return 'critical';
        }
        if (msg.includes('connection refused') || msg.includes('timeout') || msg.includes('failed to connect')) {
            return 'high';
        }
        if (msg.includes('error') || msg.includes('exception')) {
            return 'medium';
        }
        if (msg.includes('warn') || msg.includes('warning')) {
            return 'low';
        }
        
        return 'info';
    }

    /**
     * Obter todos os containers ativos
     */
    getActiveContainers() {
        try {
            const command = 'docker ps --format "{{.Names}}"';
            const output = execSync(command, { encoding: 'utf8' });
            
            return output.split('\n')
                .filter(line => line.trim())
                .map(name => name.trim());

        } catch (error) {
            console.error('Erro ao obter containers:', error.message);
            return [];
        }
    }

    /**
     * Detectar erros em todos os containers
     */
    async detectAllErrors() {
        const containers = this.getActiveContainers();
        const allErrors = [];
        const containerStats = {};

        console.log(`🔍 Analisando ${containers.length} containers...`);

        for (const container of containers) {
            const result = await this.getContainerLogs(container, 200);
            
            if (result.success) {
                const errors = result.logs.filter(log => 
                    log.level === 'error' || log.severity === 'critical' || log.severity === 'high'
                );
                
                containerStats[container] = {
                    total: result.total,
                    errors: errors.length,
                    critical: errors.filter(e => e.severity === 'critical').length,
                    high: errors.filter(e => e.severity === 'high').length
                };

                allErrors.push(...errors.map(e => ({ ...e, container })));
            }
        }

        const analysis = this.analyzeErrors(allErrors);
        const recommendations = this.generateRecommendations(analysis, containerStats);

        // Gerar alertas se necessário
        if (analysis.criticalErrors.length >= this.config.alertThreshold) {
            this.generateAlert('critical_errors', analysis.criticalErrors);
        }

        return {
            success: true,
            containers: containerStats,
            totalErrors: allErrors.length,
            analysis: analysis,
            recommendations: recommendations,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Analisar padrões de erro
     */
    analyzeErrors(errors) {
        const patterns = new Map();
        const timeline = [];

        errors.forEach(error => {
            // Extrair padrão
            const pattern = this.extractErrorPattern(error.message);
            
            if (!patterns.has(pattern)) {
                patterns.set(pattern, {
                    pattern: pattern,
                    count: 0,
                    severity: 'medium',
                    examples: [],
                    containers: new Set()
                });
            }
            
            const patternData = patterns.get(pattern);
            patternData.count++;
            patternData.containers.add(error.container);
            
            if (patternData.examples.length < 3) {
                patternData.examples.push({
                    timestamp: error.timestamp,
                    message: error.message,
                    container: error.container
                });
            }

            timeline.push({
                timestamp: new Date(error.timestamp).getTime(),
                container: error.container,
                pattern: pattern,
                severity: error.severity
            });
        });

        // Determinar severidade dos padrões
        patterns.forEach(pattern => {
            pattern.severity = this.determinePatternSeverity(pattern);
            pattern.containers = Array.from(pattern.containers);
        });

        const criticalErrors = errors.filter(e => e.severity === 'critical');

        return {
            errors: errors,
            patterns: Array.from(patterns.values()),
            timeline: timeline.sort((a, b) => a.timestamp - b.timestamp),
            criticalErrors: criticalErrors,
            summary: {
                totalPatterns: patterns.size,
                affectedContainers: new Set(errors.map(e => e.container)).size,
                errorRate: errors.length
            }
        };
    }

    /**
     * Extrair padrão de erro
     */
    extractErrorPattern(message) {
        let pattern = message
            .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/g, '[TIMESTAMP]')
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
            .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, '[UUID]')
            .replace(/\b[a-f0-9]{40,}\b/g, '[HASH]')
            .replace(/\d+/g, '[NUMBER]')
            .trim();

        if (pattern.length > 200) {
            pattern = pattern.substring(0, 200) + '...';
        }

        return pattern || 'unknown_error_pattern';
    }

    /**
     * Determinar severidade do padrão
     */
    determinePatternSeverity(pattern) {
        if (pattern.count >= 10) return 'critical';
        if (pattern.count >= 5) return 'high';
        if (pattern.count >= 2) return 'medium';
        return 'low';
    }

    /**
     * Gerar recomendações
     */
    generateRecommendations(analysis, containerStats) {
        const recommendations = [];

        // Padrões críticos
        const criticalPatterns = analysis.patterns.filter(p => p.severity === 'critical');
        if (criticalPatterns.length > 0) {
            recommendations.push({
                priority: 'critical',
                type: 'immediate_action',
                title: 'Erros Críticos Detectados',
                description: `${criticalPatterns.length} padrões de erro críticos identificados`,
                actions: [
                    'Verificar containers afetados imediatamente',
                    'Analisar logs dos últimos 30 minutos',
                    'Considerar restart dos serviços críticos'
                ],
                patterns: criticalPatterns.map(p => p.pattern)
            });
        }

        // Containers problemáticos
        const problematicContainers = Object.entries(containerStats)
            .filter(([_, stats]) => stats.errors > 5)
            .map(([container, stats]) => ({ container, ...stats }));

        if (problematicContainers.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'container_health',
                title: 'Containers com Alta Taxa de Erros',
                description: `${problematicContainers.length} containers com mais de 5 erros`,
                containers: problematicContainers,
                actions: [
                    'Investigar saúde dos containers',
                    'Verificar recursos (CPU, memória)',
                    'Analisar dependências entre serviços'
                ]
            });
        }

        // Alta taxa de erro geral
        if (analysis.summary.errorRate > 10) {
            recommendations.push({
                priority: 'medium',
                type: 'performance',
                title: 'Alta Taxa de Erros Detectada',
                description: `Taxa de erro: ${analysis.summary.errorRate} erros`,
                actions: [
                    'Monitorar performance dos serviços',
                    'Verificar configurações de timeout',
                    'Considerar scaling horizontal'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Gerar alerta
     */
    generateAlert(type, data) {
        const alert = {
            id: `alert_${Date.now()}`,
            type: type,
            severity: type === 'critical_errors' ? 'critical' : 'warning',
            timestamp: new Date().toISOString(),
            data: data,
            acknowledged: false
        };

        this.alertHistory.push(alert);
        
        // Salvar alerta em arquivo
        const alertFile = path.join(this.config.logDir, 'alerts.json');
        fs.writeFileSync(alertFile, JSON.stringify(this.alertHistory, null, 2));

        console.log(`🚨 ALERTA GERADO: ${type}`);
        console.log(`   Severidade: ${alert.severity}`);
        console.log(`   Timestamp: ${alert.timestamp}`);
        
        return alert;
    }

    /**
     * Obter status completo
     */
    async getStatus() {
        try {
            const containers = this.getActiveContainers();
            const containerStatus = {};

            // Verificar status de cada container
            for (const container of containers) {
                try {
                    const command = `docker inspect --format='{{.State.Status}}' ${container}`;
                    const status = execSync(command, { encoding: 'utf8' }).trim();
                    containerStatus[container] = status;
                } catch (error) {
                    containerStatus[container] = 'unknown';
                }
            }

            // Verificar uso de recursos
            const statsCommand = 'docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"';
            const stats = execSync(statsCommand, { encoding: 'utf8' });

            return {
                success: true,
                status: 'operational',
                containers: {
                    total: containers.length,
                    running: Object.values(containerStatus).filter(s => s === 'running').length,
                    status: containerStatus
                },
                metrics: {
                    alertsGenerated: this.alertHistory.length,
                    uptime: process.uptime(),
                    logDirectory: this.config.logDir
                },
                resourceStats: stats,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    /**
     * Salvar relatório
     */
    saveReport(data, filename = null) {
        const reportName = filename || `log-report-${Date.now()}.json`;
        const reportPath = path.join(this.config.logDir, reportName);
        
        try {
            fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
            console.log(`📄 Relatório salvo: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error('Erro ao salvar relatório:', error.message);
            return null;
        }
    }

    /**
     * Limpar logs antigos
     */
    cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.config.logDir);
            const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
            
            files.forEach(file => {
                const filePath = path.join(this.config.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Arquivo antigo removido: ${file}`);
                }
            });
        } catch (error) {
            console.error('Erro na limpeza:', error.message);
        }
    }
}

// CLI Interface
async function main() {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    const logManager = new LogManager();

    switch (command) {
        case 'containers':
            const containers = logManager.getActiveContainers();
            console.log('📦 Containers Ativos:');
            containers.forEach(container => console.log(`  • ${container}`));
            break;

        case 'logs':
            const containerName = args[0];
            if (!containerName) {
                console.error('Nome do container é obrigatório');
                process.exit(1);
            }
            const logs = await logManager.getContainerLogs(containerName);
            console.log(JSON.stringify(logs, null, 2));
            break;

        case 'detect-errors':
            console.log('🔍 Detectando erros em todos os containers...');
            const errors = await logManager.detectAllErrors();
            console.log(JSON.stringify(errors, null, 2));
            
            // Salvar relatório
            const reportPath = logManager.saveReport(errors, 'error-detection-report.json');
            if (reportPath) {
                console.log(`📄 Relatório completo salvo em: ${reportPath}`);
            }
            break;

        case 'status':
            console.log('📊 Verificando status do sistema...');
            const status = await logManager.getStatus();
            console.log(JSON.stringify(status, null, 2));
            break;

        case 'cleanup':
            console.log('🧹 Limpando logs antigos...');
            logManager.cleanupOldLogs();
            console.log('✅ Limpeza concluída');
            break;

        default:
            console.log('🔍 Log Management Skill - Versão Simplificada');
            console.log('Comandos disponíveis:');
            console.log('  containers           - Listar containers ativos');
            console.log('  logs <container>    - Obter logs de um container');
            console.log('  detect-errors       - Detectar erros em todos os containers');
            console.log('  status              - Status completo do sistema');
            console.log('  cleanup             - Limpar logs antigos');
            console.log('');
            console.log('Exemplos:');
            console.log('  node index.cjs containers');
            console.log('  node index.cjs logs grafana');
            console.log('  node index.cjs detect-errors');
            console.log('  node index.cjs status');
            break;
    }
}

// Exportar para uso como módulo
module.exports = LogManager;

// Executar CLI se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}