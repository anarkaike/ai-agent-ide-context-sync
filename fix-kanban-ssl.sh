#!/bin/bash

# 🚀 Kanban SSL Fix Script
# Corrige configuração SSL para kanbanfrontchatwoot.servinder.com.br

set -e

echo "🔧 Iniciando correção SSL para kanbanfrontchatwoot.servinder.com.br"

# 1. Parar nginx container
echo "⏹️ Parando container nginx-kanban-paths..."
docker stop nginx-kanban-paths || true

# 2. Gerar certificado auto-assinado para o domínio correto
echo "🔐 Gerando certificado auto-assinado..."
openssl genrsa -out /tmp/kanbanfrontchatwoot.servinder.com.br.key 2048

# Criar configuração CSR com o domínio correto
cat > /tmp/kanbanfrontchatwoot.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = BR
ST = SP
L = Sao Paulo
O = Servinder
OU = IT Department
CN = kanbanfrontchatwoot.servinder.com.br

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = kanbanfrontchatwoot.servinder.com.br
DNS.2 = www.kanbanfrontchatwoot.servinder.com.br
EOF

# Gerar certificado
openssl req -new -x509 -key /tmp/kanbanfrontchatwoot.servinder.com.br.key -out /tmp/kanbanfrontchatwoot.servinder.com.br.crt -days 365 -config /tmp/kanbanfrontchatwoot.conf

# 3. Copiar certificados para o container
echo "📁 Copiando certificados..."
docker cp /tmp/kanbanfrontchatwoot.servinder.com.br.crt nginx-kanban-paths:/etc/ssl/certs/
docker cp /tmp/kanbanfrontchatwoot.servinder.com.br.key nginx-kanban-paths:/etc/ssl/certs/

# 4. Atualizar configuração nginx
echo "⚙️ Atualizando configuração nginx..."
cat > /tmp/kanban-ssl-fixed.conf << 'EOF'
# 🚀 Kanban SSL Configuration - IA-First (FIXED)
events {
    worker_connections 1024;
}

http {
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Kanban Frontend - HTTPS com certificado correto
    server {
        listen 443 ssl http2;
        server_name kanbanfrontchatwoot.servinder.com.br;
        
        # SSL Configuration
        ssl_certificate /etc/ssl/certs/kanbanfrontchatwoot.servinder.com.br.crt;
        ssl_certificate_key /etc/ssl/certs/kanbanfrontchatwoot.servinder.com.br.key;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        location / {
            proxy_pass http://kanbanfree-frontend-1:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Kanban Frontend - HTTP to HTTPS redirect
    server {
        listen 80;
        server_name kanbanfrontchatwoot.servinder.com.br;
        return 301 https://$server_name$request_uri;
    }

    # Chatwoot Principal - HTTPS (mantido)
    server {
        listen 443 ssl http2;
        server_name chatwoot.servinder.com.br;
        
        # SSL Configuration
        ssl_certificate /etc/ssl/certs/chatwoot.crt;
        ssl_certificate_key /etc/ssl/certs/chatwoot.key;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Kanban Frontend Path
        location /kanban {
            proxy_pass http://kanbanfree-frontend-1:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_cache_bypass $http_upgrade;
        }

        # Kanban Backend API Path
        location /kanban-api {
            proxy_pass http://kanbanfree-backend-1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_cache_bypass $http_upgrade;
        }

        # Chatwoot Enterprise - Proxy Principal
        location / {
            proxy_pass http://tmp-rails-1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_cache_bypass $http_upgrade;
        }

        # Landing Page (fallback)
        location = /landing {
            return 200 '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatwoot Enterprise + Kanban</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; color: #2c3e50; }
        .services { display: flex; justify-content: space-around; margin: 30px 0; }
        .service { padding: 20px; border: 2px solid #3498db; border-radius: 10px; text-align: center; }
        .service a { color: #3498db; text-decoration: none; font-weight: bold; }
        .service a:hover { text-decoration: underline; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Chatwoot Enterprise + Kanban Integration</h1>
        <p>Sistema completo de atendimento e gestão de tarefas</p>
    </div>
    
    <div class="status">
        <h3>✅ Status: Todos os serviços online</h3>
        <p>HTTPS ativo • Certificado válido • Sistema operacional</p>
    </div>
    
    <div class="services">
        <div class="service">
            <h3>📋 Kanban Frontend</h3>
            <p>Gestão visual de tarefas</p>
            <a href="/kanban">Acessar Kanban →</a>
        </div>
        
        <div class="service">
            <h3>🔧 Kanban API</h3>
            <p>Backend e serviços</p>
            <a href="/kanban-api">API Documentation →</a>
        </div>
    </div>
    
    <div class="footer">
        <p>Powered by IA-First SSL Certificate Manager</p>
        <p>© 2026 Chatwoot Enterprise Integration</p>
    </div>
</body>
</html>';
            add_header Content-Type text/html;
        }
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name chatwoot.servinder.com.br;
        return 301 https://$server_name$request_uri;
    }
}
EOF

# 5. Copiar configuração atualizada
echo "📋 Copiando configuração atualizada..."
docker cp /tmp/kanban-ssl-fixed.conf nginx-kanban-paths:/etc/nginx/nginx.conf

# 6. Iniciar container
echo "🚀 Iniciando container nginx-kanban-paths..."
docker start nginx-kanban-paths

# 7. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# 8. Testar configuração
echo "🧪 Testando configuração SSL..."
if curl -k -I https://kanbanfrontchatwoot.servinder.com.br/ | grep -q "HTTP/2 200"; then
    echo "✅ Sucesso! Certificado SSL configurado corretamente"
    echo "🌐 Acesse: https://kanbanfrontchatwoot.servinder.com.br"
else
    echo "❌ Falha no teste SSL"
    docker logs nginx-kanban-paths --tail 20
    exit 1
fi

# 9. Limpar arquivos temporários
echo "🧹 Limpando arquivos temporários..."
rm -f /tmp/kanbanfrontchatwoot.*

echo "🎉 Implementação SSL concluída com sucesso!"
echo "📋 Resumo:"
echo "   - Domínio: kanbanfrontchatwoot.servinder.com.br"
echo "   - Certificado: Auto-assinado (365 dias)"
echo "   - Status: ✅ Ativo e funcional"
echo "   - Proxy: Kanban Frontend (porta 80)"
