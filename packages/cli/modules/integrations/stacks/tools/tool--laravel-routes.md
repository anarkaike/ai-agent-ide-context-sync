<!-- AI-DOC:CORE_START -->
- Use MCP para listar rotas runtime antes de alterar auth/versionamento.
- Compare runtime vs `routes/*.php` e registre apenas rotas-chave.
- Ao achar divergência, converta em task com evidência.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🛤️ Tool: Laravel Routes & Guards
Mapeia rotas, middlewares e guards usando os comandos MCP do Laravel Boost.

## 🧭 Quando usar?
- Antes de alterar autenticação/versionamento de APIs.
- Para confirmar se rotas “legacy” ainda existem em ambientes ativos.
- Quando scanners detectarem divergências entre `routes/*.php` e o runtime.

## ⚙️ Passo a Passo
1. **Preparar contexto**
   ```bash
   npm run ai:active-state:ensure
   ```
2. **Executar listagem de rotas** (se o ambiente tiver Artisan)
   ```bash
   mcp call laravel-boost_terminal -- "php artisan route:list"
   ```
   - Use filtros: `--method=GET`, `--path=api/*`, etc.
3. **Comparar com arquivos locais**
   - Verifique `routes/web.php`, `routes/api.php`, `routes/channels.php`, `routes/console.php`.
4. **Registrar achados**
   - Atualize `.ai-workspace/live-state/laravel-routes.json` com rotas-chave (prefixos, middleware, controllers).
   - Documente mudanças/alertas na task ou análise.
5. **Decidir próximos passos**
   - Se faltarem rotas → alinhar migrations/feature flags.
   - Se houver rotas fantasmas → abrir task para remoção/ajuste.

## 📌 Dicas
- Use tags no relatório: `Autenticação`, `Versão API`, `Guards`.
- Combine com `tool--laravel-config.md` para checar guards/middlewares configurados.
- Quando estiver investigando atrasos de fila/queue workers, capture também `php artisan schedule:list` via MCP.

## 🔗 Referências
- `laravel-boost_terminal`
- `routes/*.php`
- `.ai-workspace/live-state/`

<!-- AI-DOC:FULL_END -->
