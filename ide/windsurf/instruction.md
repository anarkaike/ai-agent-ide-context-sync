---
type: guide
name: windsurf-ide-module
description: Procedimentos para manter o Windsurf alinhado ao AI Kernel e MCPs.
---

# 🏄 Windsurf IDE Module
Manual de setup e manutenção do Windsurf no contexto do projeto.

## ✅ Checklist Inicial
1. Rodar `npm run ai:list-ids` em chats sem contexto e seguir o protocolo de identidade.
2. Executar `node .ai-doc/kernel/scripts/system/update-ai-rules.js` para atualizar `.windsurfrules` (ou arquivos equivalentes).
3. Validar configurações MCP em `.windsurf/settings.json` apontando para `.ai-doc/kernel/scripts`.
4. Revisar `.windurf/workflows/` relevantes (ex.: `/go-task`) e garantir que estão atualizados com os últimos passos do kernel.

## ⚙️ Setup / Sincronização
- **Prompt mestre:** Windsurf lê diretamente `ai-instructions.md`. Mantenha o arquivo sem lixo ou regras desatualizadas.  
- **Arquivos ignorados:** Confira `.codebaseignore` e inclua `/.ai-doc/data/memory/private` e outros diretórios sensíveis.  
- **Workflows:** Utilize os arquivos em `.windsurf/workflows/*.md` como fonte de verdade; após qualquer alteração nesses workflows, reabra o Windsurf para recarregar.

## 🔌 MCP & Ferramentas
- Windsurf exige que o servidor MCP esteja com dependências instaladas (`npm install`).  
- Em caso de falha de conexão, rodar `node .ai-doc/kernel/watch.cjs` (se aplicável) e verificar logs.  
- Scripts mais usados: `node .ai-doc/kernel/scripts/reports/analyze-project.js` e `node .ai-doc/kernel/scripts/system/update-ai-rules.js`.

## 🌍 Sistema i18n (Traduções)

**IMPORTANTE:** Windsurf tem acesso a scripts completos de gerenciamento de traduções.

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
📖 **Guia rápido:** `scripts/README-i18n.md`

## 🧪 Troubleshooting
| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| Windsurf ignora workflows | Cache antigo | Fechar/abrir o editor ou rodar “Reload Window”. |
| MCP não responde | Porta ocupada ou dependências faltando | Verificar processos Node ativos e reinstalar pacotes. |
| Regras desatualizadas | `ai-instructions.md` modificado sem sincronizar | Rodar script de atualização e validar `.windsurfrules`. |

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Guia expandido com checklist, MCP e troubleshooting. |
