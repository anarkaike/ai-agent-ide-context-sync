# Guia de Troubleshooting - AlphaClinics

## 🚨 Diagnóstico Confirmado

**Status**: ❌ **CRITICAL** - Todos os ambientes down  
**Causa**: 502 Bad Gateway em todos os ambientes  
**Servidor**: Nginx/1.29.5 como reverse proxy  
**IP**: 158.220.106.233 (todos os ambientes)

## 🔍 Análise Detalhada

### O que está funcionando:
- ✅ DNS resolution OK
- ✅ Network connectivity OK (ping 0.05-0.19ms)
- ✅ Nginx rodando e respondendo

### O que está falhando:
- ❌ Application servers não respondendo
- ❌ Nginx não consegue se comunicar com backend
- ❌ Todos os ambientes (prod, hmg, dev) afetados

## 🛠️ Plano de Ação Imediato

### 1. Acesso ao Servidor (Prioridade CRÍTICA)
```bash
# Identificar e acessar o servidor
ssh root@158.220.106.233
# ou
ssh usuario@alphaclinics.servinder.com.br
```

### 2. Verificação de Serviços
```bash
# Verificar status dos serviços principais
systemctl status nginx
systemctl status php-fpm
systemctl status node
systemctl status docker

# Verificar processos da aplicação
ps aux | grep -E "(node|php|python|java|docker)" | grep -v grep

# Verificar portas em uso
netstat -tlnp | grep -E ":(80|443|3000|8000|9000|8080)"
ss -tlnp | grep -E ":(80|443|3000|8000|9000|8080)"
```

### 3. Logs do Sistema
```bash
# Logs do Nginx (mais importantes)
tail -100 /var/log/nginx/error.log
tail -100 /var/log/nginx/access.log

# Logs do sistema
journalctl -u nginx -n 50
journalctl -u php-fpm -n 50

# Logs de aplicação (se existirem)
tail -100 /var/log/app.log
tail -100 /var/log/node-app.log
```

### 4. Configuração do Nginx
```bash
# Verificar configuração
nginx -t

# Verificar upstream configuration
cat /etc/nginx/sites-available/alphaclinics
cat /etc/nginx/sites-enabled/alphaclinics

# Procurar por configurações de upstream
grep -r "upstream" /etc/nginx/
grep -r "proxy_pass" /etc/nginx/
```

## 🔧 Soluções Prováveis

### Cenário 1: Application Server Down
```bash
# Se for Node.js
cd /path/to/app
npm install
npm start
# ou
pm2 restart all

# Se for PHP
systemctl restart php-fpm

# Se for Docker
docker ps
docker start $(docker ps -a -q)
```

### Cenário 2: Problema de Configuração
```bash
# Editar configuração do nginx
nano /etc/nginx/sites-available/alphaclinics

# Verificar se upstream está correto
# Exemplo:
upstream backend {
    server 127.0.0.1:3000;
    # ou
    server unix:/var/run/php-fpm.sock;
}

# Recarregar configuração
nginx -s reload
systemctl reload nginx
```

### Cenário 3: Problema de Firewall/Portas
```bash
# Verificar firewall
ufw status
iptables -L

# Liberar portas se necessário
ufw allow 3000
ufw allow 8000
```

### Cenário 4: Problema de Recursos
```bash
# Verificar uso de CPU/memória
top
htop
free -h
df -h

# Verificar se há OOM killer
dmesg | grep -i "killed process"
```

## 🚀 Script de Diagnóstico Automático

Criar script para diagnóstico rápido:

```bash
#!/bin/bash
# diagnose-alphaclinics.sh

echo "🔍 Diagnóstico AlphaClinics - $(date)"
echo "=================================="

echo "📊 Status dos Serviços:"
systemctl status nginx --no-pager -l
systemctl status php-fpm --no-pager -l 2>/dev/null || echo "php-fpm não encontrado"

echo -e "\n🌐 Portas em uso:"
netstat -tlnp | grep -E ":(80|443|3000|8000|9000|8080)"

echo -e "\n📝 Logs recentes do Nginx:"
tail -20 /var/log/nginx/error.log

echo -e "\n💾 Uso de memória:"
free -h

echo -e "\n🔥 Uso de CPU:"
top -bn1 | head -20

echo -e "\n🐳 Containers Docker (se existirem):"
docker ps 2>/dev/null || echo "Docker não encontrado"

echo -e "\n📈 Processos da aplicação:"
ps aux | grep -E "(node|php|python|java)" | grep -v grep | head -10
```

## 📞 Comandos de Emergência

### Restart Completo dos Serviços
```bash
# Restart seguro (em ordem)
systemctl restart php-fpm
sleep 2
systemctl restart nginx
```

### Verificação Completa
```bash
# Script completo de verificação
#!/bin/bash
echo "🚀 Verificação Emergencial AlphaClinics"

# 1. Nginx
echo "1. Nginx:"
systemctl is-active nginx && echo "✅ Nginx ativo" || echo "❌ Nginx inativo"
nginx -t && echo "✅ Config OK" || echo "❌ Config error"

# 2. Portas
echo "2. Portas:"
netstat -tlnp | grep :80 && echo "✅ Porta 80 OK" || echo "❌ Porta 80 fechada"
netstat -tlnp | grep :443 && echo "✅ Porta 443 OK" || echo "❌ Porta 443 fechada"

# 3. Application
echo "3. Application:"
curl -I http://localhost:3000 2>/dev/null && echo "✅ App responde" || echo "❌ App não responde"

# 4. Logs
echo "4. Logs:"
tail -5 /var/log/nginx/error.log
```

## 🎯 Metas de Recuperação

### Tempo Alvo:
- **Diagnóstico**: 5-10 minutos
- **Resolução**: 15-30 minutos
- **Validação**: 5 minutos

### Critérios de Sucesso:
- ✅ HTTP 200 em todos os ambientes
- ✅ Tempo de resposta <2 segundos
- ✅ SSL válido
- ✅ Funcionalidades críticas operando

## 📱 Monitoramento Pós-Restauração

Após restaurar, configurar monitoramento:

```bash
# Script de monitoramento simples
#!/bin/bash
while true; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://alphaclinics.servinder.com.br)
    if [ $response != "200" ]; then
        echo "🚨 ALERTA: AlphaClinics down - HTTP $response - $(date)"
        # Enviar notificação
    fi
    sleep 60
done
```

## 🧠 Inteligência para Agentes IA

### Padrões Detectados:
1. **502 em múltiplos ambientes** = Application server problem
2. **Nginx respondendo** = Proxy OK, backend problem
3. **Mesmo IP para todos** = Single point of failure

### Fluxo de Decisão:
```
502 Bad Gateway
├── Nginx OK? → Sim
├── DNS OK? → Sim  
├── Network OK? → Sim
└── Application Server? → ❌ DOWN
    ├── Verificar processo
    ├── Verificar porta
    ├── Verificar logs
    └── Restart serviço
```

### Ações Automáticas Sugeridas:
1. Restart automático do application server
2. Alerta para equipe DevOps
3. Rollback para último deploy estável
4. Ativação de maintenance mode

---

**Status Atual**: 🚨 **CRITICAL** - Requer ação imediata  
**Próximo Passo**: Acessar servidor e executar diagnóstico completo  
**Tempo Estimado**: 30 minutos para restauração completa
