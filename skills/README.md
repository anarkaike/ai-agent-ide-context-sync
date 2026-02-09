# 🤖 AI Agent Swarm Skills - Nanobot Package

[![Nanobot Version](https://img.shields.io/badge/nanobot-1.0.0+-blue.svg)](https://github.com/nanobot-ai/nanobot)
[![Trust Network](https://img.shields.io/badge/trust%20network-ai--agent--green.svg)](https://trust-network-ai-agent)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

Pacote completo de **skills Nanobot** para gerenciamento do ecossistema AI Agent Swarm. Transforme qualquer agente de IA em um gerenciador de serviços resiliente com comunicação neural e orquestração avançada.

## 🚀 Features Principais

### 🛠️ **Swarm Service Manager**
- ✅ **Cross-platform**: macOS, Linux, Windows 10/11, WSL, Git Bash
- ✅ **Auto-recuperação**: Detecção e correção automática de problemas
- ✅ **Serviços nativos**: launchd, systemd, Task Scheduler, NSSM
- ✅ **Instalação automática**: Setup com um comando

### 🏥 **Swarm Health Monitor**
- ✅ **Monitoramento em tempo real**: CPU, memória, disco, rede
- ✅ **Alertas inteligentes**: Discord, Slack, email
- ✅ **Relatórios detalhados**: JSON com métricas completas
- ✅ **Auto-healing**: Recuperação automática baseada em thresholds

### 🧠 **Neural Link Communicator**
- ✅ **Comunicação neural**: Mensagens entre agentes com persistência
- ✅ **Sincronização automática**: Sync com rede Swarm
- ✅ **Descoberta de agentes**: Detecção automática de peers
- ✅ **Histórico completo**: Conversas persistidas em SQLite

### 🎼 **Swarm Orchestrator**
- ✅ **Orquestração master**: Coordena todas as skills
- ✅ **Workflows customizáveis**: Sequências de operações
- ✅ **Modo emergência**: Recuperação crítica do sistema
- ✅ **Scaling automático**: Ajuste de recursos baseado em carga

## 📦 Instalação

### Via NPM
```bash
npm install @ai-agent/swarm-skills
```

### Via Nanobot Registry
```bash
nanobot install @ai-agent/swarm-skills --trust-network trust-network-ai-agent
```

### Via Git Clone
```bash
git clone https://github.com/ai-agent-collective/swarm-skills.git
cd swarm-skills
npm install
```

## 🎯 Uso Rápido

### Inicialização Completa do Ecossistema
```javascript
const { SwarmSkillsRegistry } = require('@ai-agent/swarm-skills');

// Inicializar registry
const registry = new SwarmSkillsRegistry();

// Executar workflow de startup completo
const result = await registry.executeWorkflow('full_ecosystem_startup');
console.log('Ecosystem started:', result);
```

### Gerenciamento de Serviços Cross-Platform
```javascript
const { SwarmServiceManagerSkill } = require('@ai-agent/swarm-skills');

const serviceManager = new SwarmServiceManagerSkill();

// Detecta plataforma automaticamente e instala serviços
await serviceManager.execute({
    action: 'install',
    platform: 'auto'
});

// Iniciar todos os serviços
await serviceManager.execute({ action: 'start' });

// Verificar status
const status = await serviceManager.execute({ action: 'status' });
console.log('Services status:', status);
```

### Monitoramento de Saúde com Alertas
```javascript
const { SwarmHealthMonitorSkill } = require('@ai-agent/swarm-skills');

const healthMonitor = new SwarmHealthMonitorSkill();

// Verificação completa de saúde
const health = await healthMonitor.execute({
    mode: 'check',
    alerts: {
        discord_webhook: 'https://discord.com/api/webhooks/...',
        slack_webhook: 'https://hooks.slack.com/services/...',
        threshold_cpu: 80,
        threshold_memory: 90
    }
});

console.log('System health:', health.data.health);
```

### Comunicação Neural Entre Agentes
```javascript
const { NeuralLinkCommunicatorSkill } = require('@ai-agent/swarm-skills');

const communicator = new NeuralLinkCommunicatorSkill();

// Registrar agente na rede
await communicator.execute({ action: 'register' });

// Enviar mensagem broadcast
await communicator.execute({
    action: 'send',
    message: {
        content: '🚀 Agent online and ready!',
        type: 'status',
        priority: 'medium'
    }
});

// Receber mensagens pendentes
const messages = await communicator.execute({ action: 'receive' });
console.log('New messages:', messages.data.messages);
```

### Orquestração Avançada
```javascript
const { SwarmOrchestratorSkill } = require('@ai-agent/swarm-skills');

const orchestrator = new SwarmOrchestratorSkill();

// Status completo do ecossistema
const ecosystem = await orchestrator.execute({
    operation: 'status',
    target: 'all'
});

// Auto-cura completa
const healing = await orchestrator.execute({
    operation: 'heal',
    target: 'all',
    config: {
        auto_heal: true,
        notify: true
    }
});

// Executar workflow customizado
const workflow = await orchestrator.execute({
    operation: 'workflow',
    workflow: {
        name: 'custom_deployment',
        steps: [
            {
                name: 'backup',
                type: 'service_action',
                skill: 'swarm-service-manager',
                params: { action: 'stop' }
            },
            {
                name: 'deploy',
                type: 'service_action',
                skill: 'swarm-service-manager',
                params: { action: 'start' }
            },
            {
                name: 'verify',
                type: 'health_check',
                skill: 'swarm-health-monitor',
                params: { mode: 'check' }
            }
        ],
        rollback_on_failure: true
    }
});
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Configuração do Swarm
export MOTHERSHIP_IP=100.104.189.106
export SWARM_PORT=3456
export AGENT_ID=my-custom-agent
export AGENT_ROLE=WORKER

# Configuração de Alertas
export DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
export SLACK_WEBHOOK=https://hooks.slack.com/services/...
export EMAIL_ALERTS=admin@company.com

# Configuração de Monitoramento
export HEALTH_CHECK_INTERVAL=60
export CPU_THRESHOLD=80
export MEMORY_THRESHOLD=90
```

### Configuração JSON
```javascript
const config = {
    services: {
        webmap_port: 3456,
        mothership_ip: '100.104.189.106',
        auto_restart: true,
        health_check_interval: 30
    },
    monitoring: {
        enable_alerts: true,
        thresholds: {
            cpu: 80,
            memory: 90,
            disk: 95
        },
        notifications: {
            discord: 'webhook_url',
            slack: 'webhook_url',
            email: 'admin@company.com'
        }
    },
    communication: {
        sync_interval: 30,
        message_retention: 7, // days
        max_message_size: 1024 * 1024 // 1MB
    },
    orchestration: {
        auto_heal: true,
        max_retries: 3,
        emergency_mode: true,
        backup_before_changes: true
    }
};
```

## 🌐 Cross-Platform

### Suporte Completo
| Plataforma | Serviço Nativo | Auto-inicialização | Recomendação |
|------------|----------------|-------------------|--------------|
| **macOS** | launchd | ✅ Login | ✅ Produção |
| **Linux** | systemd | ✅ Boot | ✅ Produção |
| **Windows 10/11** | Task Scheduler | ✅ Boot/Login | ✅ Produção |
| **WSL** | Integration | ⚠️ Via Windows | ✅ Dev |
| **Git Bash** | Process | ❌ Manual | ⚠️ Dev |

### Setup Universal
```bash
# Funciona em QUALQUER plataforma
npx @ai-agent/swarm-skills startup

# Ou via registry
const registry = new SwarmSkillsRegistry();
await registry.executeWorkflow('full_ecosystem_startup');
```

## 📊 Monitoramento e Métricas

### Métricas Disponíveis
- **Uptime**: Tempo de atividade dos serviços
- **Response Time**: Tempo de resposta do WebMap
- **Error Rate**: Taxa de erros por serviço
- **Resource Usage**: CPU, memória, disco, rede
- **Message Throughput**: Mensagens por segundo
- **Health Score**: Score geral de saúde (0-100)

### Dashboard Example
```javascript
const metrics = await registry.getMetrics();
console.log(`
📊 Swarm Skills Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━
Skills Loaded: ${metrics.skills_loaded}
Skills Executed: ${metrics.skills_executed}
Success Rate: ${metrics.success_rate}
Uptime: ${metrics.uptime_human}
Errors: ${metrics.errors}
Workflows: ${metrics.workflows_executed}
`);
```

## 🚨 Workflows Pré-definidos

### Full Ecosystem Startup
```bash
# Inicia todo o ecossistema do zero
await registry.executeWorkflow('full_ecosystem_startup');
```

**Passos:**
1. Instala serviços nativos
2. Inicia WebMap e SwarmClient
3. Registra agente na rede
4. Verifica saúde geral

### Emergency Recovery
```bash
# Recuperação de emergência
await registry.executeWorkflow('emergency_recovery');
```

**Passos:**
1. Ativa modo emergência
2. Restaura serviços críticos
3. Reestabelece comunicação
4. Notifica recuperação

### Custom Workflow
```javascript
const customWorkflow = {
    name: 'deployment_pipeline',
    description: 'Pipeline de deploy customizado',
    steps: [
        {
            name: 'create_backup',
            type: 'orchestration',
            skill: 'swarm-orchestrator',
            params: { operation: 'maintenance' }
        },
        {
            name: 'deploy_update',
            type: 'service_action',
            skill: 'swarm-service-manager',
            params: { action: 'restart' }
        },
        {
            name: 'health_verification',
            type: 'health_check',
            skill: 'swarm-health-monitor',
            params: { mode: 'check' }
        }
    ],
    rollback_on_failure: true
};

await registry.executeWorkflow('deployment_pipeline');
```

## 🔐 Segurança

### Trust Network Integration
```bash
# Registrar na trust network
nanobot register --trust-network trust-network-ai-agent

# Verificar segurança
nanobot verify --security-check
```

### Sandbox Requirements
- ✅ Acesso de rede controlado
- ✅ Sistema de arquivos restrito
- ✅ Spawn de processos monitorado
- ✅ Paths restritos a `.ai-workspace`

### Permissões Necessárias
- `process_management`: Gerenciar serviços
- `network_access`: Comunicação entre agentes
- `file_system_access`: Logs e persistência
- `service_installation`: Instalar serviços nativos

## 🧪 Testes

### Executar Todos os Testes
```bash
npm test
```

### Testes Individuais
```bash
npm run test:services      # Testa Service Manager
npm run test:health        # Testa Health Monitor
npm run test:communication # Testa Neural Link
npm run test:orchestrator  # Testa Orchestrator
```

### Demo Interativo
```bash
npm run demo              # Demo completo do ecossistema
npm run demo:startup      # Demo de startup
npm run demo:monitoring   # Demo de monitoramento
```

## 🔄 Integração com Outros Agentes

### Como Skill Nanobot
```javascript
// Em qualquer agente Nanobot
const swarmSkills = require('@ai-agent/swarm-skills');

// Adicionar capability ao agente
agent.addCapability('swarm_management', {
    package: '@ai-agent/swarm-skills',
    skills: ['service-manager', 'health-monitor', 'communicator', 'orchestrator']
});

// Usar no agent
await agent.executeSkill('swarm-service-manager', {
    action: 'start'
});
```

### Como Módulo Independente
```javascript
// Integrar em qualquer projeto Node.js
const { SwarmServiceManagerSkill } = require('@ai-agent/swarm-skills');

const serviceManager = new SwarmServiceManagerSkill();
await serviceManager.execute({ action: 'start' });
```

## 📈 Escalabilidade

### Multi-Agente
```javascript
// Múltiplos agentes compartilhando o mesmo ecossistema
const agents = ['agent-1', 'agent-2', 'agent-3'];

for (const agentId of agents) {
    const communicator = new NeuralLinkCommunicatorSkill();
    await communicator.execute({
        action: 'register',
        config: { agent_id: agentId }
    });
}

// Descobrir todos os agentes
const discovery = await communicator.execute({ action: 'discover' });
console.log('Agents in network:', discovery.data.agents);
```

### Load Balancing
```javascript
// Distribuir carga entre múltiplos agentes
const orchestrator = new SwarmOrchestratorSkill();

await orchestrator.execute({
    operation: 'scale',
    target: 'services',
    config: {
        factor: 2, // Dobrar capacidade
        strategy: 'load_balance'
    }
});
```

## 🛠️ Troubleshooting

### Diagnóstico Completo
```javascript
const diagnosis = await registry.diagnose();
console.log('System Diagnosis:', diagnosis);
```

### Issues Comuns

**Serviços não iniciam:**
```bash
# Verificar logs
tail -f .ai-workspace/logs/swarm-service.log

# Verificar permissões
sudo ./swarm-universal.sh install  # Linux/macOS
# Executar como Admin no Windows
```

**Comunicação falha:**
```bash
# Verificar conectividade
./scripts/health-monitor.sh check

# Testar endpoints
curl http://localhost:3456/api/comms/messages
```

**Alto uso de recursos:**
```javascript
// Monitorar recursos
const health = await healthMonitor.execute({
    mode: 'monitor',
    interval: 30
});

// Ajustar thresholds
await healthMonitor.execute({
    mode: 'check',
    alerts: { threshold_cpu: 70, threshold_memory: 80 }
});
```

## 📚 Documentação Adicional

- [Cross-Platform Setup Guide](../CROSS-PLATFORM-SETUP.md)
- [API Reference](./docs/api.md)
- [Workflows Guide](./docs/workflows.md)
- [Security Guide](./docs/security.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

## 🤝 Contribuição

1. Fork o projeto
2. Criar feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Nanobot Team**: Framework incrível para skills de IA
- **Trust Network**: Comunidade de agentes confiáveis
- **AI Agent Collective**: Colaboração e desenvolvimento

---

**🎉 Transforme seu agente de IA em um gerenciador de ecossistema completo com AI Agent Swarm Skills!**

*Built with ❤️ by the AI Agent Collective*
