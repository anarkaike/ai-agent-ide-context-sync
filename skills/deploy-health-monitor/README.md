# Deploy Health Monitor

Skill de diagnóstico automatizado para ambientes de deploy com verificação completa de saúde e recomendações precisas.

## 🎯 Objetivo

Diagnosticar com precisão problemas de deploy em múltiplos ambientes e fornecer soluções automatizadas para agentes de IA.

## 🚀 Funcionalidades

### Verificações Completas
- ✅ **DNS Resolution** - Verifica resolução de nomes e IPs
- ✅ **Network Connectivity** - Testa conectividade via ping
- ✅ **HTTP Status** - Verifica códigos de status e tempo de resposta
- ✅ **SSL Certificate** - Valida certificados SSL/TLS
- ✅ **Content Analysis** - Analisa conteúdo da resposta
- ✅ **Port Scanning** - Verifica portas comuns (80, 443, 8080, 3000)

### Detecção Inteligente de Erros
- 502 Bad Gateway - Application server down
- 503 Service Unavailable - Serviço temporariamente indisponível
- 500 Internal Server Error - Erro interno do servidor
- 404 Not Found - Recurso não encontrado
- DNS Resolution Failure - Problemas de DNS
- SSL Certificate Issues - Certificados expirados/inválidos

### Recomendações Automáticas
- Diagnóstico preciso do problema
- Soluções específicas para cada tipo de erro
- Priorização de issues críticas
- Relatórios detalhados em JSON

## 📊 Status de Saúde

| Status | Emoji | Descrição |
|--------|-------|-----------|
| healthy | ✅ | Ambiente funcionando perfeitamente |
| warning | ⚠️ | Issues não críticos (SSL, HTTP 4xx) |
| degraded | 🟡 | Performance degradada |
| critical | ❌ | Issues críticos (50x, DNS) |
| error | 💥 | Erro geral de verificação |
| unknown | ❓ | Status não determinado |

## 🔧 Instalação e Uso

### Básico
```bash
# Verificar ambientes padrão
node index.js

# Verbose com detalhes
node index.js --verbose
```

### Personalizado
```bash
# Ambientes customizados
node index.js --environments=https://app1.com,https://app2.com,https://app3.com

# Timeout customizado
node index.js --timeout=15000

# Número de retries
node index.js --retries=5
```

### Teste
```bash
# Testar com sites de exemplo
npm run test
```

## 📈 Exemplo de Saída

```
🔍 Iniciando verificação de saúde dos ambientes...

📡 Verificando https://alphaclinics.servinder.com.br...

❌ https://alphaclinics.servinder.com.br
   Status: CRITICAL
   DNS: success (158.220.106.233)
   HTTP: 502 (194ms)
   Erro: 502_bad_gateway

📡 Verificando https://hmg.alphaclinics.servinder.com.br...

❌ https://hmg.alphaclinics.servinder.com.br
   Status: CRITICAL
   DNS: success (158.220.106.233)
   HTTP: 502 (187ms)
   Erro: 502_bad_gateway

📡 Verificando https://dev.alphaclinics.servinder.com.br...

❌ https://dev.alphaclinics.servinder.com.br
   Status: CRITICAL
   DNS: success (158.220.106.233)
   HTTP: 502 (201ms)
   Erro: 502_bad_gateway

📊 RESUMO DA VERIFICAÇÃO
==================================================
✅ Healthy: 0
⚠️ Warning: 0
🟡 Degraded: 0
❌ Critical: 3
💥 Error: 0
❓ Unknown: 0

💡 RECOMENDAÇÕES AUTOMÁTICAS
==================================================
🚨 ISSUES CRÍTICOS DETECTADOS:
   • https://alphaclinics.servinder.com.br: 502 Bad Gateway - Verificar se o application server está rodando
   • https://hmg.alphaclinics.servinder.com.br: 502 Bad Gateway - Verificar se o application server está rodando
   • https://dev.alphaclinics.servinder.com.br: 502 Bad Gateway - Verificar se o application server está rodando

📄 Relatório detalhado salvo em: /path/to/health-report-1739187860123.json
```

## 🔍 Diagnóstico do Problema Atual

### Análise dos Ambientes AlphaClinics

**Status**: ❌ **CRITICAL** - Todos os ambientes down

#### Causa Raiz Identificada:
1. **DNS OK** - Todos resolvem para `158.220.106.233`
2. **Network OK** - Ping funciona (0.05-0.19ms)
3. **HTTP CRITICAL** - Todos retornam `502 Bad Gateway`
4. **Server** - Nginx/1.29.5 como reverse proxy

#### Problema Específico:
```
502 Bad Gateway - Nginx não consegue se comunicar com o application server
```

## 🛠️ Plano de Resolução

### 1. Verificação Imediata (Critical)
```bash
# Verificar se application servers estão rodando
ssh servidor "ps aux | grep -E '(node|php|python|java)' | grep -v grep"

# Verificar portas da aplicação
ssh servidor "netstat -tlnp | grep -E ':(3000|8000|9000|8080)'"

# Verificar logs do nginx
ssh servidor "tail -50 /var/log/nginx/error.log"
```

### 2. Verificação de Serviços
```bash
# Status dos serviços
systemctl status nginx
systemctl status php-fpm
systemctl status node-app

# Restart se necessário
systemctl restart nginx
systemctl restart php-fpm
```

### 3. Verificação de Configuração
```bash
# Testar configuração do nginx
nginx -t

# Verificar upstream configuration
cat /etc/nginx/sites-available/alphaclinics
```

## 🔄 Integração com Nanobot Network

Esta skill está integrada com a rede Nanobot para:

- **Compartilhamento de Conhecimento**: Diagnósticos compartilhados entre agentes
- **Trust Network**: Verificação automática de status de serviços
- **Monitoring**: Alertas automáticos para issues críticos
- **Auto-Healing**: Scripts de recuperação automática baseados no diagnóstico

## 📊 Métricas e Monitoramento

### KPIs Monitorados
- **Uptime**: Disponibilidade dos ambientes
- **Response Time**: Tempo de resposta HTTP
- **Error Rate**: Taxa de erros por ambiente
- **SSL Expiry**: Dias até expiração do certificado
- **Network Latency**: Latência de rede

### Alertas Automáticos
- Issues críticos (50x, DNS failure)
- SSL expirando em <7 dias
- Response time >5 segundos
- Degradation de performance

## 🧠 Inteligência Artificial

### Detecção de Padrões
- Histórico de falhas por ambiente
- Correlação entre issues
- Predição de problemas baseada em tendências

### Recomendações Inteligentes
- Soluções baseadas no histórico
- Priorização automática de issues
- Sugestões de otimização

## 📝 Relatórios

### Formatos Disponíveis
- **Console**: Resumo em tempo real com emojis
- **JSON**: Relatório detalhado com timestamp
- **CSV**: Para análise em planilhas

### Informações Incluídas
- Status completo de cada ambiente
- Métricas de performance
- Análise de conteúdo
- Recomendações específicas
- Histórico de verificações

## 🚀 Próximos Passos

1. **Executar diagnóstico completo** nos servidores
2. **Implementar auto-healing** baseado no diagnóstico
3. **Configurar monitoring** contínuo
4. **Criar dashboard** de saúde em tempo real
5. **Integrar com CI/CD** para validação pós-deploy

---

**Status**: 🚨 **CRITICAL** - Requer ação imediata  
**Resolução Estimada**: 30-60 minutos  
**Impacto**: Todos os ambientes inacessíveis
