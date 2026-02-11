/**
 * Swarm Health Monitor - Nanobot Skill
 * Monitor avançado de saúde para serviços Swarm
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class SwarmHealthMonitorSkill {
    constructor() {
        this.name = 'swarm-health-monitor';
        this.version = '1.0.0';
        this.metrics = {
            uptime: Date.now(),
            checks: 0,
            errors: 0,
            alerts: 0
        };
        this.logs = [];
    }

    /**
     * Executa a skill
     */
    async execute(input, context = {}) {
        const { mode = 'check', interval = 60, alerts = {} } = input;
        
        this.log(`🏥 Iniciando Health Monitor: ${mode}`);
        
        try {
            let result;
            switch (mode) {
                case 'check':
                    result = await this.checkHealth(alerts);
                    break;
                case 'monitor':
                    result = await this.monitorResources(interval);
                    break;
                case 'report':
                    result = await this.generateHealthReport();
                    break;
                case 'continuous':
                    result = await this.continuousMonitoring(interval, alerts);
                    break;
                default:
                    throw new Error(`Modo não suportado: ${mode}`);
            }
            
            return {
                success: true,
                data: result,
                metrics: this.metrics,
                logs: this.logs
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
     * Verificação completa de saúde
     */
    async checkHealth(alerts = {}) {
        this.log('🔍 Executando verificação completa de saúde...');
        
        const health = {
            timestamp: new Date().toISOString(),
            overall_status: 'healthy',
            services: {},
            resources: {},
            connectivity: {},
            issues: []
        };

        try {
            // Verificar serviços
            health.services = await this.checkServices();
            
            // Verificar recursos
            health.resources = await this.checkResources();
            
            // Verificar conectividade
            health.connectivity = await this.checkConnectivity();
            
            // Calcular status geral
            health.overall_status = this.calculateOverallStatus(health);
            
            // Enviar alertas se necessário
            if (health.overall_status !== 'healthy') {
                await this.sendAlerts(health, alerts);
            }
            
            this.metrics.checks++;
            this.log(`🏥 Status geral: ${health.overall_status}`);
            
            return health;
            
        } catch (error) {
            this.metrics.errors++;
            health.issues.push(`Erro na verificação: ${error.message}`);
            health.overall_status = 'critical';
            return health;
        }
    }

    /**
     * Verifica status dos serviços
     */
    async checkServices() {
        const services = {};
        
        // Verificar WebMap
        services.webmap = await this.checkWebMap();
        
        // Verificar SwarmClient
        services.swarmclient = await this.checkSwarmClient();
        
        // Verificar banco de dados
        services.database = await this.checkDatabase();
        
        return services;
    }

    /**
     * Verifica WebMap
     */
    async checkWebMap() {
        try {
            const response = await this.httpRequest('http://localhost:3456/api/comms/messages', 5000);
            return {
                status: 'running',
                response_time: response.time,
                endpoint_accessible: true,
                last_check: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'stopped',
                error: error.message,
                endpoint_accessible: false,
                last_check: new Date().toISOString()
            };
        }
    }

    /**
     * Verifica SwarmClient
     */
    async checkSwarmClient() {
        try {
            // Verificar se processo está rodando
            const processes = await this.getProcesses();
            const swarmProcess = processes.find(p => p.cmd && p.cmd.includes('SwarmClient.js'));
            
            if (swarmProcess) {
                return {
                    status: 'running',
                    pid: swarmProcess.pid,
                    cpu: swarmProcess.cpu,
                    memory: swarmProcess.memory,
                    last_check: new Date().toISOString()
                };
            } else {
                return {
                    status: 'stopped',
                    error: 'Processo não encontrado',
                    last_check: new Date().toISOString()
                };
            }
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                last_check: new Date().toISOString()
            };
        }
    }

    /**
     * Verifica banco de dados
     */
    async checkDatabase() {
        const dbPath = '.ai-workspace/swarm.db';
        
        try {
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                return {
                    status: 'available',
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    last_check: new Date().toISOString()
                };
            } else {
                return {
                    status: 'missing',
                    error: 'Arquivo de banco não encontrado',
                    last_check: new Date().toISOString()
                };
            }
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                last_check: new Date().toISOString()
            };
        }
    }

    /**
     * Verifica uso de recursos
     */
    async checkResources() {
        const resources = {};
        
        // CPU
        resources.cpu = await this.getCpuUsage();
        
        // Memória
        resources.memory = await this.getMemoryUsage();
        
        // Disco
        resources.disk = await this.getDiskUsage();
        
        // Rede
        resources.network = await this.getNetworkStats();
        
        return resources;
    }

    /**
     * Obtém uso de CPU
     */
    async getCpuUsage() {
        return new Promise((resolve) => {
            const startUsage = process.cpuUsage();
            const startTime = process.hrtime();
            
            setTimeout(() => {
                const endUsage = process.cpuUsage(startUsage);
                const endTime = process.hrtime(startTime);
                
                const cpuPercent = (endUsage.user + endUsage.system) / (endTime[0] * 1e9 + endTime[1]) * 100;
                
                resolve({
                    percentage: Math.min(cpuPercent, 100),
                    cores: os.cpus().length,
                    load_average: os.loadavg()
                });
            }, 100);
        });
    }

    /**
     * Obtém uso de memória
     */
    async getMemoryUsage() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        
        return {
            total: total,
            used: used,
            free: free,
            percentage: (used / total) * 100,
            heap: process.memoryUsage()
        };
    }

    /**
     * Obtém uso de disco
     */
    async getDiskUsage() {
        return new Promise((resolve) => {
            exec('df -h .', (error, stdout) => {
                if (error) {
                    resolve({ error: error.message });
                    return;
                }
                
                const lines = stdout.split('\n');
                if (lines.length > 1) {
                    const parts = lines[1].split(/\s+/);
                    resolve({
                        total: parts[1],
                        used: parts[2],
                        available: parts[3],
                        percentage: parseInt(parts[4]),
                        mountpoint: parts[5]
                    });
                } else {
                    resolve({ error: 'Não foi possível obter informações do disco' });
                }
            });
        });
    }

    /**
     * Obtém estatísticas de rede
     */
    async getNetworkStats() {
        const interfaces = os.networkInterfaces();
        const stats = {};
        
        for (const [name, addrs] of Object.entries(interfaces)) {
            stats[name] = addrs.filter(addr => !addr.internal).map(addr => ({
                family: addr.family,
                address: addr.address,
                netmask: addr.netmask
            }));
        }
        
        return {
            interfaces: stats,
            hostname: os.hostname(),
            platform: os.platform()
        };
    }

    /**
     * Verifica conectividade
     */
    async checkConnectivity() {
        const connectivity = {};
        
        // Conectividade local
        connectivity.local = await this.checkLocalConnectivity();
        
        // Conectividade com Mothership
        connectivity.mothership = await this.checkMothershipConnectivity();
        
        // Conectividade externa
        connectivity.internet = await this.checkInternetConnectivity();
        
        return connectivity;
    }

    /**
     * Verifica conectividade local
     */
    async checkLocalConnectivity() {
        try {
            const response = await this.httpRequest('http://localhost:3456', 3000);
            return {
                status: 'connected',
                response_time: response.time,
                accessible: true
            };
        } catch (error) {
            return {
                status: 'disconnected',
                error: error.message,
                accessible: false
            };
        }
    }

    /**
     * Verifica conectividade com Mothership
     */
    async checkMothershipConnectivity() {
        try {
            const response = await this.httpRequest('http://100.104.189.106:3456/api/comms/messages', 5000);
            return {
                status: 'connected',
                response_time: response.time,
                accessible: true
            };
        } catch (error) {
            return {
                status: 'disconnected',
                error: error.message,
                accessible: false
            };
        }
    }

    /**
     * Verifica conectividade com internet
     */
    async checkInternetConnectivity() {
        try {
            const response = await this.httpRequest('https://www.google.com', 5000);
            return {
                status: 'connected',
                response_time: response.time,
                accessible: true
            };
        } catch (error) {
            return {
                status: 'disconnected',
                error: error.message,
                accessible: false
            };
        }
    }

    /**
     * Calcula status geral
     */
    calculateOverallStatus(health) {
        let issues = 0;
        let warnings = 0;
        
        // Verificar serviços
        for (const [service, status] of Object.entries(health.services)) {
            if (status.status === 'stopped' || status.status === 'error') {
                issues++;
            }
        }
        
        // Verificar recursos
        if (health.resources.cpu && health.resources.cpu.percentage > 80) {
            warnings++;
        }
        if (health.resources.memory && health.resources.memory.percentage > 90) {
            issues++;
        }
        if (health.resources.disk && health.resources.disk.percentage > 95) {
            issues++;
        }
        
        // Verificar conectividade
        if (health.connectivity.local && health.connectivity.local.status === 'disconnected') {
            issues++;
        }
        
        if (issues > 0) {
            return 'critical';
        } else if (warnings > 0) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }

    /**
     * Monitora recursos continuamente
     */
    async monitorResources(interval = 60) {
        this.log(`📊 Iniciando monitoramento de recursos (intervalo: ${interval}s)`);
        
        const monitoring = {
            start_time: new Date().toISOString(),
            interval: interval,
            samples: [],
            current: await this.checkResources()
        };
        
        monitoring.samples.push({
            timestamp: new Date().toISOString(),
            ...monitoring.current
        });
        
        return monitoring;
    }

    /**
     * Gera relatório de saúde completo
     */
    async generateHealthReport() {
        this.log('📋 Gerando relatório de saúde completo...');
        
        const report = {
            generated_at: new Date().toISOString(),
            system: {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch(),
                uptime: os.uptime(),
                node_version: process.version
            },
            health: await this.checkHealth(),
            metrics: this.metrics,
            performance: await this.getPerformanceMetrics(),
            recommendations: []
        };
        
        // Gerar recomendações
        report.recommendations = this.generateRecommendations(report);
        
        return report;
    }

    /**
     * Monitoramento contínuo
     */
    async continuousMonitoring(interval = 60, alerts = {}) {
        this.log(`👀 Iniciando monitoramento contínuo...`);
        
        const monitoring = {
            start_time: new Date().toISOString(),
            interval: interval,
            status: 'running',
            alerts_sent: 0,
            last_check: null
        };
        
        // Simular monitoramento contínuo (na prática seria um loop)
        const health = await this.checkHealth(alerts);
        monitoring.last_check = health.timestamp;
        
        if (health.overall_status !== 'healthy') {
            monitoring.alerts_sent++;
        }
        
        return monitoring;
    }

    /**
     * Obtém métricas de performance
     */
    async getPerformanceMetrics() {
        return {
            process: process.memoryUsage(),
            cpu: os.cpus(),
            load_average: os.loadavg(),
            uptime: {
                system: os.uptime(),
                process: process.uptime()
            }
        };
    }

    /**
     * Gera recomendações baseadas no relatório
     */
    generateRecommendations(report) {
        const recommendations = [];
        
        // Recomendações de serviços
        if (report.health.services.webmap && report.health.services.webmap.status !== 'running') {
            recommendations.push({
                type: 'service',
                priority: 'high',
                message: 'WebMap não está rodando. Execute o serviço de gerenciamento.',
                action: 'start_webmap'
            });
        }
        
        // Recomendações de recursos
        if (report.health.resources.memory && report.health.resources.memory.percentage > 80) {
            recommendations.push({
                type: 'resource',
                priority: 'medium',
                message: 'Uso de memória elevado. Considere otimizar ou adicionar mais memória.',
                action: 'optimize_memory'
            });
        }
        
        // Recomendações de conectividade
        if (report.health.connectivity.mothership && report.health.connectivity.mothership.status === 'disconnected') {
            recommendations.push({
                type: 'connectivity',
                priority: 'medium',
                message: 'Sem conexão com Mothership. Verifique rede e configuração.',
                action: 'check_network'
            });
        }
        
        return recommendations;
    }

    /**
     * Envia alertas
     */
    async sendAlerts(health, alerts) {
        if (!alerts || Object.keys(alerts).length === 0) {
            return;
        }
        
        const message = `🚨 Alerta Swarm - Status: ${health.overall_status}`;
        
        // Discord
        if (alerts.discord_webhook) {
            try {
                await this.sendDiscordAlert(alerts.discord_webhook, message, health);
                this.metrics.alerts++;
            } catch (error) {
                this.log(`❌ Falha ao enviar alerta Discord: ${error.message}`);
            }
        }
        
        // Slack
        if (alerts.slack_webhook) {
            try {
                await this.sendSlackAlert(alerts.slack_webhook, message, health);
                this.metrics.alerts++;
            } catch (error) {
                this.log(`❌ Falha ao enviar alerta Slack: ${error.message}`);
            }
        }
    }

    /**
     * Envia alerta para Discord
     */
    async sendDiscordAlert(webhook, message, health) {
        const payload = {
            content: message,
            embeds: [{
                title: 'Swarm Health Alert',
                description: `Status: ${health.overall_status}`,
                color: health.overall_status === 'critical' ? 0xFF0000 : 0xFFFF00,
                timestamp: new Date().toISOString()
            }]
        };
        
        await this.httpRequest(webhook, 5000, 'POST', payload);
    }

    /**
     * Envia alerta para Slack
     */
    async sendSlackAlert(webhook, message, health) {
        const payload = {
            text: message,
            attachments: [{
                color: health.overall_status === 'critical' ? 'danger' : 'warning',
                fields: [
                    { title: 'Status', value: health.overall_status, short: true },
                    { title: 'Timestamp', value: health.timestamp, short: true }
                ]
            }]
        };
        
        await this.httpRequest(webhook, 5000, 'POST', payload);
    }

    /**
     * Executa requisição HTTP
     */
    async httpRequest(url, timeout = 5000, method = 'GET', data = null) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const http = require('http');
            const https = require('https');
            const client = url.startsWith('https') ? https : http;
            
            const req = client.request(url, { method, timeout }, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        time: Date.now() - startTime,
                        data: responseData
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    /**
     * Obtém lista de processos
     */
    async getProcesses() {
        return new Promise((resolve) => {
            const platform = os.platform();
            let command;
            
            switch (platform) {
                case 'win32':
                    command = 'tasklist /fo csv';
                    break;
                case 'darwin':
                case 'linux':
                    command = 'ps aux';
                    break;
                default:
                    command = 'ps aux';
            }
            
            exec(command, (error, stdout) => {
                if (error) {
                    resolve([]);
                    return;
                }
                
                const processes = this.parseProcessList(stdout, platform);
                resolve(processes);
            });
        });
    }

    /**
     * Parse da lista de processos
     */
    parseProcessList(output, platform) {
        const processes = [];
        const lines = output.split('\n').slice(1);
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            if (platform === 'win32') {
                // Parse Windows tasklist output
                const parts = line.split(',').map(p => p.replace(/"/g, ''));
                if (parts.length >= 5) {
                    processes.push({
                        pid: parseInt(parts[1]),
                        name: parts[0],
                        cmd: parts[0]
                    });
                }
            } else {
                // Parse Unix ps output
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 11) {
                    processes.push({
                        pid: parseInt(parts[1]),
                        name: parts[10],
                        cmd: parts.slice(10).join(' ')
                    });
                }
            }
        }
        
        return processes;
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
}

module.exports = SwarmHealthMonitorSkill;
