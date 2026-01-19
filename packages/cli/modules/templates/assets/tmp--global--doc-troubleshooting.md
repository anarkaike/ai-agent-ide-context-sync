---
title: Guia de Solução de Problemas (Troubleshooting)
subtitle: Como diagnosticar e resolver problemas comuns
description: Base de conhecimento para resolução de erros e falhas conhecidas.
author: [Nome]
status: active
tags: [troubleshooting, support, errors]
---

> **Breadcrumbs**: [Index](../../README.md) > [Troubleshooting](./README.md)

# 🔧 Guia de Solução de Problemas

## 1. 🚨 Problemas Críticos
<!-- AI-SESSION: critical-issues -->

### Erro: "Connection Refused" no Banco de Dados
**Sintomas**: A aplicação não sobe e loga `ECONNREFUSED`.
**Causa Provável**: O container do banco não está rodando ou a porta está ocupada.
**Solução**:
1. Verifique se o Docker está rodando: `docker ps`.
2. Reinicie os serviços: `docker-compose restart db`.
3. Verifique logs: `docker-compose logs -f db`.

### Erro: "Out of Memory" (OOM)
**Sintomas**: O processo Node.js morre repentinamente.
**Solução**: Aumente o limite de memória no `.env` (`NODE_OPTIONS=--max-old-space-size=4096`).

## 2. ⚠️ Problemas Comuns
<!-- AI-SESSION: common-issues -->

### Lentidão na API
- Verifique se o índice X foi criado no banco.
- Verifique a latência da rede externa.

### Falha no Login (Token Inválido)
- Limpe o LocalStorage/Cookies.
- Verifique se o relógio do sistema está sincronizado.

## 3. 🔍 Diagnóstico
<!-- AI-SESSION: diagnostics -->

### Logs Úteis
- **Aplicação**: `/var/log/app/error.log` ou `docker logs app`
- **Nginx**: `/var/log/nginx/error.log`

### Comandos de Verificação
```bash
# Verificar status da API
curl -I http://localhost:3000/health

# Verificar conectividade com banco
npm run db:check
```

## 4. 📞 Suporte
<!-- AI-SESSION: support -->
Se o problema persistir, abra um ticket no Jira com:
- Logs do erro
- Passos para reproduzir
- Ambiente afetado (Dev, Staging, Prod)
