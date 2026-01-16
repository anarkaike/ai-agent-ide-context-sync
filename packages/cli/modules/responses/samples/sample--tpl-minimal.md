---
template: tpl--minimal
scenario: Dúvida rápida sobre seeders
persona: AI-OrionZen
---

> [router] Template selecionado: Minimal Pulse
{{> _partial-header.md }}

## ⚡️ Pulso
- ❓ **Pergunta:** "Qual seeder preciso rodar para popular clínicas demo em staging?"
- ✅ **Resposta:** Execute `php artisan db:seed --class=BusinessesDemoSeeder` (já contempla unidades, profissionais e agendas base).
- ⏱️ **ETA / Próximo passo:** Rodar o seeder leva ~40s; confirme credenciais `.env.staging` antes.

---

**Notas rápidas**
- Seeder localizado em `database/seeders/BusinessesDemoSeeder.php` com dependência do `UsersSeeder` @database/seeders/BusinessesDemoSeeder.php#15-72.

---

## 🗺️ Controle de Progresso
- ✅ Validar seeder correto.
- ☐ Rodar seed em staging.
- ☐ Processar filas pendentes.

---

> **Widget – Próximo Passo Imediato**  
> 📌 Após o seed, rodar `php artisan queue:work --stop-when-empty` para processar notificações pendentes.

{{> _partial-footer.md }}
