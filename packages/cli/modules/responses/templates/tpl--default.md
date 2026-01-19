---
type: response-template
name: Default Full
description: Resposta completa para coding/tasks explicativas.
---

{{> _partial-header.md }}

---

### 🎭 **Estilo Ativado**
- 🌈 **Mood Emojis:** {{STYLE_MOOD}}
- 🧊 **Formato:** {{STYLE_FORMAT}}
- 🔁 **Fallback escolhido?** {{STYLE_FALLBACK_FLAG}}

---

## ✨ **Resumo Rápido**
- 🎯 **Objetivo:** {{SUMMARY_GOAL}}
- 🧩 **Escopo:** {{SUMMARY_SCOPE}}
- 📦 **Entregáveis:** {{SUMMARY_OUTPUT}}
- 💬 **Tom usado:** {{ANSWER_TONE}}

---

## 🛡️ **Sensores Recomendados**
- ✅ **Obrigatórios:** {{QUALITY_SENSORS_REQUIRED}}
- 💡 **Recomendados:** {{QUALITY_SENSORS_OPTIONAL}}
- 📍 **Tipo de entrega:** {{QUALITY_DELIVERY_TYPE}}
- 📝 **Notas:** {{QUALITY_SENSORS_NOTES}}
- 🧪 **Bundle / Execução:** {{QUALITY_SENSORS_BUNDLE}}
- 🧾 **Resumo AI-Sensors:** {{QUALITY_SENSORS_MATRIX}}

---

## 🛠️ **Detalhamento**
{{BODY_CONTENT}}

---

## 🔗 **Contexto Cruzado & Recomendações**
_Bloco preenchido automaticamente a partir de `~/.ai-doc/data/context/context-graph.json` (rode `npm run ai:context:sync` antes de responder). Acrescente observações extras abaixo se necessário._
{{CONTEXT_BLOCK}}

---

## 🗺️ **Controle de Progresso**
- ☐ {{PROGRESS_ITEM_1}} ✨
- ☐ {{PROGRESS_ITEM_2}} 💡
- ☐ {{PROGRESS_ITEM_3}} 🚀

---

## ✅ **Decisões & Próximos Passos**
1. {{NEXT_STEP_1}} 🔜
2. {{NEXT_STEP_2}} 🪜
3. {{NEXT_STEP_3}} 🏁

---

## 🧠 **Auto Consciência**
- 🧩 {{SELF_AWARE_ITEM_1}}
- 🛰️ {{SELF_AWARE_ITEM_2}}
- 🪄 {{SELF_AWARE_ITEM_3}}

---

{{> _partial-footer.md }}
