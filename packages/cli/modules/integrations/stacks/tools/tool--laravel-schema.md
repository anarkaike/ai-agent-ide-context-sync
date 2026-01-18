<!-- AI-DOC:CORE_START -->
- Use schema via MCP para evitar suposições sobre tabelas/colunas.
- Registre apenas diffs relevantes; evite dump completo do schema em reports.
- Combine com logs quando investigar migrations quebradas.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🧱 Tool: Laravel Schema Snapshot
Documenta tabelas e colunas usando o MCP `laravel-boost_database-schema`.

## 🧭 Quando usar?
- Antes de criar migrations ou refatorar relações.
- Quando houver dúvidas se o banco local está sincronizado com o ambiente ativo.
- Para gerar `data/live-state/laravel-schema.json` de referência rápida.

## ⚙️ Passo a Passo
1. **Garantir cache**
   ```bash
   npm run ai:active-state:ensure
   ```
2. **Rodar o MCP**
   ```bash
   mcp call laravel-boost_database-schema --pretty
   ```
3. **Exportar** o resultado para `.ai-doc/data/live-state/laravel-schema.json` (ou anexe ao relatório/analysis atual).
4. **Analisar**:
   - Contagem de tabelas e colunas sensíveis.
   - Campos `nullable`, defaults e índices.
   - Divergências com migrations recentes.
5. **Documentar**: registre achados na task/analysis (copie apenas trechos relevantes, sem dados sensíveis).

## 📌 Dicas
- Compare com `database/migrations` usando `npm run ai:lint` para detectar migrations pendentes.
- Em análises longas, mantenha apenas diffs relevantes no relatório para evitar vazamento de schema completo.
- Combine com `tool--laravel-logs.md` se estiver investigando erros de migration.

## 🔗 Referências
- `laravel-boost_database-schema`
- `.ai-doc/data/live-state/`
- `tool--tool-laravel-boost.md`

<!-- AI-DOC:FULL_END -->
