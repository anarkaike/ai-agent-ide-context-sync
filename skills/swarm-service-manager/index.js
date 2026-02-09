/**
 * Swarm Service Manager - Nanobot Skill
 * Gerencia serviços SwarmClient e WebMap em qualquer plataforma
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SwarmServiceManagerSkill {
    constructor() {
        this.name = 'swarm-service-manager';
        this.version = '1.0.0';
        this.logs = [];
    }

    /**
     * Executa a skill
     * @param {Object} input - Parâmetros da skill
     * @param {Object} context - Contexto de execução
     * @returns {Promise<Object>} Resultado da execução
     */
    async execute(input, context = {}) {
        const { action = 'check', platform = 'auto', config = {} } = input;
        
        this.log(`🚀 Executando Swarm Service Manager: ${action}`);
        
        try {
            // Detectar plataforma
            const detectedPlatform = platform === 'auto' ? this.detectPlatform() : platform;
            this.log(`🖥️ Plataforma detectada: ${detectedPlatform}`);
            
            // Configurar parâmetros
            const finalConfig = {
                webmap_port: 3456,
                mothership_ip: '100.104.189.106',
                agent_id: this.generateAgentId(),
                log_level: 'info',
                ...config
            };
            
            // Executar ação
            let result;
            switch (action) {
                case 'start':
                    result = await this.startServices(detectedPlatform, finalConfig);
                    break;
                case 'stop':
                    result = await this.stopServices(detectedPlatform, finalConfig);
                    break;
                case 'restart':
                    result = await this.restartServices(detectedPlatform, finalConfig);
                    break;
                case 'status':
                    result = await this.getStatus(detectedPlatform, finalConfig);
                    break;
                case 'check':
                    result = await this.checkHealth(detectedPlatform, finalConfig);
                    break;
                case 'install':
                    result = await this.installService(detectedPlatform, finalConfig);
                    break;
                case 'uninstall':
                    result = await this.uninstallService(detectedPlatform, finalConfig);
                    break;
                case 'monitor':
                    result = await this.monitorServices(detectedPlatform, finalConfig);
                    break;
                default:
                    throw new Error(`Ação não suportada: ${action}`);
            }
            
            return {
                success: true,
                data: result,
                logs: this.logs,
                platform: detectedPlatform,
                action: action
            };
            
        } catch (error) {
            this.log(`❌ Erro: ${error.message}`);
            return {
                success: false,
                error: error.message,
                logs: this.logs
            };
        }
    }

    /**
     * Detecta a plataforma atual
     */
    detectPlatform() {
        const platform = os.platform();
        const arch = os.arch();
        
        // Verificar WSL
        if (platform === 'linux') {
            try {
                if (fs.existsSync('/proc/version')) {
                    const version = fs.readFileSync('/proc/version', 'utf8');
                    if (version.includes('microsoft') || version.includes('wsl')) {
                        return 'wsl';
                    }
                }
            } catch (e) {
                // Ignorar erro
            }
        }
        
        // Verificar Git Bash no Windows
        if (platform === 'win32' || process.env.MSYSTEM) {
            if (process.env.MSYSTEM) {
                return 'gitbash';
            }
            return 'windows';
        }
        
        switch (platform) {
            case 'darwin':
                return 'macos';
            case 'linux':
                return 'linux';
            case 'win32':
                return 'windows';
            default:
                return 'unknown';
        }
    }

    /**
     * Gera ID do agente
     */
    generateAgentId() {
        const hostname = os.hostname();
        const timestamp = Date.now();
        const platform = this.detectPlatform();
        return `${platform.toUpperCase()}_${hostname}_${timestamp}`;
    }

    /**
     * Executa comando shell
     */
    async executeCommand(command, cwd = null, env = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                cwd: cwd || process.cwd(),
                env: { ...process.env, ...env },
                timeout: 30000
            };
            
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Command failed: ${command} - ${error.message}`));
                    return;
                }
                resolve({ stdout, stderr });
            });
        });
    }

    /**
     * Inicia serviços
     */
    async startServices(platform, config) {
        this.log(`🚀 Iniciando serviços na plataforma: ${platform}`);
        
        const commands = {
            'macos': './scripts/swarm-service-manager.sh start',
            'linux': 'sudo ./scripts/swarm-service-manager.sh start',
            'windows': 'powershell.exe -ExecutionPolicy Bypass -File ./scripts/swarm-service-manager.ps1 start',
            'wsl': './scripts/swarm-service-manager-wsl.sh start',
            'gitbash': './scripts/swarm-service-manager.bat start'
        };
        
        const command = commands[platform];
        if (!command) {
            throw new Error(`Plataforma não suportada: ${platform}`);
        }
        
        // Configurar variáveis de ambiente
        const env = {
            MOTHERSHIP_IP: config.mothership_ip,
            AGENT_ID: config.agent_id,
            AGENT_ROLE: 'WORKER'
        };
        
        try {
            await this.executeCommand(command, null, env);
            this.log('✅ Serviços iniciados com sucesso');
            
            // Aguardar e verificar status
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await this.getStatus(platform, config);
            
        } catch (error) {
            this.log(`❌ Falha ao iniciar serviços: ${error.message}`);
            throw error;
        }
    }

    /**
     * Para serviços
     */
    async stopServices(platform, config) {
        this.log(`🛑 Parando serviços na plataforma: ${platform}`);
        
        const commands = {
            'macos': './scripts/swarm-service-manager.sh stop',
            'linux': 'sudo ./scripts/swarm-service-manager.sh stop',
            'windows': 'powershell.exe -ExecutionPolicy Bypass -File ./scripts/swarm-service-manager.ps1 stop',
            'wsl': './scripts/swarm-service-manager-wsl.sh stop',
            'gitbash': './scripts/swarm-service-manager.bat stop'
        };
        
        const command = commands[platform];
        if (!command) {
            throw new Error(`Plataforma não suportada: ${platform}`);
        }
        
        try {
            await this.executeCommand(command);
            this.log('✅ Serviços parados com sucesso');
            
            return {
                webmap: 'stopped',
                swarmclient: 'stopped',
                action: 'stopped'
            };
            
        } catch (error) {
            this.log(`❌ Falha ao parar serviços: ${error.message}`);
            throw error;
        }
    }

    /**
     * Reinicia serviços
     */
    async restartServices(platform, config) {
        this.log(`🔄 Reiniciando serviços na plataforma: ${platform}`);
        
        await this.stopServices(platform, config);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await this.startServices(platform, config);
    }

    /**
     * Obtém status dos serviços
     */
    async getStatus(platform, config) {
        this.log(`📊 Verificando status na plataforma: ${platform}`);
        
        const commands = {
            'macos': './scripts/swarm-service-manager.sh status',
            'linux': './scripts/swarm-service-manager.sh status',
            'windows': 'powershell.exe -ExecutionPolicy Bypass -File ./scripts/swarm-service-manager.ps1 status',
            'wsl': './scripts/swarm-service-manager-wsl.sh status',
            'gitbash': './scripts/swarm-service-manager.bat status'
        };
        
        const command = commands[platform];
        if (!command) {
            throw new Error(`Plataforma não suportada: ${platform}`);
        }
        
        try {
            const { stdout } = await this.executeCommand(command);
            
            // Parse do status (simplificado)
            const webmapRunning = stdout.includes('WebMap: RODANDO') || stdout.includes('🟢 WebMap');
            const swarmclientRunning = stdout.includes('SwarmClient: RODANDO') || stdout.includes('🟢 SwarmClient');
            
            const status = {
                webmap: webmapRunning ? 'running' : 'stopped',
                swarmclient: swarmclientRunning ? 'running' : 'stopped',
                platform: platform,
                agent_id: config.agent_id,
                endpoint: `http://localhost:${config.webmap_port}`,
                mothership: config.mothership_ip,
                timestamp: new Date().toISOString()
            };
            
            this.log(`📊 Status: WebMap=${status.webmap}, SwarmClient=${status.swarmclient}`);
            
            return status;
            
        } catch (error) {
            this.log(`❌ Falha ao obter status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifica saúde dos serviços com auto-recuperação
     */
    async checkHealth(platform, config) {
        this.log(`🔍 Executando verificação de saúde na plataforma: ${platform}`);
        
        const commands = {
            'macos': './scripts/swarm-service-manager.sh check',
            'linux': './scripts/swarm-service-manager.sh check',
            'windows': 'powershell.exe -ExecutionPolicy Bypass -File ./scripts/swarm-service-manager.ps1 check',
            'wsl': './scripts/swarm-service-manager-wsl.sh check',
            'gitbash': './scripts/swarm-service-manager.bat check'
        };
        
        const command = commands[platform];
        if (!command) {
            throw new Error(`Plataforma não suportada: ${platform}`);
        }
        
        try {
            const { stdout } = await this.executeCommand(command);
            
            // Parse do resultado
            const needsRestart = stdout.includes('reiniciados') || stdout.includes('restarting');
            const allHealthy = stdout.includes('funcionando normalmente') || stdout.includes('All services healthy');
            
            const health = {
                healthy: allHealthy && !needsRestart,
                needs_restart: needsRestart,
                platform: platform,
                timestamp: new Date().toISOString(),
                details: stdout
            };
            
            // Obter status atual
            const status = await this.getStatus(platform, config);
            
            this.log(`🏥 Saúde: ${health.healthy ? 'Saudável' : 'Problemas detectados'}`);
            
            return {
                ...health,
                status: status
            };
            
        } catch (error) {
            this.log(`❌ Falha na verificação de saúde: ${error.message}`);
            throw error;
        }
    }

    /**
     * Instala serviço nativo
     */
    async installService(platform, config) {
        this.log(`🛠️ Instalando serviço na plataforma: ${platform}`);
        
        const commands = {
            'macos': './scripts/swarm-service-manager.sh install',
            'linux': 'sudo ./scripts/swarm-service-manager.sh install',
            'windows': 'powershell.exe -ExecutionPolicy Bypass -File ./scripts/swarm-service-manager.ps1 install',
            'wsl': './scripts/swarm-service-manager-wsl.sh install'
        };
        
        const command = commands[platform];
        if (!command) {
            throw new Error(`Instalação não suportada na plataforma: ${platform}`);
        }
        
        try {
            const { stdout, stderr } = await this.executeCommand(command);
            
            this.log('✅ Serviço instalado com sucesso');
            
            return {
                installed: true,
                platform: platform,
                message: 'Serviço instalado com sucesso',
                details: stdout || stderr
            };
            
        } catch (error) {
            this.log(`❌ Falha na instalação: ${error.message}`);
            throw error;
        }
    }

    /**
     * Remove serviço nativo
     */
    async uninstallService(platform, config) {
        this.log(`🗑️ Removendo serviço na plataforma: ${platform}`);
        
        const commands = {
            'macos': './scripts/swarm-service-manager.sh uninstall',
            'linux': 'sudo ./scripts/swarm-service-manager.sh uninstall',
            'windows': 'powershell.exe -ExecutionPolicy Bypass -File ./scripts/swarm-service-manager.ps1 uninstall'
        };
        
        const command = commands[platform];
        if (!command) {
            throw new Error(`Desinstalação não suportada na plataforma: ${platform}`);
        }
        
        try {
            await this.executeCommand(command);
            this.log('✅ Serviço removido com sucesso');
            
            return {
                uninstalled: true,
                platform: platform,
                message: 'Serviço removido com sucesso'
            };
            
        } catch (error) {
            this.log(`❌ Falha na desinstalação: ${error.message}`);
            throw error;
        }
    }

    /**
     * Monitoramento contínuo
     */
    async monitorServices(platform, config) {
        this.log(`👀 Iniciando monitoramento contínuo na plataforma: ${platform}`);
        
        const health = await this.checkHealth(platform, config);
        
        // Se não estiver saudável, tentar recuperar
        if (!health.healthy) {
            this.log('🔄 Tentando recuperação automática...');
            await this.restartServices(platform, config);
            
            // Verificar novamente
            const newHealth = await this.checkHealth(platform, config);
            
            return {
                monitoring: true,
                recovered: newHealth.healthy,
                health: newHealth
            };
        }
        
        return {
            monitoring: true,
            recovered: false,
            health: health
        };
    }

    /**
     * Adiciona entrada ao log
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry);
    }

    /**
     * Limpa logs
     */
    clearLogs() {
        this.logs = [];
    }
}

module.exports = SwarmServiceManagerSkill;
