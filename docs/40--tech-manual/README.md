---
title: Manual Técnico
subtitle: Arquitetura, padrões e decisões
description: Visão técnica do kernel, CLI, heurísticas e extensão VS Code.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../README.md) > [Contexto Geral](../README.md) > Manual Técnico

# 📂 Manual Técnico

**Documentação técnica de arquitetura, padrões e funcionamento interno do projeto.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

Este diretório organiza a visão técnica do sistema, incluindo padrões de arquitetura, decisões estruturais e referências de implementação no CLI e na extensão VS Code.

> [!TIP]
> **Dica**: Inclua decisões arquiteturais sempre que mudar a estrutura do kernel ou do workspace.

## 📑 Conteúdo

Aqui você encontra:

### 📁 Padrões de Arquitetura
> [!NOTE]
> Decisões estruturais do CLI, kernel modular e extensão.

- **[📄 Padrões do Projeto](./20--project-architecture-patterns/README.md)**: visão macro da arquitetura.
- **[📄 Backend Patterns](./20--project-architecture-patterns/backend-patterns/README.md)**: padrões do CLI/kernel.
- **[📄 Frontend Patterns](./20--project-architecture-patterns/frontend-patterns/README.md)**: padrões da extensão.

### 📁 Design System
- **[📄 Design System](./30--design-system/README.md)**: princípios visuais da extensão.

### 📁 Entidades
- **[📄 Entidades do Sistema](./40--entities/README.md)**: entidades e modelos conceituais.

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Use títulos orientados a decisão ou módulo.
2.  **Estrutura**: Sempre relacionar o texto com arquivos reais do repo.

---

## 👥 Público-alvo

- Engenheiros e mantenedores do projeto
- Tech leads que definem padrões e arquitetura

## 🧪 Critérios de Qualidade

- Referenciar arquivos reais do repositório.
- Atualizar quando comandos/arquitetura mudarem.

## 🔄 Processo de Atualização

- **Quando atualizar**: mudanças no kernel, CLI, heurísticas ou extensão.
- **Quem atualiza**: maintainers técnicos.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto superior.
> *   **[Stack](../55--tech-stack/README.md)**: tecnologias e versões.
