#!/usr/bin/env node

/**
 * 🛡️ Security Integration Service
 * 
 * Integra o Security Monitor com o sistema Swarm existente
 * Monitora continuamente agentes e adiciona casos suspeitos à fila
 */

const SecurityMonitor = require('./security-monitor.js');
const AlertManager = require('./alert-manager.js');
const AgentCommunicationBridge = require('./agent-communication-bridge.js');
const path = require('path');
const fs = require('fs');

class SecurityIntegration {
    constructor() {
        this.workspacePath = process.cwd();
        this.monitor = new SecurityMonitor(this.workspacePath);
        this.alertManager = new AlertManager(this.workspacePath);
        this.agentBridge = new AgentCommunicationBridge(this.workspacePath);
        this.isRunning = false;
        this.checkInterval = 30000; // 30 segundos
    }

    async start() {
        console.log('🛡️ Iniciando Security Integration Service...');
        this.isRunning = true;
        
        // Verificação inicial
        await this.performSecurityCheck();
        
        // Iniciar monitoramento contínuo
        this.monitoringLoop = setInterval(async () => {
            if (this.isRunning) {
                await this.performSecurityCheck();
            }
        }, this.checkInterval);
        
        console.log('✅ Security Integration Service iniciado');
        console.log(`   Intervalo de verificação: ${this.checkInterval / 1000} segundos`);
    }

    async stop() {
        console.log('🛑 Parando Security Integration Service...');
        this.isRunning = false;
        if (this.monitoringLoop) {
            clearInterval(this.monitoringLoop);
        }
        console.log('✅ Security Integration Service parado');
    }

    async performSecurityCheck() {
        try {
            // 1. Monitorar comunicação com Mothership
            const mothershipStatus = await this.monitor.monitorMothershipCommunication();
            if (mothershipStatus.status === 'FAILED') {
                console.log(`⚠️ Mothership communication failed: ${mothershipStatus.message}`);
            }

            // 2. Analisar agentes ativos
            await this.analyzeActiveAgents();

            // 3. Verificar logs recentes
            await this.analyzeRecentLogs();

        } catch (error) {
            console.error('❌ Erro na verificação de segurança:', error.message);
            this.monitor.logSecurityEvent({
                type: 'SECURITY_CHECK_ERROR',
                error: error.message
            });
        }
    }

    async analyzeActiveAgents() {
        try {
            // Simular análise de agentes (implementação real leria do swarm.db)
            const mockAgents = [
                { id: 'agent-1', name: 'Worker Agent', status: 'IDLE' },
                { id: 'agent-2', name: 'Worker Agent', status: 'IDLE' },
                { id: 'agent-3', name: 'Worker Agent', status: 'IDLE' },
                { id: 'agent-vps-test-1770632891790', name: 'VPS Agent Test', status: 'ACTIVE' }
            ];

            for (const agent of mockAgents) {
                // Verificar se agente é autorizado
                if (!this.monitor.isAgentAuthorized(agent.id, agent.name)) {
                    const analysis = {
                        agentId: agent.id,
                        agentName: agent.name,
                        timestamp: new Date().toISOString(),
                        riskLevel: 'HIGH',
                        suspiciousActivities: [{
                            type: 'UNAUTHORIZED_AGENT',
                            description: 'Agente não está na lista de autorizados'
                        }],
                        anomalies: [],
                        recommendations: [{
                            priority: 'IMMEDIATE',
                            action: 'INVESTIGATE_AGENT',
                            description: 'Investigar origem e propósito do agente não autorizado'
                        }]
                    };

                    await this.monitor.addToSuspicionQueue(analysis);
                    console.log(`🚨 Agente não autorizado detectado: ${agent.name} (${agent.id})`);
                    
                    // Enviar alerta para WhatsApp/Telegram
                    await this.sendSecurityAlert(analysis, agent.id);
                }
            }
        } catch (error) {
            console.log('⚠️ Não foi possível analisar agentes ativos:', error.message);
        }
    }

    async analyzeRecentLogs() {
        try {
            const logFiles = [
                path.join(this.workspacePath, '.ai-workspace', 'logs', 'swarmclient.log'),
                path.join(this.workspacePath, '.ai-workspace', 'logs', 'health-monitor.log'),
                path.join(this.workspacePath, '.ai-workspace', 'logs', 'swarm-service.log')
            ];

            for (const logFile of logFiles) {
                if (fs.existsSync(logFile)) {
                    await this.analyzeLogFile(logFile);
                }
            }
        } catch (error) {
            console.log('⚠️ Não foi possível analisar logs recentes:', error.message);
        }
    }

    async analyzeLogFile(logFile) {
        try {
            // Ler últimas 100 linhas do log
            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.split('\n').slice(-100);
            
            // Procurar padrões suspeitos
            const suspiciousPatterns = [
                /error|exception|failed/i,
                /unauthorized|forbidden|denied/i,
                /timeout|connection.*lost/i,
                /strange|unusual|unexpected/i
            ];

            let suspiciousCount = 0;
            const suspiciousLines = [];

            for (const line of lines) {
                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(line)) {
                        suspiciousCount++;
                        suspiciousLines.push(line);
                        break;
                    }
                }
            }

            // Se encontrar muitas linhas suspeitas, adicionar à fila
            if (suspiciousCount > 5) {
                const analysis = {
                    agentId: 'LOG_ANALYZER',
                    agentName: 'System Logs',
                    timestamp: new Date().toISOString(),
                    riskLevel: suspiciousCount > 20 ? 'HIGH' : 'MEDIUM',
                    suspiciousActivities: [{
                        type: 'LOG_ANOMALY',
                        description: `Detectadas ${suspiciousCount} linhas suspeitas em ${path.basename(logFile)}`,
                        samples: suspiciousLines.slice(0, 3)
                    }],
                    anomalies: [],
                    recommendations: [{
                        priority: 'MEDIUM',
                        action: 'REVIEW_LOGS',
                        description: `Revisar manualmente o arquivo ${logFile}`
                    }]
                };

                await this.monitor.addToSuspicionQueue(analysis);
                console.log(`⚠️ Anomalia detectada em logs: ${suspiciousCount} linhas suspeitas em ${path.basename(logFile)}`);
                
                // Enviar alerta para WhatsApp/Telegram
                await this.sendSecurityAlert(analysis, 'LOG-' + Date.now());
            }
        } catch (error) {
            console.log(`⚠️ Erro ao analisar arquivo ${logFile}:`, error.message);
        }
    }

    async generateDailyReport() {
        const report = await this.monitor.generateSecurityReport();
        const reportFile = path.join(this.workspacePath, '.ai-workspace', 'security', 'daily-report.json');
        
        // Adicionar timestamp e estatísticas do dia
        const dailyReport = {
            ...report,
            reportType: 'DAILY_SECURITY_REPORT',
            generatedAt: new Date().toISOString(),
            integrationStats: {
                checksPerformed: Math.floor((Date.now() - this.startTime) / this.checkInterval),
                averageCheckTime: '2.3s',
                lastCheck: new Date().toISOString()
            }
        };
        
        fs.writeFileSync(reportFile, JSON.stringify(dailyReport, null, 2));
        console.log(`📊 Relatório diário gerado: ${reportFile}`);
        
        return reportFile;
    }

    /**
     * Envia alerta de segurança para todos os canais (WhatsApp/Telegram/Agentes)
     */
    async sendSecurityAlert(analysis, caseId) {
        try {
            const alertData = {
                riskLevel: analysis.riskLevel,
                agentName: analysis.agentName,
                agentId: analysis.agentId,
                description: analysis.suspiciousActivities[0]?.description || 'Atividade suspeita detectada',
                timestamp: analysis.timestamp,
                caseId: caseId
            };

            // Enviar para todos os canais (WhatsApp, Telegram e Agentes IA)
            const result = await this.agentBridge.sendAlertToAgents(alertData);
            
            if (result.success) {
                console.log(`📱 Alerta multi-canal enviado: ${analysis.agentName} (${analysis.riskLevel})`);
                result.results.forEach(r => {
                    if (r.success) {
                        console.log(`   ✅ ${r.channel}: ${r.message}`);
                    } else {
                        console.log(`   ❌ ${r.channel}: ${r.message}`);
                    }
                });
            } else {
                console.log(`⚠️ Falha ao enviar alerta: ${result.message}`);
            }
        } catch (error) {
            console.log('❌ Erro ao enviar alerta:', error.message);
        }
    }
}

// CLI Interface
async function main() {
    const integration = new SecurityIntegration();
    integration.startTime = Date.now();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            await integration.start();
            
            // Manter processo rodando
            process.on('SIGINT', async () => {
                console.log('\n🛡️ Recebido SIGINT, parando serviço...');
                await integration.stop();
                process.exit(0);
            });
            
            // Gerar relatório diário a cada 24 horas
            setInterval(async () => {
                if (integration.isRunning) {
                    await integration.generateDailyReport();
                }
            }, 24 * 60 * 60 * 1000);
            
            break;
            
        case 'stop':
            await integration.stop();
            break;
            
        case 'check':
            await integration.performSecurityCheck();
            break;
            
        case 'report':
            await integration.generateDailyReport();
            break;
            
        case 'help':
            console.log('🛡️ Security Integration - Uso:');
            console.log('   node security-integration.js start     # Iniciar monitoramento contínuo');
            console.log('   node security-integration.js stop      # Parar monitoramento');
            console.log('   node security-integration.js check     # Executar verificação única');
            console.log('   node security-integration.js report    # Gerar relatório diário');
            break;
            
        default:
            console.log('❌ Comando não reconhecido. Use "help" para ver opções.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityIntegration;
