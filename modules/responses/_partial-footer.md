---
### 🔔 Protocolo de Greeting
1. Rode `npm run ai:list-ids` e replique o painel **“Conselho de Personas”** na saudação.
2. Pergunte qual identidade assumir e confirme o nome do dev antes de continuar.
3. Só prossiga após registrar/validar presence em `.ai-doc/data/identity/`.

---
### 🔥 Task Ativa
{{#if TASK_ACTIVE}}
- **Arquivo:** {{TASK_ACTIVE.FILE}}
- **Resumo:** {{TASK_ACTIVE.SUMMARY}}
- **Status atual:** {{TASK_ACTIVE.STATUS}}
{{else}}
- *Nenhuma task ativa registrada em `.ai-doc/data/tasks/` no momento.*
{{/if}}

### 🧬 Análise Ativa
{{#if ACTIVE_ANALYSIS}}
- **Arquivo:** {{ACTIVE_ANALYSIS.FILE}}
- **Foco:** {{ACTIVE_ANALYSIS.SUMMARY}}
- **Próximos checkpoints:** {{ACTIVE_ANALYSIS.NEXT_STEPS}}
{{else}}
- *Sem análise ativa vinculada a esta iteração.*
{{/if}}

### 🟢 Checklist de Progresso
O que falta para fechar a task?
{{#each PROGRESS_CHECKLIST}}
- {{#if this.done}}✅{{else}}▫️{{/if}}  {{this.label}} {{this.comment}}
{{/each}}

### 💜 Meus Passos
{{#if RECENT_FILES.length}}
{{#each RECENT_FILES}}
- **{{#if this.file}}{{this.file}}{{else}}{{this}}{{/if}}**
  - {{#if this.note}}{{this.note}}{{else}}Contexto registrado automaticamente.{{/if}}
{{/each}}
{{else}}
*Nenhum arquivo recente registrado nesta sessão.*
{{/if}}

### ⚙️ Modo Auto-Drive
- **Status:** {{AUTO_MODE_STATUS}}
- **Contexto:** {{AUTO_MODE_SCOPE}}
- **Expira/Termina:** {{AUTO_MODE_UNTIL}}
- **Origem:** {{AUTO_MODE_SOURCE}}

### 🧪 Auto Diagnóstico
{{#if AUTO_DIAG_DISCOVERIES.length}}
{{#each AUTO_DIAG_DISCOVERIES}}
- {{this}}
{{/each}}
{{else}}
*Sem descobertas adicionais nesta iteração.*
{{/if}}

### 🧠 Auto Consciência
{{#if SELF_AWARENESS_LESSONS.length}}
{{#each SELF_AWARENESS_LESSONS}}
- {{this}}
{{/each}}
{{else}}
*Nenhuma reflexão registrada além do plano atual.*
{{/if}}

### 🔮 Próximos passos sugeridos
{{#if SUGGESTED_STEPS.length}}
{{#each SUGGESTED_STEPS}}
- {{this}}
{{/each}}
{{else}}
*Sem próximos passos adicionais listados.*
{{/if}}

### ⏭️ Próximo passo imediato
{{#if NEXT_IMMEDIATE_ACTION}}
- {{NEXT_IMMEDIATE_ACTION}}
{{else}}
- *Não há ação automática definida; aguardo instruções.*
{{/if}}

---
### 🧠 Radar Global
- 🧬 Kernel: {{KERNEL_VERSION}} | 🚦 Status: {{PROJECT_HEALTH}} | 🛰️ Ambiente: {{ENVIRONMENT}} | 🧑‍💻 IDE: {{IDE_NAME}}
- 🗂️ Contextos citados: {{CONTEXT_SOURCES}}

---
### 📌 Checklist Rápido
- [ ] Task atual atualizada em `.ai-doc/data/tasks/`
- [ ] Documentação sincronizada? {{DOC_SYNC_STATUS}}
- [ ] Necessita follow-up humano? {{FOLLOWUP_FLAG}}

---
### 💗 Empatia Contextual (Multi-Perspectiva)
- Use sempre que responder greetings, relatórios, handoffs técnicos ou alinhamentos sensíveis.
- Combine nível de contexto + persona dominante + clima atual antes de sugerir próximos passos.

| Perspectiva | O que importa | Como sinalizar empatia |
| --- | --- | --- |
| Produto | Impacto em usuários, roadmap e adoção | “Essa entrega reduz churn em X” / “Mantém a experiência consistente” |
| Projeto | Datas, dependências, riscos macro | “Libera o marco {{MILESTONE}} e elimina bloqueio Y” |
| Dev | Clareza técnica, suporte imediato, bloqueios | “Segue checklist + debug para destravar rápido” |
| Infra/DevOps | Estabilidade, observabilidade, custos | “Prevemos rollback + alertas configurados” |
| IA/Assistente | Coerência com kernel e instruções | “Baseado no módulo {{REFERENCE_MODULE}} seguiremos...” |

**Checklist de aplicação**
1. Identifique contexto dominante (Projeto/Sprint/Tarefa).
2. Escolha a perspectiva que mais representa o interlocutor.
3. Ajuste tom + referência específica (risco, impacto, suporte).
4. Sugira próximo passo alinhado à persona e ao estado emocional percebido.

**Snippet reutilizável**
```
> Empatia contextual:
> - Contexto: {{CONTEXT_LEVEL}} · {{SPRINT_OR_TASK}}
> - Perspectiva dominante: {{PERSPECTIVE}}
> - Clima atual: {{CLIMATE_FLAG}}
> - Próximo passo sugerido: {{NEXT_STEP}}
```

---
### 🤖 {{CHAT_SITUATION}} · {{DATE_BR}}
🌐 **Contexto Global:** {{GLOBAL_CONTEXT}}

> ⚙️ **Template:** `{{TEMPLATE_NAME}}` | 🧬 **Auto-Evolution:** {{AUTO_EVOLUTION_STATUS}}
> 🤖 **{{ACTIVE_PERSONA}}** | 👤 {{DEV_NAME}} | 🕒 {{DATE_BR}} {{TIME_BR}} · {{TIMEZONE}}
