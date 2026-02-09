---
id: task-014
title: Agent OS Epic — 20 iniciativas (Roadmap executável)
persona: AI-DEV
status: in_progress
priority: high
created_at: 2026-02-09T06:06:07.000Z
auto_execute: false
tags:
  - epic
  - roadmap
  - agent-os
  - security
  - observability
objectives:
  - Transformar as 20 propostas em entregas implementáveis (MVP → Hardening)
  - Definir arquitetura, boundaries e APIs para evitar retrabalho
  - Garantir segurança (zero-trust), auditabilidade e rollback seguro
  - Garantir DX/UX (VSCode/CLI) sem textos hardcoded (i18n obrigatório no VSCode)
  - Garantir observabilidade de ponta-a-ponta (logs/eventos/métricas)
deliverables:
  - Documento épico com 20 workstreams detalhados (escopo, MVP, hardening, checklist, DoD)
  - Milestones e dependências explícitas entre iniciativas
  - Padrões cross-cutting (event schema, policy-as-code, segurança, i18n)
  - Lista de arquivos do repo afetados por iniciativa
---

# Agent OS Epic — 20 iniciativas (Roadmap executável)

## Contexto
Você aprovou **todas as 20 iniciativas**. Esta task é um **épico operacional**: a intenção é que um modelo mais simples (**SWR-1.5 Fast**) consiga executar as entregas com baixa ambiguidade.

## Como usar (para SWR-1.5 Fast)
- Foque **1 iniciativa por vez**.
- Antes de codar:
  - valide se já existe implementação parcial no repo
  - mapeie consumidores e efeitos colaterais (CLI / VSCode / core)
- Para cada iniciativa, siga:
  - **MVP** (end-to-end mínimo)
  - **Hardening** (segurança, testes, observabilidade, docs)
  - **Validação** (rodar testes existentes + smoke tests)

## Checklist (macro)
- [ ] Confirmar que este épico aparece na árvore de Tasks do VSCode
- [ ] Completar detalhamento das iniciativas 1–10
- [ ] Completar detalhamento das iniciativas 11–20
- [ ] Revisão final: consistência (segurança/observabilidade/i18n/Nanobot)

## 🗺️ Mapa de Contexto do Projeto

### 📚 Documentação Relacionada
- `docs/PROJECT_ARCHITECTURE.md` - visão geral e componentes
- `docs/40--tech-manual/20--project-architecture-patterns/notification-system.md` - padrões de notificação
- `.ai-doc/manual/10--agents/nanobot-devops-integration.md` - referência de Nanobot / trust-network

### 🔬 Análises Prévias
- `.ai-workspace/tasks/active/AI-JUNIOR--task-SNAPSHOT-CONTEXT-RESTORATION.md` - snapshot de tone / swarm / risk UI

### 📋 Tasks Relacionadas
- `.ai-workspace/tasks/active/AI-DEV--task-010-test-rollback-task.md`
- `.ai-workspace/tasks/active/AI-DEV--task-011-test-observability.md`
- `.ai-workspace/tasks/active/AI-DEV--task-012-improve-scalability.md`
- `.ai-workspace/tasks/active/AI-DEV--task-013-fix-scaling-issues.md`

### 💻 Arquivos de Código Principais (Foco)
- `packages/core/src/index.js` - ponto central (`initializeCore()`)
- `packages/core/src/memory/WALManager.js` - WAL/checkpoints/recovery
- `packages/core/src/memory/MemoryManager.js` - NÚCLEUS, integridade, SBT
- `packages/core/src/security/SecuritySandbox.js` - sanitização/validação
- `packages/core/src/network/AgentMeshNetwork.js` - mesh/network
- `packages/core/src/sync/IntelligentSyncEngine.js` - delta sync/compressão
- `packages/core/src/optimization/AutoOptimizationEngine.js` - auto-otimização
- `packages/cli/cli/commands/task.js` - tasks + trust/safety checks
- `packages/cli/core/security/SafetyFilter.js` - heurística de risco
- `packages/cli/core/swarm/TrustSystem.js` - zero-trust + SBT trust
- `packages/cli/core/security/ApprovalLogger.js` - auditoria de decisões
- `packages/extension/extension.js` - UI/commands/tasks/i18n
- `scripts/nanobot-coordinator.js` - orquestração de agentes

## Guardrails (regras globais)

### Segurança (obrigatório)
- Nenhum segredo em logs.
- Tudo que for destrutivo deve passar por:
  - `SafetyFilter` (conteúdo)
  - `TrustSystem` (vínculo)
  - `ApprovalLogger` (auditoria)

### VSCode UI (obrigatório)
- Não adicionar texto hardcoded na UI.
- Sempre usar `i18n.t('...')` e atualizar `packages/extension/locales/*.json`.

### Observabilidade (padrão mínimo)
Definir/usar um schema mínimo (JSON) em logs/eventos cross-packages:
- `trace_id`
- `span_id`
- `event_type`
- `component` (core/cli/extension/desktop-ui/nanobot)
- `severity`
- `timestamp`
- `payload` (sanitizado)

### Nota técnica (risco conhecido): ESM vs CJS no `@ai-agent/core`
O `packages/core/package.json` usa `type: module`, então arquivos `.js` dentro de `packages/core/src/**` devem ser ESM. Se algum arquivo usar `require(...)`, isso pode quebrar runtime e precisa ser normalizado antes de expandir.

---

# Iniciativas (20 workstreams)

> Cada iniciativa abaixo deve virar uma subtask específica quando começar a execução.

## 1) Time‑Travel Debugger do Contexto (WAL → CLI → VSCode)
**Objetivo:** navegar transações/checkpoints e reproduzir como o estado foi construído.

### Escopo
- Expor **leitura** de WAL/checkpoints (timeline) via CLI.
- Criar um **visualizador** no VSCode (webview) para timeline + detalhes.
- Exportar relatórios (JSON/MD) para anexar em tasks e facilitar debug.

### Estado atual (evidências no repo)
- `packages/core/src/memory/WALManager.js` já possui:
  - `beginTransaction(type, metadata)`
  - `addOperation(operationType, operation)`
  - `commitTransaction()` / `rollbackTransaction(reason)`
  - `createCheckpoint(name, metadata)` / `restoreFromCheckpoint(checkpointId)`
  - persistência em `.ai-workspace/journal/wal/wal.json` e checkpoints em `.ai-workspace/checkpoints/`
- O CLI hoje tem um WAL “simplificado” para operações de execução via:
  - `packages/cli/core/reliability/ExecutionJournal.js`
  - `ai-doc task audit` e `ai-doc task rollback` (ver `packages/cli/cli/commands/task.js`)

### Gap
- Não existe uma interface **unificada** e **navegável** (CLI/VSCode) para entender a linha do tempo do WAL do core.
- Não existe um contrato de export (“event schema”) para anexar evidência de rollback/checkpoints em tasks.

### MVP (read-only + export)

#### Entregas do CLI
- Criar comando `ai-doc wal stats`:
  - usa `initializeCore()` e imprime `wal.getStats()`.
- Criar comando `ai-doc wal timeline [--last N] [--json]`:
  - lê o journal (via core ou via arquivo `wal.json`).
  - agrupa por `transactionId`.
  - imprime saída humana e (opcional) JSON.
- Criar comando `ai-doc wal checkpoints [--json]`:
  - lista checkpoints em `.ai-workspace/checkpoints/*.json` (ignorando `*-journal.json`).

#### Entregas do VSCode
- Criar comando `ai-agent-sync.openTimeTravelDebugger`.
- Webview com:
  - lista de transações (id, type, status, createdAt)
  - painel com operações (`OPERATION`) e commits/rollbacks
  - botão “export” para salvar arquivo em `.ai-workspace/reports/`
- **i18n obrigatório**:
  - adicionar chaves em `packages/extension/locales/en.json` e `packages/extension/locales/pt-BR.json`

#### Entregas do Core (mínimo)
- Se necessário, adicionar métodos read-only no `WALManager` (sem side effects), por exemplo:
  - `getJournalSnapshot()` (retorna array de entries)
  - `getCheckpointIndex()` (retorna lista de checkpoints carregados)

### Hardening (restore/replay com segurança)
- Ações destrutivas (ex.: `restoreFromCheckpoint`) só podem existir se:
  - exigirem confirmação explícita
  - registrarem auditoria (ex.: `ApprovalLogger` no CLI)
  - criarem `operation_id` no `ExecutionJournal` para rollback/forense
- Se o restore for permitido via Swarm/externo:
  - exigir token válido com `TrustSystem.validateRequest(...)` **ou** cair em `pending_approval` (padrão já existente em `task.js`).

### Checklist executável
- [ ] Definir spec JSON do export de timeline (usar schema mínimo de observabilidade deste épico)
- [ ] Implementar `ai-doc wal stats`
- [ ] Implementar `ai-doc wal timeline` (humano + `--json`)
- [ ] Implementar `ai-doc wal checkpoints` (humano + `--json`)
- [ ] VSCode: comando + webview (lista/detalhes/export)
- [ ] Adicionar chaves i18n (labels, erros, tooltips)
- [ ] Testes: fixtures com `wal.json` pequeno + smoke test do parser

### Definição de Pronto (DoD)
- CLI lista timeline e checkpoints sem erro em workspace vazio e não-vazio.
- Webview abre e exporta relatório sem travar.
- MVP é **read-only** (nenhuma ação destrutiva exposta por padrão).

### Riscos e mitigação
- **Risco:** timeline muito grande.
  - **Mitigação:** suportar `--last N` e paginação na UI.
- **Risco:** restore corromper estado.
  - **Mitigação:** restore só em modo explícito + auditoria + rollback via journal.

## 2) Zero‑Trust Memory (assinatura, auditoria e integridade)
**Objetivo:** prevenir injeção de memória e garantir integridade verificável.

### Ameaça / motivação
- “Memory injection” via alteração silenciosa de:
  - `.ai-workspace/memory/NUCLEUS.md`
  - `.ai-workspace/memory/soul_ledger.json`
- Alterações remotas (swarm) sem trilha de auditoria clara.

### Estado atual (evidências no repo)
- `packages/core/src/memory/MemoryManager.js`:
  - `validateNucleusIntegrity()` hoje valida **estrutura** (campos, estado, tamanho), não assinatura criptográfica.
- `packages/core/src/security/SecuritySandbox.js`:
  - possui `sign(data)` e `verify(signedData)` usando HMAC-SHA256 com a chave `.ai-workspace/.security-key`.
- CLI já tem interceptação por risco/confiança para **tasks remotas** (ver `packages/cli/cli/commands/task.js`), mas não para memória.

### Design proposto
- Introduzir “integridade verificável” para artefatos críticos:
  - `NUCLEUS.md`
  - `soul_ledger.json`
  - (opcional) snapshots/export do contexto
- Modelo recomendado (simples e executável): assinatura em sidecar JSON.
  - Exemplo: `NUCLEUS.md.sig.json` e `soul_ledger.json.sig.json`
  - Conteúdo do sidecar (mínimo):
    - `hash_sha256`
    - `signature_hmac_sha256`
    - `signed_at`
    - `signed_by` (id local)
- Auditoria:
  - qualquer falha de verificação deve gerar evento (schema do épico) e log no `ApprovalLogger`.
  - opção de criar automaticamente uma task `SECURITY-REVIEW--task-XXX-memory-integrity.md` (padrão similar ao pending_approval do `task.js`).

### MVP
- CLI
  - `ai-doc memory sign`:
    - gera/atualiza sidecar para `NUCLEUS.md` e `soul_ledger.json`.
  - `ai-doc memory verify [--json]`:
    - verifica sidecars; retorna OK/FAIL + motivo.
- Core
  - criar utilitário `MemoryIntegrity` (novo) para:
    - calcular `sha256` do arquivo
    - assinar/verificar usando `SecuritySandbox`
- Boot / runtime
  - ao carregar NÚCLEUS/ledger:
    - se sidecar existir e falhar verificação: marcar estado como `COMPROMISED` e **não auto-reparar** silenciosamente.

### Hardening
- Integração com `TrustSystem` (swarm):
  - “memory write requests” remotas só podem ser aplicadas se:
    - token válido (`validateRequest`) com nível mínimo, **ou**
    - trust_score >= limiar de policy, **ou**
    - virar task `pending_approval`.
- Integrar WAL
  - toda mutação de arquivos críticos deve ser encapsulada numa transação WAL com operações `FILE_WRITE` / `FILE_DELETE` / `FILE_MOVE`.
- Expandir `SafetyFilter`
  - adicionar padrões para alterações persistentes (“escreva no NÚCLEUS”, “persist instructions”, etc.) via policy.

### Checklist executável
- [ ] Definir formato do sidecar `*.sig.json`
- [ ] Implementar `ai-doc memory sign`
- [ ] Implementar `ai-doc memory verify` (humano + `--json`)
- [ ] Integrar verificação no load do NÚCLEUS/ledger
- [ ] Logar auditoria (ApprovalLogger + event schema)
- [ ] Teste de tamper: alterar 1 byte do NÚCLEUS e garantir FAIL

### Definição de Pronto (DoD)
- Qualquer alteração manual em `NUCLEUS.md` ou `soul_ledger.json` sem re-assinatura é detectada.
- Nenhuma “correção automática” destrutiva roda sem ficar explícito no log/auditoria.
- Logs nunca incluem conteúdo completo de memória (somente hashes/ids).

## 3) Policy‑as‑Code (políticas versionadas e executáveis)
**Objetivo:** regras de execução, acesso e rede expressas em arquivos versionados.

### Estado atual (evidências)
- `packages/cli/cli/commands/task.js` possui limiares hardcoded:
  - exemplo: `trustScore < 50` para interromper execução remota sem token.
- `packages/cli/core/security/SafetyFilter.js` contém padrões hardcoded.
- `packages/core/src/security/SecuritySandbox.js` tem defaults hardcoded para:
  - `allowedPaths`
  - `commandWhitelist`
  - `blockedCommands`

### Design proposto
- Criar diretório de políticas do projeto:
  - `.ai-workspace/policies/`
  - arquivo principal: `.ai-workspace/policies/policy.yaml`
- Resolver políticas com precedência:
  1. policy do projeto
  2. policy do usuário (opcional)
  3. defaults embutidos
- O arquivo de policy controla (mínimo):
  - limiares de trust e exigência de token
  - extensões de padrões do `SafetyFilter`
  - allow/deny de comandos e paths do `SecuritySandbox`
  - budgets (tamanho de output, limites de execução)

### MVP
- CLI
  - `ai-doc policy init` (gera `policy.yaml` com defaults seguros)
  - `ai-doc policy validate` (valida schema e imprime erros)
  - `ai-doc policy show --effective` (mostra policy mesclada)
- Aplicar policy em fluxos existentes
  - `task.js`: substituir thresholds hardcoded por policy
  - `SafetyFilter`: carregar patterns adicionais da policy
  - `SecuritySandbox`: carregar allow/deny e paths da policy

### Hardening
- VSCode
  - comando para abrir o `policy.yaml` + validar e mostrar diagnóstico (i18n obrigatório)
- Testes
  - fixtures de policy (válida/inválida)
  - testes de regressão para execução remota `--auto`

### Checklist executável
- [ ] Definir schema YAML (versão + defaults)
- [ ] Implementar loader/merge/validate
- [ ] Integrar policy no `task.js` (trust thresholds)
- [ ] Integrar policy no `SafetyFilter` (patterns)
- [ ] Integrar policy no `SecuritySandbox` (comandos/paths)
- [ ] Testes com fixtures + mensagens de erro claras

### Definição de Pronto (DoD)
- Alterar `policy.yaml` muda o comportamento sem alterar código.
- Policies inválidas são rejeitadas com erro explícito.
- Defaults continuam “secure-by-default”.

## 4) Skills Marketplace (skills versionadas, assinadas e “installables”)
**Objetivo:** catálogo de skills com verificação de integridade e permissão.

### Escopo
- Definir “skill package” (manifest + código + assinatura).
- Ter um registry local de skills instaladas por workspace.
- Expor operações via CLI e (opcional) VSCode:
  - listar
  - verificar integridade
  - instalar/remover
  - executar (sandbox)

### Estado atual (evidências no repo)
- Já existe um pacote inicial de skills em `packages/ai-skills-interface/`:
  - loader/registry: `packages/ai-skills-interface/index.cjs`
  - skills exemplo: `packages/ai-skills-interface/skills/*.cjs`
  - build/export: `packages/ai-skills-interface/scripts/build-skills.cjs`
  - export já gerado: `packages/ai-skills-interface/exported-skills.json` e `packages/ai-skills-interface/dist/skills.json`
  - performance: `packages/ai-skills-interface/performance/CacheManager.cjs` e `OptimizedAISkills.cjs`
- Não existe ainda comando no CLI para instalar/executar skills.

### Gap
- Falta:
  - política de permissões por skill
  - assinatura/verificação (supply chain)
  - UI/CLI para “marketplace”
  - sandboxed execution (restrição de comandos/paths)

### MVP (local marketplace + execução segura)

#### Formato do pacote (mínimo viável)
- Criar um diretório padrão por workspace:
  - `.ai-workspace/skills/`
  - `.ai-workspace/skills/registry.json`
  - `.ai-workspace/skills/packages/<skillName>/<version>/...`
- Manifest mínimo `skill.yaml` (por pacote):
  - `name`, `version`, `description`, `entrypoint`
  - `capabilities`, `tags`
  - `permissions` (ex.: commands, paths)
  - `integrity` (hash + assinatura)

#### Assinatura e verificação
- Usar `packages/core/src/security/SecuritySandbox.js`:
  - `sign(data)` / `verify(signedData)`
- Assinar o manifest (ou um hash determinístico do pacote) e armazenar em `skill.sig.json`.

#### CLI
- Implementar comandos:
  - `ai-doc skills list [--json]`
  - `ai-doc skills install <path|tar|git-url> [--trust-token ...]`
  - `ai-doc skills remove <name> [--version ...]`
  - `ai-doc skills verify <name> [--version ...] [--json]`
  - `ai-doc skills run <name> --action <action> [--params <json>]`
- Execução sempre via sandbox:
  - validar inputs com `SecuritySandbox.sanitizeInput()`
  - validar comandos com `SecuritySandbox.validateCommand()`
  - validar paths com `SecuritySandbox.validatePath()`

#### VSCode (opcional no MVP)
- View “Skills”:
  - lista skills instaladas
  - botão “verificar”
  - botão “executar” (somente ações não-destrutivas)
- i18n obrigatório.

### Hardening (marketplace via swarm + governança)
- Publicação/instalação remota:
  - exigir `TrustSystem.validateRequest(agentId, token, requiredLevel)`
  - fallback para `pending_approval` com auditoria (via `ApprovalLogger`)
- Observabilidade:
  - cada execução de skill deve emitir evento (schema do épico) com:
    - `skill_name`, `skill_version`, `action`, `duration_ms`, `success`
- Budgets:
  - limitar tempo de execução e tamanho de output por policy (ligar com iniciativa 3 e 10).

### Checklist executável
- [ ] Definir spec do `skill.yaml` + `skill.sig.json`
- [ ] Criar registry local `.ai-workspace/skills/registry.json`
- [ ] Implementar `ai-doc skills list`
- [ ] Implementar `ai-doc skills install/remove`
- [ ] Implementar `ai-doc skills verify`
- [ ] Implementar `ai-doc skills run` com sandbox
- [ ] Logs/eventos para auditoria + métricas
- [ ] Teste e2e: instalar skill local, verificar assinatura, executar ação read-only

### Definição de Pronto (DoD)
- Uma skill local pode ser instalada, verificada e executada com sucesso.
- Instalação de pacote adulterado falha em `verify`.
- Execução não consegue sair de `allowedPaths` nem executar comando fora da whitelist.

### Riscos e mitigação
- **Risco:** execução de código não confiável.
  - **Mitigação:** assinatura + sandbox + trust/approval para instalação remota.
- **Risco:** inconsistência ESM/CJS (skills `.cjs` vs packages `type: module`).
  - **Mitigação:** padronizar contrato de execução (wrapper) e validar runtime no MVP.

## 5) Agent Mesh Networking (service discovery + heartbeats)
**Objetivo:** mesh confiável para agentes com discovery e health.

### Nota: já existe implementação base no core
- Código:
  - `packages/core/src/network/AgentMeshNetwork.js`
  - `packages/core/src/network/ServiceDiscovery.js`
  - `packages/core/src/network/LoadBalancer.js`
- Docs/relatório:
  - `packages/core/AGENT_MESH_NETWORK_REPORT.md`
- Testes:
  - `packages/core/src/test/network.test.js`

### Gap (o que falta para ser “produção”)
- Segurança de rede:
  - autenticação entre nós
  - assinatura/verificação de mensagens
  - integração com TrustSystem e políticas
- Integração com Nanobot trust network (padrão do projeto).
- UX/operabilidade (CLI/VSCode) para ver:
  - peers, serviços, saúde, métricas

### MVP (operabilidade + segurança mínima)

#### CLI
- Criar comandos:
  - `ai-doc mesh start [--port N]`
  - `ai-doc mesh connect <peerUrl>`
  - `ai-doc mesh peers [--json]`
  - `ai-doc mesh services [--json]`
  - `ai-doc mesh metrics [--json]`
- Comportamento:
  - usar `initializeCore()` para obter `network/serviceDiscovery/loadBalancer`
  - iniciar `network.start()` e persistir estado mínimo em `.ai-workspace/live-state/mesh.json`

#### Segurança mínima (sem criptografia ainda)
- Sanitizar inputs (URLs, payloads) com `SecuritySandbox.sanitizeInput()`.
- Bloquear peers fora de policy (iniciativa 3): allowlist/denylist por domínio/ip.

### Hardening (zero-trust + Nanobot)
- Integrar autenticação de nós com `TrustSystem`:
  - handshake deve carregar `agentId` + token.
  - mensagens rejeitadas se `validateRequest(...)` falhar.
- Assinatura de mensagens:
  - assinar payloads com `SecuritySandbox.sign()`.
  - verificar no receiver com `SecuritySandbox.verify()`.
- Integração Nanobot:
  - registrar nó/serviços na trust network (ver `scripts/nanobot-core.js` e `scripts/nanobot-coordinator.js`).
  - compartilhar “service registry” via Knowledge Base.

### Checklist executável
- [ ] Validar runtime real do core network (ESM/CJS) e corrigir incompatibilidades antes de expor CLI
- [ ] Implementar `ai-doc mesh start/connect/peers/services/metrics`
- [ ] Persistir estado mínimo em `live-state/`
- [ ] Adicionar policy allowlist/denylist para peers
- [ ] Integrar trust token no handshake + mensagens
- [ ] Assinar/verificar mensagens
- [ ] Smoke test: 2 nós, 1 serviço, discovery + metrics

### Definição de Pronto (DoD)
- Um nó pode iniciar, conectar em outro nó, registrar serviço e descobrir.
- Métricas e peers podem ser listados via CLI.
- Mensagens sem token (ou fora de policy) são rejeitadas quando hardening ligado.

### Riscos e mitigação
- **Risco:** abrir porta/serviço inseguro.
  - **Mitigação:** policy default “deny”, exigir allowlist local.
- **Risco:** complexidade operacional.
  - **Mitigação:** comandos CLI com `--json` + arquivos em `live-state`.

## 6) Autopruner / Context Garbage Collector
**Objetivo:** reduzir custo/ruído com políticas de retenção e compactação.

### Estado atual (evidências)
- `packages/cli/core/smart-cache.js`:
  - TTL 24h para prompts e invalidação por timestamp de arquivo.
- `packages/core/src/memory/WALManager.js`:
  - `trimJournal()` e `trimCheckpoints()` com `maxJournalSize` / `maxCheckpoints`.
- `packages/core/src/sync/DeltaCompressionEngine.js`:
  - `maxDeltaAge` (5 min) e `deltaCache` em memória.
- `packages/ai-skills-interface/performance/CacheManager.cjs`:
  - cache LRU + TTL + `cleanup()`.

### Gap
- Retenção está espalhada, com múltiplos “mini-GCs” sem orquestração.
- Falta modo “dry-run”, relatórios e política central.

### MVP (prune local, seguro e auditável)

#### Policy
- Adicionar seção de retenção no `policy.yaml` (iniciativa 3), por exemplo:
  - limites de tamanho e idade por diretório/artefato
  - `max_checkpoints`, `max_journal_entries`, `smart_cache_ttl_hours`, etc.

#### CLI
- Implementar comando:
  - `ai-doc prune --dry-run [--json]`
  - `ai-doc prune --apply [--json]`
- Deve cobrir (mínimo):
  - `.ai-workspace/cache/smart-cache.json` (remover entradas expiradas)
  - `.ai-workspace/journal/**` (limpeza por policy)
  - `.ai-workspace/checkpoints/` (manter os N mais recentes)
  - `.ai-workspace/reports/` (opcional, por idade)

#### Segurança
- Todo delete deve passar por `SecuritySandbox.validatePath()`.
- Operações devem ser registradas com `operation_id` (ExecutionJournal) quando `--apply`.

### Hardening
- Integrar pruning com:
  - `WALManager` (chamar `trimJournal/trimCheckpoints` quando apropriado)
  - cache de skills (`CacheManager.cleanup()`)
  - delta cache: remover deltas mais antigos que `maxDeltaAge` (se exposto por API)
- Relatórios:
  - escrever relatório JSON em `.ai-workspace/reports/prune-YYYYMMDD-HHMM.json`.

### Checklist executável
- [ ] Definir política de retenção (em `policy.yaml`)
- [ ] Implementar `ai-doc prune --dry-run`
- [ ] Implementar `ai-doc prune --apply` com logs e `operation_id`
- [ ] Cobrir smart-cache + checkpoints + journal
- [ ] Relatório JSON do prune
- [ ] Teste com workspace sintético (criar 20 checkpoints, garantir que mantém apenas N)

### Definição de Pronto (DoD)
- `--dry-run` lista exatamente o que seria removido (sem alterar nada).
- `--apply` remove com segurança (somente dentro de allowedPaths) e gera relatório.
- Rodar prune não quebra `ai-doc task list` nem `ai-doc build`.

### Riscos e mitigação
- **Risco:** remover artefatos úteis.
  - **Mitigação:** dry-run obrigatório + policy defaults conservadoras.
- **Risco:** concorrência com processos escrevendo cache.
  - **Mitigação:** lockfile simples em `.ai-workspace/locks/prune.lock` (se necessário).

## 7) Conflict Studio (UI/CLI para conflitos de sync)
**Objetivo:** visualizar/resolver conflitos com estratégias do `ConflictResolutionEngine`.

### Estado atual (evidências)
- `packages/core/src/sync/ConflictResolutionEngine.js`:
  - 7 estratégias implementadas: `latest-wins`, `local-wins`, `remote-wins`, `merge`, `semantic-merge`, `voting`, `manual`.
  - `addResolutionRule(pattern, strategy)` para regras por glob pattern.
  - `getStats()` retorna `totalConflicts`, `resolvedConflicts`, `strategies`, `avgConfidence`, `conflictTypes`.
  - `conflictHistory` armazena histórico por chave.
- `packages/core/src/sync/IntelligentSyncEngine.js`:
  - `this.conflicts` (Map) armazena conflitos pendentes.
  - `resolveConflict(key, strategy)` delega para `ConflictResolutionEngine`.
  - Conflitos são detectados automaticamente durante `syncWithPeers()`.
- Testes: `packages/core/src/test/sync.test.js` cobre `latest-wins` e `merge`.

### Gap
- Nenhuma interface (CLI ou UI) expõe conflitos pendentes ao operador.
- Estratégia `manual` retorna `data: null` — não tem fluxo de resolução interativa.
- `voting` usa votos simulados (`Math.random()`), não consulta peers reais.

### MVP (CLI interativa para conflitos)

#### CLI
- Implementar comandos:
  - `ai-doc conflicts list [--json]`
    - Lista conflitos pendentes: chave, timestamps, estratégia sugerida, confidence.
    - Fonte: `syncEngine.conflicts` (Map).
  - `ai-doc conflicts show <key> [--json]`
    - Mostra diff visual (local vs remote) para uma chave específica.
    - Destacar campos divergentes.
  - `ai-doc conflicts resolve <key> --strategy <strategy>`
    - Resolve usando a estratégia indicada.
    - Chama `syncEngine.resolveConflict(key, strategy)`.
  - `ai-doc conflicts resolve <key> --manual --data <json>`
    - Resolve com dados fornecidos manualmente.
  - `ai-doc conflicts rules list [--json]`
    - Lista regras de resolução ativas.
  - `ai-doc conflicts rules add <pattern> --strategy <strategy>`
    - Chama `conflictEngine.addResolutionRule(pattern, strategy)`.
  - `ai-doc conflicts stats [--json]`
    - Exibe `conflictEngine.getStats()`.

#### Diff visual (terminal)
- Representar local/remote lado a lado (JSON diff).
- Marcar campos conflitantes com cores (vermelho/verde).
- Usar dependência leve (ex.: `diff` ou implementação interna com `JSON.stringify` + comparação linha a linha).

### Hardening (VSCode + voting real)

#### VSCode
- View "Conflict Studio":
  - TreeView com conflitos pendentes.
  - Panel com diff visual (WebviewPanel).
  - Botões: "Resolver com [estratégia]", "Resolver manualmente", "Adicionar regra".
- i18n obrigatório para todas as strings de UI.

#### Voting real
- Substituir `_collectVotes()` simulado:
  - Enviar mensagem `{ type: 'conflict-vote', key, local, remote }` via `network.broadcastMessage()`.
  - Coletar respostas em tempo limitado (timeout configurável).
  - Tabular votos e aplicar resultado.

### Checklist executável
- [ ] Implementar `ai-doc conflicts list/show/resolve/stats`
- [ ] Implementar `ai-doc conflicts rules list/add`
- [ ] Diff visual no terminal (JSON lado a lado)
- [ ] Persistir regras de resolução em `.ai-workspace/config/conflict-rules.json`
- [ ] Teste: criar conflito sintético, listar, resolver com cada estratégia
- [ ] (Hardening) WebviewPanel no VSCode com diff e botões

### Definição de Pronto (DoD)
- Conflitos pendentes podem ser listados e resolvidos via CLI.
- Regras de resolução persistem entre sessões.
- `--json` funciona em todos os comandos para integração programática.

### Riscos e mitigação
- **Risco:** conflitos acumulam sem resolução.
  - **Mitigação:** `ai-doc conflicts list` deve alertar quando há conflitos > N ou > X horas.
- **Risco:** resolução manual com dados inválidos.
  - **Mitigação:** validar schema/tipo do dado antes de aceitar `--data`.

## 8) Shadow Mode (execução paralela sem impacto)
**Objetivo:** rodar decisões/ações em modo simulado para comparar resultados.

### Escopo
- Permitir que qualquer ação do agente (task, skill, comando) rode em paralelo num sandbox de leitura sem alterar o workspace real.
- Comparar resultado "shadow" vs resultado "real" para validação, testes A/B e detecção de regressões.

### Estado atual (evidências)
- `packages/core/src/security/SecuritySandbox.js`:
  - `validateCommand()` e `validatePath()` já restringem execução.
  - Não há modo "dry-run" ou "shadow" explícito no sandbox.
- `packages/cli/core/security/SafetyFilter.js`:
  - `analyze(content)` retorna `{ safe, requires_approval, score, threats }`.
  - Poderia ser usado como pré-filtro para decidir se shadow mode é necessário.
- `packages/core/src/optimization/AutoOptimizationEngine.js`:
  - Possui `optimizableParams` com ranges. Poderia testar novos parâmetros em shadow antes de aplicar.
- WAL (`packages/core/src/memory/WALManager.js`):
  - Suporta transactions com rollback — pode ser a base para "executar e descartar".

### Gap
- Não existe conceito de "fork de estado" (snapshot → executar → comparar → descartar).
- Nenhuma CLI/flag `--shadow` disponível.

### MVP (shadow mode local via WAL fork)

#### Arquitetura
1. **Antes da ação**: criar WAL checkpoint (`WALManager.createCheckpoint()`).
2. **Executar ação normalmente** (mas marcada como `shadow: true`).
3. **Capturar resultado** (output, side-effects, métricas).
4. **Rollback automático** via `WALManager.rollbackTransaction()`.
5. **Comparar** resultado shadow com estado anterior e/ou resultado real.

#### CLI
- Flag global `--shadow` em comandos existentes:
  - `ai-doc task create "..." --shadow` → cria task, captura resultado, faz rollback.
  - `ai-doc skills run <name> --action <action> --shadow` → executa skill, captura, rollback.
- Comando dedicado:
  - `ai-doc shadow run "<comando-ai-doc>" [--compare-with-real] [--json]`
    - Executa o comando em modo shadow.
    - `--compare-with-real`: executa também sem shadow e mostra diff.
  - `ai-doc shadow report [--json]`
    - Lista últimas execuções shadow com resultados e comparações.

#### Restrições de segurança
- Em shadow mode:
  - File writes vão para diretório temporário (`.ai-workspace/shadow-tmp/`).
  - Comandos de shell bloqueados (ou redirecionados para `echo`/`dry-run`).
  - Network calls bloqueadas (ou mockadas).
- Limpeza: `shadow-tmp/` removido após captura do resultado.

#### Persistência de resultados
- Salvar em `.ai-workspace/reports/shadow/shadow-<timestamp>.json`:
  - `command`, `params`, `result`, `side_effects`, `duration_ms`, `comparison` (se `--compare-with-real`).

### Hardening
- Integrar com `AutoOptimizationEngine`:
  - Testar novos parâmetros em shadow antes de aplicar ao sistema.
  - Se resultado shadow for melhor (por métrica definida), propor aplicação.
- Integrar com `SafetyFilter`:
  - Ações com `score <= 80` rodam automaticamente em shadow primeiro.
  - Se shadow mode detectar side-effects perigosos, bloquear execução real.

### Checklist executável
- [ ] Implementar `ShadowExecutor` (checkpoint → execute → capture → rollback)
- [ ] Adicionar flag `--shadow` no CLI parser principal (`ai-doc.js`)
- [ ] Implementar `ai-doc shadow run` e `ai-doc shadow report`
- [ ] Criar diretório temporário `.ai-workspace/shadow-tmp/` com cleanup
- [ ] Relatório JSON por execução shadow
- [ ] Teste: executar `ai-doc task create` em shadow, verificar que task NÃO existe após rollback
- [ ] (Hardening) Integrar com AutoOptimizationEngine para testes de parâmetros

### Definição de Pronto (DoD)
- `--shadow` executa e faz rollback sem deixar rastro no workspace.
- Relatório shadow contém resultado + duração + diff (quando `--compare-with-real`).
- Side-effects de rede e shell são bloqueados ou mockados em shadow mode.

### Riscos e mitigação
- **Risco:** rollback incompleto deixa artefatos "fantasma".
  - **Mitigação:** usar WAL transaction + cleanup de `shadow-tmp/` em `finally`.
- **Risco:** shadow mode consome recursos duplicados.
  - **Mitigação:** limitar execução shadow a 1 por vez (semáforo simples).
- **Risco:** resultado shadow diverge do real por falta de side-effects.
  - **Mitigação:** documentar claramente quais side-effects são mockados; `--compare-with-real` é opt-in.

### Dependências
- Iniciativa 2 (Execution Journal) para registrar execuções shadow.
- WAL (`WALManager`) para checkpoint/rollback.
- `SecuritySandbox` para restrições de I/O.

## 9) Canary Agents (deploy gradual de mudanças)
**Objetivo:** liberar features para subset de agentes/projetos antes de generalizar.

## 10) Budget Engine (tokens/tempo/custo/limites por política)
**Objetivo:** controlar custo do LLM/execução e impor limites por rota/tarefa.

## 11) Persona Evolution (aprendizado seguro baseado em evidências)
**Objetivo:** evoluir personas com trilha de auditoria e rollback.

## 12) Federated Learning (aprendizado distribuído com privacidade)
**Objetivo:** melhorar heurísticas sem centralizar dados sensíveis.

## 13) Synthetic Workspaces (datasets de testes reprodutíveis)
**Objetivo:** gerar workspaces sintéticos para testes de sync/memory/skills.

## 14) Red Team Mode (ataques simulados e hardening contínuo)
**Objetivo:** pipeline de ataques simulados contra prompt/task/memory.

## 15) Local‑First / Remote‑Optional (sync resiliente)
**Objetivo:** garantir uso offline e sincronização eventual consistente.

## 16) Context Compression (compressão sem perda e “summary cache”)
**Objetivo:** reduzir payload mantendo invariantes e rastreabilidade.

## 17) Intent Routing (roteamento por intenção/risco/latência)
**Objetivo:** decidir qual módulo/agente/modelo executa cada pedido.

## 18) Human‑in‑the‑Loop Governance (aprovações e trilha completa)
**Objetivo:** governança: aprovar, auditar, reverter, justificar.

## 19) Observability End‑to‑End (tracing/metrics/logs)
**Objetivo:** instrumentar core/cli/vscode/nanobot com eventos coerentes.

## 20) Swarm Economics (incentivos, reputação e “pricing” de skills)
**Objetivo:** reputação/custo/benefício e priorização de execução em swarm.
