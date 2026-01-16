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
   Versão: 2.0.0-alpha.1
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
