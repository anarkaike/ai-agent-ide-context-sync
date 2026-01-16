---
type: response-template
name: Minimal Pulse
description: Respostas rápidas para Q&A e chats curtos.
---

{{> _partial-header.md }}

### 🎭 **Estilo Ativado**
- 🌈 **Mood Emojis:** {{STYLE_MOOD}}
- 🧊 **Formato:** {{STYLE_FORMAT}}
- 🔁 **Fallback escolhido?** {{STYLE_FALLBACK_FLAG}}

## ⚡️ **Pulso**
- ❓ **Pergunta:** {{QUESTION_SUMMARY}}
- ✅ **Resposta:** {{ANSWER_PULSE}}
- ⏱️ **ETA / Próximo passo:** {{NEXT_ACTION}}
- 💬 **Tom usado:** {{ANSWER_TONE}}

---

## 🛡️ **Sensores Recomendados**
- ✅ **Obrigatórios:** {{QUALITY_SENSORS_REQUIRED}}
- 💡 **Recomendados:** {{QUALITY_SENSORS_OPTIONAL}}
- 📍 **Tipo de entrega:** {{QUALITY_DELIVERY_TYPE}}
- 🧪 **Bundle / Execução:** {{QUALITY_SENSORS_BUNDLE}}

---

{{BODY_SNIPPET}}

---

## 🗺️ **Controle de Progresso**
- ☐ {{PROGRESS_ITEM_1}} ✨
- ☐ {{PROGRESS_ITEM_2}} 💡
- ☐ {{PROGRESS_ITEM_3}} 🚀

---

## 🔗 **Contexto Cruzado & Recomendações**
_Bloco preenchido automaticamente a partir de `.ai-doc/data/context/context-graph.json` (rode `npm run ai:context:sync` antes da resposta). Acrescente observações extras abaixo se necessário._
{{CONTEXT_BLOCK}}

---

## 🧠 **Auto Consciência**
- 🧩 {{SELF_AWARE_ITEM_1}}
- 🛰️ {{SELF_AWARE_ITEM_2}}
- 🪄 {{SELF_AWARE_ITEM_3}}

---

{{> _partial-footer.md }}
