---
title: Frontend Patterns (Extensão VS Code)
subtitle: UI, comandos e contribuições no VS Code
description: Padrões da extensão visual para gerir personas, tasks e dashboards.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../../../README.md) > [Contexto Geral](../../../README.md) > [Manual Técnico](../../README.md) > [Padrões de Arquitetura](../README.md) > Frontend Patterns

# 📂 Frontend Patterns (Extensão VS Code)

**Padrões usados na extensão VS Code para interação visual com o kernel.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

A extensão VS Code expõe comandos, views e dashboards para manipular personas, tasks e analytics do `.ai-workspace`. O manifesto `package.json` define as contribuições e o `extension.js` orquestra a lógica.

> [!TIP]
> **Dica**: Sempre alinhe os comandos da extensão com o CLI para evitar divergência de comportamento.

## 📑 Conteúdo

Aqui você encontra:

### 📁 Manifesto e entrypoint
> [!NOTE]
> Onde os comandos e views são declarados e executados.

- **[📄 Manifesto da Extensão](../../../../packages/extension/package.json)**: contribuições, comandos e views.
- **[📄 Entrypoint da Extensão](../../../../packages/extension/extension.js)**: implementação dos comandos.

### 📁 Documentação de uso
- **[📄 README da Extensão](../../../../packages/extension/README.md)**: funcionalidades e instalação.

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Comandos seguem prefixo `ai-agent-sync.*`.
2.  **Estrutura**: Views organizadas por áreas (personas, analytics, status, timer).

---

## 👥 Público-alvo

- Mantenedores da extensão VS Code
- Designers e engenheiros de UX interna

## 🧪 Critérios de Qualidade

- Comandos devem existir no manifesto e no entrypoint.
- UI deve refletir o estado real do `.ai-workspace`.

## 🔄 Processo de Atualização

- **Quando atualizar**: inclusão de novos comandos/views ou mudanças no CLI.
- **Quem atualiza**: maintainers da extensão.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto arquitetural.
> *   **[Manual do Usuário](../../../30--user-manual/README.md)**: fluxo de uso.
