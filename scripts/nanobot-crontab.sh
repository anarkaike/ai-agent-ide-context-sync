#!/bin/bash

# Script de configuração do Crontab para Nanobot Automation
# Uso: ./nanobot-crontab.sh

echo "🕐 Configurando agenda de automação Nanobot..."

# Diretório do projeto
PROJECT_DIR="/root/projects/dev/ai-agent-ide-context-sync"
LOG_DIR="/var/log/nanobot"

# Cria diretório de logs
sudo mkdir -p $LOG_DIR
sudo chmod 755 $LOG_DIR

# Crontab completo para Nanobot
CRONTAB_CONTENT="# Nanobot Automation Schedule
# Generated on $(date)

# Limpeza rápida a cada 30 minutos
*/30 * * * * cd $PROJECT_DIR && node scripts/nanobot-cleanup-automator.js --quick >> $LOG_DIR/cleanup.log 2>&1

# Monitoramento de segurança a cada 2 horas
0 */2 * * * cd $PROJECT_DIR && node scripts/nanobot-security-monitor.js >> $LOG_DIR/security.log 2>&1

# Otimização de performance a cada 15 minutos
*/15 * * * * cd $PROJECT_DIR && node scripts/nanobot-performance-optimizer.js >> $LOG_DIR/performance.log 2>&1

# Backup diário as 2 AM
0 2 * * * cd $PROJECT_DIR && node scripts/nanobot-backup-manager-s3.js daily >> $LOG_DIR/backup.log 2>&1

# Manutenção de processos a cada 6 horas (dry-run)
0 */6 * * * cd $PROJECT_DIR && node scripts/nanobot-process-maintenance.js --dry-run >> $LOG_DIR/processes.log 2>&1

# Limpeza diária completa as 3 AM
0 3 * * * cd $PROJECT_DIR && node scripts/nanobot-cleanup-automator.js --daily >> $LOG_DIR/cleanup-daily.log 2>&1

# Backup semanal aos domingos as 4 AM
0 4 * * 0 cd $PROJECT_DIR && node scripts/nanobot-backup-manager-s3.js weekly >> $LOG_DIR/backup-weekly.log 2>&1

# Limpeza semanal profunda aos domingos as 5 AM
0 5 * * 0 cd $PROJECT_DIR && node scripts/nanobot-cleanup-automator.js --weekly >> $LOG_DIR/cleanup-weekly.log 2>&1

# Backup mensal no dia 1 as 6 AM
0 6 1 * * cd $PROJECT_DIR && node scripts/nanobot-backup-manager-s3.js monthly >> $LOG_DIR/backup-monthly.log 2>&1

# Limpeza mensal completa no dia 1 as 7 AM
0 7 1 * * cd $PROJECT_DIR && node scripts/nanobot-cleanup-automator.js --monthly >> $LOG_DIR/cleanup-monthly.log 2>&1

# Relatório diário de sistema as 8 AM
0 8 * * * cd $PROJECT_DIR && node scripts/nanobot-coordinator.js --status >> $LOG_DIR/daily-report.log 2>&1

# Manutenção semanal completa aos sábados as 3 AM
0 3 * * 6 cd $PROJECT_DIR && node scripts/nanobot-coordinator.js --run-all >> $LOG_DIR/weekly-maintenance.log 2>&1

# Scripts existentes (mantidos)
0 2 * * * /root/backup-scripts/backup-dev.sh
0 2 * * * /root/backup-scripts/backup-hmg.sh
0 2 * * * /root/backup-scripts/backup-prod.sh
0 */3 * * * /root/projects/prod/nanobot-debounce-telegram-enhanced.sh
*/5 * * * * /docs/skills-interface/openclaw_cron.sh >> /var/log/openclaw-cron.log 2>&1
"

# Backup do crontab atual
echo "💾 Fazendo backup do crontab atual..."
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).txt

# Aplica novo crontab
echo "📝 Aplicando nova configuração..."
echo "$CRONTAB_CONTENT" | crontab -

# Verifica se foi aplicado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Agenda de automação Nanobot configurada com sucesso!"
    echo ""
    echo "📅 Resumo da agenda:"
    echo "   • Limpeza rápida: A cada 30 minutos"
    echo "   • Security monitor: A cada 2 horas"
    echo "   • Performance optimizer: A cada 15 minutos"
    echo "   • Backup diário: 2 AM"
    echo "   • Limpeza diária: 3 AM"
    echo "   • Backup semanal: Domingo 4 AM"
    echo "   • Limpeza semanal: Domingo 5 AM"
    echo "   • Backup mensal: Dia 1, 6 AM"
    echo "   • Limpeza mensal: Dia 1, 7 AM"
    echo "   • Relatório diário: 8 AM"
    echo "   • Manutenção completa: Sábado 3 AM"
    echo ""
    echo "📁 Logs em: $LOG_DIR/"
    echo "   • cleanup.log"
    echo "   • security.log"
    echo "   • performance.log"
    echo "   • backup.log"
    echo "   • processes.log"
    echo "   • daily-report.log"
    echo "   • weekly-maintenance.log"
    echo ""
    echo "🔍 Para verificar: crontab -l"
    echo "📊 Para monitorar: tail -f $LOG_DIR/cleanup.log"
    echo ""
else
    echo "❌ Erro ao configurar crontab"
    exit 1
fi
