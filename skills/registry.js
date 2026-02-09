/**
 * AI Agent Swarm Skills Registry
 * Registro central de todas as skills Nanobot do ecossistema
 */

const SwarmServiceManagerSkill = require('./swarm-service-manager/index.js');
const SwarmHealthMonitorSkill = require('./swarm-health-monitor/index.js');
const NeuralLinkCommunicatorSkill = require('./neural-link-communicator/index.js');
const SwarmOrchestratorSkill = require('./swarm-orchestrator/index.js');

class SwarmSkillsRegistry {
    constructor() {
        this.skills = new Map();
        this.workflows = new Map();
        this.metrics = {
            skills_loaded: 0,
            skills_executed: 0,
            workflows_executed: 0,
            errors: 0,
            uptime: Date.now()
        };
        
        // Carregar registry
        this.loadRegistry();
        
        // Inicializar skills
        this.initializeSkills();
        
        // Carregar workflows
        this.loadWorkflows();
    }

    /**
     * Carrega configuração do registry
     */
    loadRegistry() {
        try {
            const fs = require('fs');
            const registryPath = __dirname + '/registry.json';
            
            if (fs.existsSync(registryPath)) {
                const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                this.registry = registryData;
                console.log('📋 Registry carregado:', this.registry.name);
            } else {
                throw new Error('Arquivo registry.json não encontrado');
            }
        } catch (error) {
            console.error('❌ Falha ao carregar registry:', error.message);
            throw error;
        }
    }

    /**
     * Inicializa todas as skills
     */
    initializeSkills() {
        console.log('🔧 Inicializando skills...');
        
        try {
            // Service Manager
            this.skills.set('swarm-service-manager', {
                instance: new SwarmServiceManagerSkill(),
                metadata: this.registry.skills.find(s => s.name === 'swarm-service-manager'),
                status: 'loaded'
            });
            
            // Health Monitor
            this.skills.set('swarm-health-monitor', {
                instance: new SwarmHealthMonitorSkill(),
                metadata: this.registry.skills.find(s => s.name === 'swarm-health-monitor'),
                status: 'loaded'
            });
            
            // Neural Link Communicator
            this.skills.set('neural-link-communicator', {
                instance: new NeuralLinkCommunicatorSkill(),
                metadata: this.registry.skills.find(s => s.name === 'neural-link-communicator'),
                status: 'loaded'
            });
            
            // Swarm Orchestrator
            this.skills.set('swarm-orchestrator', {
                instance: new SwarmOrchestratorSkill(),
                metadata: this.registry.skills.find(s => s.name === 'swarm-orchestrator'),
                status: 'loaded'
            });
            
            this.metrics.skills_loaded = this.skills.size;
            console.log(`✅ ${this.skills.size} skills carregadas com sucesso`);
            
        } catch (error) {
            console.error('❌ Falha ao inicializar skills:', error.message);
            throw error;
        }
    }

    /**
     * Carrega workflows pré-definidos
     */
    loadWorkflows() {
        console.log('🔄 Carregando workflows...');
        
        try {
            if (this.registry.workflows) {
                this.registry.workflows.forEach(workflow => {
                    this.workflows.set(workflow.name, workflow);
                });
                
                console.log(`✅ ${this.workflows.size} workflows carregados`);
            }
        } catch (error) {
            console.error('❌ Falha ao carregar workflows:', error.message);
        }
    }

    /**
     * Executa uma skill específica
     */
    async executeSkill(skillName, input, context = {}) {
        const startTime = Date.now();
        
        try {
            const skill = this.skills.get(skillName);
            if (!skill) {
                throw new Error(`Skill não encontrada: ${skillName}`);
            }
            
            if (skill.status !== 'loaded') {
                throw new Error(`Skill não está carregada: ${skillName}`);
            }
            
            console.log(`🚀 Executando skill: ${skillName}`);
            
            const result = await skill.instance.execute(input, context);
            
            this.metrics.skills_executed++;
            
            console.log(`✅ Skill ${skillName} executada em ${Date.now() - startTime}ms`);
            
            return {
                success: true,
                skill: skillName,
                execution_time: Date.now() - startTime,
                result: result,
                metadata: skill.metadata
            };
            
        } catch (error) {
            this.metrics.errors++;
            console.error(`❌ Falha ao executar skill ${skillName}:`, error.message);
            
            return {
                success: false,
                skill: skillName,
                execution_time: Date.now() - startTime,
                error: error.message
            };
        }
    }

    /**
     * Executa um workflow
     */
    async executeWorkflow(workflowName, config = {}) {
        const startTime = Date.now();
        
        try {
            const workflow = this.workflows.get(workflowName);
            if (!workflow) {
                throw new Error(`Workflow não encontrado: ${workflowName}`);
            }
            
            console.log(`🔄 Executando workflow: ${workflowName}`);
            
            // Usar o orchestrator para executar o workflow
            const orchestrator = this.skills.get('swarm-orchestrator').instance;
            const result = await orchestrator.execute({
                operation: 'workflow',
                workflow: workflow,
                config: config
            });
            
            this.metrics.workflows_executed++;
            
            console.log(`✅ Workflow ${workflowName} executado em ${Date.now() - startTime}ms`);
            
            return {
                success: true,
                workflow: workflowName,
                execution_time: Date.now() - startTime,
                result: result,
                steps_executed: result.data.steps_executed?.length || 0
            };
            
        } catch (error) {
            this.metrics.errors++;
            console.error(`❌ Falha ao executar workflow ${workflowName}:`, error.message);
            
            return {
                success: false,
                workflow: workflowName,
                execution_time: Date.now() - startTime,
                error: error.message
            };
        }
    }

    /**
     * Obtém status de todas as skills
     */
    async getSkillsStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            total_skills: this.skills.size,
            skills: {},
            overall_health: 'unknown'
        };
        
        let healthyCount = 0;
        
        for (const [name, skill] of this.skills) {
            try {
                // Tentar obter status da skill
                const skillStatus = await skill.instance.execute({ action: 'status' });
                status.skills[name] = {
                    status: 'operational',
                    metadata: skill.metadata,
                    last_check: new Date().toISOString(),
                    data: skillStatus.data
                };
                healthyCount++;
            } catch (error) {
                status.skills[name] = {
                    status: 'error',
                    metadata: skill.metadata,
                    last_check: new Date().toISOString(),
                    error: error.message
                };
            }
        }
        
        // Calcular saúde geral
        const healthRatio = healthyCount / status.total_skills;
        if (healthRatio >= 0.8) {
            status.overall_health = 'healthy';
        } else if (healthRatio >= 0.5) {
            status.overall_health = 'degraded';
        } else {
            status.overall_health = 'critical';
        }
        
        return status;
    }

    /**
     * Obtém métricas do registry
     */
    getMetrics() {
        const uptime = Date.now() - this.metrics.uptime;
        
        return {
            ...this.metrics,
            uptime_ms: uptime,
            uptime_human: this.formatUptime(uptime),
            success_rate: this.metrics.skills_executed > 0 
                ? ((this.metrics.skills_executed - this.metrics.errors) / this.metrics.skills_executed * 100).toFixed(2) + '%'
                : 'N/A',
            skills_available: this.skills.size,
            workflows_available: this.workflows.size
        };
    }

    /**
     * Lista todas as skills disponíveis
     */
    listSkills() {
        const skills = [];
        
        for (const [name, skill] of this.skills) {
            skills.push({
                name: name,
                description: skill.metadata.description,
                capabilities: skill.metadata.capabilities,
                platforms: skill.metadata.platforms,
                status: skill.status
            });
        }
        
        return skills;
    }

    /**
     * Lista todos os workflows disponíveis
     */
    listWorkflows() {
        const workflows = [];
        
        for (const [name, workflow] of this.workflows) {
            workflows.push({
                name: name,
                description: workflow.description,
                steps_count: workflow.steps.length,
                steps: workflow.steps.map(step => ({
                    name: step.name,
                    type: step.type,
                    skill: step.skill
                }))
            });
        }
        
        return workflows;
    }

    /**
     * Obtém informações do registry
     */
    getRegistryInfo() {
        return {
            name: this.registry.name,
            version: this.registry.version,
            description: this.registry.description,
            author: this.registry.author,
            license: this.registry.license,
            tags: this.registry.tags,
            skills_count: this.registry.skills.length,
            workflows_count: this.registry.workflows.length,
            installation: this.registry.installation,
            compatibility: this.registry.compatibility
        };
    }

    /**
     * Recarrega uma skill específica
     */
    async reloadSkill(skillName) {
        try {
            const skill = this.skills.get(skillName);
            if (!skill) {
                throw new Error(`Skill não encontrada: ${skillName}`);
            }
            
            console.log(`🔄 Recarregando skill: ${skillName}`);
            
            // Marcar como descarregada
            skill.status = 'unloading';
            
            // Recarregar instância
            switch (skillName) {
                case 'swarm-service-manager':
                    skill.instance = new SwarmServiceManagerSkill();
                    break;
                case 'swarm-health-monitor':
                    skill.instance = new SwarmHealthMonitorSkill();
                    break;
                case 'neural-link-communicator':
                    skill.instance = new NeuralLinkCommunicatorSkill();
                    break;
                case 'swarm-orchestrator':
                    skill.instance = new SwarmOrchestratorSkill();
                    break;
                default:
                    throw new Error(`Recarga não implementada para: ${skillName}`);
            }
            
            skill.status = 'loaded';
            
            console.log(`✅ Skill ${skillName} recarregada com sucesso`);
            
            return {
                success: true,
                skill: skillName,
                status: 'reloaded'
            };
            
        } catch (error) {
            console.error(`❌ Falha ao recarregar skill ${skillName}:`, error.message);
            
            return {
                success: false,
                skill: skillName,
                error: error.message
            };
        }
    }

    /**
     * Formata tempo de uptime para leitura humana
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Executa diagnóstico completo do registry
     */
    async diagnose() {
        console.log('🔍 Executando diagnóstico completo...');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            registry_info: this.getRegistryInfo(),
            skills_status: await this.getSkillsStatus(),
            metrics: this.getMetrics(),
            issues: [],
            recommendations: []
        };
        
        // Verificar issues
        const skillsStatus = diagnosis.skills_status;
        
        if (skillsStatus.overall_health === 'critical') {
            diagnosis.issues.push({
                severity: 'critical',
                message: 'Múltiplas skills com erro crítico',
                recommendation: 'Reiniciar o registry ou verificar dependências'
            });
        }
        
        if (this.metrics.errors > this.metrics.skills_executed * 0.1) {
            diagnosis.issues.push({
                severity: 'warning',
                message: 'Alta taxa de erros nas execuções',
                recommendation: 'Investigar causas dos erros recentes'
            });
        }
        
        // Gerar recomendações
        if (diagnosis.issues.length === 0) {
            diagnosis.recommendations.push({
                type: 'maintenance',
                message: 'Sistema funcionando normalmente. Considere limpar logs antigos.'
            });
        }
        
        return diagnosis;
    }
}

// Exportar classes individuais e o registry
module.exports = {
    SwarmSkillsRegistry,
    SwarmServiceManagerSkill,
    SwarmHealthMonitorSkill,
    NeuralLinkCommunicatorSkill,
    SwarmOrchestratorSkill
};

// Para uso fácil
const registry = new SwarmSkillsRegistry();
module.exports.registry = registry;
module.exports.default = registry;
