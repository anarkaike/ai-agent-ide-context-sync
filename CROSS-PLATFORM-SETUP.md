# 🪟 AI Agent Swarm - Cross-Platform Setup Guide

## 🌐 Suporte Multiplataforma Completo

Este sistema agora suporta **todas** as plataformas principais com detecção automática:

### ✅ Plataformas Suportadas

| Plataforma | Método de Serviço | Script Principal | Auto-inicialização |
|------------|------------------|------------------|-------------------|
| **macOS** | launchd | `swarm-service-manager.sh` | ✅ Login do usuário |
| **Linux** | systemd | `swarm-service-manager.sh` | ✅ Boot do sistema |
| **Windows 10/11** | NSSM + Task Scheduler | `swarm-service-manager.ps1` | ✅ Boot/Login |
| **WSL** | Process Manager | `swarm-service-manager-wsl.sh` | ✅ Via Windows |
| **Git Bash** | Process Manager | `swarm-service-manager.bat` | ⚠️ Manual |
| **CMD/PowerShell** | Process Manager | `swarm-service-manager.bat/.ps1` | ⚠️ Manual |

---

## 🚀 Setup Universal (Recomendado)

### Método 1: Script Universal (Detecta automaticamente)

```bash
# Baixe e execute (funciona em TODAS as plataformas)
curl -fsSL https://raw.githubusercontent.com/.../swarm-universal.sh | bash

# Ou se já clonou:
./swarm-universal.sh quick
```

### Método 2: Específico por Plataforma

#### 🍎 macOS
```bash
# Usuário normal (não root)
./quick-setup.sh

# Ou manualmente:
./scripts/swarm-service-manager.sh install
```

#### 🐧 Linux
```bash
# Precisa de root para serviço do sistema
sudo ./quick-setup.sh

# Ou manualmente:
sudo ./scripts/swarm-service-manager.sh install
```

#### 🪟 Windows (PowerShell)
```powershell
# Executar como Administrador
.\scripts\swarm-service-manager.ps1 install

# Ou configurar tarefas agendadas:
.\scripts\swarm-tasks.ps1 install
```

#### 🐧 WSL
```bash
# No terminal WSL
./scripts/swarm-service-manager-wsl.sh install

# Ou via script universal:
./swarm-universal.sh install
```

#### 🔄 Git Bash (Windows)
```bash
# No Git Bash
./scripts/swarm-service-manager.bat start

# Configurar startup manual no Windows Task Scheduler
```

---

## 📋 Comandos Universais

O script universal `swarm-universal.sh` funciona em qualquer plataforma:

```bash
# Gerenciamento de serviços
./swarm-universal.sh start      # Iniciar serviços
./swarm-universal.sh stop       # Parar serviços
./swarm-universal.sh restart    # Reiniciar serviços
./swarm-universal.sh status     # Ver status
./swarm-universal.sh check      # Verificar e corrigir

# Instalação
./swarm-universal.sh install    # Instalar como serviço
./swarm-universal.sh uninstall  # Remover serviço

# Ajuda
./swarm-universal.sh help
```

---

## 🔧 Configurações Específicas

### Windows 10/11

#### Pré-requisitos:
1. **Node.js** - Instalar via https://nodejs.org/
2. **NSSM** (Non-Sucking Service Manager) - Opcional para serviço Windows
   - Download: https://nssm.cc/download
   - Extrair e adicionar ao PATH

#### Métodos de Instalação:

**Opção A: PowerShell + NSSM (Recomendado)**
```powershell
# Como Administrador
.\scripts\swarm-service-manager.ps1 install
```

**Opção B: Task Scheduler (Alternativa)**
```powershell
# Como Administrador
.\scripts\swarm-tasks.ps1 install
```

**Opção C: Manual (Inicia no login)**
```powershell
# Adicionar ao startup do Windows (Win+R > shell:startup)
# Atalho para: powershell.exe -ExecutionPolicy Bypass -File "C:\path\to\scripts\swarm-service-manager.ps1" start
```

### WSL (Windows Subsystem for Linux)

#### Detecção Automática:
- Detecta IP do Windows host automaticamente
- Configura Mothership para usar IP do Windows
- Trata conflitos de porta entre WSL e Windows

#### Configuração:
```bash
# Testar conectividade
./scripts/swarm-service-manager-wsl.sh test

# Instalar (inicia via Windows startup)
./scripts/swarm-service-manager-wsl.sh install
```

### Git Bash (Windows)

#### Limitações:
- Sem integração com serviços do Windows
- Precisa iniciar manualmente ou via Task Scheduler

#### Setup:
```bash
# No Git Bash
./scripts/swarm-service-manager.bat start

# Criar atalho no startup do Windows apontando para:
# C:\Program Files\Git\bin\bash.exe -c "cd /c/path/to/project && ./scripts/swarm-service-manager.bat start"
```

---

## 📊 Monitoramento e Logs

### Localização dos Logs:
```
.ai-workspace/logs/
├── swarm-service.log          # Log principal
├── webmap.log                 # WebMap específico
├── swarmclient.log            # SwarmClient específico
├── health-monitor.log         # Monitor de saúde
├── swarm-service-wsl.log      # WSL específico
└── systemd.log                # Linux systemd
└── launchd.log                # macOS launchd
└── service.log                # Windows NSSM
```

### Comandos de Monitoramento:
```bash
# Ver saúde completa
./scripts/health-monitor.sh check

# Monitoramento contínuo
./scripts/health-monitor.sh watch

# Ver último relatório
./scripts/health-monitor.sh report
```

---

## 🌐 Endpoints e Configuração

### Portas Padrão:
- **WebMap**: 3456
- **Mothership**: 100.104.189.106:3456

### Variáveis de Ambiente:
```bash
# Configurar IP do Mothership
export MOTHERSHIP_IP=100.104.189.106

# Configurar ID do Agent
export AGENT_ID=MY-CUSTOM-AGENT

# Configurar papel
export AGENT_ROLE=WORKER

# Configurar porta (se diferente de 3456)
export SWARM_PORT=3456
```

### Acesso WebMap:
- **Local**: http://localhost:3456
- **WSL via Windows**: http://localhost:3456
- **Rede**: http://[IP]:3456

---

## 🚨 Solução de Problemas

### Windows:
```powershell
# Verificar se NSSM está instalado
nssm version

# Verificar serviços
Get-Service | Where-Object {$_.Name -like "*AIAgent*"}

# Verificar tarefas agendadas
Get-ScheduledTask | Where-Object {$_.TaskName -like "*AIAgentSwarm*"}
```

### WSL:
```bash
# Verificar conectividade com Windows
./scripts/swarm-service-manager-wsl.sh test

# Verificar portas
ss -tuln | grep 3456

# Verificar processos
ps aux | grep -E "(WebMap|SwarmClient)"
```

### Linux:
```bash
# Verificar serviço systemd
systemctl status aiagent-swarm

# Ver logs
journalctl -u aiagent-swarm -f
```

### macOS:
```bash
# Verificar serviço launchd
launchctl list | grep aiagent

# Ver logs
tail -f ~/Library/Logs/com.aiagent.swarm-service.log
```

---

## 🔄 Atualização e Manutenção

### Atualizar scripts:
```bash
# Pull mais recente
git pull

# Reiniciar serviços
./swarm-universal.sh restart
```

### Limpar logs antigos:
```bash
# Manter apenas últimos 7 dias
find .ai-workspace/logs -name "*.log" -mtime +7 -delete
```

### Reset completo:
```bash
# Parar e limpar tudo
./swarm-universal.sh stop
rm -rf .ai-workspace/pids/
./swarm-universal.sh start
```

---

## 🎯 Recomendações por Plataforma

### **Produção Linux**: Usar systemd
- Mais robusto e integrado ao sistema
- Inicia no boot, independente de usuário
- Melhor para servidores

### **Desenvolvimento macOS**: Usar launchd
- Integrado ao usuário
- Fácil de gerenciar
- Não precisa de root

### **Windows Desktop**: Usar Task Scheduler
- Mais fácil que NSSM
- Integrado ao Windows
- Flexível para personalização

### **WSL**: Usar integração Windows
- Aproveita startup do Windows
- Melhor experiência de desenvolvimento
- Compatibilidade com host

### **Git Bash**: Manual ou Task Scheduler
- Para desenvolvedores que preferem Bash
- Requer configuração adicional
- Bom para ambientes de desenvolvimento

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** em `.ai-workspace/logs/`
2. **Execute diagnóstico**: `./scripts/health-monitor.sh check`
3. **Teste conectividade**: `./swarm-universal.sh status`
4. **Consulte a documentação específica** da sua plataforma

**🎉 Sistema preparado para qualquer ambiente!**
