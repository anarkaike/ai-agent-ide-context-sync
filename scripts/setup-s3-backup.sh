#!/bin/bash

# Script de configuração para Backup S3 da Contabo
# Uso: ./setup-s3-backup.sh

echo "🔧 Configurando Backup S3 para Nanobot..."

# Verifica se .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env a partir do exemplo..."
    cp .env.example .env
    echo "⚠️  Por favor, edite o arquivo .env com suas credenciais da Contabo!"
    echo "   CONTABO_ACCESS_KEY="
    echo "   CONTABO_SECRET_KEY="
    echo ""
    echo "📍 Para obter as credenciais:"
    echo "   1. Acesse https://console.contabo.com/"
    echo "   2. Vá para Object Storage"
    echo "   3. Crie um bucket ou use um existente"
    echo "   4. Gere as chaves de acesso (Access Key e Secret Key)"
    echo ""
    read -p "Pressione ENTER após configurar o .env..."
fi

# Carrega variáveis de ambiente
source .env

# Verifica credenciais
if [ -z "$CONTABO_ACCESS_KEY" ] || [ -z "$CONTABO_SECRET_KEY" ]; then
    echo "❌ Erro: CONTABO_ACCESS_KEY e CONTABO_SECRET_KEY são obrigatórios!"
    echo "   Edite o arquivo .env e configure suas credenciais."
    exit 1
fi

# Instala dependências
echo "📦 Instalando dependências..."
npm install aws-sdk

# Testa conexão S3
echo "🔗 Testando conexão com S3..."
node -e "
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    endpoint: process.env.S3_ENDPOINT || 'https://eu2.contabostorage.com',
    accessKeyId: process.env.CONTABO_ACCESS_KEY,
    secretAccessKey: process.env.CONTABO_SECRET_KEY,
    region: process.env.S3_REGION || 'eu-central-1',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});

const bucket = process.env.S3_BUCKET || 'ai-agent-backups';

s3.headBucket({ Bucket: bucket })
    .then(() => {
        console.log('✅ Conexão S3 estabelecida com sucesso!');
        console.log(\`   Bucket: \${bucket}\`);
        console.log(\`   Endpoint: \${s3.endpoint.href}\`);
    })
    .catch(async (err) => {
        if (err.code === 'NoSuchBucket') {
            console.log('📦 Bucket não encontrado, criando...');
            await s3.createBucket({ Bucket: bucket }).promise();
            console.log('✅ Bucket criado com sucesso!');
        } else {
            console.error('❌ Erro na conexão S3:', err.message);
            process.exit(1);
        }
    });
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Configuração concluída com sucesso!"
    echo ""
    echo "🚀 Para executar o backup:"
    echo "   node scripts/nanobot-backup-manager-s3.js"
    echo ""
    echo "📊 Para ver estatísticas:"
    echo "   node scripts/nanobot-backup-manager-s3.js --stats"
    echo ""
    echo "🔄 Para restaurar backup:"
    echo "   node scripts/nanobot-backup-manager-s3.js --restore <backup-id>"
    echo ""
    echo "💡 O backup S3 com deduplicação economiza até 90% de espaço!"
else
    echo "❌ Falha na configuração. Verifique suas credenciais."
    exit 1
fi
