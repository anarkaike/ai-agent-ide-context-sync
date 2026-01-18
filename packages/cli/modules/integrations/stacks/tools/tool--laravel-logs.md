<!-- AI-DOC:CORE_START -->
- Use log processor via MCP para incident response e bugs não replicáveis.
- Registre resumo + IDs; não cole logs crus sensíveis em tasks.
- Se houver suspeita de DB/migrations, combine com schema.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 📓 Tool: Laravel Logs via AI Processor
Como usar `laravel-boost_ai-log-processor` para inspecionar logs (frontend/backend/database) e sintetizar achados.

## 🧭 Quando usar?
- Incident response (erros críticos em produção).
- Antes de abrir task para bugs não replicáveis localmente.
- Para gerar relatórios de saúde (combinar com `tool--qa-health-check`).

## ⚙️ Passo a Passo
1. **Preparação**
   ```bash
   npm run ai:active-state:ensure
   ```
2. **Rodar o MCP**
   ```bash
   mcp call laravel-boost_ai-log-processor --pretty --levels="error,warning" --limit=200
   ```
   - Parâmetros úteis: `message_contains`, `start_time`, `end_time`.
3. **Interpretar saída**
   - `analysis` → resumo consolidado por IA.
   - `sources.frontend/backend/database` → logs crus + resumo.
4. **Documentar**
   - Em tasks/analysis, cole apenas o resumo + IDs de log relevantes.
   - Se necessário, anexe os trechos em `.ai-doc/data/live-state/laravel-logs.json` (evite dados sensíveis).
5. **Ações**
   - Abrir task se houver bug claro.
   - Atualizar `tool--qa-health-check` > seção “Status Geral”.

## 📌 Dicas
- Combine com `tool--laravel-schema` se os erros envolvem migrations/DB.
- Sempre saneie dados antes de persistir (remova tokens, e-mails, etc.).
- Para streaming contínuo, use o endpoint `_boost/browser-logs/stream` registrado em `AppServiceProvider`.

## 🔗 Referências
- `laravel-boost_ai-log-processor`
- `.ai-doc/data/live-state/`
- `AppServiceProvider@boot` (rotas `_boost/...`)

<!-- AI-DOC:FULL_END -->
