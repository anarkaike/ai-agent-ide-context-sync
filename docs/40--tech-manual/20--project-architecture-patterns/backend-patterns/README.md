---
title: Backend Patterns (CLI & Kernel)
subtitle: Organização do CLI, módulos e cache
description: Padrões de arquitetura do CLI e do kernel que orquestram a sincronização de contexto.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../../../README.md) > [Contexto Geral](../../../README.md) > [Manual Técnico](../../README.md) > [Padrões de Arquitetura](../README.md) > Backend Patterns

# 📂 Backend Patterns (CLI & Kernel)

**Padrões que governam o CLI, o kernel modular e o workspace local.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

O backend lógico do projeto é o CLI `ai-doc`, responsável por compilar módulos, sincronizar regras para múltiplas IDEs e registrar métricas no `.ai-workspace`.

> [!TIP]
> **Dica**: Relacione sempre cada padrão com arquivos reais do CLI.

## 📑 Conteúdo

Aqui você encontra:

### 📁 Entrypoint e comandos
> [!NOTE]
> Organização do roteamento de comandos e handlers.

- **[📄 Entrypoint](../../../../packages/cli/cli/ai-doc.js)**: orquestra comandos e auto-ritual.
- **[📄 Comandos base](../../../../packages/cli/commands/)**: prompt e workflows.
- **[📄 Comandos CLI](../../../../packages/cli/cli/commands/)**: build e docs.

### 📁 Kernel e módulos
- **[📄 Modules](../../../../packages/cli/modules/)**: identidade, memória, tasks, analysis, responses.
- **[📄 Core](../../../../packages/cli/core/)**: prompt generator, rules manager, smart cache.

### 📁 Workspace e cache
- **[📄 Workspace](../../../../.ai-workspace/)**: stats e compilados.

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Comandos em `packages/cli/cli/commands/` seguem nomes curtos.
2.  **Estrutura**: Cada comando deve logar status claro e atualizar cache quando aplicável.

---

## 👥 Público-alvo

- Mantenedores do CLI
- Desenvolvedores que estendem o kernel

## 🧪 Critérios de Qualidade

- Comandos idempotentes quando possível.
- Logs claros de execução e saída previsível.

## 🔄 Processo de Atualização

- **Quando atualizar**: novos comandos, mudanças no build, revisão de cache.
- **Quem atualiza**: maintainers do CLI.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto arquitetural.
> *   **[Stack](../../../55--tech-stack/README.md)**: tecnologias e versões.
