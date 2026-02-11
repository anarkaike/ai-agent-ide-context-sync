#!/bin/bash

# Script para verificar status dos agentes IA autônomos
# Uso: ./agent-status.sh

echo "📊 Status dos Agentes IA Autônomos"
echo "================================="
echo "📅 Verificação: $(date '+%d/%m/%Y %H:%M:%S')"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar status do agente
check_agent_status() {
    local pid_file=$1
    local agent_name=$2
    local log_file=$3
    
    echo -e "${BLUE}🤖 $agent_name${NC}"
    echo "----------------------------------------"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "📊 Status: ${GREEN}✅ RODANDO${NC}"
            echo "🆔 PID: $pid"
            
            # Informações do processo
            local proc_info=$(ps -p "$pid" -o pid,ppid,etime,pcpu,pmem,cmd --no-headers 2>/dev/null)
            if [ -n "$proc_info" ]; then
                echo "⏱️  Tempo ativo: $(echo $proc_info | awk '{print $3}')"
                echo "💾 CPU: $(echo $proc_info | awk '{print $4}')%"
                echo "🧹 Memória: $(echo $proc_info | awk '{print $5}')%"
            fi
            
            # Verificar log file
            if [ -f "$log_file" ]; then
                local log_size=$(du -h "$log_file" | cut -f1)
                local last_line=$(tail -1 "$log_file" 2>/dev/null)
                echo "📁 Log: $log_size"
                echo "📝 Última atividade: ${last_line:0:80}..."
            else
                echo -e "📁 Log: ${YELLOW}⚠️ Arquivo não encontrado${NC}"
            fi
        else
            echo -e "📊 Status: ${RED}❌ PARADO${NC}"
            echo "🆔 PID: $pid (inválido)"
            echo "🔍 Processo não encontrado"
        fi
    else
        echo -e "📊 Status: ${YELLOW}⚠️ NÃO INICIADO${NC}"
        echo "🆔 PID: Arquivo não encontrado"
    fi
    
    echo ""
}

# Verificar Agente de Documentação
check_agent_status "logs/cosmic-doc-agent-1.pid" "Agente de Documentação Cósmica" "logs/cosmic-doc-agent-1.log"

# Verificar Agente de Monitoramento
check_agent_status "logs/cosmic-monitor-agent-1.pid" "Agente de Monitoramento Cósmico" "logs/cosmic-monitor-agent-1.log"

# Resumo geral
echo -e "${BLUE}📈 Resumo Geral${NC}"
echo "========================================"

# Contar documentos
if [ -d "/root/projects/dev/ai-agent-ide-context-sync/docs/plano-estrategico" ]; then
    local doc_count=$(ls -1 /root/projects/dev/ai-agent-ide-context-sync/docs/plano-estrategico/*.md 2>/dev/null | wc -l)
    echo "📄 Documentos cósmicos: $doc_count"
else
    echo "📄 Documentos cósmicos: ❌ Diretório não encontrado"
fi

# Verificar uso de recursos
echo ""
echo -e "${BLUE}💾 Uso de Recursos do Sistema${NC}"
echo "----------------------------------------"
echo "🧹 Memória total: $(free -h | awk '/^Mem:/ {print $2}')"
echo "💾 Memória usada: $(free -h | awk '/^Mem:/ {print $3}')"
echo "🔥 CPU Load: $(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')"
echo "💽 Disco usado: $(df -h . | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"

# Verificar conexão com Telegram
echo ""
echo -e "${BLUE}📱 Conexão Telegram${NC}"
echo "----------------------------------------"
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo -e "🔗 Configuração: ${GREEN}✅ Configurado${NC}"
    echo "🤖 Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
    echo "💬 Chat ID: $TELEGRAM_CHAT_ID"
else
    echo -e "🔗 Configuração: ${RED}❌ Não configurado${NC}"
    echo "💡 Configure as variáveis de ambiente:"
    echo "   export TELEGRAM_BOT_TOKEN='seu_bot_token'"
    echo "   export TELEGRAM_CHAT_ID='seu_chat_id'"
fi

echo ""
echo -e "${BLUE}🔧 Ações Rápidas${NC}"
echo "----------------------------------------"
echo "🚀 Iniciar agentes: ./start-agents.sh"
echo "🛑 Parar agentes: ./stop-agents.sh"
echo "📊 Ver logs: tail -f logs/cosmic-*.log"
echo "🔄 Reiniciar: ./stop-agents.sh && ./start-agents.sh"

echo ""
echo "✅ Verificação concluída em $(date '+%H:%M:%S')"
