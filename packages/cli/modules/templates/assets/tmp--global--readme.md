---
title: Templates de Documentação
subtitle: Guia de Estilo e Modelos
description: Templates padrão para manter a consistência, clareza e padronização visual em toda a documentação do projeto.
author: Sistema Clínica Team
status: done
---

> 🍞 **Caminho**: [Home](../../../../docs/README.md) > [AI Smart Docs](../../../README.md) > Templates

# 🎨 Templates de Documentação

Esta pasta contém templates padrão (Markdown) para manter a consistência na documentação do projeto. O objetivo é garantir que todos os documentos compartilhem a mesma estrutura visual e cognitiva.

> [!TIP]
> **Como Usar**: Copie o código fonte ("raw") do template desejado e cole no seu novo arquivo. Preencha as seções entre colchetes `[...]`.
>
> 🤖 **Para Agentes de IA**: Ao preencher estes templates, siga o [Guia de Tom e Estilo](../../../../docs/00--intro/ai-agent-tone.md). Seja amigável, educativo e claro.

## 📦 Templates Disponíveis

### 1. Estruturais
*   **[Folder README](TPL--DOC--folder-readme.md)** (`TPL--DOC--folder-readme.md`): Use como `README.md` na raiz de novas pastas para explicar o conteúdo e convenções.
*   **[Contexto Root](TPL--DOC--context-root.md)** (`TPL--DOC--context-root.md`): Template para arquivos de contexto principal do sistema.
*   **[Contexto Sub](TPL--DOC--context-sub.md)** (`TPL--DOC--context-sub.md`): Template para contextos específicos (sub-domínios).

### 2. Técnicos
*   **[Entidade](TPL--DOC--entity.md)** (`TPL--DOC--entity.md`): Para documentar novas tabelas/models do sistema (Backend + Frontend).
*   **[Padrão Técnico](TPL--DOC--tech-pattern.md)** (`TPL--DOC--tech-pattern.md`): Para registrar decisões de arquitetura, padrões de código ou novas bibliotecas.
*   **[Stack Tecnológica](TPL--DOC--tech-stack.md)** (`TPL--DOC--tech-stack.md`): Para documentar ferramentas, linguagens e frameworks da stack.

### 3. Gestão & Processos
*   **[Tarefa/Feature](TPL--TASK--feature.md)** (`TPL--TASK--feature.md`): Para especificar novas tarefas na pasta `10--tasks`.
*   **[Análise/RFC](TPL--DOC--analysis-rfc.md)** (`TPL--DOC--analysis-rfc.md`): Para investigações complexas, debugs profundos ou propostas de mudança (Request for Comments) na pasta `80--analyses-wip`.
*   **[Ação Genérica](TPL--ACTION--generic.md)** (`TPL--ACTION--generic.md`): Template base para scripts e ações automatizadas.
*   **[Relatório Genérico](TPL--REPORT--generic.md)** (`TPL--REPORT--generic.md`): Template base para relatórios gerados automaticamente (Dashboards, Lint).

### 4. Usuário Final
*   **[Guia do Usuário](TPL--DOC--user-guide.md)** (`TPL--DOC--user-guide.md`): Para criar manuais e tutoriais de uso do sistema na pasta `30--user-manual`.

### 5. Qualidade & Manutenção
*   **[Bug Report](TPL--TASK--bug-fix.md)** (`TPL--TASK--bug-fix.md`): Padronização para reporte de erros, bugs e falhas.
*   **[Regra de Negócio](TPL--DOC--business-rule.md)** (`TPL--DOC--business-rule.md`): Para documentar regras de negócio complexas, critérios de aceitação e exceções. Ideal para ser referenciado por tarefas e entidades.
*   **[Teste Automatizado](TPL--DOC--test-case.md)** (`TPL--DOC--test-case.md`): Template para documentar arquivos de teste (Unit, Feature, E2E) e seus cenários.

### 6. Socialização
*   **[Identificação Pessoal](TPL--META--identification.md)** (`TPL--META--identification.md`): Para perfis pessoais de humanos e agentes de IA no projeto.
*   **[Espaço Social](TPL--SPACE--generic.md)** (`TPL--SPACE--generic.md`): Para salas de conversa e colaboração informal.

## 🚀 Como Usar

1.  Escolha o template adequado para o seu documento.
2.  Copie o conteúdo "raw" do arquivo `.md`.
3.  Cole no seu novo arquivo.
4.  Preencha as seções entre colchetes `[...]` e remova as instruções que não se aplicam.
