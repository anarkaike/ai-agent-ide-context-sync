<!-- AI-DOC:CORE_START -->
- Em projetos Laravel, prefira MCP (Laravel Boost) para introspecção antes de inferir.
- Atualize caches de live-state quando fizer sentido; cite a fonte do dado.
- Nunca registre segredos/envs em reports; sanitize antes.
- Converta insights em tasks/análises com links bidirecionais.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🌀 Laravel Integration Module
Centraliza instruções sobre introspecção do ecossistema Laravel usando o MCP Laravel Boost.

## 🎯 Objetivo
Oferecer um ponto único para diagnosticar o backend Laravel via ferramentas MCP (schemas, configs, logs) e manter o cache sincronizado.

## 🛠️ Ferramentas Disponíveis
| Tool | Descrição |
| :--- | :--- |
| `tool--tool-laravel-boost.md` | Playbook de uso do servidor Laravel Boost. |
| `tool--laravel-schema.md` | Como capturar o schema do banco e manter o cache `live-state`. |
| `tool--laravel-routes.md` | (novo) Inspecionar rotas/guards/versionamento via MCP. |
| `tool--laravel-config.md` | (novo) Ler configs/env sensitivas com segurança. |
| `tool--laravel-logs.md` | (novo) Playbook para análise de logs via `ai-log-processor`. |

> Sempre adicione novos playbooks específicos (ex: logs, rotas) na subpasta `tools/`.

## 🔍 Fluxo Recomendado
1. **Valide o contexto** lendo `.ai-workspace/live-state/laravel.json` (se existir).
2. **Execute** as ferramentas MCP conforme o objetivo:
   - `laravel-boost_ai-log-processor` para investigar erros recentes.
   - `laravel-boost_database-schema` para inspecionar tabelas/colunas.
   - `laravel-boost_get-config` e `laravel-boost_list-env-vars` para conferir configs sensíveis.
3. **Atualize o cache** em `.ai-workspace/live-state/` com os dados obtidos (quando fizer sentido).
4. **Propague o insight** criando análises em `.ai-workspace/analysis/findings/` ou tasks (`___tasks`). Cite o playbook utilizado.

## 🔗 Integrações
- **___analysis**: Referencie este módulo quando um scanner depender de dados runtime (evite duplicação de instruções).
- **___mcp**: Este módulo descreve a estratégia híbrida cache/live; use-o junto com estas instruções.
- **Aplicação Laravel**: Endpoint `_boost` está protegido por token (ver `config/ai.php`).

## 📝 Boas Práticas
1. Sempre prefira MCP antes de ler arquivos locais para obter o estado real do app.
2. Limpe dados sensíveis antes de registrar logs/insights nas tasks.
3. Documente passos e comandos usados no relatório ou task vinculada.

## 📜 Histórico de Alterações
| Data | Autor | Descrição |
| :--- | :--- | :--- |
| 2026-01-04 | AI Agent | Criação do módulo e migração do playbook Laravel Boost. |

<!-- AI-DOC:FULL_END -->
