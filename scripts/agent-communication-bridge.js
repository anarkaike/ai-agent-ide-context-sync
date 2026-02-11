/**
 * 🤖 Agent Communication Bridge
 * 
 * Integra sistema de alertas com agentes IA existentes
 * Repassa alertas para agentes com integração de comunicação
 */

const AlertManager = require('./alert-manager.js');
const fs = require('fs');
const path = require('path');

class AgentCommunicationBridge {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.alertManager = new AlertManager(workspacePath);
        this.neuralLinkPath = path.join(workspacePath, '.ai-workspace', 'communication', 'neural_link.json');
        this.agentRegistryPath = path.join(workspacePath, '.ai-workspace', 'swarm.db');
        
        this.initializeBridge();
    }

    initializeBridge() {
        console.log('🤖 Agent Communication Bridge inicializado');
        console.log('   Integrando alertas com agentes IA existentes...');
    }

    /**
     * Envia alerta para todos os agentes com capacidades de comunicação
     */
    async sendAlertToAgents(alertData) {
        const results = [];
        
        // 1. Adicionar ao Neural Link (comunicação interna)
        const neuralLinkResult = await this.addToNeuralLink(alertData);
        results.push({ channel: 'neural_link', ...neuralLinkResult });
        
        // 2. Enviar para agentes com integração externa
        const agentResults = await this.sendToExternalAgents(alertData);
        results.push(...agentResults);
        
        // 3. Enviar para canais configurados (Telegram/WhatsApp)
        const externalResult = await this.alertManager.sendSecurityAlert(alertData);
        if (externalResult.results) {
            results.push(...externalResult.results);
        }
        
        return {
            success: results.some(r => r.success),
            results: results
        };
    }

    /**
     * Adiciona alerta ao Neural Link para comunicação interna
     */
    async addToNeuralLink(alertData) {
        try {
            const message = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                from: 'SECURITY_SYSTEM',
                to: 'ALL_AGENTS',
                name: 'Security Alert System',
                content: this.formatAgentMessage(alertData),
                type: 'security_alert',
                priority: alertData.riskLevel,
                metadata: alertData
            };

            let neuralLink = [];
            if (fs.existsSync(this.neuralLinkPath)) {
                neuralLink = JSON.parse(fs.readFileSync(this.neuralLinkPath, 'utf8'));
            }

            neuralLink.unshift(message); // Adicionar no início
            
            // Manter apenas últimas 1000 mensagens
            if (neuralLink.length > 1000) {
                neuralLink = neuralLink.slice(0, 1000);
            }

            fs.writeFileSync(this.neuralLinkPath, JSON.stringify(neuralLink, null, 2));
            
            console.log(`🔗 Alerta adicionado ao Neural Link: ${alertData.agentName} (${alertData.riskLevel})`);
            
            return { success: true, message: 'Alert added to neural link' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Envia alerta para agentes com integração externa configurada
     */
    async sendToExternalAgents(alertData) {
        const results = [];
        
        try {
            // Verificar agentes com capacidades de comunicação
            const agents = await this.getAgentsWithCommunication();
            
            for (const agent of agents) {
                const result = await this.sendToAgent(agent, alertData);
                results.push({ channel: `agent_${agent.id}`, ...result });
            }
        } catch (error) {
            console.log('⚠️ Erro ao enviar para agentes externos:', error.message);
        }
        
        return results;
    }

    /**
     * Obtém agentes com capacidades de comunicação
     */
    async getAgentsWithCommunication() {
        // Simulação - na implementação real, consultaria o swarm.db
        return [
            {
                id: 'agent-vps-test-1770632891790',
                name: 'VPS Agent Test',
                capabilities: ['communication', 'security_monitoring'],
                communication_channels: ['neural_link', 'external_api']
            },
            {
                id: 'prime-orchestrator-001',
                name: 'Prime Orchestrator',
                capabilities: ['communication', 'coordination'],
                communication_channels: ['neural_link', 'telegram_bridge']
            }
        ];
    }

    /**
     * Envia alerta para um agente específico
     */
    async sendToAgent(agent, alertData) {
        try {
            const message = this.formatAgentMessage(alertData);
            
            // Simular envio para o agente
            console.log(`📨 Enviando alerta para agente ${agent.name}: ${alertData.riskLevel} - ${alertData.description}`);
            
            // Na implementação real, aqui faria a chamada API para o agente
            // await this.callAgentAPI(agent.id, message);
            
            return { success: true, message: `Alert sent to ${agent.name}` };
        } catch (error) {
            return { success: false, message: `Failed to send to ${agent.name}: ${error.message}` };
        }
    }

    /**
     * Formata mensagem para agentes
     */
    formatAgentMessage(alertData) {
        return `🚨 SECURITY ALERT [${alertData.riskLevel}] - Agent: ${alertData.agentName} - ${alertData.description} - Action: Review security dashboard`;
    }

    /**
     * Testa comunicação com agentes
     */
    async testAgentCommunication() {
        console.log('🧪 Testando comunicação com agentes...');
        
        const testAlert = {
            riskLevel: 'HIGH',
            agentName: 'Test Agent',
            agentId: 'test-123',
            description: 'Este é um alerta de teste para agentes IA',
            timestamp: new Date().toISOString()
        };

        const result = await this.sendAlertToAgents(testAlert);
        
        console.log('📊 Resultado do teste de agentes:');
        result.results.forEach(r => {
            console.log(`   ${r.channel}: ${r.success ? '✅' : '❌'} ${r.message}`);
        });

        return result;
    }

    /**
     * Lista agentes ativos e suas capacidades
     */
    async listActiveAgents() {
        try {
            const agents = await this.getAgentsWithCommunication();
            
            console.log('\n🤖 AGENTES ATIVOS COM COMUNICAÇÃO:');
            console.log('=====================================\n');
            
            agents.forEach((agent, index) => {
                console.log(`${index + 1}. ${agent.name} (${agent.id})`);
                console.log(`   Capacidades: ${agent.capabilities.join(', ')}`);
                console.log(`   Canais: ${agent.communication_channels.join(', ')}`);
                console.log('');
            });
            
            return agents;
        } catch (error) {
            console.log('❌ Erro ao listar agentes:', error.message);
            return [];
        }
    }
}

module.exports = AgentCommunicationBridge;
