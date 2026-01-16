---
type: scrum-daily
date: {{DATE}}
sprint: "{{SPRINT}}"
stats:
  completed: {{COMPLETED}}
  in_progress: {{IN_PROGRESS}}
  blocked: {{BLOCKED}}
participants:
{{PARTICIPANTS_FRONTMATTER}}
sources:
  tasks_snapshot: {{TASK_SNAPSHOT_COUNT}}
---

# Daily {{DATE}} (Sprint: {{SPRINT}})

## ⚡ Highlights Automáticos
- Completed: {{COMPLETED}}
- In progress: {{IN_PROGRESS}}
- Blocked: {{BLOCKED}}

## 👥 Participantes
{{PARTICIPANTS_SECTION}}

## 🧠 Entradas Individuais
{{ENTRIES_SECTION}}

## 🧩 Plano do Dia
- [ ] Tasks de maior impacto listadas
- [ ] Bloqueios sinalizados para o módulo ___scrum
- [ ] Atualizar Coffee Break se o humor mudar

## 🔗 Relatório de Tasks
{{TASK_HIGHLIGHTS_SECTION}}

---

> Este arquivo é criado automaticamente por `npm run ai:scrum:daily`. Personalize as respostas mantendo o frontmatter e a estrutura.
