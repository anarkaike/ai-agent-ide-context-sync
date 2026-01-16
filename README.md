# 🧠 AI Agent IDE Context Sync

> **Hub Universal de Contexto para Agentes de IA em múltiplas IDEs**

Pare de se repetir. Um contexto, infinitos agentes.

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 O que é isso?

**AI Agent IDE Context Sync** é um sistema universal de gerenciamento de contexto que sincroniza a inteligência do seu projeto entre **todos os agentes de IA para código** — Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity e muito mais.

Em vez de manter arquivos separados como `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` e outros específicos de cada IDE, você define seu contexto **uma vez** e o sistema automaticamente sincroniza para todos os agentes.

### O Problema

Você está trabalhando em um projeto Laravel + Vue. Você tem:
- `.cursorrules` para o Cursor
- `.windsurfrules` para o Windsurf
- `.github/copilot-instructions.md` para o Copilot
- `.trae/rules/project_rules.md` para o Trae
- `.claude/instructions.md` para Claude Projects

Toda vez que você atualiza sua arquitetura, adiciona um novo padrão ou muda um padrão de código, você precisa **atualizar manualmente 5+ arquivos**. É um pesadelo.

### A Solução

```bash
npm install -g ai-agent-ide-context-sync
cd seu-projeto
ai-doc init
ai-doc build
```

Agora **todos os seus agentes compartilham o mesmo cérebro**. Atualize uma vez, sincronize em todos os lugares.

---

## ✨ Funcionalidades

### 🔄 Sincronização Universal
Gera automaticamente arquivos de contexto para:
- **Cursor** (`.cursorrules`)
- **Windsurf** (`.windsurfrules`)
- **GitHub Copilot** (`.github/copilot-instructions.md`)
- **Trae** (`.trae/rules/project_rules.md`)
- **Claude Projects** (`.claude/instructions.md`)
- **Gemini CLI** (`.google/instructions.md`)
- **Antigravity** (`.ai-workspace/cache/compiled/ai-instructions.md`)

### 🧬 Arquitetura Modular
- **Módulos Core**: Identidade, Memória, Tarefas, Análise
- **Integrações de Stack**: Laravel, Vue, React, Next.js (extensível)
- **Motor de Heurísticas**: Aprende padrões automaticamente do seu código
- **Sistema Soul**: Base de conhecimento portável (exporte/importe seus aprendizados)

### 🚀 Auto-Evolução
O sistema aprende com suas interações:
- Padrões de navegação (rotas Laravel, componentes Vue)
- Otimizações de prompts
- Padrões de código e anti-padrões
- Insights técnicos

### 🌍 Conhecimento Portável
Exporte sua "Soul" (conhecimento acumulado) e compartilhe:
```bash
ai-doc soul export
# Cria soul-backup-YYYYMMDD.tar.gz
```

Importe em outra máquina ou projeto:
```bash
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📦 Instalação

### Instalação Global (Recomendado)
```bash
npm install -g ai-agent-ide-context-sync
```

### Inicializar no Seu Projeto
```bash
cd seu-projeto
ai-doc init
```

Isso cria um diretório `.ai-workspace/` com:
- `config.yaml` (metadados do projeto)
- `personas/` (identidades de agentes IA)
- `tasks/` (rastreamento de trabalho ativo)
- `analysis/` (decisões arquiteturais)

---

## 🛠️ Uso

### Construir Contexto para Todos os Agentes
```bash
ai-doc build
```

Isso compila seus módulos kernel, integrações de stack e contexto do projeto em um único conjunto de instruções abrangente e sincroniza para todas as IDEs suportadas.

### Verificar Status
```bash
ai-doc status
```

Saída:
```
=== 🔧 AI KERNEL (Global) ===
   Versão: 2.0.0
   Inteligência: 15 heurísticas aprendidas

=== 📁 AI WORKSPACE (Local) ===
   Projeto: sistema-clinica-new
   Path: /caminho/para/seu/projeto/.ai-workspace
```

### Ver Heurísticas Aprendidas
```bash
ai-doc heuristics
```

### Exportar/Importar Soul
```bash
# Exportar
ai-doc soul export

# Importar
ai-doc soul import soul-backup-20260116.tar.gz
```

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
    ├── config.yaml
    ├── personas/
    ├── tasks/
    └── analysis/
```

---

## 🎭 Sistema de Identidade

Crie personas de agentes IA com expertise específica:

```bash
ai-doc identity create AI-NARUTO
```

Cada persona tem:
- Especialidades técnicas
- Estilo de comunicação
- Preferências de trabalho
- Histórico de tarefas
- Espaço de raciocínio ("Mesa de Raciocínio")

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

## 📚 Documentação

- [Documentação Completa](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- [Guia de Contribuição](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md) primeiro.

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

> **Universal Context Hub for AI Agents across multiple IDEs**

Stop repeating yourself. One context, infinite agents.

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 What is this?

**AI Agent IDE Context Sync** is a universal context management system that synchronizes your project's intelligence across **all AI coding agents** — Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity, and more.

Instead of maintaining separate `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, and other IDE-specific files, you define your context **once** and the system automatically syncs it to every agent.

### The Problem

You're working on a Laravel + Vue project. You have:
- `.cursorrules` for Cursor
- `.windsurfrules` for Windsurf
- `.github/copilot-instructions.md` for Copilot
- `.trae/rules/project_rules.md` for Trae
- `.claude/instructions.md` for Claude Projects

Every time you update your architecture, add a new pattern, or change a coding standard, you have to **manually update 5+ files**. It's a nightmare.

### The Solution

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
ai-doc build
```

Now **all your agents share the same brain**. Update once, sync everywhere.

---

## ✨ Features

### 🔄 Universal Sync
Automatically generates context files for:
- **Cursor** (`.cursorrules`)
- **Windsurf** (`.windsurfrules`)
- **GitHub Copilot** (`.github/copilot-instructions.md`)
- **Trae** (`.trae/rules/project_rules.md`)
- **Claude Projects** (`.claude/instructions.md`)
- **Gemini CLI** (`.google/instructions.md`)
- **Antigravity** (`.ai-workspace/cache/compiled/ai-instructions.md`)

### 🧬 Modular Architecture
- **Core Modules**: Identity, Memory, Tasks, Analysis
- **Stack Integrations**: Laravel, Vue, React, Next.js (extensible)
- **Heuristics Engine**: Auto-learns patterns from your codebase
- **Soul System**: Portable knowledge base (export/import your learnings)

### 🚀 Auto-Evolution
The system learns from your interactions:
- Navigation patterns (Laravel routes, Vue components)
- Prompt optimizations
- Code patterns and anti-patterns
- Technical insights

### 🌍 Portable Knowledge
Export your "Soul" (accumulated knowledge) and share it:
```bash
ai-doc soul export
# Creates soul-backup-YYYYMMDD.tar.gz
```

Import it in another machine or project:
```bash
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g ai-agent-ide-context-sync
```

### Initialize in Your Project
```bash
cd your-project
ai-doc init
```

This creates a `.ai-workspace/` directory with:
- `config.yaml` (project metadata)
- `personas/` (AI agent identities)
- `tasks/` (active work tracking)
- `analysis/` (architectural decisions)

---

## 🛠️ Usage

### Build Context for All Agents
```bash
ai-doc build
```

This compiles your kernel modules, stack integrations, and project context into a single, comprehensive instruction set and syncs it to all supported IDEs.

### Check Status
```bash
ai-doc status
```

Output:
```
=== 🔧 AI KERNEL (Global) ===
   Versão: 2.0.0
   Inteligência: 15 heurísticas aprendidas

=== 📁 AI WORKSPACE (Local) ===
   Projeto: sistema-clinica-new
   Path: /path/to/your/project/.ai-workspace
```

### View Learned Heuristics
```bash
ai-doc heuristics
```

### Export/Import Soul
```bash
# Export
ai-doc soul export

# Import
ai-doc soul import soul-backup-20260116.tar.gz
```

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
    ├── config.yaml
    ├── personas/
    ├── tasks/
    └── analysis/
```

---

## 🎭 Identity System

Create AI agent personas with specific expertise:

```bash
ai-doc identity create AI-NARUTO
```

Each persona has:
- Technical specialties
- Communication style
- Work preferences
- Task history
- Reasoning workspace ("Mesa de Raciocínio")

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

## 📚 Documentation

- [Full Documentation](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

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
