# =============================================================================
# AI Agent Swarm Service Manager - Windows PowerShell
# =============================================================================
# Gerencia SwarmClient e WebMap como serviços no Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "check", "install", "uninstall")]
    [string]$Action = "check"
)

# Configuração
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $ProjectRoot ".ai-workspace\logs"
$PidDir = Join-Path $ProjectRoot ".ai-workspace\pids"
$ConfigFile = Join-Path $ProjectRoot ".ai-workspace\swarm-config.env"

# Portas e IPs
$WebMapPort = 3456
$MothershipIP = $env:MOTHERSHIP_IP ?? "100.104.189.106"
$AgentID = $env:AGENT_ID ?? "$($env:COMPUTERNAME)_$(Get-Date -Format 'yyyyMMddHHmmss')"

# Criar diretórios
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $PidDir | Out-Null

# Logging
function Log-Message {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor Cyan
    Add-Content -Path (Join-Path $LogDir "swarm-service.log") -Value $logMessage
}

# Verificar se processo está rodando
function Test-ProcessRunning {
    param([string]$ServiceName)
    $pidFile = Join-Path $PidDir "$ServiceName.pid"
    
    if (Test-Path $pidFile) {
        try {
            $pid = Get-Content $pidFile
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                return $true
            } else {
                Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
                return $false
            }
        } catch {
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
            return $false
        }
    }
    return $false
}

# Iniciar WebMap
function Start-WebMap {
    if (Test-ProcessRunning "webmap") {
        $pid = Get-Content (Join-Path $PidDir "webmap.pid")
        Log-Message "✅ WebMap já está rodando (PID: $pid)"
        return $true
    }
    
    Log-Message "🚀 Iniciando WebMap na porta $WebMapPort..."
    Set-Location $ProjectRoot
    
    # Verificar se porta está em uso
    $portInUse = Get-NetTCPConnection -LocalPort $WebMapPort -ErrorAction SilentlyContinue
    if ($portInUse) {
        Log-Message "⚠️ Porta $WebMapPort já está em uso, tentando liberar..."
        Get-Process | Where-Object {$_.ProcessName -eq "node"} | Where-Object {$_.MainWindowTitle -like "*WebMap*"} | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Iniciar WebMap
    $process = Start-Process -FilePath "node" -ArgumentList "packages/cli/core/swarm/WebMap.js" -PassThru -WindowStyle Hidden
    $pid = $process.Id
    Set-Content -Path (Join-Path $PidDir "webmap.pid") -Value $pid
    
    # Verificar se iniciou corretamente
    Start-Sleep -Seconds 3
    if (Test-ProcessRunning "webmap") {
        Log-Message "✅ WebMap iniciado com sucesso (PID: $pid)"
        return $true
    } else {
        Log-Message "❌ Falha ao iniciar WebMap"
        return $false
    }
}

# Iniciar SwarmClient
function Start-SwarmClient {
    if (Test-ProcessRunning "swarmclient") {
        $pid = Get-Content (Join-Path $PidDir "swarmclient.pid")
        Log-Message "✅ SwarmClient já está rodando (PID: $pid)"
        return $true
    }
    
    Log-Message "🚀 Iniciando SwarmClient..."
    Set-Location $ProjectRoot
    
    # Configurar variáveis de ambiente
    $env:MOTHERSHIP_IP = $MothershipIP
    $env:AGENT_ID = $AgentID
    $env:AGENT_ROLE = "WORKER"
    
    # Iniciar SwarmClient
    $process = Start-Process -FilePath "node" -ArgumentList "packages/cli/core/swarm/SwarmClient.js" -PassThru -WindowStyle Hidden
    $pid = $process.Id
    Set-Content -Path (Join-Path $PidDir "swarmclient.pid") -Value $pid
    
    # Verificar se iniciou corretamente
    Start-Sleep -Seconds 3
    if (Test-ProcessRunning "swarmclient") {
        Log-Message "✅ SwarmClient iniciado com sucesso (PID: $pid)"
        return $true
    } else {
        Log-Message "❌ Falha ao iniciar SwarmClient"
        return $false
    }
}

# Parar serviços
function Stop-Service {
    param([string]$ServiceName)
    $pidFile = Join-Path $PidDir "$ServiceName.pid"
    
    if (Test-ProcessRunning $ServiceName) {
        $pid = Get-Content $pidFile
        Log-Message "🛑 Parando $ServiceName (PID: $pid)..."
        
        try {
            $process = Get-Process -Id $pid -ErrorAction Stop
            $process.Kill()
            Start-Sleep -Seconds 1
        } catch {
            # Processo já não existe
        }
        
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        Log-Message "✅ $ServiceName parado"
    } else {
        Log-Message "ℹ️ $ServiceName não está rodando"
    }
}

# Status dos serviços
function Show-Status {
    Log-Message "📊 Status dos Serviços Swarm:"
    Write-Host ""
    
    if (Test-ProcessRunning "webmap") {
        $pid = Get-Content (Join-Path $PidDir "webmap.pid")
        Write-Host "🟢 WebMap: RODANDO (PID: $pid)" -ForegroundColor Green
    } else {
        Write-Host "🔴 WebMap: PARADO" -ForegroundColor Red
    }
    
    if (Test-ProcessRunning "swarmclient") {
        $pid = Get-Content (Join-Path $PidDir "swarmclient.pid")
        Write-Host "🟢 SwarmClient: RODANDO (PID: $pid)" -ForegroundColor Green
    } else {
        Write-Host "🔴 SwarmClient: PARADO" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📡 Endpoint WebMap: http://localhost:$WebMapPort"
    Write-Host "🌐 Mothership IP: $MothershipIP"
    Write-Host "🤖 Agent ID: $AgentID"
}

# Verificação e auto-correção
function Test-AndFix {
    Log-Message "🔍 Executando verificação e auto-correção..."
    
    $needsRestart = $false
    
    # Verificar WebMap
    if (-not (Test-ProcessRunning "webmap")) {
        Log-Message "⚠️ WebMap detectado como parado, tentando reiniciar..."
        if (-not (Start-WebMap)) { $needsRestart = $true }
    }
    
    # Verificar SwarmClient
    if (-not (Test-ProcessRunning "swarmclient")) {
        Log-Message "⚠️ SwarmClient detectado como parado, tentando reiniciar..."
        if (-not (Start-SwarmClient)) { $needsRestart = $true }
    }
    
    # Verificar se WebMap está respondendo
    if (Test-ProcessRunning "webmap") {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$WebMapPort/api/comms/messages" -TimeoutSec 5 -ErrorAction Stop
        } catch {
            Log-Message "⚠️ WebMap não está respondendo, reiniciando..."
            Stop-Service "webmap"
            Start-Sleep -Seconds 2
            if (-not (Start-WebMap)) { $needsRestart = $true }
        }
    }
    
    if ($needsRestart) {
        Log-Message "🔄 Serviços reiniciados durante verificação"
        return $false
    } else {
        Log-Message "✅ Todos os serviços funcionando normalmente"
        return $true
    }
}

# Instalar como serviço Windows
function Install-WindowsService {
    Log-Message "🪟 Instalando serviço Windows..."
    
    # Verificar se está rodando como administrador
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Log-Message "❌ Precisa executar como Administrador para instalar serviço"
        return
    }
    
    # Criar arquivo de serviço NSSM (Non-Sucking Service Manager)
    $nssmPath = "nssm.exe"
    if (-not (Get-Command $nssmPath -ErrorAction SilentlyContinue)) {
        Log-Message "❌ NSSM não encontrado. Instale NSSM primeiro:"
        Log-Message "📥 Download: https://nssm.cc/download"
        return
    }
    
    $serviceName = "AIAgentSwarm"
    $serviceScript = Join-Path $ScriptDir "swarm-service-manager.ps1"
    
    # Remover serviço existente
    & $nssmPath remove $serviceName confirm | Out-Null
    
    # Instalar novo serviço
    & $nssmPath install $serviceName "powershell.exe" "-ExecutionPolicy Bypass -File `"$serviceScript`" check" | Out-Null
    & $nssmPath set $serviceName DisplayName "AI Agent Swarm Service" | Out-Null
    & $nssmPath set $serviceName Description "Gerencia SwarmClient e WebMap para AI Agent" | Out-Null
    & $nssmPath set $serviceName Start SERVICE_AUTO_START | Out-Null
    & $nssmPath set $serviceName AppStdout (Join-Path $LogDir "service.log") | Out-Null
    & $nssmPath set $serviceName AppStderr (Join-Path $LogDir "service-error.log") | Out-Null
    
    # Iniciar serviço
    & $nssmPath start $serviceName | Out-Null
    
    Log-Message "✅ Serviço Windows instalado e iniciado!"
    Log-Message "🔧 Gerenciar com: nssm [start|stop|restart] $serviceName"
}

# Desinstalar serviço Windows
function Uninstall-WindowsService {
    Log-Message "🗑️ Desinstalando serviço Windows..."
    
    $nssmPath = "nssm.exe"
    if (Get-Command $nssmPath -ErrorAction SilentlyContinue) {
        & $nssmPath stop "AIAgentSwarm" | Out-Null
        & $nssmPath remove "AIAgentSwarm" confirm | Out-Null
        Log-Message "✅ Serviço Windows desinstalado"
    } else {
        Log-Message "❌ NSSM não encontrado"
    }
}

# Main
switch ($Action) {
    "start" {
        Log-Message "🚀 Iniciando todos os serviços..."
        Start-WebMap | Out-Null
        Start-SwarmClient | Out-Null
        Show-Status
    }
    "stop" {
        Log-Message "🛑 Parando todos os serviços..."
        Stop-Service "swarmclient"
        Stop-Service "webmap"
    }
    "restart" {
        Log-Message "🔄 Reiniciando todos os serviços..."
        Stop-Service "swarmclient"
        Stop-Service "webmap"
        Start-Sleep -Seconds 2
        Start-WebMap | Out-Null
        Start-SwarmClient | Out-Null
        Show-Status
    }
    "status" {
        Show-Status
    }
    "check" {
        Test-AndFix
    }
    "install" {
        Install-WindowsService
    }
    "uninstall" {
        Uninstall-WindowsService
    }
    default {
        Write-Host "Uso: .\swarm-service-manager.ps1 [start|stop|restart|status|check|install|uninstall]"
        Write-Host ""
        Write-Host "Comandos:"
        Write-Host "  start     - Inicia todos os serviços"
        Write-Host "  stop      - Para todos os serviços"
        Write-Host "  restart   - Reinicia todos os serviços"
        Write-Host "  status    - Mostra status atual"
        Write-Host "  check     - Verifica e corrige problemas (default)"
        Write-Host "  install   - Instala como serviço Windows (precisa de NSSM e Admin)"
        Write-Host "  uninstall - Remove serviço Windows"
    }
}
