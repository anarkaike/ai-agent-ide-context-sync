# ⚖️ AutoPriority Module
> Inteligência de priorização adaptativa para o kernel IA.

---

## 🎯 Propósito
Automatizar a análise de prioridades do agente usando sinais reais (queue, tasks, lint, preferências e históricos) e permitir que novos critérios sejam aprendidos, aprovados e incorporados dinamicamente.

- **Entrada:** tasks em `.ai-doc/data/tasks/`, playlist/queue, relatórios de lint/dashboard, memórias e preferências.
- **Processamento:** motor de critérios ponderados (`criteria.json`) + registro de sinais.
- **Saída:** ranking de itens com justificativas, sugestões de ações e critérios candidatos.

---

## 🧱 Estrutura
```
.ai-doc/ai-modules/___autopriority/
  instruction.md
.ai-doc/data/autopriority/
  criteria.json              # critérios confirmados
  pending/                   # drafts aguardando aprovação
  signals-log.json           # histórico das avaliações
.ai-doc/kernel/scripts/autopriority/
  evaluate-priority.cjs      # motor principal
  learn-signals.cjs          # gera novos critérios sugeridos
  apply-criteria.cjs         # promove drafts após aprovação
```

---

## ⚙️ Fluxo Operacional
1. **Coleta de Sinais** (`evaluate-priority`)
   - Tasks abertas, idade, prioridade, status.
   - Itens na playlist/inbox da queue.
   - Último relatório de lint (`.ai-doc/data/reports/lint-report.md`).
   - Preferências do usuário (ex.: emojis obrigatórios).
2. **Motor de Priorização**
   - Aplica critérios ativos (`criteria.json`), cada um com `condition`, `weight` e histórico.
   - Gera `score` + `reasons` + ação sugerida.
   - Registra resultado em `signals-log.json` (mantém histórico recente).
3. **Aprendizado Adaptativo** (`learn-signals`)
   - Detecta padrões ainda não cobertos (ex.: tasks > 72h sem atualização, lint crítico).
   - Cria drafts em `data/autopriority/pending/` e informa o usuário para aprovar.
4. **Confirmação** (`apply-criteria`)
   - Usuário escolhe um draft (`--id` ou `--file`) e promove para `criteria.json`.
   - Histórico atualizado com autor/motivo.
5. **Integração com o Kernel**
   - `npm run ai:auto-priority` pode ser chamado a qualquer momento.
   - O ritual automático (`npm run ai:auto-ritual`) executa o ranking e mostra o Top N.

---

## 🛠️ Comandos
| Comando | Descrição |
| --- | --- |
| `npm run ai:auto-priority` | Avalia tasks/queue e gera ranking (tabela padrão).
| `npm run ai:auto-priority -- --top 5 --format json` | Opções de saída (`table` ou `json`). |
| `npm run ai:auto-priority:learn` | Analisa sinais recentes e cria critérios sugeridos (`pending/`). |
| `npm run ai:auto-priority:apply -- --id <draft_id>` | Move draft aprovado para `criteria.json`. |
| `npm run ai:auto-priority:watch -- --interval 300 --top 5` | Roda o ranking em loop (default 5 min) e espelha o Top N continuamente. |

> Todos os scripts aceitam `--help` para detalhar flags adicionais (`--scope`, `--from-git`, etc.).

---

## 📁 criteria.json (exemplo)
```json
[
  {
    "id": "high_priority_task",
    "description": "Tasks marcadas como priority=high",
    "condition": { "field": "priority", "operator": "==", "value": "high" },
    "weight": 3,
    "status": "active",
    "history": [
      { "timestamp": "2026-01-06T18:20:00Z", "author": "AI-JAY", "note": "Critério inicial" }
    ]
  }
]
```
- `field`: atributo do item (`priority`, `status`, `age_hours`, `in_queue`, etc.).
- `operator`: `==`, `!=`, `>`, `>=`, `<`, `<=`, `includes`.
- `weight`: impacto no score.
- `scope`: opcional (`global`) para aplicar em todo o conjunto.

---

## 🤖 Como Aprovar Novos Critérios
1. Execute `npm run ai:auto-priority:learn`.
2. Se houver sugestão, será criado um draft em `.ai-doc/data/autopriority/pending/` com explicação.
3. Revise o conteúdo e confirme com `npm run ai:auto-priority:apply -- --file pending/draft-XYZ.json`.
4. Rode `npm run ai:build` + `npm run ai:health` para propagar regras.

---

## 📝 Boas Práticas
- Sempre anexe links/evidências ao responder ao usuário (ex.: ranking JSON) para transparência.
- Se um critério parecer redundante, registre o motivo no histórico ao removê-lo ou ajustar peso.
- Use o módulo para justificar “por que estou priorizando X agora” diretamente na resposta.

---

## 📜 Histórico
| Data | Autor | Ação |
| --- | --- | --- |
| 2026-01-06 | AI-JAY | Criação do módulo AutoPriority com motor, aprendizado e aplicação.
