---
id: task-006
title: Filtrar README.md do seletor de tasks
persona: AI-DEV
status: completed
created_at: 2026-01-23T18:45:31.619Z
objectives:
  - [x] Identificar função responsável por listar tasks (getAllTasks)
  - [x] Adicionar filtro para excluir README.md
deliverables:
  - [x] Correção aplicada em extension.js
---

# Filtrar README.md do seletor de tasks

## Contexto
O seletor de tasks (QuickPicker) e a Status Bar estavam listando o arquivo `README.md` como uma task válida, o que é incorreto.

## Plano de Ação
- [x] Localizar `getAllTasks` em `packages/extension/extension.js`
- [x] Atualizar filtro `fs.readdirSync` para ignorar `README.md` (case insensitive)
- [x] Verificar se outros arquivos markdown precisam ser filtrados (foco em README por enquanto)
