---
type: guide
name: copilot-module
description: Orientações para usar GitHub Copilot alinhado ao AI Kernel.
---

# 🤖 Copilot Module
Como fornecer contexto consistente ao GitHub Copilot.

## ✅ Checklist Inicial
1. Antes de iniciar uma sessão com Copilot Chat, revisar `ai-instructions.md` e, se necessário, colar o resumo do `active-state.json`.
2. Garantir que o repositório está sincronizado (git pull) e que `.ai-doc` não apresenta arquivos temporários não versionados sem necessidade.
3. Se estiver usando Codespaces ou VS Code, conferir se a extensão Copilot tem acesso ao workspace completo (Configurações → Features → Copilot).

## 🌍 Sistema i18n (Traduções)

**IMPORTANTE:** Copilot tem acesso a scripts completos de gerenciamento de traduções.

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

## ⚙️ Contexto & Prompting
- Copilot possui janela de contexto limitada: use `active-state.json`, `docs/40--tech-manual` e `docs/55--tech-stack` como fontes concisas para colar no chat quando precisar.  
- Para instruções longas, referencie os módulos específicos (ex.: “consultar `.ai-doc/ai-modules/___analysis/scanners/scanner--laravel.md`”).  
- Evite compartilhar dados sensíveis ou `.env` diretamente com o Copilot.

## 🧪 Troubleshooting
| Sintoma | Possível causa | Correção |
| --- | --- | --- |
| Copilot ignora contexto do kernel | Prompt muito curto ou sem referências | Cole trechos de `active-state.json` e cite arquivos-chave. |
| Respostas inconsistentes com padrões | Extensão desatualizada | Atualizar Copilot e recarregar VS Code/Codespaces. |
| Sugestões com dados vazados | Arquivos sensíveis expostos | Adicionar diretórios a `.gitignore`/`.copilotignore` e reiniciar sessão. |

## 📜 Histórico
| Data | Autor | Mudança |
| :--- | :--- | :--- |
| 2026-01-05 | AI Agent | Guia expandido com checklist e troubleshooting. |
