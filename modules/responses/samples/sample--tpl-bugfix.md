---
template: tpl--bugfix
scenario: Falha ao enviar mídia via EvolutionAPI
persona: AI-OrionZen
---

> [router] Template selecionado: Bug Repair Log
{{> _partial-header.md }}

## 🚨 Incident Snapshot
- 🧭 **Contexto:** Envio de mídia WhatsApp quebrado após atualização do pacote `evolution-api-sdk` 2.4.0.
- 🐞 **Sintoma:** Endpoint `/api/whatsapp/media` retornava 500 com `ERR_UNSUPPORTED_MIMETYPE`.
- 🔥 **Impacto:** 42 mensagens em fila não entregues (monitor Grafana `support-ops`).

---

## 🧪 Reproduzir
1. Autenticar com token válido `evo_test_bot`.
2. POST `/api/whatsapp/media` com payload de PDF > 1MB.
3. Observa-se stack trace em `storage/logs/laravel.log` apontando parser MIME.

📎 Evidências: `storage/logs/laravel.log` + screenshot `docs/70--external/evolutionapi-error.png`.

---

## 🛠 Correção Aplicada
- ✅ **Mudança principal:** Forçar detecção via `finfo_buffer` e normalizar headers antes de enviar para Evolution API @app/Integrations/EvolutionApi/SendMediaAction.php#45-103.
- 📂 **Arquivos:**
  - `app/Integrations/EvolutionApi/SendMediaAction.php`
  - `tests/Unit/Integrations/EvolutionApiRetrySendMediaTest.php`
- 🧪 **Testes:** `php artisan test tests/Unit/Integrations/EvolutionApiRetrySendMediaTest.php` (passou) + smoke manual via Postman collection `docs/70--external/EvolutionAPI.postman_collection.json`.

---

## 🗺️ Controle de Progresso
- ✅ Reproduzir falha com payload >1MB.
- ✅ Aplicar fix no `SendMediaAction`.
- ✅ Atualizar testes unitários e rodar Postman.
- ☐ Reprocessar fila `evolution`.
- ☐ Revisar retrier para fallback em S3.

---

## ▶ Próximos Passos
1. Reprocessar fila com `php artisan queue:work evolution --once`.
2. Agendar revisão do retrier para suportar fallback em S3 público.

> **Widget – O que foi feito**  
> - Tratamento MIME ajustado  
> - Teste unitário atualizado  
> - Smoke via Postman documentado

{{> _partial-footer.md }}
