---
title: Design System
subtitle: Diretrizes visuais da extensão VS Code
description: Padrões de UI e consistência visual para a interface da extensão.
author: Junio de Almeida Vitorino
status: active
---

> 🍞 **Caminho**: [Home](../../../README.md) > [Contexto Geral](../../README.md) > [Manual Técnico](../README.md) > Design System

# 📂 Design System

**Padrões visuais e de experiência aplicados à extensão VS Code.**

> 📅 **Última Atualização**: 2026-01-22 | 👤 **Responsável**: Junio de Almeida Vitorino

---

## 🎯 Visão Geral

O projeto segue as diretrizes nativas de UI do VS Code, usando ícones e views declaradas no manifesto da extensão. Não há um design system formal separado; os padrões visuais são guiados pela UI padrão do VS Code e pelo uso consistente de ícones e títulos.

> [!TIP]
> **Dica**: Quando introduzir uma nova view, manter ícones e nomes coerentes com as demais seções (personas, analytics, status, timer).

## 📑 Conteúdo

Aqui você encontra:

### 📁 Manifesto de UI
> [!NOTE]
> Definição de views, ícones e títulos.

- **[📄 Manifesto da Extensão](../../../packages/extension/package.json)**: views, menus e comandos.
- **[📄 README da Extensão](../../../packages/extension/README.md)**: referência visual e funcionalidades.

## 🤝 Convenções Locais

Regras específicas para arquivos neste diretório:

1.  **Nomenclatura**: Títulos das views com emoji + descrição clara.
2.  **Estrutura**: Agrupar views por intenção (Personas, Analytics, Status, Timer).

---

## 👥 Público-alvo

- Mantenedores e designers da extensão
- Equipe técnica que define UX interna

## 🧪 Critérios de Qualidade

- UI alinhada com padrões do VS Code.
- Nomenclatura e ícones consistentes entre views.

## 🔄 Processo de Atualização

- **Quando atualizar**: novas views ou mudança de identidade visual.
- **Quem atualiza**: maintainers da extensão.

## ✅ Checklist rápido

- ✅ Breadcrumbs revisados
- ✅ Links cruzados atualizados
- ✅ Nome e descrições consistentes

---

## 🔗 Links Relacionados

> 🔗 **Veja também**:
> *   **[Documentação Pai](../README.md)**: contexto técnico.
> *   **[Manual do Usuário](../../30--user-manual/README.md)**: uso da extensão.
