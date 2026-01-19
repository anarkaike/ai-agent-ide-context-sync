---
title: Guia de Onboarding e Setup
subtitle: Bem-vindo ao projeto!
description: Tudo o que você precisa saber para configurar seu ambiente e começar a contribuir.
author: [Nome]
status: stable
tags: [onboarding, setup, dev-environment]
---

> **Breadcrumbs**: [Index](../../README.md) > [Onboarding](./README.md)

# 🚀 Guia de Onboarding e Setup

## 1. 👋 Boas-vindas
<!-- AI-SESSION: welcome -->
Bem-vindo ao time! Este projeto tem como objetivo [Objetivo Principal].
Nossa cultura valoriza: documentação, testes e código limpo.

### Canais de Comunicação
- **Slack/Teams**: `#dev-team`
- **Daily**: 10:00 AM (Link na agenda)
- **Tech Lead**: @[TechLead]

## 2. 💻 Configuração do Ambiente (Setup)
<!-- AI-SESSION: setup -->

### Ferramentas Necessárias
- [ ] Node.js v18+ (`node -v`)
- [ ] Docker & Docker Compose (`docker -v`)
- [ ] VS Code (Recomendado) com extensão `AI Agent IDE Context Sync`

### Instalação
1. Clone o repositório:
   ```bash
   git clone git@github.com:org/repo.git
   cd repo
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o .env com as credenciais locais
   ```

4. Suba os serviços (Banco, Cache, etc.):
   ```bash
   docker-compose up -d
   ```

## 3. ▶️ Rodando o Projeto
<!-- AI-SESSION: running -->

### Backend
```bash
npm run dev
# O servidor iniciará em http://localhost:3000
```

### Frontend (se aplicável)
```bash
npm run dev:web
# O app iniciará em http://localhost:8080
```

## 4. 🧪 Testes e Qualidade
<!-- AI-SESSION: testing -->
Antes de abrir um PR, garanta que seu código passa nas verificações:

```bash
# Rodar testes unitários
npm run test

# Rodar linter
npm run lint

# Verificar formatação
npm run format:check
```

## 5. 📦 Primeiro Commit
<!-- AI-SESSION: first-commit -->
1. Crie uma branch seguindo o padrão: `feat/nome-da-feature` ou `fix/nome-do-bug`.
2. Faça alterações pequenas.
3. Documente o que fez (Docs-as-you-code!).
4. Abra um Pull Request (PR) e peça review.

## 6. 📚 Recursos Úteis
<!-- AI-SESSION: resources -->
- [Link para o Figma]
- [Link para o Jira/Trello]
- [Link para a Documentação da API]
