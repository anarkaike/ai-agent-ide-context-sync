#!/usr/bin/env node

/**
 * 📱 Alert Manager CLI
 * 
 * Interface de linha de comando para configurar e gerenciar alertas
 */

const AlertManager = require('./alert-manager.js');
const path = require('path');

class AlertCLI {
    constructor() {
        this.workspacePath = process.cwd();
        this.alertManager = new AlertManager(this.workspacePath);
    }

    async run() {
        const command = process.argv[2];
        const args = process.argv.slice(3);

        switch (command) {
            case 'setup':
                this.alertManager.showSetupInstructions();
                break;

            case 'config':
                await this.handleConfig(args);
                break;

            case 'enable':
                await this.handleEnable(args);
                break;

            case 'disable':
                await this.handleDisable(args);
                break;

            case 'test':
                await this.alertManager.testAlerts();
                break;

            case 'status':
                this.showStatus();
                break;

            case 'logs':
                this.showLogs(args[0]);
                break;

            case 'help':
                this.showHelp();
                break;

            default:
                console.log('❌ Comando não reconhecido. Use "help" para ver opções.');
        }
    }

    async handleConfig(args) {
        const [channel, ...params] = args;

        if (!channel) {
            console.log('❌ Especifique o canal: telegram ou whatsapp');
            return;
        }

        const config = this.alertManager.config;

        switch (channel) {
            case 'telegram':
                if (params.length < 2) {
                    console.log('❌ Uso: config telegram <bot_token> <chat_id>');
                    return;
                }
                config.channels.telegram.botToken = params[0];
                config.channels.telegram.chatId = params[1];
                console.log('✅ Telegram configurado com sucesso');
                break;

            case 'whatsapp':
                if (params.length < 2) {
                    console.log('❌ Uso: config whatsapp <phone_number> <api_key>');
                    console.log('   Exemplo: config whatsapp +55119xxxxxxxxx abc123def');
                    return;
                }
                config.channels.whatsapp.phoneNumber = params[0];
                config.channels.whatsapp.apiKey = params[1];
                console.log('✅ WhatsApp configurado com sucesso');
                break;

            default:
                console.log('❌ Canal não suportado. Use: telegram ou whatsapp');
                return;
        }

        this.alertManager.saveConfig();
    }

    async handleEnable(args) {
        const channels = args.length > 0 ? args : ['telegram', 'whatsapp'];
        
        for (const channel of channels) {
            if (channel === 'telegram' || channel === 'whatsapp') {
                this.alertManager.config.channels[channel].enabled = true;
                console.log(`✅ ${channel} ativado`);
            } else {
                console.log(`❌ Canal não suportado: ${channel}`);
            }
        }

        this.alertManager.config.enabled = true;
        this.alertManager.saveConfig();
        console.log('✅ Sistema de alertas ativado');
    }

    async handleDisable(args) {
        const channels = args.length > 0 ? args : ['telegram', 'whatsapp'];
        
        for (const channel of channels) {
            if (channel === 'telegram' || channel === 'whatsapp') {
                this.alertManager.config.channels[channel].enabled = false;
                console.log(`❌ ${channel} desativado`);
            } else {
                console.log(`❌ Canal não suportado: ${channel}`);
            }
        }

        // Se todos canais desativados, desativa sistema
        const allDisabled = !this.alertManager.config.channels.telegram.enabled && 
                           !this.alertManager.config.channels.whatsapp.enabled;
        if (allDisabled) {
            this.alertManager.config.enabled = false;
            console.log('❌ Sistema de alertas desativado (todos canais inativos)');
        }

        this.alertManager.saveConfig();
    }

    showStatus() {
        const config = this.alertManager.config;
        
        console.log('\n📱 STATUS DO SISTEMA DE ALERTAS');
        console.log('=============================\n');
        
        console.log(`🔧 Sistema: ${config.enabled ? '✅ ATIVO' : '❌ INATIVO'}`);
        console.log(`📊 Nível mínimo: ${config.filters?.minRiskLevel || 'MEDIUM'}`);
        
        if (config.filters?.quietHours?.enabled) {
            console.log(`🌙 Horário silêncio: ${config.filters.quietHours.start} - ${config.filters.quietHours.end}`);
        } else {
            console.log('🌙 Horário silêncio: ❌ Desativado');
        }
        
        console.log('\n📡 CANAIS:');
        
        // Telegram
        const telegram = config.channels?.telegram;
        console.log(`📱 Telegram: ${telegram?.enabled ? '✅ ATIVO' : '❌ INATIVO'}`);
        if (telegram?.botToken) {
            console.log(`   Bot: ${telegram.botToken.substring(0, 10)}...`);
        }
        if (telegram?.chatId) {
            console.log(`   Chat: ${telegram.chatId}`);
        }
        
        // WhatsApp
        const whatsapp = config.channels?.whatsapp;
        console.log(`💬 WhatsApp: ${whatsapp?.enabled ? '✅ ATIVO' : '❌ INATIVO'}`);
        if (whatsapp?.phoneNumber) {
            console.log(`   Phone: ${whatsapp.phoneNumber}`);
        }
        if (whatsapp?.apiKey) {
            console.log(`   API Key: ${whatsapp.apiKey.substring(0, 8)}...`);
        }
        
        console.log('\n⚡ NÍVEIS DE ALERTA:');
        const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        levels.forEach(level => {
            const levelConfig = config.alertLevels?.[level];
            const enabled = levelConfig?.enabled ? '✅' : '❌';
            const cooldown = levelConfig?.cooldown || 0;
            console.log(`   ${level}: ${enabled} (${cooldown}s cooldown)`);
        });
    }

    showLogs(limit = 10) {
        const alertLog = path.join(this.workspacePath, '.ai-workspace', 'logs', 'alerts.log');
        
        try {
            if (require('fs').existsSync(alertLog)) {
                const content = require('fs').readFileSync(alertLog, 'utf8');
                const lines = content.trim().split('\n');
                const recentLogs = lines.slice(-limit);
                
                console.log(`\n📋 ÚLTIMOS ${recentLogs.length} ALERTAS:`);
                console.log('========================\n');
                
                recentLogs.forEach((line, index) => {
                    try {
                        const log = JSON.parse(line);
                        const date = new Date(log.timestamp).toLocaleString('pt-BR');
                        const success = log.success ? '✅' : '❌';
                        const risk = log.alert?.riskLevel || 'UNKNOWN';
                        const agent = log.alert?.agentName || 'Unknown';
                        
                        console.log(`${index + 1}. ${success} ${date} - ${risk} - ${agent}`);
                        
                        log.results?.forEach(result => {
                            console.log(`   ${result.channel}: ${result.success ? '✅' : '❌'} ${result.message}`);
                        });
                        console.log('');
                    } catch (e) {
                        console.log(`${index + 1}. ❌ Log inválido: ${line.substring(0, 50)}...`);
                    }
                });
            } else {
                console.log('📋 Nenhum log de alerta encontrado');
            }
        } catch (error) {
            console.log('❌ Erro ao ler logs:', error.message);
        }
    }

    showHelp() {
        console.log('\n📱 ALERT MANAGER - COMANDOS');
        console.log('==========================\n');
        
        console.log('🔧 CONFIGURAÇÃO:');
        console.log('   setup                    - Mostra instruções detalhadas');
        console.log('   config telegram <token> <chat_id> - Configura Telegram');
        console.log('   config whatsapp <phone> <api_key> - Configura WhatsApp');
        console.log('   enable [canal...]        - Ativa canais (telegram, whatsapp)');
        console.log('   disable [canal...]       - Desativa canais');
        
        console.log('\n🧪 TESTE E STATUS:');
        console.log('   test                     - Envia alerta de teste');
        console.log('   status                   - Mostra status atual');
        console.log('   logs [n]                 - Mostra últimos n alertas (padrão: 10)');
        
        console.log('\n📋 EXEMPLOS:');
        console.log('   node alert-manager.js setup');
        console.log('   node alert-manager.js config telegram 123456:ABCDEF 987654321');
        console.log('   node alert-manager.js config whatsapp +55119xxxxxxxxx abc123def');
        console.log('   node alert-manager.js enable telegram whatsapp');
        console.log('   node alert-manager.js test');
        console.log('   node alert-manager.js status');
        console.log('   node alert-manager.js logs 5');
        
        console.log('\n🔗 LINKS ÚTEIS:');
        console.log('   Telegram Bot: @BotFather');
        console.log('   WhatsApp API: https://callmebot.com/whatsapp.html');
    }
}

// CLI Interface
if (require.main === module) {
    const cli = new AlertCLI();
    cli.run().catch(console.error);
}

module.exports = AlertCLI;
