#!/usr/bin/env node

/**
 * Agente IA de Monitoramento Cósmico Autônomo
 * Monitora o progresso da documentação e envia relatórios detalhados
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class CosmicMonitoringAgent {
    constructor(agentId, telegramBotToken, telegramChatId) {
        this.agentId = agentId;
        this.telegramBotToken = telegramBotToken;
        this.telegramChatId = telegramChatId;
        this.docsPath = '/root/projects/dev/ai-agent-ide-context-sync/docs/plano-estrategico';
        this.isRunning = false;
        this.lastFullReport = new Date();
        this.lastDocumentCount = 0;
        this.monitoringInterval = 60000; // 1 minuto
        this.reportInterval = 300000; // 5 minutos para relatórios detalhados
    }

    async start() {
        console.log(`🔍 Agente ${this.agentId} iniciado - Monitoramento cósmico`);
        this.isRunning = true;
        
        // Enviar mensagem de início
        await this.sendTelegramMessage(
            `🔍 *Agente de Monitoramento ${this.agentId} Iniciado*\n\n` +
            `📊 Monitorando continuamente a documentação cósmica\n` +
            `⏰ Início: ${new Date().toLocaleString('pt-BR')}\n` +
            `🔄 Intervalo: ${this.monitoringInterval/1000} segundos\n` +
            `📈 Relatórios: ${this.reportInterval/60000} minutos`
        );

        // Loop principal de monitoramento
        while (this.isRunning) {
            try {
                await this.monitoringCycle();
                await this.sleep(this.monitoringInterval);
            } catch (error) {
                console.error(`Erro no agente ${this.agentId}:`, error);
                await this.sendTelegramMessage(
                    `⚠️ *Erro no Monitoramento*\n\n` +
                    `🤖 Agente: ${this.agentId}\n` +
                    `❌ ${error.message}\n` +
                    `🔄 Continuando monitoramento...`
                );
                await this.sleep(10000);
            }
        }
    }

    async monitoringCycle() {
        const currentStats = await this.getCurrentStats();
        const newDocuments = await this.checkNewDocuments();
        
        // Se houver novos documentos, enviar alerta imediato
        if (newDocuments.length > 0) {
            await this.sendNewDocumentsAlert(newDocuments);
        }

        // Relatório detalhado periódico
        const now = new Date();
        if (now - this.lastFullReport >= this.reportInterval) {
            await this.sendDetailedReport(currentStats);
            this.lastFullReport = now;
        }

        // Verificar anomalias
        await this.checkAnomalies(currentStats);
    }

    async getCurrentStats() {
        try {
            const files = fs.readdirSync(this.docsPath).filter(file => file.endsWith('.md'));
            const documentCount = files.length;
            
            let totalWords = 0;
            let totalLinks = 0;
            let totalSections = 0;
            let totalSize = 0;
            
            const documents = [];
            
            for (const file of files) {
                const filepath = path.join(this.docsPath, file);
                const stats = fs.statSync(filepath);
                const content = fs.readFileSync(filepath, 'utf8');
                
                // Estatísticas básicas
                const words = content.split(/\s+/).length;
                const links = (content.match(/\[.*?\]/g) || []).length;
                const sections = (content.match(/^#+/gm) || []).length;
                
                totalWords += words;
                totalLinks += links;
                totalSections += sections;
                totalSize += stats.size;
                
                documents.push({
                    filename: file,
                    words: words,
                    links: links,
                    sections: sections,
                    size: stats.size,
                    modified: stats.mtime
                });
            }
            
            return {
                documentCount,
                totalWords,
                totalLinks,
                totalSections,
                totalSize,
                documents: documents.sort((a, b) => b.modified - a.modified)
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return null;
        }
    }

    async checkNewDocuments() {
        try {
            const currentStats = await this.getCurrentStats();
            if (!currentStats) return [];
            
            const newDocuments = [];
            
            // Verificar se há novos documentos desde a última verificação
            if (this.lastDocumentCount > 0 && currentStats.documentCount > this.lastDocumentCount) {
                const latestDocs = currentStats.documents.slice(0, currentStats.documentCount - this.lastDocumentCount);
                newDocuments.push(...latestDocs);
            }
            
            this.lastDocumentCount = currentStats.documentCount;
            return newDocuments;
        } catch (error) {
            console.error('Erro ao verificar novos documentos:', error);
            return [];
        }
    }

    async sendNewDocumentsAlert(newDocuments) {
        const message = `📄 *Novos Documentos Cósmicos Detectados*\n\n` +
            `🤖 Agente: ${this.agentId}\n` +
            `📊 Novos documentos: ${newDocuments.length}\n\n` +
            newDocuments.map(doc => 
                `📝 ${doc.filename}\n` +
                `📈 ${doc.words.toLocaleString('pt-BR')} palavras\n` +
                `🔗 ${doc.links.toLocaleString('pt-BR')} links\n` +
                `📚 ${doc.sections} seções\n` +
                `⏰ ${doc.modified.toLocaleString('pt-BR')}\n`
            ).join('\n') +
            `\n🎯 Total atual: ${this.lastDocumentCount} documentos`;
        
        await this.sendTelegramMessage(message);
    }

    async sendDetailedReport(stats) {
        if (!stats) return;
        
        const growthRate = this.calculateGrowthRate(stats);
        const topDocuments = stats.documents.slice(0, 5);
        
        const message = `📊 *Relatório Detalhado de Monitoramento*\n\n` +
            `🤖 Agente: ${this.agentId}\n` +
            `📅 ${new Date().toLocaleString('pt-BR')}\n\n` +
            
            `📈 *Estatísticas Globais*\n` +
            `📄 Documentos: ${stats.documentCount}\n` +
            `📝 Palavras: ${stats.totalWords.toLocaleString('pt-BR')}\n` +
            `🔗 Links: ${stats.totalLinks.toLocaleString('pt-BR')}\n` +
            `📚 Seções: ${stats.totalSections.toLocaleString('pt-BR')}\n` +
            `💾 Tamanho: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB\n\n` +
            
            `🚀 *Métricas de Crescimento*\n` +
            `📊 Taxa de crescimento: ${growthRate.toFixed(2)} docs/hora\n` +
            `📈 Média por documento: ${Math.floor(stats.totalWords / stats.documentCount).toLocaleString('pt-BR')} palavras\n\n` +
            
            `🏆 *Top 5 Documentos Recentes*\n` +
            topDocuments.map((doc, index) => 
                `${index + 1}. 📝 ${doc.filename}\n` +
                `   📈 ${doc.words.toLocaleString('pt-BR')} palavras\n`
            ).join('\n');
        
        await this.sendTelegramMessage(message);
    }

    async checkAnomalies(stats) {
        if (!stats) return;
        
        const anomalies = [];
        
        // Verificar se não há crescimento
        if (stats.documentCount === this.lastDocumentCount) {
            const timeSinceLastDoc = Date.now() - stats.documents[0]?.modified?.getTime() || 0;
            if (timeSinceLastDoc > 600000) { // 10 minutos sem novos documentos
                anomalies.push({
                    type: 'no_growth',
                    message: `⚠️ Sem novos documentos há ${Math.floor(timeSinceLastDoc / 60000)} minutos`
                });
            }
        }
        
        // Verificar documentos muito pequenos
        const smallDocs = stats.documents.filter(doc => doc.words < 1000);
        if (smallDocs.length > 0) {
            anomalies.push({
                type: 'small_documents',
                message: `⚠️ ${smallDocs.length} documentos com menos de 1000 palavras`
            });
        }
        
        // Enviar alertas de anomalias
        if (anomalies.length > 0) {
            const message = `🚨 *Alertas de Anomalia Detectados*\n\n` +
                `🤖 Agente: ${this.agentId}\n` +
                `📅 ${new Date().toLocaleString('pt-BR')}\n\n` +
                anomalies.map(anomaly => anomaly.message).join('\n\n');
            
            await this.sendTelegramMessage(message);
        }
    }

    calculateGrowthRate(stats) {
        // Calcular taxa de crescimento baseada nos documentos mais recentes
        const recentDocs = stats.documents.slice(0, Math.min(10, stats.documentCount));
        if (recentDocs.length < 2) return 0;
        
        const oldestRecent = recentDocs[recentDocs.length - 1].modified;
        const newestRecent = recentDocs[0].modified;
        const timeDiff = (newestRecent - oldestRecent) / 1000 / 3600; // horas
        
        return timeDiff > 0 ? recentDocs.length / timeDiff : 0;
    }

    async sendTelegramMessage(message) {
        try {
            const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
            
            await axios.post(url, {
                chat_id: this.telegramChatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            console.log(`✅ Relatório enviado para Telegram - Agente ${this.agentId}`);
        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para Telegram:`, error.message);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
        this.isRunning = false;
        console.log(`🛑 Agente ${this.agentId} parado`);
    }
}

// Exportar para uso em outros módulos
module.exports = CosmicMonitoringAgent;

// Se executado diretamente
if (require.main === module) {
    // Configurações (devem ser obtidas de variáveis de ambiente)
    const agentId = process.env.AGENT_ID || 'cosmic-monitor-1';
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
        console.error('❌ TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios');
        process.exit(1);
    }

    const agent = new CosmicMonitoringAgent(agentId, telegramBotToken, telegramChatId);
    
    // Tratamento de sinais
    process.on('SIGINT', () => {
        console.log('\n🛑 Recebido SIGINT, parando agente...');
        agent.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Recebido SIGTERM, parando agente...');
        agent.stop();
        process.exit(0);
    });

    // Iniciar agente
    agent.start().catch(error => {
        console.error('❌ Erro ao iniciar agente:', error);
        process.exit(1);
    });
}
