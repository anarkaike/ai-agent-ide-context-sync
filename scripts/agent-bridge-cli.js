#!/usr/bin/env node

/**
 * 🤖 Agent Communication Bridge CLI
 */

const AgentCommunicationBridge = require('./agent-communication-bridge.js');

class AgentBridgeCLI {
    constructor() {
        this.bridge = new AgentCommunicationBridge(process.cwd());
    }

    async run() {
        const command = process.argv[2];

        switch (command) {
            case 'test':
                await this.bridge.testAgentCommunication();
                break;

            case 'list':
                await this.bridge.listActiveAgents();
                break;

            case 'help':
                this.showHelp();
                break;

            default:
                console.log('❌ Comando não reconhecido. Use "help" para ver opções.');
        }
    }

    showHelp() {
        console.log('\n🤖 AGENT COMMUNICATION BRIDGE - COMANDOS');
        console.log('==========================================\n');
        
        console.log('🧪 TESTE E STATUS:');
        console.log('   test                     - Testa comunicação com agentes');
        console.log('   list                     - Lista agentes ativos com comunicação');
        
        console.log('\n📋 EXEMPLOS:');
        console.log('   node agent-communication-bridge.js test');
        console.log('   node agent-communication-bridge.js list');
        
        console.log('\n🔗 INTEGRAÇÃO:');
        console.log('   Este sistema integra alertas de segurança com:');
        console.log('   • Neural Link (comunicação interna)');
        console.log('   • Agentes com capacidades de comunicação');
        console.log('   • Canais externos (Telegram/WhatsApp)');
    }
}

if (require.main === module) {
    const cli = new AgentBridgeCLI();
    cli.run().catch(console.error);
}

module.exports = AgentBridgeCLI;
