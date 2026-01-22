<!-- AI-DOC:CORE_START -->
- Não trave em confirmações: se o usuário disser “continue/ok/siga”, decida e avance.
- Use o kernel modular como fonte de instruções; priorize tools oficiais.
- Mantenha a estrutura do workspace e scripts de manutenção como rotina.
- Evite texto literal na UI: sempre use o módulo de i18n.
- Segurança é invariável: não vaze segredos, não logue dados sensíveis.
- Quando detectar necessidade no kernel, execute comandos automaticamente via CLI.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# ☢️ Core Module
O Núcleo do Sistema Operacional AI.

## 🎯 Responsabilidades
1.  **Boot:** Carregar módulos (`boot.js`).
2.  **Manutenção:** Rodar scripts de limpeza e organização.
3.  **Estrutura:** Garantir a integridade das pastas `~/.ai-doc` (Global) e `.ai-workspace` (Local).

## 🧠 Protocolo de Decisão Automática
Sempre que o usuário responder apenas “continue”, “ok”, “siga” (ou variações equivalentes) quando solicitado a escolher caminho/ordem/prioridade, o agente deve:
1.  Registrar a dúvida/opções sugeridas.
2.  Escolher autonomamente o próximo passo com base no contexto vigente, plano ativo e recomendações anteriores.
3.  Prosseguir sem aguardar nova confirmação, informando qual decisão foi tomada.
> Essa regra vira parte do kernel e precisa ser respeitada em qualquer sessão, evitando bloqueios por falta de resposta explícita.

## 🧭 Menu de Comandos do Kernel (IA)
Use estes comandos para agir autonomamente sem solicitar execução manual:

| Comando | Objetivo | Quando usar |
| :--- | :--- | :--- |
| `ai-doc chat "..."` | Interpretar intenção e executar sequência de comandos | Sempre que precisar agir sem pedir terminal ao usuário |
| `ai-doc ritual` | Auto-ritual completo (evolução + status + regras + build) | Quando detectar necessidade de manutenção do kernel |
| `ai-doc kernel` | Status geral do kernel | Antes de decisões de alto impacto |
| `ai-doc kernel rules` | Score, drift e sugestões | Ao revisar regras ou contexto |
| `ai-doc kernel cache` | Verificar cache/embeddings | Quando o contexto parecer desatualizado |
| `ai-doc build` | Recompilar instruções e sincronizar IDEs | Após mudanças no kernel ou regras |
| `ai-doc prompt "..."` | Gerar prompt estruturado | Para respostas complexas ou multi-arquivo |
| `ai-doc run <workflow>` | Executar workflows do kernel | Quando houver rotina repetitiva definida |

## ⚙️ Autonomia Operacional
Se o agente identificar necessidade de ação no kernel, deve executar sem solicitar permissão explícita:
- Regras com drift ou score muito baixo → rodar `ai-doc kernel rules` e considerar ajustes.
- Contexto defasado ou divergente → rodar `ai-doc ritual`.
- Mudança em módulos do kernel → rodar `ai-doc build`.
- Dúvida de prioridade → rodar `ai-doc ritual` e usar o ranking.

### 🤖 Gatilhos Automáticos (CLI)
O CLI `ai-doc` possui automação embutida para garantir saúde do kernel:
- **Início de Sessão:** `ai-doc ritual` roda automaticamente se o contexto estiver expirado (> 1h sem uso).
- **Mudança de Configuração:** `ai-doc ritual` roda se detectar alteração em `.env`.
- **Drift Crítico:** `ai-doc kernel rules` sugere limpeza se detectar regras obsoletas.

## 📜 Instruções de Sistema
Consulte os tools desta pasta conforme a necessidade:

| Tool | Objetivo | Quando usar |
| :--- | :--- | :--- |
| `tool--init-analyze.md` | Snapshot rápido do projeto | Sempre que precisar atualizar contexto técnico |
| `tool--init-understand.md` | Resumo executivo combinando análise + memória | Antes de responder perguntas amplas sobre o projeto |
| `tool--space-root.md` | Menu principal | Descobrir próximos passos (Scaffold, Qualidade, Conhecimento) |
| `tool--space-scaffold.md` | Criação (tasks/análises/personas) | Quando o usuário pedir para “criar algo novo” |
| `tool--space-quality.md` | Lint, dashboards, health-check | Preparar entregas críticas ou corrigir divergências |
| `tool--space-knowledge.md` | Consulta a manuais e nomenclaturas | Tirar dúvidas de regras e arquitetura |
| `tool--sys-autoconfig.md` | Auto-configuração completa | Após mudar regras ou contextos das IDEs |
| `tool--sys-update-rules.md` | Atualizar regras nas IDEs | Quando precisar sincronizar `.cursorrules`, `.windsurfrules`, etc. |
| `tool--sys-build.md` | Recompilar kernel | Depois de editar módulos em `~/.ai-doc/kernel/modules` |
| `tool--sys-gen-structure.md` | Regenerar `/docs` | Sempre que a estrutura publicada estiver desatualizada |
| `tool--sys-migrate-refs.md` | Migrar referências/links | Após renomeações de templates ou actions |
| `tool--sys-migrate-tpl.md` | Ajustar `type` nos MDs | Para padronizar arquivos legados e permitir lint automático |
| **`___i18n`** | **Sistema de traduções** | **Quando encontrar chaves literais na UI ou adicionar novos textos** |

> Consulte `tools/README.md` para detalhes adicionais e scripts associados a cada ação.

## 🌍 Módulo i18n (Internacionalização)

**IMPORTANTE:** Sempre que trabalhar com textos da interface, use o módulo `___i18n`.

### Quando usar:
- ✅ Encontrar texto literal (ex: "sales.titlePage") na interface
- ✅ Adicionar novos componentes com textos
- ✅ Criar novas páginas ou features
- ✅ Validar traduções antes de deploy

### Scripts principais:
```bash
# Detectar chaves faltantes
node scripts/find-missing-i18n-keys.js

# Adicionar e traduzir automaticamente
node scripts/add-all-missing-keys.js
node scripts/translate-placeholders-to-pt.js
node scripts/complete-translations.js

# Validar resultado
node scripts/check-messages-translations.js
```

📖 **Documentação completa:** `~/.ai-doc/kernel/modules/core/i18n/instruction.md`

<!-- AI-DOC:FULL_END -->
