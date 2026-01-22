---
title: Padrões de Arquitetura
subtitle: Estrutura do kernel, CLI e workspace
description: Padrões estruturais que orientam a organização do projeto e seus módulos.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../../README.md) > [Contexto Geral](../../README.md) > [Manual Técnico](../README.md) > Padrões de Arquitetura

# 📂 Padrões de Arquitetura

**Guia da estrutura de monorepo, kernel modular e fluxo de compilação de contexto.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

O projeto adota **monorepo** com dois pacotes principais: `packages/cli` (kernel/CLI) e `packages/extension` (VS Code). O CLI compila regras e módulos para múltiplos formatos de IDE e persiste o estado no `.ai-workspace`.

> [!TIP]
> **Dica**: Mapeie decisões arquiteturais sempre que a estrutura do kernel ou build mudar.

## 📑 Conteúdo

Aqui você encontra:

### 📁 Padrões de CLI/Kernel
> [!NOTE]
> Como o CLI orquestra build, ritual e cache.

- **[📄 Entry Point](../../../packages/cli/cli/ai-doc.js)**: roteamento de comandos.
- **[📄 Módulos do Kernel](../../../packages/cli/modules/)**: organização modular.

### 📁 Padrões de Workspace
- **[📄 Workspace Local](../../../.ai-workspace/)**: cache, stats e compilados.

### 📁 Padrões de Extensão
- **[📄 Extensão VS Code](../../../packages/extension/)**: integração UI e comandos.

### 📁 Subpastas
- **[📄 Backend Patterns](./backend-patterns/README.md)**: padrões do CLI/kernel.
- **[📄 Frontend Patterns](./frontend-patterns/README.md)**: padrões da extensão.

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Cada padrão deve apontar para arquivos reais do repo.
2.  **Estrutura**: Resumo + evidência + impacto.

---

## 👥 Público-alvo

- Mantenedores do kernel e CLI
- Desenvolvedores que estendem módulos/integrações

## 🧪 Critérios de Qualidade

- Referências reais e atualizadas a arquivos do repositório.
- Evitar padrões genéricos sem evidência no código.

## 🔄 Processo de Atualização

- **Quando atualizar**: mudanças no fluxo de build/ritual ou reorganização de pacotes.
- **Quem atualiza**: maintainers do CLI e kernel.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto técnico.
> *   **[Stack](../../55--tech-stack/README.md)**: tecnologias e versões.
