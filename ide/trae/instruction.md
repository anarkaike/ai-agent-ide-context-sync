---
type: guide
name: trae-ide-module
description: Boas práticas para operar o Trae IDE com o AI Kernel.
---

# 🚀 Trae IDE Module
Procedimento operacional para sessões no Trae.

## ✅ Checklist Inicial
1. Executar `npm run ai:list-ids` ao iniciar uma nova sessão (se não houver contexto) e confirmar identidade com o usuário.
2. Rodar `node .ai-doc/kernel/scripts/system/update-ai-rules.js` e garantir que `.trae/rules/project_rules.md` e `.trae/project_rules.md` refletem o prompt atualizado.
3. Verificar se `.trae/mcp.json` aponta para os servidores MCP necessários (filesystem, laravel-boost, clickup, etc.).
4. Limpar caches antigos do Trae se o `.ai-doc/data` mudou significativamente (fechar projeto e reabrir).

## ⚙️ Setup / Boas Práticas
- **Contexto:** O Trae carrega muito o `.ai-doc`. Evite arquivos obsoletos em `.ai-doc/data` (mover para arquivos arquivados se necessário).  
- **Performance:** Diretórios volumosos como `.ai-doc/data/changelog` devem ser compactados ou referenciados via resumo quando não usados.  
- **Ferramentas:** Sempre prefira as tools nativas (RunCommand, File Ops). Use scripts manuais apenas quando não houver tool equivalente.

## 🔌 Integrações e Scripts
- Se o Trae usar automações do kernel, mantenha `node .ai-doc/kernel/watch.cjs` ativo para rebuilds automáticos.  
- Para rodar scanners, utilize os comandos descritos no módulo `___analysis`.  
- Em caso de divergência entre Trae e outros IDEs, priorize o que estiver descrito no `.ai-doc/ai-modules/___core`.

## 🧪 Troubleshooting
| Sintoma | Possível causa | Correção |
| --- | --- | --- |
| Trae lento ao carregar | `.ai-doc/data` com muitos arquivos inúteis | Compactar/arquivar dados antigos e reiniciar o IDE. |
| Regras não aplicadas | Scripts não rodados | Executar `node .ai-doc/kernel/scripts/system/update-ai-rules.js`. |
| MCP falhando | Configuração incompleta em `.trae/mcp.json` | Atualizar endpoints e reiniciar Trae. |

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Guia expandido com checklist, integrações e troubleshooting. |
