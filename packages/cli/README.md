# 🧠 AI Agent IDE Context Sync

**🌐 Navegação por idioma**

- [Português](#lang-pt)
- [English](#lang-en)
- [Español](#lang-es)
- [Italiano](#lang-it)
- [Français](#lang-fr)
- [日本語](#lang-ja)
- [中文](#lang-zh)
- [العربية](#lang-ar)
- [हिन्दी](#lang-hi)

<a id="lang-pt"></a>

<div align="center">

> **Hub Universal de Contexto para Agentes de IA em múltiplas IDEs**

**Cansado de reesplicar sua arquitetura, camadas, stack e padrões para cada agente de IA? Este é o seu novo aliado. Um contexto, infinitos agentes.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

<br>

<img src="./assets/ai-agent-context-cover.png" alt="AI Agent IDE Context Sync - One Brain, Infinite Agents visual cover" width="100%" />

<br>

<img src="./assets/ai-agent-context-kanban.png" alt="Kanban board view using the AI Agent IDE Context Sync extension" width="85%" />

</div>

---

## 🎯 O que é?

**AI Agent IDE Context Sync** é um sistema universal de gerenciamento de contexto que sincroniza a inteligência do seu projeto entre **todos os agentes de IA para código** — Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity e muito mais.

Em vez de manter arquivos separados como `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` e outros específicos de cada IDE, você define seu contexto **uma vez** e o sistema automaticamente sincroniza para todos os agentes.

Além disso, usa o próprio repositório Git do projeto para versionar memória, contexto, tarefas e atividades de forma persistente para cada persona criada para seus agentes de IA nas IDEs.

Acompanhe com precisão o checklist de cada janela de agente de IA em arquivos separados, para não perder nenhum passo, organizando tudo por personas (identidades que cada janela de agente pode assumir).

---
#### 🌟 Se este projeto te ajudar, considera deixar uma estrela no repositório
###### Ainda está em processo de amadurecimento. Contribuições são muito bem-vindas — abra uma issue para sugerir funcionalidades, relatar bugs ou contar como está usando.
#### 🌟 If this project helps you, consider giving it a star
###### It's still evolving. Contributions are very welcome — open an issue to suggest features, report bugs, or share how you're using it.
#### 🌟 Si este proyecto te ayuda, considera dejar una estrella
###### Todavía está en desarrollo. Se agradecen mucho las contribuciones: abre un issue para sugerir funcionalidades, reportar errores o contar cómo lo estás usando.
---

### 😫 O Problema

Você está trabalhando em um projeto Laravel + Vue com camadas e padrões definidos. Você tem:
- `.cursorrules` para o Cursor
- `.windsurfrules` para o Windsurf
- `.github/copilot-instructions.md` para o Copilot
- `.trae/rules/project_rules.md` para o Trae
- `.claude/instructions.md` para Claude Projects

Toda vez que você atualiza sua arquitetura, adiciona um novo padrão ou muda um padrão de código, você precisa **atualizar manualmente 5+ arquivos**. É fácil esquecer algo e isso rouba tempo e foco.

### ✨ A Solução

```bash
npm install -g ai-agent-ide-context-sync
cd seu-projeto
ai-doc init
```

Agora **todos os seus agentes compartilham o mesmo cérebro**. Atualize uma vez, sincronize em todos os lugares.

---

## 🚀 Início Rápido

### Instalação

```bash
npm install -g ai-agent-ide-context-sync
```

### Configuração em 2 Passos

```bash
# 1. Vá para o seu projeto
cd meu-projeto-laravel

# 2. Inicialize o workspace e construa o contexto
ai-doc init
```

Depois, quando você atualizar regras ou arquitetura, use `ai-doc build` para recompilar e sincronizar o contexto sem precisar rodar `ai-doc init` novamente.

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
Um único comando (`ai-doc init`) inicializa e gera contexto para **7+ IDEs/Agentes** simultaneamente.

### 🧬 Arquitetura Modular
- **Módulos Core**: Identidade, Memória, Tarefas, Análise
- **Integrações de Stack**: Laravel, Vue, React, Next.js (extensível - implemente suas próprias integrações de stack)
- **Motor de Heurísticas**: Aprende padrões automaticamente do seu código e otimiza prompts
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
| `ai-doc init` | Inicializa o workspace e constrói o contexto inicial (init + build) |
| `ai-doc build` | Recompila e sincroniza o contexto manualmente para todas as IDEs |
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

# Inicializar workspace e construir contexto para todos os agentes
ai-doc init
# ✅ Criado: .ai-workspace/config.yaml
# ✅ Criado: .ai-workspace/personas/
# ✅ Criado: .ai-workspace/tasks/
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

# Criar uma persona (Identity Happy Path)
ai-doc identity create AI-SAKURA
# ✅ Persona criada: AI-SAKURA

# Listar personas existentes
ai-doc identity list

# Exportar conhecimento (Soul Happy Path)
ai-doc soul export
# ✅ Soul exportada: /algum/caminho/soul-backup-20260116.tar.gz

# Importar conhecimento em outra máquina
ai-doc soul import soul-backup-20260116.tar.gz
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

## 💻 Extensão VS Code (interface visual)

Prefere gerenciar tudo por uma interface visual dentro do VS Code?

- Gerencie personas de IA, tasks e checklists sem sair do editor
- Use timer Pomodoro integrado e atalhos de teclado para manter o foco
- Veja dashboards com estatísticas em tempo real sobre seu AI Workspace

Instale a extensão AI Agent IDE Context Sync para VS Code:
- Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)
- Detalhes da interface: [README.pt-BR da extensão](../extension/README.pt-BR.md)

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

## 🔍 Palavras‑chave relacionadas

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
ferramentas de IA para desenvolvedores, produtividade de desenvolvimento,
VS Code extension, IDE plugin, universal context hub, context sync,
GitHub Copilot instructions, Cursor rules, Windsurf rules, Claude Projects,
Gemini CLI, AI kernel, AI workspace, task management, Kanban board,
multi-agent systems, autonomous coding agents, repository-wide analysis,
refactoring assistant, code review automation, test automation, DevOps,
full‑stack development, Laravel, Vue, React, Next.js, microservices,
SaaS architecture, knowledge base, onboarding de desenvolvedores, DX.

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

<a id="lang-en"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync

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

Instead of maintaining separate `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, and other IDE-specific files, you define your context **once** and the system automatically syncs it to every agent — so you spend more time coding and less time curating instructions.

### 😫 The Problem

You're working on a Laravel + Vue project. You have:
- `.cursorrules` for Cursor
- `.windsurfrules` for Windsurf
- `.github/copilot-instructions.md` for Copilot
- `.trae/rules/project_rules.md` for Trae
- `.claude/instructions.md` for Claude Projects

Every time you update your architecture, add a new pattern, or change a coding standard, you have to **manually update 5+ files**. It's easy to miss something, and it breaks your flow.

### ✨ The Solution

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
```

Now **all your agents share the same brain**. Update once, sync everywhere.

---

## 🚀 Quick Start

### Installation

```bash
npm install -g ai-agent-ide-context-sync
```

### Setup in 2 Steps

```bash
# 1. Go to your project
cd my-laravel-project

# 2. Initialize workspace and build context for all agents
ai-doc init
```

Later, when you update rules or architecture, use `ai-doc build` to rebuild and resync the context without running `ai-doc init` again.

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
One command (`ai-doc init`) initializes and generates context for **7+ IDEs/Agents** simultaneously.

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
| `ai-doc init` | Initialize workspace and build initial context (init + build) |
| `ai-doc build` | Manually rebuild and sync context to all IDEs |
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

# Initialize workspace and build context for all agents
ai-doc init
# ✅ Created: .ai-workspace/config.yaml
# ✅ Created: .ai-workspace/personas/
# ✅ Created: .ai-workspace/tasks/
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

## 💻 VS Code Extension (visual interface)

Prefer a visual interface inside VS Code?

- Manage AI personas, tasks, and checklists without leaving your editor
- Stay focused with the built-in Pomodoro timer and keyboard shortcuts
- Explore dashboards with real-time statistics about your AI workspace

Install the AI Agent IDE Context Sync VS Code extension:
- Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)
- More details: [Extension README](../extension/README.md)

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

## 🔍 Related keywords

AI coding assistant, AI code assistant, AI coding agent, AI pair programmer,
AI developer tools, developer productivity, VS Code extension, IDE plugin,
universal context hub, context sync, GitHub Copilot instructions, Cursor rules,
Windsurf rules, Claude Projects, Gemini CLI, AI kernel, AI workspace,
task management, Kanban board, multi-agent systems, autonomous coding agents,
repository-wide analysis, refactoring assistant, code review automation,
test automation, DevOps, full‑stack development, Laravel, Vue, React, Next.js,
microservices, SaaS architecture, knowledge base, developer onboarding, DX.

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
<br><br>
<div align="center">
Made with ❤️ by [Junio de Almeida Vitorino](https://github.com/anarkaike)  <br>
Siga-me / Follow-me: https://www.linkedin.com/in/junioalmeida/
</div>

<br>

<div align="center">
  <img src="./assets/maintainer-photo.jpg" alt="Portrait of the project maintainer sitting on a chair" width="180" />
  <img src="./assets/maintainer-avatar.png" alt="Stylized avatar illustration of the project maintainer" width="180" />
</div>

---
---

<a id="lang-es"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync (Español)

> **Hub Universal de Contexto para Agentes de IA en múltiples IDEs**

**Deja de repetir tu contexto una y otra vez. Un contexto, agentes infinitos.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 ¿Qué es?

**AI Agent IDE Context Sync** es un sistema universal de gestión de contexto que sincroniza la inteligencia de tu proyecto entre **todos tus agentes de IA para código**: Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity y más.

En lugar de mantener archivos separados como `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` y otros específicos de cada IDE, defines tu contexto **una sola vez** y el sistema lo sincroniza automáticamente con todos los agentes.

Además, utiliza el propio repositorio Git del proyecto para versionar memoria, contexto, tareas y actividades de forma persistente para cada persona creada para tus agentes de IA en los IDEs.

Haz un seguimiento preciso del checklist de cada ventana de agente de IA en archivos separados para no perder ningún paso, organizando todo por personas (identidades que cada ventana de agente puede asumir).

---

### 😫 El Problema

Estás trabajando en un proyecto Laravel + Vue con capas y patrones bien definidos. Tienes:
- `.cursorrules` para Cursor
- `.windsurfrules` para Windsurf
- `.github/copilot-instructions.md` para Copilot
- `.trae/rules/project_rules.md` para Trae
- `.claude/instructions.md` para Claude Projects

Cada vez que actualizas tu arquitectura, agregas un nuevo patrón o cambias un estándar de código, tienes que **actualizar manualmente más de 5 archivos**. Es fácil olvidarse de algo y te roba tiempo y foco.

### ✨ La Solución

```bash
npm install -g ai-agent-ide-context-sync
cd tu-proyecto
ai-doc init
```

Ahora **todos tus agentes comparten el mismo cerebro**. Actualizas una vez, se sincroniza en todas partes.

---

## 🚀 Inicio Rápido

### Instalación

```bash
npm install -g ai-agent-ide-context-sync
```

### Configuración en 2 Pasos

```bash
# 1. Ve a tu proyecto
cd mi-proyecto-laravel

# 2. Inicializa el workspace y genera el contexto para todos los agentes
ai-doc init
```

**Listo.** Ahora tienes archivos sincronizados para:
- ✅ Cursor (`.cursorrules`)
- ✅ Windsurf (`.windsurfrules`)
- ✅ GitHub Copilot (`.github/copilot-instructions.md`)
- ✅ Trae (`.trae/rules/project_rules.md`)
- ✅ Claude Projects (`.claude/instructions.md`)
- ✅ Gemini CLI (`.google/instructions.md`)
- ✅ Antigravity (`.ai-workspace/cache/compiled/ai-instructions.md`)

---

## ✨ Funcionalidades Clave

### 🔄 Sincronización Universal
Un único comando (`ai-doc init`) genera el contexto para **7+ IDEs/Agentes** al mismo tiempo.

### 🧬 Arquitectura Modular
- **Módulos Core**: Identity, Memory, Tasks, Analysis
- **Integraciones de Stack**: Laravel, Vue, React, Next.js (extensible)
- **Motor de Heurísticas**: Aprende patrones automáticamente desde tu código
- **Sistema Soul**: Base de conocimiento portátil (exporta/importa tus aprendizajes)

### 🚀 Auto-Evolución
El sistema aprende de tus interacciones:
- 📍 Patrones de navegación (rutas Laravel, componentes Vue)
- 🎯 Optimización de prompts
- 🏗️ Patrones de código y anti-patrones
- 💡 Insights técnicos

### 🌍 Conocimiento Portátil
Exporta tu "Soul" (conocimiento acumulado) y compártelo con tu equipo:

```bash
# Exportar
ai-doc soul export
# Crea: soul-backup-20260116.tar.gz

# Importar en otra máquina
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📚 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `ai-doc init` | Inicializa el workspace en el proyecto actual |
| `ai-doc build` | Compila y sincroniza el contexto para todos los IDEs |
| `ai-doc status` | Muestra la versión del kernel y estadísticas |
| `ai-doc heuristics` | Lista todas las heurísticas aprendidas |
| `ai-doc soul export` | Exporta la base de conocimiento |
| `ai-doc soul import <file>` | Importa la base de conocimiento |
| `ai-doc identity create <name>` | Crea una nueva persona de agente |

---

## 🏗️ Arquitectura

```
~/.ai-doc/
├── kernel/          # Inteligencia global (compartida por todos los proyectos)
│   ├── modules/     # Core, Identity, Memory, Tasks, Analysis
│   ├── heuristics/  # Patrones auto-aprendidos
│   └── cli/         # Interfaz de línea de comandos
└── soul/            # Base de conocimiento portátil
    └── experience/  # Experiencia en Laravel, Vue, React

tu-proyecto/
└── .ai-workspace/   # Contexto local del proyecto
    ├── config.yaml  # Metadatos del proyecto
    ├── personas/    # Identidades de agentes de IA
    ├── tasks/       # Seguimiento de trabajo activo
    └── analysis/    # Decisiones arquitectónicas
```

---

## 🎭 Sistema de Identidad

Crea personas de agentes de IA con experiencia específica:

```bash
ai-doc identity create AI-NARUTO
```

Cada persona tiene:
- 🎯 Especialidades técnicas
- 💬 Estilo de comunicación
- ⚙️ Preferencias de trabajo
- 📋 Historial de tareas
- 🧠 Espacio de razonamiento ("Mesa de Raciocinio")

---

## 🧪 Motor de Heurísticas

El sistema aprende automáticamente:

- **Patrones de Navegación**: "Al trabajar con Laravel, revisa siempre `routes/web.php` primero"
- **Optimización de Prompts**: "Usa la bandera `--filter` para los tests de PHPUnit"
- **Patrones de Código**: "La multi-tenencia requiere filtrar por `business_id`"

Estas heurísticas se almacenan en `~/.ai-doc/kernel/heuristics/` y se aplican en todos tus proyectos.

---

## 🌌 Sistema Soul

La "Soul" es tu sabiduría técnica acumulada:

- **Pitfalls**: Errores comunes y cómo evitarlos
- **Patterns**: Soluciones arquitectónicas probadas
- **Insights**: Lecciones aprendidas en producción

Expórtala, compártela con tu equipo o impórtala en una nueva máquina.

---

## 🔧 Ejemplo Completo de Uso

```bash
# Instalar globalmente
npm install -g ai-agent-ide-context-sync

# Navegar a tu proyecto
cd ~/proyectos/mi-sistema-laravel

# Inicializar el workspace y construir el contexto para todos los agentes
ai-doc init
# ✅ Creado: .ai-workspace/config.yaml
# ✅ Creado: .ai-workspace/personas/
# ✅ Creado: .ai-workspace/tasks/
# ✅ Sincronizado: Cursor (.cursorrules)
# ✅ Sincronizado: Windsurf (.windsurfrules)
# ✅ Sincronizado: Copilot (.github/copilot-instructions.md)
# ✅ Sincronizado: Trae (.trae/rules/project_rules.md)
# ✅ Sincronizado: Claude (.claude/instructions.md)
# ✅ Sincronizado: Gemini (.google/instructions.md)
# ✅ Sincronizado: Generic/Antigravity (.ai-workspace/cache/compiled/ai-instructions.md)

# Verificar estado
ai-doc status
# === 🔧 AI KERNEL (Global) ===
#    Versión: 2.0.0
#    Inteligencia: 15 heurísticas aprendidas
#
# === 📁 AI WORKSPACE (Local) ===
#    Proyecto: mi-sistema-laravel
#    Path: /Users/tu/proyectos/mi-sistema-laravel/.ai-workspace

# Crear una persona
ai-doc identity create AI-SAKURA

# Exportar conocimiento
ai-doc soul export
# ✅ Exportado: soul-backup-20260116.tar.gz
```

---

## 🎯 Casos de Uso

### 1. Equipos Multi-IDE
¿Tu equipo usa Cursor, Windsurf y Copilot? Sin problema. Un único `ai-doc build` mantiene todo sincronizado.

### 2. Onboarding de Nuevos Desarrolladores
Exporta tu "Soul" y compártela con las nuevas personas del equipo. Al importarla, ya tendrán todo el conocimiento acumulado del proyecto.

### 3. Múltiples Proyectos
El Kernel es global. Las heurísticas aprendidas en un proyecto Laravel se aplican automáticamente en otros proyectos Laravel.

### 4. Migración de IDE
¿Pasaste de Cursor a Windsurf? Ejecuta `ai-doc build` y el contexto se sincroniza al instante.

---

## 💻 Extensión VS Code (interfaz visual)

¿Prefieres gestionar todo mediante una interfaz visual dentro de VS Code?

- Gestiona personas de IA, tareas y checklists sin salir del editor
- Usa un temporizador Pomodoro integrado y atajos de teclado para mantener el foco
- Consulta dashboards con estadísticas en tiempo real de tu AI Workspace

Instala la extensión AI Agent IDE Context Sync para VS Code:
- Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)
- Detalles de la interfaz: [README de la extensión](../extension/README.md)

---

## 📖 Documentación Completa

- 📘 [Guía Completa](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- 🤝 [Guía de Contribución](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md)
- 📝 [Changelog](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CHANGELOG.md)
- 🐛 [Reportar Bug](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor, lee primero nuestra [Guía de Contribución](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md).

---

## 📄 Licencia

MIT © Junio

---

## 🙏 Agradecimientos

Inspirado por la necesidad de una capa de contexto universal en la era del desarrollo asistido por IA.

Construido con ❤️ para desarrolladores cansados de copiar y pegar las mismas instrucciones en 5 IDEs diferentes.

---

**Deja de repetir lo mismo. Empieza a sincronizar.**

```bash
npm install -g ai-agent-ide-context-sync
```

---
---

<a id="lang-it"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync (Italiano)

> **Hub Universale di Contesto per Agenti di IA su più IDE**

**Smetti di ripeterti. Un contesto, agenti infiniti.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 Che cos’è?

**AI Agent IDE Context Sync** è un sistema universale di gestione del contesto che sincronizza l’intelligenza del tuo progetto tra **tutti i tuoi agenti di IA per il codice**: Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity e molti altri.

Invece di mantenere file separati come `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` e altri specifici per ogni IDE, definisci il tuo contesto **una sola volta** e il sistema lo sincronizza automaticamente con tutti gli agenti.

In più, utilizza il repository Git del progetto per versionare memoria, contesto, task e attività in modo persistente per ogni persona creata per i tuoi agenti di IA negli IDE.

Tieni traccia con precisione del checklist di ogni finestra di agente di IA in file separati, così non perdi nessun passo e organizzi tutto per persona (identità che ogni finestra di agente può assumere).

---

### 😫 Il Problema

Stai lavorando a un progetto Laravel + Vue con livelli e pattern ben definiti. Hai:
- `.cursorrules` per Cursor
- `.windsurfrules` per Windsurf
- `.github/copilot-instructions.md` per Copilot
- `.trae/rules/project_rules.md` per Trae
- `.claude/instructions.md` per Claude Projects

Ogni volta che aggiorni l’architettura, aggiungi un nuovo pattern o cambi uno standard di codice, devi **aggiornare manualmente più di 5 file**. È facile dimenticare qualcosa e ti fa perdere tempo e concentrazione.

### ✨ La Soluzione

```bash
npm install -g ai-agent-ide-context-sync
cd tuo-progetto
ai-doc init
```

Ora **tutti i tuoi agenti condividono lo stesso cervello**. Aggiorni una volta, si sincronizza ovunque.

---

## 🚀 Guida Rapida

### Installazione

```bash
npm install -g ai-agent-ide-context-sync
```

### Configurazione in 2 Passaggi

```bash
# 1. Vai al tuo progetto
cd mio-progetto-laravel

# 2. Inizializza il workspace e crea il contesto per tutti gli agenti
ai-doc init
```

**Fatto.** Ora hai file sincronizzati per:
- ✅ Cursor (`.cursorrules`)
- ✅ Windsurf (`.windsurfrules`)
- ✅ GitHub Copilot (`.github/copilot-instructions.md`)
- ✅ Trae (`.trae/rules/project_rules.md`)
- ✅ Claude Projects (`.claude/instructions.md`)
- ✅ Gemini CLI (`.google/instructions.md`)
- ✅ Antigravity (`.ai-workspace/cache/compiled/ai-instructions.md`)

---

## ✨ Caratteristiche Principali

### 🔄 Sincronizzazione Universale
Un solo comando (`ai-doc init`) genera il contesto per **7+ IDE/Agenti** contemporaneamente.

### 🧬 Architettura Modulare
- **Moduli Core**: Identity, Memory, Tasks, Analysis
- **Integrazioni di Stack**: Laravel, Vue, React, Next.js (estendibile)
- **Motore di Euristiche**: Impara automaticamente i pattern dal tuo codice
- **Sistema Soul**: Base di conoscenza portabile (esporta/importa i tuoi apprendimenti)

### 🚀 Auto-Evoluzione
Il sistema impara dalle tue interazioni:
- 📍 Pattern di navigazione (route Laravel, componenti Vue)
- 🎯 Ottimizzazione dei prompt
- 🏗️ Pattern di codice e anti-pattern
- 💡 Insight tecnici

### 🌍 Conoscenza Portabile
Esporta la tua "Soul" (conoscenza accumulata) e condividila con il tuo team:

```bash
# Esporta
ai-doc soul export
# Crea: soul-backup-20260116.tar.gz

# Importa su un’altra macchina
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📚 Comandi Disponibili

| Comando | Descrizione |
|---------|------------|
| `ai-doc init` | Inizializza il workspace nel progetto corrente |
| `ai-doc build` | Compila e sincronizza il contesto per tutti gli IDE |
| `ai-doc status` | Mostra la versione del kernel e le statistiche |
| `ai-doc heuristics` | Elenca tutte le euristiche apprese |
| `ai-doc soul export` | Esporta la base di conoscenza |
| `ai-doc soul import <file>` | Importa la base di conoscenza |
| `ai-doc identity create <name>` | Crea una nuova persona di agente |

---

## 🏗️ Architettura

```
~/.ai-doc/
├── kernel/          # Intelligenza globale (condivisa tra tutti i progetti)
│   ├── modules/     # Core, Identity, Memory, Tasks, Analysis
│   ├── heuristics/  # Pattern auto-appresi
│   └── cli/         # Interfaccia a riga di comando
└── soul/            # Base di conoscenza portabile
    └── experience/  # Esperienze su Laravel, Vue, React

tuo-progetto/
└── .ai-workspace/   # Contesto locale del progetto
    ├── config.yaml  # Metadati del progetto
    ├── personas/    # Identità degli agenti IA
    ├── tasks/       # Tracciamento del lavoro attivo
    └── analysis/    # Decisioni architetturali
```

---

## 🎭 Sistema di Identità

Crea persone di agenti IA con competenze specifiche:

```bash
ai-doc identity create AI-NARUTO
```

Ogni persona ha:
- 🎯 Specializzazioni tecniche
- 💬 Stile di comunicazione
- ⚙️ Preferenze di lavoro
- 📋 Storico delle task
- 🧠 Spazio di ragionamento ("Mesa de Raciocínio")

---

## 🧪 Motore di Euristiche

Il sistema impara automaticamente:

- **Pattern di Navigazione**: "Quando lavori con Laravel, controlla prima `routes/web.php`"
- **Ottimizzazione dei Prompt**: "Usa il flag `--filter` per i test PHPUnit"
- **Pattern di Codice**: "La multi-tenancy richiede il filtro per `business_id`"

Queste euristiche vengono salvate in `~/.ai-doc/kernel/heuristics/` e applicate a tutti i progetti.

---

## 🌌 Sistema Soul

La "Soul" è la tua saggezza tecnica accumulata:

- **Pitfall**: Errori comuni e come evitarli
- **Pattern**: Soluzioni architetturali collaudate
- **Insight**: Lezioni apprese in produzione

Puoi esportarla, condividerla con il team o importarla su una nuova macchina.

---

## 🔧 Esempio Completo di Utilizzo

```bash
# Installa globalmente
npm install -g ai-agent-ide-context-sync

# Vai al tuo progetto
cd ~/progetti/mio-sistema-laravel

# Inizializza il workspace e crea il contesto per tutti gli agenti
ai-doc init
# ✅ Creato: .ai-workspace/config.yaml
# ✅ Creato: .ai-workspace/personas/
# ✅ Creato: .ai-workspace/tasks/
# ✅ Sincronizzato: Cursor (.cursorrules)
# ✅ Sincronizzato: Windsurf (.windsurfrules)
# ✅ Sincronizzato: Copilot (.github/copilot-instructions.md)
# ✅ Sincronizzato: Trae (.trae/rules/project_rules.md)
# ✅ Sincronizzato: Claude (.claude/instructions.md)
# ✅ Sincronizzato: Gemini (.google/instructions.md)
# ✅ Sincronizzato: Generic/Antigravity (.ai-workspace/cache/compiled/ai-instructions.md)

# Controlla lo stato
ai-doc status
# === 🔧 AI KERNEL (Global) ===
#    Versione: 2.0.0
#    Intelligenza: 15 euristiche apprese
#
# === 📁 AI WORKSPACE (Local) ===
#    Progetto: mio-sistema-laravel
#    Path: /Users/tu/progetti/mio-sistema-laravel/.ai-workspace

# Crea una persona
ai-doc identity create AI-SAKURA

# Esporta la conoscenza
ai-doc soul export
# ✅ Esportato: soul-backup-20260116.tar.gz
```

---

## 🎯 Casi d’Uso

### 1. Team Multi-IDE
Il tuo team usa Cursor, Windsurf e Copilot? Nessun problema. Un solo `ai-doc build` mantiene tutto sincronizzato.

### 2. Onboarding di Nuovi Sviluppatori
Esporta la tua "Soul" e condividila con i nuovi membri del team. Una volta importata, avranno già tutta la conoscenza accumulata del progetto.

### 3. Più Progetti
Il Kernel è globale. Le euristiche apprese in un progetto Laravel vengono applicate automaticamente agli altri progetti Laravel.

### 4. Migrazione di IDE
Sei passato da Cursor a Windsurf? Esegui `ai-doc build` e il contesto viene sincronizzato all’istante.

---

## 💻 Estensione VS Code (interfaccia visuale)

Preferisci gestire tutto da un’interfaccia visuale dentro VS Code?

- Gestisci persone IA, task e checklist senza uscire dall’editor
- Mantieni il focus con il timer Pomodoro integrato e le scorciatoie da tastiera
- Esplora dashboard con statistiche in tempo reale sul tuo AI Workspace

Installa l’estensione AI Agent IDE Context Sync per VS Code:
- Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)
- Dettagli: [README dell’estensione](../extension/README.md)

---

## 📖 Documentazione Completa

- 📘 [Guida Completa](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- 🤝 [Guida alla Contribuzione](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md)
- 📝 [Changelog](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CHANGELOG.md)
- 🐛 [Segnala un Bug](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 🤝 Contribuire

Le contribuzioni sono benvenute. Leggi prima la nostra [Guida alla Contribuzione](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md).

---

## 📄 Licenza

MIT © Junio

---

## 🙏 Ringraziamenti

Ispirato dal bisogno di uno strato di contesto universale nell’era dello sviluppo assistito dall’IA.

Costruito con ❤️ per sviluppatori stanchi di copiare e incollare le stesse istruzioni in 5 IDE diversi.

---

**Smetti di ripeterti. Inizia a sincronizzare.**

```bash
npm install -g ai-agent-ide-context-sync
```

---
---

<a id="lang-fr"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync (Français)

> **Hub de Contexte Universel pour Agents IA sur plusieurs IDE**

**Arrêtez de vous répéter. Un contexte, une infinité d’agents.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 Qu’est-ce que c’est ?

**AI Agent IDE Context Sync** est un système universel de gestion de contexte qui synchronise l’intelligence de votre projet entre **tous vos agents IA pour le code** : Cursor, Windsurf, Trae, Claude, Copilot, Gemini, Antigravity et plus encore.

Au lieu de maintenir des fichiers séparés comme `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` et d’autres spécifiques à chaque IDE, vous définissez votre contexte **une seule fois** et le système le synchronise automatiquement vers tous les agents.

Il utilise en plus le dépôt Git du projet pour versionner mémoire, contexte, tâches et activités de manière persistante pour chaque persona créée pour vos agents IA dans les IDE.

Vous pouvez suivre précisément la checklist de chaque fenêtre d’agent IA dans des fichiers séparés, afin de ne rien oublier, tout en organisant le travail par personas (identités que chaque fenêtre d’agent peut adopter).

---

### 😫 Le Problème

Vous travaillez sur un projet Laravel + Vue avec des couches et des patterns bien définis. Vous avez :
- `.cursorrules` pour Cursor
- `.windsurfrules` pour Windsurf
- `.github/copilot-instructions.md` pour Copilot
- `.trae/rules/project_rules.md` pour Trae
- `.claude/instructions.md` pour Claude Projects

À chaque fois que vous mettez à jour votre architecture, que vous ajoutez un nouveau pattern ou que vous modifiez une convention de code, vous devez **mettre à jour manuellement plus de 5 fichiers**. Il est facile d’en oublier un, et cela casse votre flux de travail.

### ✨ La Solution

```bash
npm install -g ai-agent-ide-context-sync
cd votre-projet
ai-doc init
```

Ensuite, **tous vos agents partagent le même cerveau**. Une mise à jour, synchronisation partout.

---

## 🚀 Démarrage Rapide

### Installation

```bash
npm install -g ai-agent-ide-context-sync
```

### Configuration en 2 Étapes

```bash
# 1. Aller dans votre projet
cd mon-projet-laravel

# 2. Initialiser le workspace et construire le contexte pour tous les agents
ai-doc init
```

**C’est tout.** Vous avez maintenant des fichiers synchronisés pour :
- ✅ Cursor (`.cursorrules`)
- ✅ Windsurf (`.windsurfrules`)
- ✅ GitHub Copilot (`.github/copilot-instructions.md`)
- ✅ Trae (`.trae/rules/project_rules.md`)
- ✅ Claude Projects (`.claude/instructions.md`)
- ✅ Gemini CLI (`.google/instructions.md`)
- ✅ Antigravity (`.ai-workspace/cache/compiled/ai-instructions.md`)

---

## ✨ Fonctionnalités Clés

### 🔄 Synchronisation Universelle
Une seule commande (`ai-doc init`) génère le contexte pour **7+ IDE/Agents** simultanément.

### 🧬 Architecture Modulaire
- **Modules Core** : Identity, Memory, Tasks, Analysis
- **Intégrations de Stack** : Laravel, Vue, React, Next.js (extensible)
- **Moteur d’Heuristiques** : Apprend automatiquement les patterns de votre code
- **Système Soul** : Base de connaissance portable (export/import de vos apprentissages)

### 🚀 Auto-Évolution
Le système apprend de vos interactions :
- 📍 Patterns de navigation (routes Laravel, composants Vue)
- 🎯 Optimisation de prompts
- 🏗️ Patterns de code et anti-patterns
- 💡 Insights techniques

### 🌍 Connaissance Portable
Exportez votre "Soul" (connaissance accumulée) et partagez-la avec votre équipe :

```bash
# Exporter
ai-doc soul export
# Crée : soul-backup-20260116.tar.gz

# Importer sur une autre machine
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📚 Commandes Disponibles

| Commande | Description |
|---------|-------------|
| `ai-doc init` | Initialise le workspace dans le projet actuel |
| `ai-doc build` | Compile et synchronise le contexte pour tous les IDE |
| `ai-doc status` | Affiche la version du kernel et les statistiques |
| `ai-doc heuristics` | Liste toutes les heuristiques apprises |
| `ai-doc soul export` | Exporte la base de connaissance |
| `ai-doc soul import <file>` | Importe la base de connaissance |
| `ai-doc identity create <name>` | Crée une nouvelle persona d’agent |

---

## 🏗️ Architecture

```
~/.ai-doc/
├── kernel/          # Intelligence globale (partagée entre tous les projets)
│   ├── modules/     # Core, Identity, Memory, Tasks, Analysis
│   ├── heuristics/  # Patterns auto-appris
│   └── cli/         # Interface en ligne de commande
└── soul/            # Base de connaissance portable
    └── experience/  # Expérience Laravel, Vue, React

votre-projet/
└── .ai-workspace/   # Contexte local du projet
    ├── config.yaml  # Métadonnées du projet
    ├── personas/    # Identités d’agents IA
    ├── tasks/       # Suivi du travail en cours
    └── analysis/    # Décisions architecturales
```

---

## 🎭 Système d’Identité

Créez des personas d’agents IA avec une expertise spécifique :

```bash
ai-doc identity create AI-NARUTO
```

Chaque persona possède :
- 🎯 Spécialités techniques
- 💬 Style de communication
- ⚙️ Préférences de travail
- 📋 Historique des tâches
- 🧠 Espace de raisonnement ("Mesa de Raciocínio")

---

## 🧪 Moteur d’Heuristiques

Le système apprend automatiquement :

- **Patterns de Navigation** : "Avec Laravel, vérifiez toujours `routes/web.php` en premier"
- **Optimisation de Prompts** : "Utilisez le flag `--filter` pour les tests PHPUnit"
- **Patterns de Code** : "La multi-tenance nécessite un filtre par `business_id`"

Ces heuristiques sont stockées dans `~/.ai-doc/kernel/heuristics/` et appliquées à tous vos projets.

---

## 🌌 Système Soul

La "Soul" est votre sagesse technique cumulée :

- **Pièges** : Erreurs fréquentes et comment les éviter
- **Patterns** : Solutions architecturales éprouvées
- **Insights** : Leçons apprises en production

Vous pouvez l’exporter, la partager avec votre équipe ou l’importer sur une nouvelle machine.

---

## 🔧 Exemple Complet d’Utilisation

```bash
# Installer globalement
npm install -g ai-agent-ide-context-sync

# Aller dans votre projet
cd ~/projets/mon-système-laravel

# Initialiser le workspace et construire le contexte pour tous les agents
ai-doc init
# ✅ Créé : .ai-workspace/config.yaml
# ✅ Créé : .ai-workspace/personas/
# ✅ Créé : .ai-workspace/tasks/
# ✅ Synchronisé : Cursor (.cursorrules)
# ✅ Synchronisé : Windsurf (.windsurfrules)
# ✅ Synchronisé : Copilot (.github/copilot-instructions.md)
# ✅ Synchronisé : Trae (.trae/rules/project_rules.md)
# ✅ Synchronisé : Claude (.claude/instructions.md)
# ✅ Synchronisé : Gemini (.google/instructions.md)
# ✅ Synchronisé : Generic/Antigravity (.ai-workspace/cache/compiled/ai-instructions.md)

# Vérifier le statut
ai-doc status
# === 🔧 AI KERNEL (Global) ===
#    Version : 2.0.0
#    Intelligence : 15 heuristiques apprises
#
# === 📁 AI WORKSPACE (Local) ===
#    Projet : mon-système-laravel
#    Path : /Users/vous/projets/mon-système-laravel/.ai-workspace

# Créer une persona
ai-doc identity create AI-SAKURA

# Exporter la connaissance
ai-doc soul export
# ✅ Exporté : soul-backup-20260116.tar.gz
```

---

## 🎯 Cas d’Usage

### 1. Équipes Multi-IDE
Votre équipe utilise Cursor, Windsurf et Copilot ? Aucun problème. Une commande `ai-doc build` garde tout synchronisé.

### 2. Onboarding de Nouveaux Développeurs
Exportez votre "Soul" et partagez-la avec les nouveaux membres de l’équipe. Une fois importée, ils disposent déjà de toute la connaissance accumulée du projet.

### 3. Projets Multiples
Le Kernel est global. Les heuristiques apprises sur un projet Laravel sont automatiquement appliquées aux autres projets Laravel.

### 4. Migration d’IDE
Vous êtes passé de Cursor à Windsurf ? Lancez `ai-doc build` et le contexte est synchronisé instantanément.

---

## 💻 Extension VS Code (interface visuelle)

Vous préférez une interface visuelle directement dans VS Code ?

- Gérez les personas IA, tâches et checklists sans quitter l’éditeur
- Restez concentré grâce au timer Pomodoro intégré et aux raccourcis clavier
- Consultez des dashboards avec des statistiques en temps réel sur votre AI Workspace

Installez l’extension AI Agent IDE Context Sync pour VS Code :
- Open VSX : [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)
- Détails : [README de l’extension](../extension/README.md)

---

## 📖 Documentation Complète

- 📘 [Guide Complet](https://github.com/anarkaike/ai-agent-ide-context-sync/wiki)
- 🤝 [Guide de Contribution](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md)
- 📝 [Changelog](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CHANGELOG.md)
- 🐛 [Signaler un Bug](https://github.com/anarkaike/ai-agent-ide-context-sync/issues)

---

## 🤝 Contribution

Les contributions sont les bienvenues. Merci de lire d’abord notre [Guide de Contribution](https://github.com/anarkaike/ai-agent-ide-context-sync/blob/main/CONTRIBUTING.md).

---

## 📄 Licence

MIT © Junio

---

## 🙏 Remerciements

Inspiré par le besoin d’une couche de contexte universelle à l’ère du développement assisté par l’IA.

Construit avec ❤️ pour les développeurs fatigués de copier-coller les mêmes instructions dans 5 IDE différents.

---

**Arrêtez de vous répéter. Commencez à synchroniser.**

```bash
npm install -g ai-agent-ide-context-sync
```

---
---

<a id="lang-ja"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync (日本語)

> **複数のIDEにまたがるAIエージェント向けユニバーサルコンテキストハブ**

**同じ説明を何度もするのはやめましょう。コンテキストは1つ、エージェントは無限。**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 これは何か？

**AI Agent IDE Context Sync** は、Cursor、Windsurf、Trae、Claude、Copilot、Gemini、Antigravity など、**あらゆるAIコーディングエージェント**間でプロジェクトの知識を同期する、ユニバーサルなコンテキスト管理システムです。

`.cursorrules`、`.windsurfrules`、`.github/copilot-instructions.md` など、IDEごとに別々のファイルを保守する代わりに、コンテキストを **一度だけ** 定義すれば、システムがすべてのエージェントに自動的に同期します。

さらに、プロジェクトのGitリポジトリ自体を使って、ペルソナごとのメモリ、コンテキスト、タスク、アクティビティを永続的にバージョン管理します。

IDEの各エージェントウィンドウごとのチェックリストをファイルとして正確に追跡し、ペルソナ（各エージェントウィンドウが持つ「人格」）ごとに整理できます。

---

### 😫 問題

レイヤーやパターンが整理された Laravel + Vue プロジェクトを開発しているとします。次のようなファイルがあります。
- Cursor 用の `.cursorrules`
- Windsurf 用の `.windsurfrules`
- Copilot 用の `.github/copilot-instructions.md`
- Trae 用の `.trae/rules/project_rules.md`
- Claude Projects 用の `.claude/instructions.md`

アーキテクチャを更新したり、新しいパターンを追加したり、コーディング規約を変更するたびに、**5つ以上のファイルを手作業で更新**しなければなりません。何かを更新し忘れやすく、集中力と時間を奪われます。

### ✨ 解決策

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
```

これで **すべてのエージェントが同じ「脳」を共有**します。1回更新すれば、あとは自動で同期されます。

---

## 🚀 クイックスタート

### インストール

```bash
npm install -g ai-agent-ide-context-sync
```

### 2ステップでセットアップ

```bash
# 1. プロジェクトディレクトリへ移動
cd my-laravel-project

# 2. ワークスペースを初期化し、すべてのエージェント向けコンテキストをビルド
ai-doc init
```

**完了です。** 以下のファイルが自動生成・同期されます:
- ✅ Cursor (`.cursorrules`)
- ✅ Windsurf (``.windsurfrules``)
- ✅ GitHub Copilot (`.github/copilot-instructions.md`)
- ✅ Trae (`.trae/rules/project_rules.md`)
- ✅ Claude Projects (`.claude/instructions.md`)
- ✅ Gemini CLI (`.google/instructions.md`)
- ✅ Antigravity (`.ai-workspace/cache/compiled/ai-instructions.md`)

---

## ✨ 主な機能

### 🔄 ユニバーサル同期
`ai-doc init` の **1コマンド** で、7種類以上のIDE/エージェント向けコンテキストを同時に生成します。

### 🧬 モジュール型アーキテクチャ
- **コアモジュール**: Identity, Memory, Tasks, Analysis
- **スタック統合**: Laravel, Vue, React, Next.js（拡張可能）
- **ヒューリスティックエンジン**: コードベースからパターンを自動学習
- **Soulシステム**: ポータブルなナレッジベース（学習内容のエクスポート/インポート）

### 🚀 自己進化
システムはあなたの操作から学習します:
- 📍 ナビゲーションパターン（Laravelのルート、Vueコンポーネントなど）
- 🎯 プロンプト最適化
- 🏗️ コードパターンとアンチパターン
- 💡 技術的インサイト

### 🌍 ポータブルナレッジ
蓄積した「Soul」（知識ベース）をエクスポートして、チームと共有できます:

```bash
# エクスポート
ai-doc soul export
# 生成: soul-backup-20260116.tar.gz

# 別マシンでインポート
ai-doc soul import soul-backup-20260116.tar.gz
```

---

## 📚 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `ai-doc init` | 現在のプロジェクトにワークスペースを初期化 |
| `ai-doc build` | すべてのIDE向けにコンテキストをコンパイル・同期 |
| `ai-doc status` | カーネルバージョンと統計情報を表示 |
| `ai-doc heuristics` | 学習済みヒューリスティックを一覧表示 |
| `ai-doc soul export` | ナレッジベースをエクスポート |
| `ai-doc soul import <file>` | ナレッジベースをインポート |
| `ai-doc identity create <name>` | 新しいエージェントペルソナを作成 |

---

## 🏗️ アーキテクチャ

```
~/.ai-doc/
├── kernel/          # グローバルインテリジェンス（すべてのプロジェクトで共有）
│   ├── modules/     # Core, Identity, Memory, Tasks, Analysis
│   ├── heuristics/  # 自動学習されたパターン
│   └── cli/         # コマンドラインインターフェース
└── soul/            # ポータブルナレッジベース
    └── experience/  # Laravel, Vue, React などの知見

your-project/
└── .ai-workspace/   # プロジェクトローカルのコンテキスト
    ├── config.yaml  # プロジェクトメタデータ
    ├── personas/    # AIエージェントのペルソナ
    ├── tasks/       # アクティブなタスク追跡
    └── analysis/    # アーキテクチャ上の決定
```

---

## 🎭 アイデンティティシステム

特定分野に特化したAIエージェントのペルソナを作成できます:

```bash
ai-doc identity create AI-NARUTO
```

各ペルソナは以下を持ちます:
- 🎯 技術的な専門領域
- 💬 コミュニケーションスタイル
- ⚙️ 作業の好み
- 📋 タスク履歴
- 🧠 推論スペース（「思考のテーブル」）

---

## 🧪 ヒューリスティックエンジン

システムは自動的に次を学習します:

- **ナビゲーションパターン**: 「Laravelで作業するときは、まず `routes/web.php` を確認」
- **プロンプト最適化**: 「PHPUnitテストには `--filter` フラグを活用」
- **コードパターン**: 「マルチテナントでは常に `business_id` でフィルタ」

学習されたヒューリスティックは `~/.ai-doc/kernel/heuristics/` に保存され、すべてのプロジェクトで再利用されます。

---

## 🌌 Soulシステム

「Soul」は、あなたが積み上げてきた技術的知見の集約です:

- **Pitfalls**: よくある落とし穴と回避方法
- **Patterns**: 実戦で検証されたアーキテクチャパターン
- **Insights**: 本番環境から得られた学び

エクスポートしてチームと共有したり、新しいマシンにインポートしたりできます。

---

## 🔧 使用例（フルフロー）

```bash
# グローバルインストール
npm install -g ai-agent-ide-context-sync

# プロジェクトへ移動
cd ~/projects/my-laravel-system

# ワークスペースを初期化し、すべてのエージェント向けコンテキストをビルド
ai-doc init
# ✅ 作成: .ai-workspace/config.yaml
# ✅ 作成: .ai-workspace/personas/
# ✅ 作成: .ai-workspace/tasks/
# ✅ 同期: Cursor (.cursorrules)
# ✅ 同期: Windsurf (.windsurfrules)
# ✅ 同期: Copilot (.github/copilot-instructions.md)
# ✅ 同期: Trae (.trae/rules/project_rules.md)
# ✅ 同期: Claude (.claude/instructions.md)
# ✅ 同期: Gemini (.google/instructions.md)
# ✅ 同期: Generic/Antigravity (.ai-workspace/cache/compiled/ai-instructions.md)

# ステータス確認
ai-doc status
# === 🔧 AI KERNEL (Global) ===
#    Version: 2.0.0
#    Intelligence: 15 learned heuristics
#
# === 📁 AI WORKSPACE (Local) ===
#    Project: my-laravel-system
#    Path: /Users/you/projects/my-laravel-system/.ai-workspace

# ペルソナ作成
ai-doc identity create AI-SAKURA

# ナレッジをエクスポート
ai-doc soul export
# ✅ Exported: soul-backup-20260116.tar.gz
```

---

## 🎯 ユースケース

### 1. 複数IDEを使うチーム
チームで Cursor、Windsurf、Copilot を併用していますか？ `ai-doc build` 1回で全員が同じコンテキストを共有できます。

### 2. 新メンバーのオンボーディング
「Soul」をエクスポートして新メンバーに共有すれば、インポートするだけでプロジェクトの蓄積知識を手に入れられます。

### 3. 複数プロジェクト
Kernel はグローバルです。ある Laravel プロジェクトで学習されたヒューリスティックは、他の Laravel プロジェクトにも自動的に適用されます。

### 4. IDE移行
Cursor から Windsurf に移行しましたか？ `ai-doc build` を実行すれば、コンテキストがすぐに同期されます。

---

<a id="lang-zh"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync（中文）

> **面向多款 IDE 的通用 AI 上下文中枢**

**告别重复讲解项目背景。一个上下文，服务所有 AI 代码助手。**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync-v2.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync-v2)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync-v2.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 这是什么？

**AI Agent IDE Context Sync** 是一个通用的上下文管理系统，可以在 **所有 AI 编程助手和 IDE** 之间同步你的项目知识：Cursor、Windsurf、Trae、Claude、Copilot、Gemini、Antigravity 等等。

无需再为每个工具维护独立的 `.cursorrules`、`.windsurfrules`、`.github/copilot-instructions.md` 等文件，只需在一个地方编写上下文，系统会自动生成并同步到所有代理。

项目的 Git 仓库会作为“真实来源（source of truth）”，为每个 AI persona 持久化存储上下文、记忆、任务和活动。

---

### 😫 痛点

- 同时使用 Cursor、Windsurf、Copilot、Claude、Trae 等多种工具  
- 每次修改架构或编码规范，都要手动更新 **5 个以上文件**  
- 不同 IDE 之间的上下文容易不一致，给 AI 的说明经常“过期”

---

### ✨ 解决方案

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
```

- 统一的“AI Kernel（内核）”管理上下文  
- 一次更新，自动同步到所有 IDE / AI 代理  

---

## 🚀 快速开始

```bash
npm install -g ai-agent-ide-context-sync
cd my-laravel-project
ai-doc init
```

生成并同步：
- `.cursorrules`（Cursor）
- `.windsurfrules`（Windsurf）
- `.github/copilot-instructions.md`（GitHub Copilot）
- `.trae/rules/project_rules.md`（Trae）
- `.claude/instructions.md`（Claude Projects）
- `.google/instructions.md`（Gemini CLI）
- `.ai-workspace/cache/compiled/ai-instructions.md`（通用 / Antigravity）

---

## ✨ 关键特性

- 🔄 **多 IDE 上下文同步**：一个命令 `ai-doc init` 覆盖所有代理  
- 🧬 **模块化架构**：Identity、Memory、Tasks、Analysis 等核心模块  
- 🧠 **Heuristics 引擎**：自动学习你的代码导航和架构模式  
- 🌌 **Soul 系统**：可导出的技术知识库，可在多台机器 / 多个项目之间共享

---

## 💻 VS Code 可视化扩展

如果你更喜欢图形界面，可以在 VS Code 中安装扩展：

- Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 相关关键词

AI coding assistant, AI code agent, VS Code extension, IDE plugin,
multi-IDE workflow, universal context hub, context sync, AI workspace,
Kanban board, task management, AI kernel, developer productivity.

---

<a id="lang-ar"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync (العربية)

> **مركز سياق موحّد لوكلاء الذكاء الاصطناعي عبر عدّة بيئات تطوير (IDEs)**

**توقّف عن تكرار شرح مشروعك في كل مرة. سياق واحد، وكل الوكلاء يفهمون.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync-v2.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync-v2)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync-v2.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 ما هو هذا المشروع؟

**AI Agent IDE Context Sync** نظام لإدارة سياق المشروع يزامن معرفة مشروعك بين
جميع وكلاء الذكاء الاصطناعي في أدوات التطوير مثل Cursor وWindsurf وTrae وClaude
وCopilot وGemini وغيرها.

بدل أن تحافظ على ملفات قواعد منفصلة لكل أداة، تعرّف سياقك مرة واحدة فقط، وسيقوم
النظام بتوليد و مزامنة التعليمات تلقائياً لكل Agent.

---

## 😫 المشكلة

- فريقك يستخدم أكثر من IDE ووكيل ذكاء اصطناعي في نفس المشروع  
- تحديث بنية المشروع أو معاييره يعني تعديل ملفات كثيرة يدوياً  
- أي ملف منسي يجعل الوكلاء يعملون بمعلومة قديمة أو ناقصة

---

## ✨ الحل

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
```

أمر واحد يبني السياق ويقوم بالمزامنة لكل الوكلاء المدعومين.

---

## 🚀 بداية سريعة

- تثبيت الحزمة عالمياً  
- تهيئة مساحة العمل `.ai-workspace/` داخل مشروعك  
- تشغيل `ai-doc build` كلما قمت بتحديث القواعد أو الهيكلية

---

## 💻 إضافة VS Code

- يمكنك إدارة ال Personas والمهام والـ Kanban Board من داخل VS Code عن طريق
  الإضافة:
  - Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 كلمات مفتاحية

AI coding assistant, AI agents, VS Code extension, IDE integration,
context synchronization, multi-IDE teams, developer productivity.

---

<a id="lang-hi"></a>

<div align="center">

# 🧠 AI Agent IDE Context Sync (हिन्दी)

> **कई IDE में काम करने वाले AI एजेंट्स के लिए एक यूनिवर्सल कॉन्टेक्स्ट हब**

**हर बार वही आर्किटेक्चर समझाना बंद कीजिए। एक कॉन्टेक्स्ट, अनगिनत एजेंट्स.**

[![NPM Version](https://img.shields.io/npm/v/ai-agent-ide-context-sync-v2.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync-v2)
[![NPM Downloads](https://img.shields.io/npm/dm/ai-agent-ide-context-sync-v2.svg)](https://www.npmjs.com/package/ai-agent-ide-context-sync-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/anarkaike/ai-agent-ide-context-sync.svg)](https://github.com/anarkaike/ai-agent-ide-context-sync)

</div>

---

## 🎯 यह क्या है?

**AI Agent IDE Context Sync** एक ऐसा सिस्टम है जो Cursor, Windsurf, Trae,
Claude, Copilot, Gemini जैसे **सभी AI कोडिंग एजेंट्स** के बीच आपके प्रोजेक्ट का
कॉन्टेक्स्ट सिंक करता है।

हर IDE के लिए अलग‑अलग नियम फ़ाइलें रखने की जगह आप कॉन्टेक्स्ट एक बार लिखते हैं,
और सिस्टम बाकी सबके लिए सिंक्रोनाइज़ेशन संभालता है।

---

## 😫 समस्या

- टीम में कई IDE / AI tools उपयोग हो रहे हैं  
- आर्किटेक्चर या कोड स्टाइल बदलते ही 5+ फ़ाइलें मैन्युअली अपडेट करनी पड़ती हैं  
- किसी एक को भूल जाना आसान है, और AI गलत या पुरानी जानकारी से काम करता है

---

## ✨ समाधान

```bash
npm install -g ai-agent-ide-context-sync
cd your-project
ai-doc init
```

अब सारे एजेंट्स एक ही “ब्रेन” शेयर करते हैं – एक अपडेट, सब जगह सिंक.

---

## 🚀 क्विक स्टार्ट

- ग्लोबली CLI इंस्टॉल करें  
- प्रोजेक्ट में `ai-doc init` चलाकर `.ai-workspace/` बनाएँ  
- जब भी कॉन्टेक्स्ट बदलें, `ai-doc build` चलाएँ

---

## 💻 VS Code एक्सटेंशन

यदि आप विज़ुअल इंटरफ़ेस पसंद करते हैं तो VS Code एक्सटेंशन इंस्टॉल करें:

- Open VSX: [ai-agent-ide-context-sync-vscode](https://open-vsx.org/extension/junio-de-almeida-vitorino/ai-agent-ide-context-sync-vscode)

---

## 🔍 की‑वर्ड्स

AI coding assistant, AI agent, VS Code extension, IDE plugin,
context sync, multi‑IDE setup, onboarding, developer productivity, AI workspace.
