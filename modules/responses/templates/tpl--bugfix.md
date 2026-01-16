---
type: response-template
name: Bug Repair Log
description: Formato para incidentes, hotfixes e relatos de erro.
---

{{> _partial-header.md }}

---

### 🎭 **Estilo Ativado**
- 🌈 **Mood Emojis:** {{STYLE_MOOD}}
- 🧊 **Formato:** {{STYLE_FORMAT}}
- 🔁 **Fallback escolhido?** {{STYLE_FALLBACK_FLAG}}

---

## 🚨 Incident Snapshot
- 🧭 **Contexto:** {{BUG_CONTEXT}}
- 🐞 **Sintoma:** {{BUG_SYMPTOM}}
- 🔥 **Impacto:** {{BUG_IMPACT}}
- 💬 **Tom usado:** {{ANSWER_TONE}}

---

## 🚨 Diagnóstico & Fix
- Contexto/Sintoma: {{BUG_CONTEXT}}
- Impacto: {{BUG_IMPACT}}
- Repro: {{BUG_REPRO}}
- Fix aplicado: {{FIX_DESCRIPTION}} (Arquivos: {{FILES_TOUCHED}})
- Testes: {{TESTS_RUN}}

---

## 🧪 Reproduzir
1. {{REPRO_STEP_1}}
2. {{REPRO_STEP_2}}
3. {{REPRO_STEP_3}}

📎 Evidências: {{BUG_EVIDENCE_LINKS}}

---

## 🛠 Correção Aplicada
- ✅ **Mudança principal:** {{FIX_DESCRIPTION}}
- 📂 **Arquivos:** {{FILES_TOUCHED}}
- 🧪 **Testes:** {{TESTS_RUN}}

---

## 🗺️ Controle de Progresso
- ☐ {{PROGRESS_ITEM_1}} ✨
- ☐ {{PROGRESS_ITEM_2}} 💡
- ☐ {{PROGRESS_ITEM_3}} 🚀

---

## 🔗 Contexto Cruzado & Recomendações
_Bloco preenchido automaticamente a partir de `.ai-doc/data/context/context-graph.json` (rode `npm run ai:context:sync` antes da resposta). Acrescente observações extras abaixo se necessário._
{{CONTEXT_BLOCK}}

---

## 🧠 Auto Consciência
- 🧩 {{SELF_AWARE_ITEM_1}}
- 🛰️ {{SELF_AWARE_ITEM_2}}
- 🪄 {{SELF_AWARE_ITEM_3}}

---

## 📎 Referências
- {{REF_ITEM_1}}
- {{REF_ITEM_2}}

---

## ⚠️ Riscos / Incertezas
- {{RISK_ITEM_1}}
- {{RISK_ITEM_2}}

---

## ▶ Próximos Passos
1. {{FOLLOWUP_1}} 🔜
2. {{FOLLOWUP_2}} 🏁

---

{{> _partial-footer.md }}
