---
template: tpl--default
scenario: Correção de bug em agendamento
persona: AI-OrionZen
---

> [router] Template selecionado: Default Full
{{> _partial-header.md }}

## ✨ **Resumo Rápido**
- 🎯 **Objetivo:** Corrigir falha no cálculo de disponibilidade semanal.
- 🧩 **Escopo:** Ajustar `ScheduleService.php` e atualizar testes de API.
- 📦 **Entregáveis:** Hotfix aplicado + testes Feature `tests/Feature/ScheduleTest.php` passando.

---

## 🛠️ **Detalhamento**
1. **Diagnóstico**
   - Logs apontavam slots duplicados aos domingos (timezone incorreto).
   - API `/api/schedules/slots` retornava dados inconsistentes (vide screenshot `logs/slot-dup.png`).
2. **Execução**
   - Ajuste em `app/Services/ScheduleService.php` para usar `Carbon::setWeekStartsAt()` conforme timezone da unidade @app/Services/ScheduleService.php#30-58.
   - Atualização de teste em `tests/Feature/ScheduleTest.php` cobrindo edge case domingo @tests/Feature/ScheduleTest.php#112-168.
   - Comando rodado: `php artisan test --filter=ScheduleTest` (passou em 2.3s).
3. **Evidências**
   - `git diff` mostra alteração de 18 linhas na service e 10 nos testes.
   - Log de before/after anexado em `/tmp/slots-before-after.md`.

---

## 🗺️ **Controle de Progresso**
- ✅ Identificar causa dos slots duplicados.
- ✅ Ajustar `ScheduleService` e testes.
- ☐ Rodar script `rebuild-schedules` em produção.
- ☐ Atualizar documentação em `docs/40--tech-manual/...`.

---

## ✅ **Decisões & Próximos Passos**
1. Monitorar métricas de agendamento no Grafana (painel `clinic-schedules`) por 24h.
2. Criar tarefa para revisar cron que recalcula caches semanais (pode ter efeito semelhante em feriados).
3. Documentar comportamento esperado no manual `docs/40--tech-manual/20--project-architecture-patterns/scheduling.md`.

---

## 🧠 **Auto Consciência**
- ✅ Identifiquei ausência de teste de timezone e adicionei cobertura — continuar replicando para feriados móveis.
- ☐ Criar alerta automático quando `slots-before-after.md` divergir >5% para avisar squads.
- ☐ Propor automação para rodar `rebuild-schedules` após toda alteração em `ScheduleService`.

> **Widget – Próximo Passo Imediato**  
> 🔜 Rodar script `scripts/cache/rebuild-schedules.sh` em produção com supervisão do SRE.

> **Widget – Auto Diagnóstico**  
> "Percebi que não tínhamos teste cobrindo mudança de timezone aos domingos; adicionamos agora, mas precisamos replicar para feriados móveis."

---

{{> _partial-footer.md }}
