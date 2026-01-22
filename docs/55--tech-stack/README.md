---
title: Tech Stack
subtitle: Tecnologias e distribuição
description: Stack técnica do CLI, kernel e extensão VS Code.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../README.md) > [Contexto Geral](../README.md) > Tech Stack

# 📂 Tech Stack

**Resumo das tecnologias e ferramentas usadas no projeto.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

O projeto é um monorepo Node.js com dois pacotes principais: CLI (kernel e build) e extensão VS Code. A distribuição ocorre via NPM e Open VSX/VSIX.

> [!TIP]
> **Dica**: Atualize versões sempre que houver bump no CLI ou extensão.

## 📑 Conteúdo

Aqui você encontra:

### 📁 Tecnologias principais
> [!NOTE]
> Stack atual baseada em manifests do repositório.

| Área | Tecnologia | Versão/Notas |
| :--- | :--- | :--- |
| Runtime | Node.js | CLI e extensão |
| Linguagem | JavaScript | CLI e extensão |
| Distribuição | NPM | `ai-agent-ide-context-sync` |
| Extensão | VS Code API | `vscode` >= 1.80 |
| Formatos | JSON, YAML | regras, configs e heurísticas |

### 📁 Dependências-chave

| Pacote | Uso | Local |
| :--- | :--- | :--- |
| `@xenova/transformers` | Embeddings e busca semântica | packages/cli |
| `js-yaml` | Leitura de configs e heurísticas | packages/cli |
| `eslint` | Lint da extensão | packages/extension |
| `mocha` | Testes da extensão | packages/extension |

### 📁 Scripts relevantes

| Script | Descrição | Local |
| :--- | :--- | :--- |
| `npm run build` | Build do monorepo | raiz |
| `npx jest` | Testes do CLI | packages/cli |
| `npm run lint` | Lint da extensão | packages/extension |
| `npm run test` | Testes da extensão | packages/extension |

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Documentar versões a partir dos `package.json`.
2.  **Estrutura**: Separar runtime, tooling e distribuição.

---

## 👥 Público-alvo

- Mantenedores do monorepo
- Engenheiros que fazem release

## 🧪 Critérios de Qualidade

- Versões coerentes com os manifests atuais.
- Scripts refletindo o fluxo real do projeto.

## 🔄 Processo de Atualização

- **Quando atualizar**: bump de versões ou mudança de tooling.
- **Quem atualiza**: maintainers de release.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto superior.
> *   **[Manual Técnico](../40--tech-manual/README.md)**: arquitetura e padrões.
