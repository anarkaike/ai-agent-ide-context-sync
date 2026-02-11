# Deploy Intelligence Layer

Sistema inteligente de deploy e automação para projetos Laravel+Inertia+Vue+Chatwoot com rollback automático, health checks e monitoramento contínuo.

## 🚀 Funcionalidades Principais

### ✅ Deploy Automatizado
- **Multi-ambiente**: Dev, HMG, Production
- **Zero downtime**: Blue-green deployment
- **Rollback automático**: Recuperação instantânea em caso de falha
- **Validação pós-deploy**: Health checks automáticos

### 🛡️ Segurança e Confiabilidade
- **Backup automático**: Banco e arquivos antes de cada deploy
- **Validação SSL**: Certificados digitais
- **Health monitoring**: Verificação contínua de serviços
- **Audit logging**: Registro completo de operações

### 📊 Monitoramento e Alertas
- **Dashboard em tempo real**: Status de todos os projetos
- **Alertas proativos**: Notificações antes de falhas
- **Métricas de performance**: Tempo de deploy,成功率
- **Integração Nanobot**: Compartilhamento de conhecimento

## 🏗️ Arquitetura

```
Deploy Intelligence Layer
├── 🎯 Project Discovery
│   ├── Auto-detect Laravel+Inertia+Vue
│   ├── Auto-detect Kanban+Chatwoot
│   └── Dynamic project manifest
├── 🚀 Deployment Engine
│   ├── Docker container orchestration
│   ├── Database migrations
│   ├── Asset compilation
│   └── Cache optimization
├── 🛡️ Safety Net
│   ├── Pre-deploy backups
│   ├── Health validation
│   ├── Automatic rollback
│   └── Recovery procedures
└── 📊 Intelligence
    ├── Performance metrics
    ├── Failure pattern analysis
    ├── Optimization suggestions
    └── Knowledge sharing
```

## 📦 Instalação

### 1. Clonar e Instalar
```bash
cd /root/projects/dev/ai-agent-ide-context-sync/skills/deploy-intelligence
npm install
npm link
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Setup Inicial
```bash
# Descobrir projetos automaticamente
deploy-intelligence status

# Verificar saúde dos projetos
deploy-intelligence health sistema-clinica-new dev
```

## 🎯 Uso

### Deploy Básico
```bash
# Deploy para desenvolvimento
deploy-intelligence deploy sistema-clinica-new dev

# Deploy para homologação
deploy-intelligence deploy sistema-clinica-new hmg

# Deploy para produção (com backup automático)
deploy-intelligence deploy sistema-clinica-new prod
```

### Monitoramento
```bash
# Status de todos os projetos
deploy-intelligence status

# Health check específico
deploy-intelligence health sistema-clinica-new prod

# Rollback de emergência
deploy-intelligence rollback sistema-clinica-new prod
```

### Operações Avançadas
```bash
# Backup manual
deploy-intelligence backup sistema-clinica-new prod

# Restaurar backup
deploy-intelligence restore sistema-clinica-new prod backup-2024-02-10-15-30

# Limpeza de backups antigos
deploy-intelligence cleanup --retention=7
```

## 🔧 Configuração

### Estrutura de Projetos
O sistema detecta automaticamente seus projetos:

```json
{
  "sistema-clinica-new": {
    "type": "laravel-inertia-vue",
    "stack": ["Laravel", "Inertia.js", "Vue.js", "PostgreSQL", "Redis"],
    "chatwoot": true,
    "domains": [
      "alphaclinics.servinder.com.br",
      "hmg.alphaclinics.servinder.com.br",
      "dev.alphaclinics.servinder.com.br"
    ]
  },
  "kanban-free": {
    "type": "kanban-chatwoot",
    "stack": ["Node.js", "React", "PostgreSQL", "Chatwoot Integration"],
    "chatwoot": true,
    "domains": [
      "kanbanfrontchatwoot.servinder.com.br",
      "kanbanbackchatwoot.servinder.com.br"
    ]
  }
}
```

### Variáveis de Ambiente
```bash
# Database
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# Chatwoot
CHATWOOT_URL=https://chatwoot.seudominio.com.br
CHATWOOT_TOKEN=your_chatwoot_token
CHATWOOT_FRONTEND_URL=https://chatwoot.seudominio.com.br
CHATWOOT_DB_PASSWORD=chatwoot_db_password
CHATWOOT_SECRET_KEY=your_secret_key

# Deploy Settings
COMPOSE_PROJECT_NAME=sistema-clinica
AUTO_ROLLBACK=true
BACKUP_RETENTION_DAYS=7
HEALTH_CHECK_TIMEOUT=30
```

## 🐳 Docker Integration

### Docker Compose Produção
```bash
# Usar docker-compose.prod.yml para produção
docker compose -f docker-compose.prod.yml up -d

# Escalar aplicação
docker compose -f docker-compose.prod.yml up -d --scale app=3

# Atualizar sem downtime
docker compose -f docker-compose.prod.yml up -d --no-deps app
```

### Multi-Stage Build
- **Stage 1**: Composer dependencies
- **Stage 2**: Node.js build
- **Stage 3**: Production image
- **Resultado**: Imagem otimizada e segura

## 🔄 CI/CD Integration

### GitHub Actions
O workflow `.github/workflows/deploy.yml` provê:

1. **Security Scan**: Análise de vulnerabilidades
2. **Build & Test**: Testes automatizados
3. **Deploy Dev**: Automático para branch develop
4. **Deploy HMG**: Automático para branch main
5. **Deploy Prod**: Manual com aprovação
6. **Rollback**: Automático em caso de falha

### Triggers
- **Push**: Deploy automático para dev/hmg
- **Manual**: Deploy controlado para produção
- **Schedule**: Backup e manutenção automáticos

## 📊 Monitoramento e Alertas

### Health Checks
```bash
# Verificar todos os serviços
curl https://alphaclinics.servinder.com.br/health

# Verificar serviço específico
curl https://alphaclinics.servinder.com.br/api/health
```

### Métricas Coletadas
- **Deploy Time**: Tempo de cada deploy
- **Success Rate**: Taxa de sucesso
- **Downtime**: Tempo de indisponibilidade
- **Rollback Frequency**: Frequência de rollback

### Alertas
- **Slack Integration**: Notificações em tempo real
- **Email Alerts**: Relatórios diários
- **Telegram Bot**: Comandos via chat

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Container não sobe
```bash
# Verificar logs
docker compose logs app

# Verificar configuração
docker compose config

# Rebuild se necessário
docker compose build --no-cache
```

#### 2. Banco não conecta
```bash
# Verificar container do banco
docker ps | grep postgres

# Testar conexão
docker exec sistema-clinica-db pg_isready -U clinica

# Verificar credenciais
docker exec sistema-clinica-env env | grep DB_
```

#### 3. SSL Certificate Error
```bash
# Verificar certificado
openssl s_client -connect alphaclinics.servinder.com.br:443

# Renovar certificado
certbot renew --dry-run

# Recarregar nginx
docker exec nginx-wildcard-proxy nginx -s reload
```

### Recovery Procedures

#### 1. Rollback Completo
```bash
# Parar containers atuais
docker compose down

# Restaurar backup
deploy-intelligence restore sistema-clinica-new prod latest

# Subir versão anterior
docker compose up -d
```

#### 2. Recuperação de Banco
```bash
# Backup atual
deploy-intelligence backup sistema-clinica-new prod

# Restaurar backup anterior
docker exec sistema-clinica-db psql -U clinica -d clinica < backup.sql

# Migrar se necessário
docker exec sistema-clinica-app php artisan migrate:rollback
```

## 🚀 Performance Optimization

### Cache Strategies
```bash
# Laravel cache
docker exec app php artisan config:cache
docker exec app php artisan route:cache
docker exec app php artisan view:cache

# Redis cache
docker exec redis redis-cli FLUSHALL
```

### Database Optimization
```bash
# Índices
docker exec db psql -U clinica -d clinica -c "REINDEX DATABASE clinica;"

# Estatísticas
docker exec db psql -U clinica -d clinica -c "ANALYZE;"
```

### Asset Optimization
```bash
# Build otimizado
npm run build -- --production

# Comprimir assets
docker exec app php artisan optimize:clear
```

## 🔐 Security Best Practices

### 1. Secrets Management
- Usar variáveis de ambiente
- Nunca commitar .env
- Rotacionar senhas regularmente

### 2. Network Security
- Firewall configurado
- Apenas portas necessárias
- HTTPS obrigatório

### 3. Container Security
- Imagens oficiais apenas
- Scan de vulnerabilidades
- Non-root user quando possível

## 📈 Roadmap Futuro

### v1.1 (Próximo)
- [ ] Dashboard web interface
- [ ] Canary deployments
- [ ] Load testing automation
- [ ] Cost optimization

### v1.2 (Futuro)
- [ ] Multi-cloud support
- [ ] GitOps integration
- [ ] AI-based optimization
- [ ] Auto-scaling

## 🤝 Contribuição

1. Fork o projeto
2. Criar feature branch
3. Commit suas mudanças
4. Push para o branch
5. Abrir Pull Request

## 📄 Licença

MIT License - Ver arquivo LICENSE para detalhes.

## 🆘 Suporte

- **Documentação**: `/docs`
- **Issues**: GitHub Issues
- **Chat**: Discord/Slack
- **Email**: support@ai-agent.com

---

**Status**: ✅ **PRODUCTION READY**  
**Version**: **1.0.0**  
**Last Updated**: **2026-02-10**
