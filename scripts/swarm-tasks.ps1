# =============================================================================
# AI Agent Swarm - Windows Task Scheduler Setup
# =============================================================================
# Configura tarefas agendadas no Windows para auto-recuperação

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("install", "uninstall", "list")]
    [string]$Action = "install"
)

# Configuração
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TaskName = "AIAgentSwarmHealthCheck"
$TaskNameStartup = "AIAgentSwarmStartup"
$ScriptPath = Join-Path $ScriptDir "swarm-service-manager.ps1"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Cyan
}

function Install-Tasks {
    Write-Log "🪟 Instalando tarefas agendadas do Windows..."
    
    # Verificar se está rodando como administrador
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Log "❌ Precisa executar como Administrador para instalar tarefas"
        return
    }
    
    # Remover tarefas existentes
    Unregister-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskNameStartup -ErrorAction SilentlyContinue
    
    # Criar tarefa de verificação de saúde (roda a cada 5 minutos)
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$ScriptPath`" check"
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "AI Agent Swarm Health Check - Verifica e corrige serviços a cada 5 minutos"
    
    # Criar tarefa de inicialização (roda no boot/login)
    $actionStartup = New-ScheduledTaskAction -Execute "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$ScriptPath`" start"
    $triggerStartup = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $settingsStartup = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -Delay 00:02:00
    
    Register-ScheduledTask -TaskName $TaskNameStartup -Action $actionStartup -Trigger $triggerStartup -Settings $settingsStartup -Principal $principal -Description "AI Agent Swarm Startup - Inicia serviços no login do usuário"
    
    Write-Log "✅ Tarefas agendadas instaladas:"
    Write-Log "  📊 Health Check: A cada 5 minutos"
    Write-Log "  🚀 Startup: No login do usuário (com 2 min de delay)"
    Write-Log ""
    Write-Log "🔧 Gerenciar com o Task Scheduler ou:"
    Write-Log "  Get-ScheduledTask | Where-Object {$_.TaskName -like '*AIAgentSwarm*'}"
}

function Uninstall-Tasks {
    Write-Log "🗑️ Removendo tarefas agendadas..."
    
    # Verificar se está rodando como administrador
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Log "❌ Precisa executar como Administrador para remover tarefas"
        return
    }
    
    Unregister-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskNameStartup -ErrorAction SilentlyContinue
    
    Write-Log "✅ Tarefas agendadas removidas"
}

function List-Tasks {
    Write-Log "📋 Listando tarefas agendadas..."
    
    $tasks = Get-ScheduledTask | Where-Object {$_.TaskName -like "*AIAgentSwarm*"}
    
    if ($tasks) {
        foreach ($task in $tasks) {
            Write-Log "📋 $($task.TaskName)"
            Write-Log "   Status: $($task.State)"
            Write-Log "   Descrição: $($task.Description)"
            if ($task.Triggers) {
                Write-Log "   Trigger: $($task.Triggers | ForEach-Object {$_.ToString()})"
            }
            Write-Log ""
        }
    } else {
        Write-Log "ℹ️ Nenhuma tarefa do AI Agent Swarm encontrada"
    }
}

# Main
switch ($Action) {
    "install" {
        Install-Tasks
    }
    "uninstall" {
        Uninstall-Tasks
    }
    "list" {
        List-Tasks
    }
    default {
        Write-Host "Uso: .\swarm-tasks.ps1 [install|uninstall|list]"
        Write-Host ""
        Write-Host "Comandos:"
        Write-Host "  install   - Instala tarefas agendadas (precisa Admin)"
        Write-Host "  uninstall - Remove tarefas agendadas (precisa Admin)"
        Write-Host "  list      - Lista tarefas instaladas"
    }
}
