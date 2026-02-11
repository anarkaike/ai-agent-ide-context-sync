/**
 * 📱 Alert Manager - Sistema de Notificações Multi-Canal
 * 
 * Envia alertas de segurança para WhatsApp e Telegram
 * Configurável para diferentes níveis de criticidade
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

// Carregar variáveis de ambiente do .env
require('dotenv').config();

class AlertManager {
    constructor(workspacePath) {
        this.workspacePath = workspacePath;
        this.configFile = path.join(workspacePath, '.ai-workspace', 'security', 'alert-config.json');
        this.alertLog = path.join(workspacePath, '.ai-workspace', 'logs', 'alerts.log');
        this.lastAlerts = new Map(); // Evitar spam de alertas
        
        this.loadConfig();
        this.initializeAlertSystem();
    }

    loadConfig() {
        try {
            // Primeiro carregar do .env se existir
            const envConfig = {
                telegram: {
                    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
                    chatId: process.env.TELEGRAM_CHAT_ID || ''
                },
                whatsapp: {
                    phoneNumber: process.env.WHATSAPP_PHONE || '',
                    apiKey: process.env.WHATSAPP_API_KEY || ''
                }
            };

            if (fs.existsSync(this.configFile)) {
                this.config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                
                // Sobrescrever com variáveis de ambiente se existirem
                if (envConfig.telegram.botToken) {
                    this.config.channels.telegram.botToken = envConfig.telegram.botToken;
                    this.config.channels.telegram.enabled = true;
                }
                if (envConfig.telegram.chatId) {
                    this.config.channels.telegram.chatId = envConfig.telegram.chatId;
                }
                if (envConfig.whatsapp.phoneNumber) {
                    this.config.channels.whatsapp.phoneNumber = envConfig.whatsapp.phoneNumber;
                    this.config.channels.whatsapp.enabled = true;
                }
                if (envConfig.whatsapp.apiKey) {
                    this.config.channels.whatsapp.apiKey = envConfig.whatsapp.apiKey;
                }
            } else {
                // Configuração padrão usando variáveis de ambiente
                this.config = {
                    enabled: true,
                    channels: {
                        whatsapp: {
                            enabled: !!envConfig.whatsapp.phoneNumber,
                            phoneNumber: envConfig.whatsapp.phoneNumber,
                            apiKey: envConfig.whatsapp.apiKey,
                            provider: 'callmebot'
                        },
                        telegram: {
                            enabled: !!envConfig.telegram.botToken,
                            botToken: envConfig.telegram.botToken,
                            chatId: envConfig.telegram.chatId,
                            provider: 'telegram-bot'
                        }
                    },
                    alertLevels: {
                        CRITICAL: { enabled: true, cooldown: 300 },
                        HIGH: { enabled: true, cooldown: 900 },
                        MEDIUM: { enabled: true, cooldown: 1800 },
                        LOW: { enabled: false, cooldown: 3600 }
                    },
                    filters: {
                        minRiskLevel: 'MEDIUM',
                        quietHours: {
                            enabled: true,
                            start: '22:00',
                            end: '08:00',
                            timezone: 'America/Sao_Paulo'
                        }
                    }
                };
                this.saveConfig();
            }
        } catch (error) {
            console.log('⚠️ Erro ao carregar configuração de alertas:', error.message);
            this.config = { enabled: false };
        }
    }

    saveConfig() {
        try {
            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.log('❌ Erro ao salvar configuração de alertas:', error.message);
        }
    }

    initializeAlertSystem() {
        console.log('📱 Alert Manager inicializado');
        console.log('   Status:', this.config.enabled ? '✅ ATIVO' : '❌ INATIVO');
        
        if (this.config.enabled) {
            console.log('   Canais configurados:');
            if (this.config.channels.telegram.enabled) {
                console.log('     📱 Telegram: ✅');
            }
            if (this.config.channels.whatsapp.enabled) {
                console.log('     💬 WhatsApp: ✅');
            }
        }
        
        console.log('   Para configurar: node scripts/alert-manager.js setup');
    }

    /**
     * Envia alerta de segurança
     */
    async sendSecurityAlert(alertData) {
        if (!this.config.enabled) {
            return { success: false, message: 'Alert system disabled' };
        }

        const { riskLevel, agentName, agentId, description, timestamp } = alertData;
        
        // Verificar nível de risco mínimo
        if (!this.shouldSendAlert(riskLevel)) {
            return { success: false, message: 'Alert level below threshold' };
        }

        // Verificar cooldown (evitar spam)
        const alertKey = `${agentId}-${riskLevel}`;
        if (this.isInCooldown(alertKey, riskLevel)) {
            return { success: false, message: 'Alert in cooldown period' };
        }

        // Verificar horário de silêncio
        if (this.isQuietHours() && riskLevel !== 'CRITICAL') {
            return { success: false, message: 'Quiet hours active' };
        }

        // Formatar mensagem
        const message = this.formatAlertMessage(alertData);
        
        const results = [];
        
        // Enviar para Telegram
        if (this.config.channels.telegram.enabled) {
            const telegramResult = await this.sendTelegramAlert(message);
            results.push({ channel: 'telegram', ...telegramResult });
        }

        // Enviar para WhatsApp
        if (this.config.channels.whatsapp.enabled) {
            const whatsappResult = await this.sendWhatsAppAlert(message);
            results.push({ channel: 'whatsapp', ...whatsappResult });
        }

        // Registrar alerta
        this.logAlert(alertData, results);
        
        // Atualizar cooldown
        this.updateCooldown(alertKey);

        return {
            success: results.some(r => r.success),
            results: results
        };
    }

    /**
     * Formata mensagem de alerta
     */
    formatAlertMessage(alertData) {
        const { riskLevel, agentName, agentId, description, timestamp } = alertData;
        
        const emojis = {
            CRITICAL: '🚨',
            HIGH: '🟠',
            MEDIUM: '🟡',
            LOW: '🟢'
        };

        const message = `
${emojis[riskLevel]} *ALERTA DE SEGURANÇA - AI AGENT*

*Risco:* ${riskLevel}
*Agente:* ${agentName} (${agentId})
*Horário:* ${new Date(timestamp).toLocaleString('pt-BR')}
*Descrição:* ${description}

📊 *Dashboard:* node scripts/security-dashboard.js
🔧 *Ação:* Verificar caso na fila de segurança

---
🛡️ AI Agent Security System
        `.trim();

        return message;
    }

    /**
     * Envia alerta via Telegram
     */
    async sendTelegramAlert(message) {
        try {
            const { botToken, chatId } = this.config.channels.telegram;
            
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            
            const postData = querystring.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            return new Promise((resolve) => {
                const req = https.request(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            resolve({
                                success: response.ok,
                                message: response.ok ? 'Telegram alert sent' : response.description,
                                messageId: response.result?.message_id
                            });
                        } catch (e) {
                            resolve({ success: false, message: 'Invalid response' });
                        }
                    });
                });

                req.on('error', (error) => {
                    resolve({ success: false, message: error.message });
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Envia alerta via WhatsApp (usando CallMeBot API - gratuita)
     */
    async sendWhatsAppAlert(message) {
        try {
            const { phoneNumber, apiKey } = this.config.channels.whatsapp;
            
            // Limpar mensagem para WhatsApp (sem markdown)
            const cleanMessage = message.replace(/\*/g, '').replace(/_/g, '').replace(/`/g, '');
            
            const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(cleanMessage)}&apikey=${apiKey}`;

            return new Promise((resolve) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            success: data.includes('Message sent'),
                            message: data.includes('Message sent') ? 'WhatsApp alert sent' : 'Failed to send WhatsApp alert'
                        });
                    });
                }).on('error', (error) => {
                    resolve({ success: false, message: error.message });
                });
            });
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Verifica se deve enviar alerta baseado no nível
     */
    shouldSendAlert(riskLevel) {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const minLevel = levels.indexOf(this.config.filters.minRiskLevel);
        const currentLevel = levels.indexOf(riskLevel);
        
        return currentLevel >= minLevel && this.config.alertLevels[riskLevel].enabled;
    }

    /**
     * Verifica se está em período de cooldown
     */
    isInCooldown(alertKey, riskLevel) {
        const lastAlert = this.lastAlerts.get(alertKey);
        if (!lastAlert) return false;

        const cooldown = this.config.alertLevels[riskLevel].cooldown * 1000;
        return (Date.now() - lastAlert) < cooldown;
    }

    /**
     * Verifica se está em horário de silêncio
     */
    isQuietHours() {
        if (!this.config.filters.quietHours.enabled) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(this.config.filters.quietHours.start.split(':')[0]);
        const endHour = parseInt(this.config.filters.quietHours.end.split(':')[0]);

        if (startHour > endHour) {
            // Período atravessa meia-noite (ex: 22:00 - 08:00)
            return currentHour >= startHour || currentHour < endHour;
        } else {
            // Período normal (ex: 01:00 - 06:00)
            return currentHour >= startHour && currentHour < endHour;
        }
    }

    /**
     * Atualiza cooldown do alerta
     */
    updateCooldown(alertKey) {
        this.lastAlerts.set(alertKey, Date.now());
    }

    /**
     * Registra alerta no log
     */
    logAlert(alertData, results) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            alert: alertData,
            results: results,
            success: results.some(r => r.success)
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.alertLog, logLine);
    }

    /**
     * Testa sistema de alertas
     */
    async testAlerts() {
        const testAlert = {
            riskLevel: 'HIGH',
            agentName: 'Test Agent',
            agentId: 'test-123',
            description: 'Este é um alerta de teste do sistema de segurança',
            timestamp: new Date().toISOString()
        };

        console.log('🧪 Enviando alerta de teste...');
        const result = await this.sendSecurityAlert(testAlert);
        
        console.log('📊 Resultado do teste:');
        result.results.forEach(r => {
            console.log(`   ${r.channel}: ${r.success ? '✅' : '❌'} ${r.message}`);
        });

        return result;
    }

    /**
     * Configura assistente para WhatsApp e Telegram
     */
    showSetupInstructions() {
        console.log('\n📱 CONFIGURAÇÃO DE ALERTAS - PASSO A PASSO');
        console.log('==========================================\n');

        console.log('📝 1. CONFIGURAR TELEGRAM:');
        console.log('   a) Crie um bot no Telegram:');
        console.log('      - Fale com @BotFather no Telegram');
        console.log('      - Envie /newbot');
        console.log('      - Siga as instruções');
        console.log('   b) Obtenha seu Chat ID:');
        console.log('      - Envie /start para seu bot');
        console.log('      - Acesse: https://api.telegram.org/bot<SEU_TOKEN>/getUpdates');
        console.log('      - Procure por "chat":{"id":<SEU_CHAT_ID>}');
        console.log('   c) Configure no sistema:\n');

        console.log('📝 2. CONFIGURAR WHATSAPP (GRÁTIS - CallMeBot):');
        console.log('   a) Acesse: https://callmebot.com/whatsapp.html');
        console.log('   b) Siga os passos para ativar seu número');
        console.log('   c) Copie a API Key fornecida');
        console.log('   d) Configure no sistema:\n');

        console.log('⚙️ 3. COMANDOS DE CONFIGURAÇÃO:');
        console.log('   node scripts/alert-manager.js config telegram <bot_token> <chat_id>');
        console.log('   node scripts/alert-manager.js config whatsapp <phone_number> <api_key>');
        console.log('   node scripts/alert-manager.js enable telegram');
        console.log('   node scripts/alert-manager.js enable whatsapp');
        console.log('   node scripts/alert-manager.js test');
        console.log('   node scripts/alert-manager.js status\n');

        console.log('📋 4. EXEMPLOS:');
        console.log('   node scripts/alert-manager.js config telegram 123456:ABCDEF 987654321');
        console.log('   node scripts/alert-manager.js config whatsapp +55119xxxxxxxxx abc123def');
        console.log('   node scripts/alert-manager.js enable telegram whatsapp');
        console.log('   node scripts/alert-manager.js test\n');

        console.log('🔔 5. NÍVEIS DE ALERTA:');
        console.log('   CRITICAL: Sempre enviado (ex: invasão detectada)');
        console.log('   HIGH: Enviado imediatamente (ex: agente não autorizado)');
        console.log('   MEDIUM: Enviado com 30min de cooldown');
        console.log('   LOW: Desabilitado por padrão\n');

        console.log('🌙 6. HORÁRIO DE SILÊNCIO:');
        console.log('   Padrão: 22:00 - 08:00 (fuso America/Sao_Paulo)');
        console.log('   Apenas alertas CRITICAL são enviados neste período\n');
    }
}

module.exports = AlertManager;
