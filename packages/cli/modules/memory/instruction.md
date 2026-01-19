---
type: guide
name: memory-module
description: Governança do estado perene do projeto (memória longa) e suas integrações.
---

<!-- AI-DOC:CORE_START -->
- Memória é estado perene: registre fatos estáveis, decisões e invariantes.
- No boot, leia project-state, tech-stack, user-preferences e system-config.
- Mantenha stack/padrões como SSoT; divergências viram log ou task.
- Evite bloat: prefira resumos e referências a arquivos do projeto.
- Integre com Analysis/Tasks: mudanças detectadas devem atualizar memória ou abrir task.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🧠 Memory Module
Responsável por armazenar e sincronizar o “DNA” do projeto: estado, preferências, stack e eventos históricos.

## ✅ Checklist de Boot / Sessão
1. Ler `project-state.json`, `user-preferences.md`, `tech-stack.md` e `system-config.json`.
2. Verificar divergências de versão (`ai-package.json` vs docs) e registrar em `memory-log` ou abrir task.
3. Atualizar `last_boot` em `project-state.json` (script sugerido).
4. Confirmar se há instruções pendentes em `memory-log` (ex.: auditorias para aplicar).

## 📂 Estrutura de Dados

### 🌍 Global (`~/.ai-doc/data/memory/`)
> Configurações que acompanham o Agente/Usuário entre projetos.

| Arquivo | Função |
| --- | --- |
| `user-preferences.md` | Estilo do usuário, workflow, restrições globais |
| `me.json` | Metadados do agente (persona, canais de notificação) |

### 🏠 Local (`.ai-workspace/memory/`)
> Estado e configurações específicas deste projeto.

| Arquivo | Função |
| --- | --- |
| `project-state.json` | Estado operativo (fase, sprint, active_task, timestamps) |
| `tech-stack.md` | Stack técnica e padrões do projeto (SSoT) |
| `system-config.json` | Paths reais, integrações MCP locais, versões |
| `memory-log.md` | Linha do tempo de eventos relevantes do projeto |

## 🔄 Fluxos / Atualizações
- **Mudança de sprint/fase:** executar script `memory/sync-state` → atualiza `project-state`, registra no log.  
- **Alteração de stack/padrão:** atualizar `tech-stack.md` (local) e criar entrada no `memory-log`.  
- **Preferências do usuário:** registrar em `user-preferences.md` (global) se for regra geral; se for regra de projeto, usar `tech-stack.md`.  
- **Integração com Analysis:** scanners que detectarem mudanças importantes devem atualizar `tech-stack` ou abrir task para review.  
- **Integração com Tasks/Scrum:** tasks estratégicas devem referenciar seções do memory (SSoT).

## 🛠️ Scripts / Ferramentas (sugeridos)
- `node ~/.ai-doc/kernel/scripts/memory/sync-state.js` — atualiza campos padrão (last_boot, data de sprint).  
- `node ~/.ai-doc/kernel/scripts/memory/validate.js` — verifica existência de arquivos e paths corretos.  
- `node ~/.ai-doc/kernel/scripts/memory/log-event.js "descrição"` — adiciona entrada em `.ai-workspace/memory/memory-log.md`.

## 🧪 Troubleshooting
| Sintoma | Causa comum | Ação |
| --- | --- | --- |
| Datas defasadas em `project-state` | Falta de rotina de sync | Rodar script de sincronização e registrar no log. |
| Stack divergente entre docs e código | Scanner não aplicou atualização | Rodar scanners (`___analysis`) e alinhar `project-stack`. |
| Erro de path (ex.: buscar `project-state` no global) | Confusão Global vs Local | Garantir que dados de projeto sejam lidos de `.ai-workspace/memory/`. |

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Guia expandido com checklist, fluxos e integrações. |
| 2026-01-19 | AI Agent | Refatoração Global (`~/.ai-doc`) vs Local (`.ai-workspace`). |

<!-- AI-DOC:FULL_END -->
