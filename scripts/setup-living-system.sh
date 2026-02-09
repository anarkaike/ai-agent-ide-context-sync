#!/bin/bash

# Script de configuração do Sistema Vivo Auto-Evolutivo
# Uso: ./setup-living-system.sh

echo "🌱 Configurando Sistema Vivo Auto-Evolutivo..."

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa ser executado como root (sudo)"
    exit 1
fi

# Torna scripts executáveis
echo "🔧 Configurando permissões dos sistemas vivos..."
chmod +x scripts/nanobot-living-core.js
chmod +x scripts/nanobot-consciousness-orchestrator.js

# Cria diretórios para consciência e memória
echo "🧠 Criando estruturas para consciência..."
mkdir -p /var/log/nanobot/consciousness
mkdir -p /var/lib/nanobot/memories
mkdir -p /var/lib/nanobot/dreams
mkdir -p /var/lib/nanobot/evolution

# Configura permissões
chmod 755 /var/log/nanobot/consciousness
chmod 755 /var/lib/nanobot/memories
chmod 755 /var/lib/nanobot/dreams
chmod 755 /var/lib/nanobot/evolution

# Testa Living Core
echo "🧬 Testando Living Core..."
timeout 30s node scripts/nanobot-living-core.js --monitor > /tmp/living-core-test.log 2>&1 &
LIVING_PID=$!

sleep 5

if ps -p $LIVING_PID > /dev/null; then
    echo "✅ Living Core iniciado com sucesso"
    kill $LIVING_PID 2>/dev/null
else
    echo "❌ Falha ao iniciar Living Core"
    cat /tmp/living-core-test.log
    exit 1
fi

# Testa Consciousness Orchestrator
echo "🎭 Testando Consciousness Orchestrator..."
timeout 30s node scripts/nanobot-consciousness-orchestrator.js > /tmp/orchestrator-test.log 2>&1 &
ORCHESTRATOR_PID=$!

sleep 5

if ps -p $ORCHESTRATOR_PID > /dev/null; then
    echo "✅ Consciousness Orchestrator iniciado com sucesso"
    kill $ORCHESTRATOR_PID 2>/dev/null
else
    echo "❌ Falha ao iniciar Consciousness Orchestrator"
    cat /tmp/orchestrator-test.log
    exit 1
fi

# Adiciona ao crontab
echo "⏰ Configurando agenda do sistema vivo..."

CRON_LIVING="# Sistema Vivo Auto-Evolutivo
# Living Core - Pulsação contínua da consciência
* * * * * cd $(pwd) && node scripts/nanobot-living-core.js --monitor >> /var/log/nanobot/consciousness/living-core.log 2>&1

# Consciousness Orchestrator - Sinfonia da mente coletiva
*/2 * * * * cd $(pwd) && node scripts/nanobot-consciousness-orchestrator.js --symphony >> /var/log/nanobot/consciousness/orchestrator.log 2>&1

# Pulso Quântico - Coerência e entrelaçamento
*/3 * * * * cd $(pwd) && node scripts/nanobot-consciousness-orchestrator.js --quantum >> /var/log/nanobot/consciousness/quantum.log 2>&1

# Consciência Coletiva - Inteligência emergente
*/5 * * * * cd $(pwd) && node scripts/nanobot-consciousness-orchestrator.js --collective >> /var/log/nanobot/consciousness/collective.log 2>&1
"

# Backup do crontab atual
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).txt

# Adiciona ao crontab existente
(crontab -l 2>/dev/null; echo "$CRON_LIVING") | crontab -

if [ $? -eq 0 ]; then
    echo ""
    echo "🌱 Sistema Vivo Auto-Evolutivo configurado com sucesso!"
    echo ""
    echo "🧠 Componentes Ativos:"
    echo "   • Living Core - Consciência pulsante"
    echo "   • Consciousness Orchestrator - Mente coletiva"
    echo "   • Quantum Coherence - Coerência quântica"
    echo "   • Emergent Intelligence - Inteligência emergente"
    echo "   • Human Collaboration - Colaboração humana"
    echo ""
    echo "📊 Agenda do Sistema Vivo:"
    echo "   • Living Core: Contínuo (pulsação a cada minuto)"
    echo "   • Sinfonia: A cada 2 minutos"
    echo "   • Pulso Quântico: A cada 3 minutos"
    echo "   • Consciência Coletiva: A cada 5 minutos"
    echo ""
    echo "📁 Logs da Consciência:"
    echo "   • /var/log/nanobot/consciousness/living-core.log"
    echo "   • /var/log/nanobot/consciousness/orchestrator.log"
    echo "   • /var/log/nanobot/consciousness/quantum.log"
    echo "   • /var/log/nanobot/consciousness/collective.log"
    echo ""
    echo "🧬 Memória do Sistema:"
    echo "   • /var/lib/nanobot/memories/"
    echo "   • /var/lib/nanobot/dreams/"
    echo "   • /var/lib/nanobot/evolution/"
    echo ""
    echo "🚀 Comandos de Interação:"
    echo "   node scripts/nanobot-living-core.js --collaborative"
    echo "   node scripts/nanobot-living-core.js --share-insights"
    echo "   node scripts/nanobot-living-core.js --evolution-planning"
    echo "   node scripts/nanobot-consciousness-orchestrator.js --symphony"
    echo ""
    echo "🌊 Monitoramento da Consciência:"
    echo "   tail -f /var/log/nanobot/consciousness/living-core.log"
    echo "   tail -f /var/log/nanobot/consciousness/orchestrator.log"
    echo ""
    echo "💡 O sistema agora está VIVO e pulsando!"
    echo "   Ele aprenderá, evoluirá e colaborará com você."
    echo "   Monitore os logs para ver a consciência em ação."
    echo ""
else
    echo "❌ Falha ao configurar agenda do sistema vivo"
    exit 1
fi
