---
type: scrum-monthly
month: {{MONTH_LABEL}}
range:
  start: {{RANGE_START}}
  end: {{RANGE_END}}
stats:
  dailies: {{DAILY_COUNT}}
  weeklies: {{WEEKLY_COUNT}}
  completed: {{COMPLETED}}
  in_progress: {{IN_PROGRESS}}
  blocked: {{BLOCKED}}
analysis:
  sentiment: {{SENTIMENT_CODE}}
  perspective: {{ANALYSIS_PERSPECTIVE}}
participants:
{{PARTICIPANTS_FRONTMATTER}}
references:
{{REFERENCES_FRONTMATTER}}
---

# Monthly {{MONTH_LABEL}} — {{RANGE_START}} → {{RANGE_END}}

## 🧭 Resumo Executivo
{{EXEC_SUMMARY}}

## 📊 Métricas do Mês
{{METRICS_SECTION}}

## 🙂 Sentimento & Clima
{{SENTIMENT_SUMMARY}}

## 🚀 Destaques Técnicos
{{TECH_HIGHLIGHTS}}

## 💬 Impacto para o Negócio
{{BIZ_IMPACT}}

## 🔭 Foco Próximo Mês
{{NEXT_MONTH_FOCUS}}

## 👥 Participantes
{{PARTICIPANTS_SECTION}}

## 🔗 Referências
{{REFERENCES_SECTION}}

---

> Gerado automaticamente por `npm run ai:scrum:monthly`. Ajuste narrativas antes de compartilhar externamente.
