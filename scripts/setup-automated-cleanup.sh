#!/bin/bash

# Script de configuração para Limpeza Automatizada
# Uso: ./setup-automated-cleanup.sh

echo "🧹 Configurando Sistema de Limpeza Automatizada..."

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa ser executado como root (sudo)"
    exit 1
fi

# Torna scripts executáveis
echo "🔧 Configurando permissões..."
chmod +x scripts/nanobot-cleanup-automator.js

# Testa limpeza rápida
echo "🧪 Testando limpeza rápida..."
node scripts/nanobot-cleanup-automator.js --quick

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sistema de limpeza automatizada configurado com sucesso!"
    echo ""
    echo "🚀 Opções de uso:"
    echo "   ./scripts/nanobot-cleanup-automator.js --quick      # Limpeza rápida (30 min)"
    echo "   ./scripts/nanobot-cleanup-automator.js --daily      # Limpeza diária completa"
    echo "   ./scripts/nanobot-cleanup-automator.js --weekly     # Limpeza semanal profunda"
    echo "   ./scripts/nanobot-cleanup-automator.js --monthly    # Limpeza mensal completa"
    echo "   ./scripts/nanobot-cleanup-automator.js --automated  # Modo automatizado contínuo"
    echo ""
    echo "⚡ Para agendar no crontab:"
    echo "   # Edite crontab: crontab -e"
    echo "   # Adicione as linhas:"
    echo "   */30 * * * * cd $(pwd) && node scripts/nanobot-cleanup-automator.js --quick"
    echo "   0 3 * * * cd $(pwd) && node scripts/nanobot-cleanup-automator.js --daily"
    echo "   0 4 * * 0 cd $(pwd) && node scripts/nanobot-cleanup-automator.js --weekly"
    echo "   0 5 1 * * cd $(pwd) && node scripts/nanobot-cleanup-automator.js --monthly"
    echo ""
    echo "🛡️ Recursos de segurança:"
    echo "   - Proteção de diretórios críticos"
    echo "   - Validação de arquivos antes da remoção"
    echo "   - Limite de espaço mínimo em disco"
    echo "   - Logs detalhados de todas as operações"
    echo ""
    echo "💾 Economia de espaço implementada:"
    echo "   - Limpeza de arquivos temporários"
    echo "   - Cache de aplicações e sistema"
    echo "   - Logs antigos com retenção configurável"
    echo "   - Pacotes e kernels desnecessários"
    echo "   - Arquivos órfãos e grandes"
else
    echo "❌ Falha no teste de limpeza. Verifique os logs."
    exit 1
fi
