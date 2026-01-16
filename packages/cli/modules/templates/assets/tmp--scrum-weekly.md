---
type: scrum-weekly
week: {{WEEK_LABEL}}
range:
  start: {{RANGE_START}}
  end: {{RANGE_END}}
stats:
  dailies: {{DAILY_COUNT}}
  completed: {{COMPLETED}}
  in_progress: {{IN_PROGRESS}}
  blocked: {{BLOCKED}}
participants:
{{PARTICIPANTS_FRONTMATTER}}
analysis:
  sentiment: {{SENTIMENT_CODE}}
  perspective: {{ANALYSIS_PERSPECTIVE}}
references:
{{REFERENCES_FRONTMATTER}}
---

# Weekly {{WEEK_LABEL}} — {{RANGE_START}} → {{RANGE_END}}

## 📈 Highlights
{{HIGHLIGHTS_SECTION}}

## 🙂 Sentimento & Clima
{{SENTIMENT_SUMMARY}}

## 🔭 Próximos Focos
{{NEXT_FOCUS_SECTION}}

## 👥 Participação
{{PARTICIPANTS_SECTION}}

## 🔗 Referências
{{REFERENCES_SECTION}}

---

> Gerado automaticamente por `npm run ai:scrum:weekly`. Ajuste narrativas conforme necessário antes de compartilhar.
