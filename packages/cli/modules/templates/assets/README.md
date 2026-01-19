# 📋 Templates do Kernel

> **SSoT:** todos os templates vivem neste diretório (`~/.ai-doc/kernel/modules/templates/assets/`).  
> Use-os como base ao criar tasks, análises, scanners ou ações antes de mover para `.ai-doc/data/...`.

---

## 📂 Estrutura Atual

| Template | Descrição | Onde usar |
| --- | --- | --- |
| `tmp--analytics--scanner.md` | Template genérico para scanners do módulo ___analysis. | `~/.ai-doc/kernel/modules/analysis/templates/` (copiar e adaptar) |
| `tech-profile.json` | Cache base para `active-state` do módulo ___analysis. | `~/.ai-doc/kernel/modules/analysis/templates/` |
| `tmp--queue--playlist.md` | Playlist em Markdown para `~/.ai-doc/data/queue/queue.md`. | `~/.ai-doc/data/queue/queue.md` |
| `tmp--queue--inbox.md` | Item individual da queue (inbox). | `~/.ai-doc/data/queue/inbox/*.md` |

> ⚠️ Se adicionar novos templates, registre-os aqui com descrição e destino recomendado.

---

## 🛠️ Como utilizar
1. Copie o arquivo desejado para o destino oficial (ex.: `___analysis/scanners/`).
2. Remova comentários/instruções internas.
3. Atualize metadados/frontmatter conforme o contexto.

---

## 🔄 Manutenção
- Sempre que mover ou renomear um template, sincronize este README.  
- Caso um template seja deprecado, adicione uma observação e oriente o arquivo substituto.

---

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-04 | AI Agent | README criado para documentar templates e paths corretos. |
