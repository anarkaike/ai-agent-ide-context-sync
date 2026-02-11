#!/bin/bash

# Script para parar os agentes IA autônomos
# Uso: ./stop-agents.sh

echo "🛑 Parando Agentes IA Autônomos"
echo "=============================="

# Função para parar agente por PID
stop_agent() {
    local pid_file=$1
    local agent_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Parando $agent_name (PID: $pid)..."
            kill "$pid"
            
            # Aguardar o processo terminar
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Se ainda estiver rodando, forçar parada
            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️ Forçando parada do $agent_name..."
                kill -9 "$pid"
            fi
            
            echo "✅ $agent_name parado com sucesso"
        else
            echo "⚠️ $agent_name não está rodando (PID: $pid)"
        fi
        
        # Remover arquivo PID
        rm -f "$pid_file"
    else
        echo "⚠️ Arquivo PID não encontrado para $agent_name"
    fi
}

# Parar Agente de Documentação
stop_agent "logs/cosmic-doc-agent-1.pid" "Agente de Documentação Cósmica"

# Parar Agente de Monitoramento
stop_agent "logs/cosmic-monitor-agent-1.pid" "Agente de Monitoramento Cósmico"

# Verificar se há processos restantes
echo ""
echo "🔍 Verificando processos restantes..."

# Procurar por processos node relacionados aos agentes
remaining_processes=$(ps aux | grep "cosmic-documentation-agent\|cosmic-monitoring-agent" | grep -v grep)

if [ -n "$remaining_processes" ]; then
    echo "⚠️ Processos restantes encontrados:"
    echo "$remaining_processes"
    echo ""
    echo "🛑 Forçando parada dos processos restantes..."
    ps aux | grep "cosmic-documentation-agent\|cosmic-monitoring-agent" | grep -v grep | awk '{print $2}' | xargs -r kill -9
else
    echo "✅ Nenhum processo restante encontrado"
fi

echo ""
echo "🎉 Todos os agentes foram parados!"
echo ""
echo "📁 Logs mantidos em:"
echo "   📝 logs/cosmic-doc-agent-1.log"
echo "   🔍 logs/cosmic-monitor-agent-1.log"
echo ""
echo "🚀 Para reiniciar os agentes:"
echo "   ./start-agents.sh"
