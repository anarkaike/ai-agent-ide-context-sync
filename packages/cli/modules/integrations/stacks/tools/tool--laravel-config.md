<!-- AI-DOC:CORE_START -->
- Consulte configs/env via MCP quando precisar confirmar runtime real.
- Não copie valores sensíveis para logs/relatórios; registre apenas status.
- Após mudanças, revalide via MCP para confirmar.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# ⚙️ Tool: Laravel Config & Env Audit
Usa `laravel-boost_get-config` e `laravel-boost_list-env-vars` para validar configurações em runtime.

## 🧭 Quando usar?
- Antes de alterar integrações (queues, mail, storage) e precisar confirmar configs reais.
- Para investigar diferenças entre `.env` local e ambiente ativo.
- Quando existirem bugs relacionados a feature flags ou credenciais.

## ⚙️ Passo a Passo
1. **Preparar contexto**
   ```bash
   npm run ai:active-state:ensure
   ```
2. **Ler configs específicas**
   ```bash
   mcp call laravel-boost_get-config --key="app.name"
   mcp call laravel-boost_get-config --key="queue.default"
   ```
3. **Listar env vars seguras**
   ```bash
   mcp call laravel-boost_list-env-vars
   ```
   - Filtre apenas chaves necessárias. Não copie valores sensíveis para relatórios.
4. **Comparar com `.env.example`**
   - Registre diferenças críticas em `.ai-workspace/live-state/laravel-config.json`.
5. **Documentar decisão**
   - Abra task ou atualize a atual com o resumo do que precisa mudar (ex.: trocar driver de queue, ajustar mailer).

## 📌 Dicas
- Prefira registrar apenas o status (ex.: “queue.default=redis”) sem colar URLs/chaves completas.
- Combine com `tool--laravel-routes.md` para checar guards que dependem dessas configs.
- Após mudanças, rode novamente para confirmar.

## 🔗 Referências
- `laravel-boost_get-config`
- `laravel-boost_list-env-vars`
- `.ai-workspace/live-state/`

<!-- AI-DOC:FULL_END -->
