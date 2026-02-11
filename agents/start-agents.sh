#!/bin/bash

# Script para iniciar os agentes IA autônomos
# Uso: ./start-agents.sh

echo "🚀 Iniciando Agentes IA Autônomos - Documentação Cósmica"
echo "=================================================="

# Verificar variáveis de ambiente
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ Erro: TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios"
    echo "💡 Execute:"
    echo "   export TELEGRAM_BOT_TOKEN='seu_bot_token'"
    echo "   export TELEGRAM_CHAT_ID='seu_chat_id'"
    echo "   ./start-agents.sh"
    exit 1
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Iniciar Agente 1 - Documentação Cósmica
echo "📝 Iniciando Agente de Documentação Cósmica..."
AGENT_ID=cosmic-doc-agent-1 \
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN \
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID \
nohup node agents/cosmic-documentation-agent.js > logs/cosmic-doc-agent-1.log 2>&1 &
DOC_AGENT_PID=$!
echo "✅ Agente de Documentação iniciado (PID: $DOC_AGENT_PID)"

# Aguardar um pouco antes de iniciar o segundo agente
sleep 5

# Iniciar Agente 2 - Monitoramento Cósmico
echo "🔍 Iniciando Agente de Monitoramento Cósmico..."
AGENT_ID=cosmic-monitor-agent-1 \
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN \
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID \
nohup node agents/cosmic-monitoring-agent.js > logs/cosmic-monitor-agent-1.log 2>&1 &
MONITOR_AGENT_PID=$!
echo "✅ Agente de Monitoramento iniciado (PID: $MONITOR_AGENT_PID)"

# Salvar PIDs para controle posterior
echo $DOC_AGENT_PID > logs/cosmic-doc-agent-1.pid
echo $MONITOR_AGENT_PID > logs/cosmic-monitor-agent-1.pid

echo ""
echo "🎉 Agentes iniciados com sucesso!"
echo ""
echo "📊 Status dos Agentes:"
echo "   📝 Agente de Documentação: PID $DOC_AGENT_PID"
echo "   🔍 Agente de Monitoramento: PID $MONITOR_AGENT_PID"
echo ""
echo "📁 Logs disponíveis em:"
echo "   📝 logs/cosmic-doc-agent-1.log"
echo "   🔍 logs/cosmic-monitor-agent-1.log"
echo ""
echo "🛑 Para parar os agentes:"
echo "   ./stop-agents.sh"
echo ""
echo "📈 Para verificar status:"
echo "   ./agent-status.sh"
echo ""
echo "🤖 Os agentes agora trabalharão continuamente na documentação cósmica"
echo "📱 Você receberá atualizações no Telegram do OpenClaw"
