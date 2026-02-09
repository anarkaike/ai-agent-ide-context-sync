@echo off
REM =============================================================================
REM AI Agent Swarm Service Manager - Windows Batch
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuração
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set LOG_DIR=%PROJECT_ROOT%\.ai-workspace\logs
set PID_DIR=%PROJECT_ROOT%\.ai-workspace\pids
set WEBMAP_PORT=3456
set MOTHERSHIP_IP=%MOTHERSHIP_IP%
if "%MOTHERSHIP_IP%"=="" set MOTHERSHIP_IP=100.104.189.106

REM Criar diretórios
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%PID_DIR%" mkdir "%PID_DIR%"

REM Logging
call :log "AI Agent Swarm Service Manager - Windows Batch"

REM Obter ação
set ACTION=%1
if "%ACTION%"=="" set ACTION=check

REM Main
if "%ACTION%"=="start" goto start_services
if "%ACTION%"=="stop" goto stop_services
if "%ACTION%"=="restart" goto restart_services
if "%ACTION%"=="status" goto show_status
if "%ACTION%"=="check" goto check_and_fix
goto show_usage

:start_services
call :log "Iniciando todos os serviços..."
call :start_webmap
call :start_swarmclient
goto show_status

:stop_services
call :log "Parando todos os serviços..."
call :stop_service "webmap"
call :stop_service "swarmclient"
goto end

:restart_services
call :log "Reiniciando todos os serviços..."
call :stop_service "swarmclient"
call :stop_service "webmap"
timeout /t 2 /nobreak >nul
call :start_webmap
call :start_swarmclient
goto show_status

:show_status
echo.
echo Status dos Servicos Swarm:
echo ==========================
call :check_process "webmap"
if !errorlevel! equ 0 (
    echo 🟢 WebMap: RODANDO
) else (
    echo 🔴 WebMap: PARADO
)
call :check_process "swarmclient"
if !errorlevel! equ 0 (
    echo 🟢 SwarmClient: RODANDO
) else (
    echo 🔴 SwarmClient: PARADO
)
echo.
echo 📡 Endpoint WebMap: http://localhost:%WEBMAP_PORT%
echo 🌐 Mothership IP: %MOTHERSHIP_IP%
goto end

:check_and_fix
call :log "Executando verificacao e auto-correcao..."
call :check_process "webmap"
if !errorlevel! neq 0 (
    call :log "WebMap detectado como parado, tentando reiniciar..."
    call :start_webmap
)
call :check_process "swarmclient"
if !errorlevel! neq 0 (
    call :log "SwarmClient detectado como parado, tentando reiniciar..."
    call :start_swarmclient
)
call :log "Verificacao concluida"
goto end

:start_webmap
call :check_process "webmap"
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in (%PID_DIR%\webmap.pid) do set PID=%%i
    call :log "WebMap ja esta rodando (PID: !PID!)"
    goto :eof
)
call :log "Iniciando WebMap na porta %WEBMAP_PORT%..."
cd /d "%PROJECT_ROOT%"
start /B node packages/cli/core/swarm/WebMap.js > "%LOG_DIR%\webmap.log" 2>&1
timeout /t 3 /nobreak >nul
REM Salvar PID (simplificado - na prática precisaria de método mais robusto)
echo %random% > "%PID_DIR%\webmap.pid"
call :log "WebMap iniciado"
goto :eof

:start_swarmclient
call :check_process "swarmclient"
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in (%PID_DIR%\swarmclient.pid) do set PID=%%i
    call :log "SwarmClient ja esta rodando (PID: !PID!)"
    goto :eof
)
call :log "Iniciando SwarmClient..."
cd /d "%PROJECT_ROOT%"
set MOTHERSHIP_IP=%MOTHERSHIP_IP%
set AGENT_ID=WIN_%COMPUTERNAME%_%random%
set AGENT_ROLE=WORKER
start /B node packages/cli/core/swarm/SwarmClient.js > "%LOG_DIR%\swarmclient.log" 2>&1
timeout /t 3 /nobreak >nul
echo %random% > "%PID_DIR%\swarmclient.pid"
call :log "SwarmClient iniciado"
goto :eof

:stop_service
set SERVICE_NAME=%1
if exist "%PID_DIR%\%SERVICE_NAME%.pid" (
    for /f "tokens=*" %%i in (%PID_DIR%\%SERVICE_NAME%.pid) do set PID=%%i
    call :log "Parando %SERVICE_NAME% (PID: !PID!)"
    taskkill /F /PID !PID! >nul 2>&1
    del "%PID_DIR%\%SERVICE_NAME%.pid" >nul 2>&1
    call :log "%SERVICE_NAME% parado"
) else (
    call :log "%SERVICE_NAME% nao esta rodando"
)
goto :eof

:check_process
set SERVICE_NAME=%1
if exist "%PID_DIR%\%SERVICE_NAME%.pid" (
    for /f "tokens=*" %%i in (%PID_DIR%\%SERVICE_NAME%.pid) do set PID=%%i
    tasklist /FI "PID eq !PID!" 2>nul | find "!PID!" >nul
    if !errorlevel! equ 0 (
        exit /b 0
    ) else (
        del "%PID_DIR%\%SERVICE_NAME%.pid" >nul 2>&1
        exit /b 1
    )
) else (
    exit /b 1
)

:log
set MESSAGE=%*
set TIMESTAMP=%date% %time%
echo [%TIMESTAMP%] %MESSAGE% >> "%LOG_DIR%\swarm-service.log"
echo [%TIMESTAMP%] %MESSAGE%
goto :eof

:show_usage
echo Uso: %~nx0 [start^|stop^|restart^|status^|check]
echo.
echo Comandos:
echo   start   - Inicia todos os servicos
echo   stop    - Para todos os servicos
echo   restart - Reinicia todos os servicos
echo   status  - Mostra status atual
echo   check   - Verifica e corrige problemas (default)

:end
endlocal
