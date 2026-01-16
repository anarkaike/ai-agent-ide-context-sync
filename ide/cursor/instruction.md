---
type: guide
name: cursor-ide-module
description: Passo a passo para manter o Cursor sincronizado com o AI Kernel.
---

# 🖱️ Cursor IDE Module
Fluxo de manutenção da integração entre o Cursor e o `.ai-doc`.

## 🌍 Sistema i18n (Traduções)

**IMPORTANTE:** Cursor tem acesso a scripts completos de gerenciamento de traduções.

### Quando usar:
- ✅ Usuário reporta texto literal aparecendo na interface (ex: "sales.titlePage")
- ✅ Ao adicionar novos componentes/páginas com textos
- ✅ Antes de fazer deploy de novas features

### Fluxo automático:
```bash
# Detectar e corrigir chaves faltantes
node scripts/find-missing-i18n-keys.js
node scripts/add-all-missing-keys.js
node scripts/translate-placeholders-to-pt.js
node scripts/complete-translations.js
node scripts/check-messages-translations.js
```

### Regras:
1. **pt-BR é a fonte** - Sempre adicione chaves lá primeiro
2. **Use os scripts** - Nunca edite múltiplos idiomas manualmente
3. **Valide sempre** - Execute `check-messages-translations.js` após mudanças

📖 **Documentação:** `.ai-doc/ai-modules/___i18n/instruction.md`  
📖 **Guia rápido:** `scripts/README-i18n.md` o `.ai-doc`.

## ✅ Checklist Inicial
1. Rodar `npm run ai:list-ids` quando abrir o chat sem contexto e perguntar qual identidade usar (regra do usuário).
2. Executar `node .ai-doc/kernel/scripts/system/update-ai-rules.js` para copiar o conteúdo de `ai-instructions.md` para `.cursorrules`.
3. Confirmar que `.cursor/rules/laravel-boost.mdc` está atualizado (reaplicar se scripts forem alterados).
4. Reindexar o workspace no Cursor (`Cmd+Shift+P → Indexing: Rebuild`) para refletir mudanças recentes no `.ai-doc`.

## 🔄 Sincronização de Regras
- **Arquivo principal:** `.cursorrules` deve sempre refletir o prompt mestre (`ai-instructions.md`).  
- **Como atualizar:**  
  1. `node .ai-doc/kernel/scripts/system/update-ai-rules.js`.  
  2. Verificar diff em `.cursorrules` e confirmar que as instruções novas foram injetadas.  
  3. Se houver personalizações locais no Cursor, preserve-as após o bloco gerado automaticamente.

## ⚙️ Integrações MCP / Scripts
- O Cursor consome scripts de `.ai-doc/kernel/scripts`. Sempre que um novo módulo é criado, reindexar para habilitar as rotas MCP.  
- Para testar se o MCP está ativo, execute um comando simples (ex.: listar diretórios) via palette; se falhar, reinstale as dependências com `npm install` na raiz.

## 🧪 Troubleshooting
| Sintoma | Causa provável | Ação corretiva |
| --- | --- | --- |
| Cursor ignora novas regras | `.cursorrules` desatualizado | Rodar script de atualização e reiniciar o app. |
| Index não encontra `.ai-doc` | Cache antigo no Cursor | Usar “Rebuild Index” e garantir que `.ai-doc` não está ignorado. |
| MCP indisponível | Node modules quebrados ou porta em uso | Rodar `npm install`, reiniciar `node .ai-doc/kernel/watch.cjs` se aplicável. |

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Guia expandido com checklist, sincronização e troubleshooting. |
