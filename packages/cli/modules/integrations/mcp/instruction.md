# 🔌 MCP Module (Model Context Protocol)
Integração com servidores externos (Laravel Boost, ClickUp, etc.) e IDEs via MCP.

---

## ⚙️ Configuração Rápida
1. **Arquivos de credencial**
   - `.junie/mcp/mcp.json` (Trae) e `.cursor/rules/laravel-boost.mdc` já contêm os endpoints registrados.
   - Tokens sensíveis ficam no `.env` (ex.: `CLICKUP_API_TOKEN`) ou em arquivos `mcp.config.json` específicos.
2. **Verificar servidores disponíveis**
   - Rode `npm run ai:list-ids` ou `npx mcp list` (quando suportado) para ver servers ativos.
3. **Fallback**
   - Se o MCP estiver indisponível: registre o bloqueio na task/resposta e trabalhe com os caches em `.ai-doc/data/live-state/`.

---

## 🧠 Estratégia Híbrida (Cache vs Live)
1. **Cache (Snapshot)**  
   Leia primeiro arquivos em `.ai-doc/data/live-state/` (ex.: `laravel.json`, `clickup-lists.json`).
2. **Live (MCP)**  
   Use MCP quando:
   - Os snapshots estiverem com mais de 48h.
   - O usuário pedir dados “atuais/ao vivo”.
   - Houver inconsistências e você precise validar contra a fonte real.
3. **Atualize o cache**  
   Após usar MCP, rode scripts como `npm run ai:active-state:sync` ou escreva o resultado em `data/live-state/` para próxima execução.

---

## 🛠️ Servidores & Módulos Associados
| Servidor | Módulo | Playbooks principais | Scripts úteis |
| :--- | :--- | :--- | :--- |
| `laravel-boost` | `___laravel` | `tool--tool-laravel-boost.md` + (rotas, logs, schema) | `npm run ai:active-state:ensure` |
| `clickup` | `___mcp/tools/` e futuro `___clickup` | `tool--sys-clickup-sync.md`, `tool--sys-clickup-merge.md` | `npm run ai:clickup-merge`, `npm run ai:coffee-post` (handover) |
| `terminal` | `___core` (scripts) | - | `npm run ai:health`, `npm run ai:lint` |
| `browser` | `___reports`/`___analysis` | - | Ferramenta interativa (buscar docs) |

> **Plano:** cada servidor relevante deve ter um módulo dedicado (ex.: `___clickup`) com playbooks específicos. Este kernel já possui `___laravel`; ClickUp virá a seguir.

---

## 📋 Fluxo Geral para Usar MCP
1. **Preparar contexto**  
   ```bash
   npm run ai:active-state:ensure   # garante caches essenciais
   ```
2. **Executar ferramenta**  
   - Laravel: `laravel-boost_database-schema`, `laravel-boost_ai-log-processor`.
   - ClickUp: `mcp2_clickup_create_task`, `mcp2_clickup_get_task`, etc.
3. **Registrar resultados**  
   - Atualize o cache (`.ai-doc/data/live-state/*.json`) ou escreva em `analysis/findings`.
   - Cite o comando usado no corpo da task/report.
4. **Mesclar dados externos**  
   - Use `npm run ai:clickup-merge -- diff|apply` para manter descrições em sincronia.

---

## 🛡️ Boas Práticas de Segurança
1. Não exponha tokens em respostas ou arquivos versionados.
2. Antes de escrever em ClickUp ou outras APIs, confirme que os dados locais estão válidos (lint, active-state).
3. Sempre preferir operadores “read-only” quando o usuário pedir apenas consulta.
4. Documente falhas com detalhes (timeout, auth, endpoint) para facilitar troubleshooting.

---

## 🔄 Lógica de Merge (ClickUp ↔ `.ai-doc`)
1. **Prioridade:** dados locais prevalecem, exceto quando o usuário pedir “substituir pelo remoto”.
2. **Preservação:** nunca delete contexto local sem confirmar se existe backup.
3. **Scripts**
   - `npm run ai:clickup-merge -- scan|diff|apply`
   - `npm run ai:clickup-merge -- report` para gerar resumos.

---

## 🆘 Troubleshooting
| Situação | Ação |
| :--- | :--- |
| Servidor MCP não responde | Registre bloqueio na task, use cache (`data/live-state`) e re-tente após `npm run ai:presence`. |
| Token inválido | Rode `npm run ai:clickup-merge -- config` ou atualize `.env`/`mcp.config.json`. |
| Diferenças grandes entre local e remoto | Execute `npm run ai:clickup-merge -- scan` e anexe diff na task antes de aplicar. |

---

## 📎 Links Úteis
- `tool--sys-clickup-sync.md`
- `tool--sys-clickup-merge.md`
- `___laravel/tools/` (playbooks MCP do Laravel Boost)
- Próximo módulo sugerido: `___clickup`
