---
title: Entidades do Sistema
subtitle: Conceitos e artefatos principais
description: Mapeamento das entidades usadas no kernel, workspace e extensão.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../../README.md) > [Contexto Geral](../../README.md) > [Manual Técnico](../README.md) > Entidades

# 📂 Entidades do Sistema

**Conceitos centrais que estruturam o comportamento do AI Agent IDE Context Sync.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

As entidades abaixo representam os principais artefatos do sistema: regras, módulos, tarefas, heurísticas e o workspace local que orquestra o estado do projeto.

> [!TIP]
> **Dica**: Se surgir um novo artefato persistente, registre aqui para manter o mapa conceitual completo.

## 📑 Conteúdo

Aqui você encontra:

### 📁 Entidades principais
> [!NOTE]
> Referências aos arquivos e diretórios onde vivem essas entidades.

- **Kernel Module**: conjunto de instruções em `packages/cli/modules/`.
- **Rule**: regra compilada para IDEs em `.trae/rules/` e `.ai-workspace/cache/compiled/`.
- **Persona**: identidades em `.ai-workspace/personas/` (quando criado).
- **Task**: tarefas em `.ai-workspace/tasks/` (quando criado).
- **Heuristic**: padrões aprendidos em `packages/cli/heuristics/`.
- **Smart Cache**: armazenamento de prompts em `.ai-workspace/cache/smart-cache.json`.
- **Stats**: métricas em `.ai-workspace/stats.json`.

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Entidades com nomes consistentes com o CLI (`rules`, `tasks`, `heuristics`).
2.  **Estrutura**: Sempre indicar onde a entidade é persistida.

---

## 👥 Público-alvo

- Engenheiros que estendem o kernel
- Mantenedores do workspace local

## 🧪 Critérios de Qualidade

- Entidades ligadas a caminhos reais no repositório.
- Definições curtas e operacionais.

## 🔄 Processo de Atualização

- **Quando atualizar**: adição de nova entidade persistente.
- **Quem atualiza**: maintainers do kernel.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto técnico.
> *   **[Stack](../../55--tech-stack/README.md)**: tecnologias e versões.
