<!-- AI-DOC:CORE_START -->
- Use MCP Laravel Boost para introspecção antes de inferir pelo código.
- Cite a ferramenta usada e sanitize dados sensíveis antes de registrar.
- Atualize caches live-state quando fizer sentido para reduzir re-trabalho.
<!-- AI-DOC:CORE_END -->

<!-- AI-DOC:FULL_START -->

# 🚀 Tool: Laravel Boost
Instruções para uso da ferramenta de introspecção do Laravel.

## 🎯 O que é?
O MCP Laravel Boost fornece uma visão em tempo real do estado da aplicação Laravel, incluindo rotas, models, configs e logs.

## 🛠️ Capacidades
1.  **Schema Database:** `laravel-boost_database-schema` - Ver tabelas e colunas.
2.  **App Info:** `laravel-boost_application-info` - Versão do Laravel e pacotes.
3.  **Config:** `laravel-boost_get-config` - Ler configurações (ex: `app.name`).
4.  **Env Vars:** `laravel-boost_list-env-vars` - Listar variáveis de ambiente seguras.
5.  **Log Analysis:** `laravel-boost_ai-log-processor` - Analisar logs de erro com IA.

## 🔄 Fluxo de Diagnóstico
Ao investigar um bug no backend:
1.  Use `laravel-boost_ai-log-processor` para ver erros recentes.
2.  Use `laravel-boost_database-schema` para validar se a tabela existe.
3.  Use `laravel-boost_get-config` para verificar conexões.

> **Nota:** Prefira usar estas ferramentas antes de tentar `grep` ou ler arquivos de config manualmente, pois elas refletem o estado *em memória* do Laravel.

<!-- AI-DOC:FULL_END -->
