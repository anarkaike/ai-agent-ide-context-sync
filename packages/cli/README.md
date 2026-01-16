# 🧠 AI Agent IDE Context Sync

<div align="center">

> **Hub Universal de Contexto para Agentes de IA em múltiplas IDEs**

**Pare de se repetir. Um contexto, infinitos agentes.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 O que é isso?

**AI Agent IDE Context Sync** é um sistema universal de gerenciamento de contexto que sincroniza a inteligência do seu projeto entre **todos os agentes de IA para código** — Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity e muito mais.

Em vez de manter arquivos separados como `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` e outros específicos de cada IDE, você define seu contexto **uma vez** e o sistema automaticamente sincroniza para todos os agentes.

### 😫 O Problema

Você está trabalhando em um projeto Laravel + Vue. Você tem:
- `.cursorrules` para o Cursor
- `.windsurfrules` para o Windsurf
- `.github/copilot-instructions.md` para o Copilot
- `.trae/rules/project_rules.md` para o Trae
- `.claude/instructions.md` para Claude Projects

Toda vez que você atualiza sua arquitetura, adiciona um novo padrão ou muda um padrão de código, você precisa **atualizar manualmente 5+ arquivos**. É um pesadelo.

### ✨ A Solução

```bash
npm install -g ai-agent-ide-context-sync
cd seu-projeto
ai-doc init
ai-doc build
```

Agora **todos os seus agentes compartilham o mesmo cérebro**. Atualize uma vez, sincronize em todos os lugares.

---

## 🚀 Início Rápido

### Instalação

```bash
npm install -g ai-agent-ide-context-sync
```

### Configuração em 3 Passos

```bash
# 1. Vá para o seu projeto
cd meu-projeto-laravel

# 2. Inicialize o workspace
ai-doc init

# 3. Construa o contexto para todos os agentes
ai-doc build
```

**Pronto!** Agora você tem arquivos sincronizados para:
- ✅ Cursor (`.cursorrules`)
- ✅ Windsurf (`.windsurfrules`)
- ✅ GitHub Copilot (`.github/copilot-instructions.md`)
- ✅ Trae (`.trae/rules/project_rules.md`)
- ✅ Claude Projects (`.claude/instructions.md`)
- ✅ Gemini CLI (`.google/instructions.md`)
- ✅ Antigravity (`.ai-workspace/cache/compiled/ai-instructions.md`)

---

## ✨ Funcionalidades Principais

### 🔄 Sincronização Universal
Um único comando (`ai-doc build`) gera contexto para **7+ IDEs/Agentes** simultaneamente.

### 🧬 Arquitetura Modular
- **Módulos Core**: Identidade, Memória, Tarefas, Análise
- **Integrações de Stack**: Laravel, Vue, React, Next.js (extensível)
- **Motor de Heurísticas**: Aprende padrões automaticamente do seu código
- **Sistema Soul**: Base de conhecimento portável (exporte/importe seus aprendizados)

### 🚀 Auto-Evolução
O sistema aprende com suas interações:
- 📍 Padrões de navegação (rotas Laravel, componentes Vue)
- 🎯 Otimizações de prompts
- 🏗️ Padrões de código e anti-padrões
- 💡 Insights técnicos

### 🌍 Conhecimento Portável
Exporte sua "Soul" (conhecimento acumulado) e compartilhe com sua equipe:

```bash
# Exportar
ai-doc soul export
# Cria: soul-backup-20260116.tar.gz

# Importar em outra máquina
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📚 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `ai-doc init` | Inicializa o workspace no projeto atual |
| `ai-doc build` | Compila e sincroniza contexto para todas as IDEs |
| `ai-doc status` | Mostra versão do kernel e estatísticas |
| `ai-doc heuristics` | Lista todas as heurísticas aprendidas |
| `ai-doc soul export` | Exporta base de conhecimento |
| `ai-doc soul import <file>` | Importa base de conhecimento |
| `ai-doc identity create <name>` | Cria uma nova persona de agente |

---

## 🏗️ Arquitetura

```
~/.ai-doc/
├── kernel/          # Inteligência global (compartilhada entre todos os projetos)
│   ├── modules/     # Core, Identity, Memory, Tasks, Analysis
│   ├── heuristics/  # Padrões auto-aprendidos
│   └── cli/         # Interface de linha de comando
└── soul/            # Base de conhecimento portável
    └── experience/  # Insights de Laravel, Vue, React

seu-projeto/
└── .ai-workspace/   # Contexto local do projeto
    ├── config.yaml  # Metadados do projeto
    ├── personas/    # Identidades de agentes IA
    ├── tasks/       # Rastreamento de trabalho ativo
    └── analysis/    # Decisões arquiteturais
```

---

## 🎭 Sistema de Identidade

Crie personas de agentes IA com expertise específica:

```bash
ai-doc identity create AI-NARUTO
```

Cada persona tem:
- 🎯 Especialidades técnicas
- 💬 Estilo de comunicação
- ⚙️ Preferências de trabalho
- 📋 Histórico de tarefas
- 🧠 Espaço de raciocínio ("Mesa de Raciocínio")

---

## 🧪 Motor de Heurísticas

O sistema aprende automaticamente:

- **Padrões de Navegação**: "Ao trabalhar com Laravel, sempre verifique `routes/web.php` primeiro"
- **Otimizações de Prompt**: "Use a flag `--filter` para testes PHPUnit"
- **Padrões de Código**: "Multi-tenancy requer filtragem por `business_id`"

Essas heurísticas são armazenadas em `~/.ai-doc/kernel/heuristics/` e aplicadas em todos os projetos.

---

## 🌌 Sistema Soul

A "Soul" é sua sabedoria técnica acumulada:

- **Pitfalls**: Erros comuns e como evitá-los
- **Patterns**: Soluções arquiteturais comprovadas
- **Insights**: Lições aprendidas em produção

Exporte, compartilhe com sua equipe ou importe em uma nova máquina.

---

## 🔧 Exemplo de Uso Completo

```bash
# Instalar globalmente
npm install -g ai-agent-ide-context-sync

# Navegar para seu projeto
cd ~/projetos/meu-sistema-laravel

# Inicializar workspace
ai-doc init
# ✅ Criado: .ai-workspace/config.yaml
# ✅ Criado: .ai-workspace/personas/
# ✅ Criado: .ai-workspace/tasks/

# Construir contexto para todos os agentes
ai-doc build
# ✅ Sincronizado: Cursor (.cursorrules)
# ✅ Sincronizado: Windsurf (.windsurfrules)
# ✅ Sincronizado: Copilot (.github/copilot-instructions.md)
# ✅ Sincronizado: Trae (.trae/rules/project_rules.md)
# ✅ Sincronizado: Claude (.claude/instructions.md)
# ✅ Sincronizado: Gemini (.google/instructions.md)
# ✅ Sincronizado: Generic/Antigravity (.ai-workspace/cache/compiled/ai-instructions.md)

# Verificar status
ai-doc status
# === 🔧 AI KERNEL (Global) ===
#    Versão: 2.0.0
#    Inteligência: 15 heurísticas aprendidas
#
# === 📁 AI WORKSPACE (Local) ===
#    Projeto: meu-sistema-laravel
#    Path: /Users/voce/projetos/meu-sistema-laravel/.ai-workspace

# Criar uma persona
ai-doc identity create AI-SAKURA

# Exportar conhecimento
ai-doc soul export
# ✅ Exportado: soul-backup-20260116.tar.gz
```

---

## 🎯 Casos de Uso

### 1. Equipes Multi-IDE
Sua equipe usa Cursor, Windsurf e Copilot? Não há problema. Um único `ai-doc build` mantém todos sincronizados.

### 2. Onboarding de Novos Desenvolvedores
Exporte sua "Soul" e compartilhe com novos membros da equipe. Eles importam e já têm todo o conhecimento acumulado do projeto.

### 3. Múltiplos Projetos
O Kernel é global. Heurísticas aprendidas em um projeto Laravel são aplicadas automaticamente em outros projetos Laravel.

### 4. Migração de IDE
Mudou do Cursor para o Windsurf? Rode `ai-doc build` e o contexto é sincronizado instantaneamente.

---

## 📖 Documentação Completa

- 📘 [Guia Completo](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- 🤝 [Guia de Contribuição](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md)
- 📝 [Changelog](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CHANGELOG.md)
- 🐛 [Reportar Bug](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md) primeiro.

---

## 📄 Licença

MIT © Junio

---

## 🙏 Agradecimentos

Inspirado pela necessidade de uma camada de contexto universal na era do desenvolvimento assistido por IA.

Construído com ❤️ para desenvolvedores cansados de copiar e colar as mesmas instruções em 5 IDEs diferentes.

---

**Pare de se repetir. Comece a sincronizar.**

```bash
npm install -g ai-agent-ide-context-sync
```

---
---

# 🧠 AI Agent IDE Context Sync

<div align="center">

> **Universal Context Hub for AI Agents across multiple IDEs**

**Stop repeating yourself. One context, infinite agents.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 What is this?

**AI Agent IDE Context Sync** is a universal context management system that synchronizes your project's intelligence across **all AI coding agents** — Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity, and more.

Instead of maintaining separate `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, and other IDE-specific files, you define your context **once** and the system automatically syncs it to every agent.

### 😫 The Problem

You're working on a Laravel + Vue project. You have:
- `.cursorrules` for Cursor
- `.windsurfrules` for Windsurf
- `.github/copilot-instructions.md` for Copilot
- `.trae/rules/project_rules.md` for Trae
- `.claude/instructions.md` for Claude Projects

Every time you update your architecture, add a new pattern, or change a coding standard, you have to **manually update 5+ files**. It's a nightmare.

### ✨ The Solution

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
ai-doc build
```

Now **all your agents share the same brain**. Update once, sync everywhere.

---

## 🚀 Quick Start

### Installation

```bash
npm install -g ai-agent-ide-context-sync
```

### Setup in 3 Steps

```bash
# 1. Go to your project
cd my-laravel-project

# 2. Initialize workspace
ai-doc init

# 3. Build context for all agents
ai-doc build
```

**Done!** Now you have synced files for:
- ✅ Cursor (`.cursorrules`)
- ✅ Windsurf (`.windsurfrules`)
- ✅ GitHub Copilot (`.github/copilot-instructions.md`)
- ✅ Trae (`.trae/rules/project_rules.md`)
- ✅ Claude Projects (`.claude/instructions.md`)
- ✅ Gemini CLI (`.google/instructions.md`)
- ✅ Antigravity (`.ai-workspace/cache/compiled/ai-instructions.md`)

---

## ✨ Key Features

### 🔄 Universal Sync
One command (`ai-doc build`) generates context for **7+ IDEs/Agents** simultaneously.

### 🧬 Modular Architecture
- **Core Modules**: Identity, Memory, Tasks, Analysis
- **Stack Integrations**: Laravel, Vue, React, Next.js (extensible)
- **Heuristics Engine**: Auto-learns patterns from your codebase
- **Soul System**: Portable knowledge base (export/import your learnings)

### 🚀 Auto-Evolution
The system learns from your interactions:
- 📍 Navigation patterns (Laravel routes, Vue components)
- 🎯 Prompt optimizations
- 🏗️ Code patterns and anti-patterns
- 💡 Technical insights

### 🌍 Portable Knowledge
Export your "Soul" (accumulated knowledge) and share it with your team:

```bash
# Export
ai-doc soul export
# Creates: soul-backup-20260116.tar.gz

# Import on another machine
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📚 Available Commands

| Command | Description |
|---------|-------------|
| `ai-doc init` | Initialize workspace in current project |
| `ai-doc build` | Compile and sync context to all IDEs |
| `ai-doc status` | Show kernel version and statistics |
| `ai-doc heuristics` | List all learned heuristics |
| `ai-doc soul export` | Export knowledge base |
| `ai-doc soul import <file>` | Import knowledge base |
| `ai-doc identity create <name>` | Create a new agent persona |

---

## 🏗️ Architecture

```
~/.ai-doc/
├── kernel/          # Global intelligence (shared across all projects)
│   ├── modules/     # Core, Identity, Memory, Tasks, Analysis
│   ├── heuristics/  # Auto-learned patterns
│   └── cli/         # Command-line interface
└── soul/            # Portable knowledge base
    └── experience/  # Laravel, Vue, React insights

your-project/
└── .ai-workspace/   # Local project context
    ├── config.yaml  # Project metadata
    ├── personas/    # AI agent identities
    ├── tasks/       # Active work tracking
    └── analysis/    # Architectural decisions
```

---

## 🎭 Identity System

Create AI agent personas with specific expertise:

```bash
ai-doc identity create AI-NARUTO
```

Each persona has:
- 🎯 Technical specialties
- 💬 Communication style
- ⚙️ Work preferences
- 📋 Task history
- 🧠 Reasoning workspace ("Mesa de Raciocínio")

---

## 🧪 Heuristics Engine

The system automatically learns:

- **Navigation Patterns**: "When working with Laravel, always check `routes/web.php` first"
- **Prompt Optimizations**: "Use `--filter` flag for PHPUnit tests"
- **Code Patterns**: "Multi-tenancy requires `business_id` filtering"

These heuristics are stored in `~/.ai-doc/kernel/heuristics/` and applied across all projects.

---

## 🌌 Soul System

The "Soul" is your accumulated technical wisdom:

- **Pitfalls**: Common mistakes and how to avoid them
- **Patterns**: Proven architectural solutions
- **Insights**: Hard-won lessons from production

Export it, share it with your team, or import it on a new machine.

---

## 🔧 Complete Usage Example

```bash
# Install globally
npm install -g ai-agent-ide-context-sync

# Navigate to your project
cd ~/projects/my-laravel-system

# Initialize workspace
ai-doc init
# ✅ Created: .ai-workspace/config.yaml
# ✅ Created: .ai-workspace/personas/
# ✅ Created: .ai-workspace/tasks/

# Build context for all agents
ai-doc build
# ✅ Synced: Cursor (.cursorrules)
# ✅ Synced: Windsurf (.windsurfrules)
# ✅ Synced: Copilot (.github/copilot-instructions.md)
# ✅ Synced: Trae (.trae/rules/project_rules.md)
# ✅ Synced: Claude (.claude/instructions.md)
# ✅ Synced: Gemini (.google/instructions.md)
# ✅ Synced: Generic/Antigravity (.ai-workspace/cache/compiled/ai-instructions.md)

# Check status
ai-doc status
# === 🔧 AI KERNEL (Global) ===
#    Version: 2.0.0
#    Intelligence: 15 learned heuristics
#
# === 📁 AI WORKSPACE (Local) ===
#    Project: my-laravel-system
#    Path: /Users/you/projects/my-laravel-system/.ai-workspace

# Create a persona
ai-doc identity create AI-SAKURA

# Export knowledge
ai-doc soul export
# ✅ Exported: soul-backup-20260116.tar.gz
```

---

## 🎯 Use Cases

### 1. Multi-IDE Teams
Your team uses Cursor, Windsurf, and Copilot? No problem. One `ai-doc build` keeps everyone in sync.

### 2. Onboarding New Developers
Export your "Soul" and share it with new team members. They import it and already have all the accumulated project knowledge.

### 3. Multiple Projects
The Kernel is global. Heuristics learned in one Laravel project are automatically applied to other Laravel projects.

### 4. IDE Migration
Switched from Cursor to Windsurf? Run `ai-doc build` and the context is synced instantly.

---

## 📖 Full Documentation

- 📘 [Complete Guide](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- 🤝 [Contributing Guide](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md)
- 📝 [Changelog](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CHANGELOG.md)
- 🐛 [Report Bug](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md) first.

---

## 📄 License

MIT © Junio

---

## 🙏 Acknowledgments

Inspired by the need for a universal context layer in the age of AI-powered development.

Built with ❤️ for developers who are tired of copy-pasting the same instructions across 5 different IDEs.

---

**Stop repeating yourself. Start syncing.**

```bash
npm install -g ai-agent-ide-context-sync
```
