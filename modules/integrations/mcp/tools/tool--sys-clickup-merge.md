---
title: tool--sys-clickup-merge
description: Orquestra merges entre ClickUp e `.ai-doc` com diff interativo e backups automáticos.
updated: 2025-12-30
---

# tool--sys-clickup-merge (Action)

> **Objetivo:** Sincronizar descrições de tasks entre ClickUp e `.ai-doc` usando o CLI `ai:clickup-merge`, preservando histórico com diffs e backups.

## 1. 🧭 Situação
- **Quando usar:** Sempre que uma task tiver edições concorrentes no `.md` local e na descrição do ClickUp, ou quando precisarmos auditar divergências.
- **Pré-condições:**  
  - Task registrada em `.ai-doc/data/tasks/...` com `clickup_id` no frontmatter (ou informado via CLI).  
  - Token ClickUp disponível em `CLICKUP_API_TOKEN` ou `CLICKUP_TOKEN`.  
  - Ambiente com acesso ao painel (`npm run ai:list-ids`) e presença registrada.

## 2. 🚦 Passo a Passo (Função)
1. `npm run ai:clickup-merge -- scan --task caminho.md [--clickup TASK_ID]`  
   - Lista divergências locais ↔ ClickUp, exibindo quantidade de conflitos por task.
2. `npm run ai:clickup-merge -- diff --task caminho.md [--clickup TASK_ID] [--identity AI-XYZ] [--dev "Nome"]`  
   - Gera bloco `# DIFF / # RESPOSTA` dentro do `.md`, numerando parágrafos e registrando autores.
3. Revise o bloco no `.md`, escolha a opção apropriada (1 = ambos, 2 = local, 3 = remoto, 4 = interativo) e, se necessário, interaja com o time.
4. `npm run ai:clickup-merge -- apply --task caminho.md --decision <1|2|3|interactive> [--clickup TASK_ID]`  
   - Cria backup automático em `.ai-doc/.backups/`, aplica a decisão nos parágrafos locais, atualiza ClickUp e anexa comentário com o diff.
5. Verifique `MERGE-LOG.md` na pasta da task e adicione notas complementares (motivo, responsáveis, links).

## 3. 🔀 Roteiros Alternativos
- **Somente auditoria:** Use apenas o modo `scan` para inventariar differences sem tocar nos arquivos.  
- **Hotfix manual:** Caso o CLI falhe, gere o bloco manualmente (conforme protocolo em `ai-instructions.md`) e siga a mesma lógica de backups antes de editar.  
- **Rollback:** Restaurar o arquivo desejado usando os backups em `.ai-doc/.backups/<path>/<arquivo>--TIMESTAMP.md`.

## 4. 🔗 Referências Úteis
- [`ai:clickup-merge` CLI](../../kernel/scripts/system/clickup-merge.js)  
- [Protocolo de Merge ClickUp ↔ `.ai-doc`](../../ai-instructions.md#🔄-protocolo-de-merge-clickup--ai-doc)  
- [`file-manager.js`](../../kernel/scripts/_core/utils/file-manager.js) – utilitário usado para backups.  
- [`MERGE-LOG.md` template informal](../../data/tasks/README.md)

## 5. 📝 Observações
- Mantenha o token ClickUp fora do repositório (dotenv/local shell).  
- Registre presença antes de rodar o CLI para manter o painel atualizado.  
- Após alterações estruturais neste action, execute `npm run ai:update-rules` para propagar instruções.
